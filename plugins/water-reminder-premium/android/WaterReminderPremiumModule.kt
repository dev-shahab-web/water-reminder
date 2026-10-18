package __PACKAGE__.premium

import android.content.ComponentName
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Base64
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

private class BillingFailure(val code: String, message: String) : Exception(message)
private data class Plan(val id: String, val productId: String, val type: String, val basePlanId: String, val period: String, val trialOfferId: String, val trialDays: Int)
private data class StoreProduct(val plan: Plan, val details: ProductDetails, val offerToken: String?, val amount: Long, val currency: String, val formatted: String, val trialDays: Int = 0)

class WaterReminderPremiumModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), PurchasesUpdatedListener {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val mutex = Mutex()
  private val client = BillingClient.newBuilder(context)
    .setListener(this)
    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
    .enableAutoServiceReconnection()
    .build()
  private var publicKey = ""
  private var offlineHours = 24
  private var plans = emptyList<Plan>()
  private var products = emptyList<StoreProduct>()
  private var purchasePromise: Promise? = null
  private var purchaseTimeout: Job? = null
  override fun getName() = "WaterReminderPremium"

  private fun requireOk(result: BillingResult) {
    if (result.responseCode != BillingClient.BillingResponseCode.OK) throw BillingFailure(
      when (result.responseCode) {
        BillingClient.BillingResponseCode.USER_CANCELED -> "USER_CANCELED"
        BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> "ITEM_ALREADY_OWNED"
        else -> "BILLING_UNAVAILABLE"
      }, result.debugMessage)
  }

  private suspend fun connect() {
    if (client.isReady) return
    suspendCancellableCoroutine<Unit> { continuation ->
      client.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          if (!continuation.isActive) return
          try { requireOk(result); continuation.resume(Unit) }
          catch (error: Exception) { continuation.resumeWithException(error) }
        }
        override fun onBillingServiceDisconnected() { /* Reconnect on the next request. */ }
      })
    }
  }

  private suspend fun queryProducts(type: String): List<ProductDetails> {
    val ids = plans.filter { it.type == type }.map { it.productId }.distinct()
    if (ids.isEmpty()) return emptyList()
    val params = QueryProductDetailsParams.newBuilder().setProductList(ids.map {
      QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(type).build()
    }).build()
    return suspendCancellableCoroutine { continuation ->
      client.queryProductDetailsAsync(params) { result, details ->
        if (continuation.isActive) {
          try { requireOk(result); continuation.resume(details.productDetailsList) }
          catch (error: Exception) { continuation.resumeWithException(error) }
        }
      }
    }
  }

  private suspend fun queryPurchases(type: String): List<Purchase> = suspendCancellableCoroutine { continuation ->
    client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build()) { result, purchases ->
      if (continuation.isActive) {
        try { requireOk(result); continuation.resume(purchases) }
        catch (error: Exception) { continuation.resumeWithException(error) }
      }
    }
  }

  private fun verify(purchase: Purchase): Boolean = runCatching {
    val key = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.DEFAULT)))
    Signature.getInstance("SHA1withRSA").run {
      initVerify(key)
      update(purchase.originalJson.toByteArray(Charsets.UTF_8))
      verify(Base64.decode(purchase.signature, Base64.DEFAULT))
    }
  }.getOrDefault(false)

  private suspend fun acknowledge(purchase: Purchase) {
    if (purchase.isAcknowledged) return
    suspendCancellableCoroutine<Unit> { continuation ->
      client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()) { result ->
        if (continuation.isActive) {
          try { requireOk(result); continuation.resume(Unit) }
          catch (error: Exception) { continuation.resumeWithException(error) }
        }
      }
    }
  }

  private suspend fun reconcile(): Boolean {
    check(publicKey.isNotBlank() && plans.isNotEmpty()) { "Billing has not been configured." }
    val connectivity = context.getSystemService(ConnectivityManager::class.java)
    val network = connectivity.getNetworkCapabilities(connectivity.activeNetwork)
    if (network?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) != true) {
      throw BillingFailure("BILLING_UNAVAILABLE", "Connect to the internet to verify purchases.")
    }
    // Do not clear known access unless BOTH queries finish successfully.
    val purchases = queryPurchases(BillingClient.ProductType.SUBS) + queryPurchases(BillingClient.ProductType.INAPP)
    val owned = mutableSetOf<String>()
    var pending = false
    for (purchase in purchases) {
      val relevant = purchase.products.filter { id -> plans.any { it.productId == id } }
      if (relevant.isEmpty()) continue
      if (purchase.purchaseState == Purchase.PurchaseState.PENDING) { pending = true; continue }
      if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) continue
      if (!verify(purchase)) throw BillingFailure("VERIFICATION_FAILED", "Purchase verification failed.")
      acknowledge(purchase)
      owned.addAll(relevant)
    }
    PremiumAccessStore.write(context, owned.toList(), offlineHours)
    if (owned.isEmpty()) applyIcon("default")
    return pending
  }

  private fun snapshot(pending: Boolean): WritableMap = Arguments.createMap().apply {
    putArray("products", Arguments.createArray().apply {
      products.forEach { product -> pushMap(Arguments.createMap().apply {
        putString("id", product.plan.id)
        putString("productId", product.plan.productId)
        putDouble("price", product.amount / 1_000_000.0)
        putString("formattedPrice", product.formatted)
        putString("currency", product.currency)
        if (product.trialDays > 0) putInt("freeTrialDays", product.trialDays)
      }) }
    })
    putMap("access", Arguments.createMap().apply {
      putBoolean("active", PremiumAccessStore.isActive(context))
      putDouble("accessUntil", PremiumAccessStore.accessUntil(context).toDouble())
      putArray("productIds", Arguments.fromList(PremiumAccessStore.productIds(context)))
    })
    putBoolean("pending", pending)
  }

  private fun run(promise: Promise, block: suspend () -> Unit) {
    scope.launch {
      try { withTimeout(30_000) { mutex.withLock { block() } } }
      catch (error: Exception) { promise.reject((error as? BillingFailure)?.code ?: "BILLING_UNAVAILABLE", error.message, error) }
    }
  }

  @ReactMethod
  fun getCatalog(configJson: String, promise: Promise) = run(promise) {
    val config = JSONObject(configJson)
    publicKey = config.getString("playPublicKey").trim()
    offlineHours = config.optInt("offlineAccessHours", 24)
    val configured = config.getJSONArray("plans")
    plans = (0 until configured.length()).map { index -> configured.getJSONObject(index).let {
      val trial = it.optJSONObject("trial")
      Plan(it.getString("id"), it.getString("productId"), it.getString("type"), it.getString("basePlanId"), it.getString("period"), trial?.optString("offerId") ?: "", trial?.optInt("days", 0) ?: 0)
    } }
    require(publicKey.isNotEmpty()) { "Google Play public key is required." }
    connect()
    products = fetchStoreProducts()
    val pending = reconcile()
    promise.resolve(snapshot(pending))
  }

  private suspend fun fetchStoreProducts(): List<StoreProduct> {
    val details = queryProducts(BillingClient.ProductType.SUBS) + queryProducts(BillingClient.ProductType.INAPP)
    return plans.mapNotNull { plan ->
      val product = details.find { it.productId == plan.productId && it.productType == plan.type } ?: return@mapNotNull null
      if (plan.type == BillingClient.ProductType.SUBS) {
        val offers = product.subscriptionOfferDetails.orEmpty().filter { it.basePlanId == plan.basePlanId }
        fun isRecurring(phase: ProductDetails.PricingPhase) =
          phase.recurrenceMode == ProductDetails.RecurrenceMode.INFINITE_RECURRING && phase.billingPeriod == plan.period && phase.priceAmountMicros > 0
        // Play filters new-customer eligibility. Accept only the configured trial
        // followed directly by the full recurring price; never hide paid intro phases.
        val trial = offers.find { offer ->
          val phases = offer.pricingPhases.pricingPhaseList
          val free = phases.firstOrNull()
          val freeDays = free?.billingPeriod?.let { period ->
            Regex("P(\\d+)D").matchEntire(period)?.groupValues?.get(1)?.toIntOrNull()
              ?: Regex("P(\\d+)W").matchEntire(period)?.groupValues?.get(1)?.toIntOrNull()?.times(7)
          }
          plan.trialOfferId.isNotBlank() && plan.trialDays > 0 && offer.offerId == plan.trialOfferId &&
            phases.size == 2 && free?.priceAmountMicros == 0L && freeDays == plan.trialDays &&
            free.billingCycleCount == 1 && free.recurrenceMode == ProductDetails.RecurrenceMode.FINITE_RECURRING &&
            isRecurring(phases.last()) && free.priceCurrencyCode == phases.last().priceCurrencyCode
        }
        val offer = trial ?: offers.find {
          it.offerId == null && it.pricingPhases.pricingPhaseList.let { phases -> phases.size == 1 && isRecurring(phases.single()) }
        } ?: return@mapNotNull null
        val phase = offer.pricingPhases.pricingPhaseList.last()
        StoreProduct(plan, product, offer.offerToken, phase.priceAmountMicros, phase.priceCurrencyCode, phase.formattedPrice, if (trial != null) plan.trialDays else 0)
      } else {
        val price = product.oneTimePurchaseOfferDetails ?: return@mapNotNull null
        StoreProduct(plan, product, null, price.priceAmountMicros, price.priceCurrencyCode, price.formattedPrice)
      }
    }
  }

  @ReactMethod
  fun getCachedAccess(promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putBoolean("active", PremiumAccessStore.isActive(context))
      putDouble("accessUntil", PremiumAccessStore.accessUntil(context).toDouble())
      putArray("productIds", Arguments.fromList(PremiumAccessStore.productIds(context)))
    })
  }

  @ReactMethod
  fun restore(promise: Promise) = run(promise) {
    connect()
    promise.resolve(snapshot(reconcile()))
  }

  @ReactMethod
  fun purchase(planId: String, promise: Promise) = run(promise) {
    if (purchasePromise != null) throw BillingFailure("PURCHASE_IN_PROGRESS", "A purchase is already in progress.")
    connect()
    if (reconcile()) throw BillingFailure("PURCHASE_PENDING", "An existing payment is pending.")
    // Plan changes need a replacement/proration flow. Avoid duplicate charges.
    if (PremiumAccessStore.isActive(context)) throw BillingFailure("ITEM_ALREADY_OWNED", "Plus is already active.")
    val displayed = products.find { it.plan.id == planId } ?: throw BillingFailure("BILLING_UNAVAILABLE", "The plan is unavailable.")
    val fresh = fetchStoreProducts()
    val product = fresh.find { it.plan.id == planId }
    products = fresh
    if (product == null || product.offerToken != displayed.offerToken || product.amount != displayed.amount || product.currency != displayed.currency || product.trialDays != displayed.trialDays) {
      throw BillingFailure("OFFER_CHANGED", "Review the updated price and trial before continuing.")
    }
    val activity = context.currentActivity ?: throw BillingFailure("BILLING_UNAVAILABLE", "No foreground activity.")
    val params = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product.details).apply {
      product.offerToken?.let { setOfferToken(it) }
    }.build()
    purchasePromise = promise
    val result = client.launchBillingFlow(activity, BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(params)).build())
    try { requireOk(result) } catch (error: Exception) { purchasePromise = null; throw error }
    purchaseTimeout = scope.launch {
      delay(180_000)
      purchasePromise?.reject("BILLING_UNAVAILABLE", "Checkout timed out. Restore purchases to check your account.")
      purchasePromise = null
    }
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
    purchaseTimeout?.cancel()
    val promise = purchasePromise
    purchasePromise = null
    scope.launch {
      try {
        requireOk(result)
        val resultSnapshot = withTimeout(30_000) { mutex.withLock { snapshot(reconcile()) } }
        promise?.resolve(resultSnapshot)
      } catch (error: Exception) { promise?.reject((error as? BillingFailure)?.code ?: "BILLING_UNAVAILABLE", error.message, error) }
    }
  }

  private fun applyIcon(name: String) {
    val names = listOf("default", "midnight", "jade", "rose", "violet", "expressive")
    require(name in names) { "Unknown app icon." }
    val manager = context.packageManager
    // Enable the new alias before disabling the old one; leave MainActivity enabled.
    val ordered = listOf(name) + names.filter { it != name }
    ordered.forEach { icon ->
      val component = ComponentName(context.packageName, "__PACKAGE__.premium.Icon${icon.replaceFirstChar { it.uppercase() }}")
      val desired = if (icon == name) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      if (manager.getComponentEnabledSetting(component) != desired) manager.setComponentEnabledSetting(component, desired, PackageManager.DONT_KILL_APP)
    }
  }

  @ReactMethod
  fun setAppIcon(name: String, promise: Promise) {
    try {
      if (name != "default" && !PremiumAccessStore.isActive(context)) throw BillingFailure("PREMIUM_REQUIRED", "Plus is required.")
      applyIcon(name)
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("ICON_CHANGE_FAILED", error.message, error) }
  }

  override fun invalidate() {
    purchasePromise?.reject("BILLING_UNAVAILABLE", "The billing session ended. Restore purchases to check your account.")
    purchasePromise = null
    scope.cancel()
    client.endConnection()
    super.invalidate()
  }
}
