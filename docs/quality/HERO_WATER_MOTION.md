# Hero water motion

The Home hydration vessel uses a 25-column shallow-water surface simulation on
Reanimated's UI runtime. Pressure gradients move horizontal flow between columns;
that flow raises and lowers the surface. Closed boundaries produce wall rebounds,
and damping lets waves settle. Additions/removals launch local ripples. Fast rising
crests can emit up to eight ballistic droplets that return to the surface.

## Gravity and sensor synchronization

- Gravity supplies the absolute downward direction. A brief 120–180 ms response
  lets the fluid redistribute, with a bounded turn rate and no spring overshoot.
  The target remains measured gravity until alignment has finished.
- All three gyro axes predict changes in the gravity vector between measurements,
  using `dg/dt = -omega cross g`. Fresh gravity corrects drift. When movement stops,
  gravity anchors the resting direction; near-flat readings use gentle filtering.
- Linear acceleration drives surface flow. Its tangent and normal projections
  explicitly convert sensor +Y-up into SVG +Y-down. The former implementation used
  the wrong sign in this conversion during recovery from motion.
  Gravity's own tangential component also drives water downhill while it catches
  up with a turn; it reaches zero at equilibrium.
- Gyro changes and vessel drag transfer momentum into the surface. This includes
  pitch/roll while rocking a nearly flat phone, as well as screen-plane rotation.
  Stopping launches a rebound; it does not change the final downward direction.
  A 75 ms coupling filter softens abrupt impulses. Lower vessel drag, slower wave
  travel and local flow viscosity produce broader rolling waves instead of short
  sharp crests pulled around the rim.
- Each stream has its own UI delivery timestamp. Reanimated does not expose native
  hardware timestamps. Gyro prediction and acceleration expire after 120/150 ms;
  stale samples cannot keep pushing water after a sensor stops delivering events.
- The old 18%-of-gravity flatness cutoff could freeze a pre-shake angle. Only a
  noise-sized screen-plane projection below 0.08 m/s² is now treated as ambiguous.
  A gyro noise floor prevents slow bias from drifting this nearly-flat projection.
- No magnetometer is requested: compass heading does not determine down and adds
  magnetic interference and sensor work. No native dependency or permission was
  added. Android Reanimated's ACCELEROMETER maps to TYPE_LINEAR_ACCELERATION; iOS
  returns raw acceleration, so gravity is subtracted there.

The liquid rotates around its circular centre while text and rim stay upright.
Resting fill level uses circular-segment area; waves map to the current chord.
This remains a bounded 2D surface approximation. It does not model full 3D fluid
flow, overturning/breaking waves, or exact displaced volume at curved walls. A
minimum pressure term keeps ripples stable when most gravity points through the
screen, where a 2D vessel has no meaningful vertical water column.

## Power and accessibility

Gravity requests 50 ms (20 Hz), gyro 20 ms (50 Hz), and linear acceleration 33 ms
(about 30 Hz). Work stays on the UI runtime without per-sample React renders.
Strong movement uses up to 60 fps; decaying waves use 30 fps, with 120 Hz numerical
substeps. The frame callback stops after both the surface and orientation settle.
There is no perpetual idle wave, timer, or particle emitter.

Every sensor unmounts when Home loses focus, the app backgrounds, Android's window
loses focus, the hero scrolls out of view, or the amount modal opens. Empty/full
vessels and app/system Reduce Motion also disable subscriptions. Reduce Motion
makes logging feedback static. Devices with missing sensors retain local logging
animations and available sensor behavior.

These measures reduce unnecessary work; they are not a measured battery-life
percentage. Physical sensor fusion and display power remain device dependent.

## Verification

```sh
npm test -- --runInBand src/modules/hydration/components/hydration-ring.test.tsx src/modules/hydration/utils/water-motion.test.ts src/modules/hydration/utils/water-physics.test.ts src/shared/motion/
npm run typecheck
npm run lint
```

Tests cover sensor coordinate signs, three-axis gyro prediction, slower gravity
updates, stale sample expiry, gyro bias, near-flat recovery, and shake-then-hold
settling at upright, tilted, sideways and inverted angles. They also cover wave
curvature, reflection, fill disturbances, fluid momentum, settling, 30/60 fps
consistency, bounded integration, circular fill area, amounts and sensor lifetime.
The final focused run passed all 30 tests across six suites. TypeScript, relevant
ESLint checks and the isolated Android validation build also passed.

The actual Home, logging, Undo, Settings and Reduce Motion flows were explored
through ARTEMIS screenshots/hierarchy and ADB before tests were authored. An earlier
autonomous ARTEMIS run reached its provider's quota; its incomplete report is not
counted as evidence. Device observation and direct ADB actions remained available.

Validation uses `com.shahab.waterreminder.syncvalidation`, preserving production
data. On 2026-10-19, the incorrect near-flat resting direction was reproduced on
Pixel 7 (`35201FDH2006ET`): native gravity was approximately
`(-0.02, 0.25, 9.81)` while the old surface retained a slope toward the opposite
side. The corrected build showed the corresponding downward slope, and the user
confirmed that direction was correct after tilt/shake and holding still. Their
subsequent feedback that motion was too stiff led to stronger three-axis momentum
transfer while retaining the gravity anchor.

Native Pixel 7 inspection confirmed Gravity, Gyroscope and Linear Acceleration
listeners requesting 50000/20000/33000 microseconds respectively, with no sensor
wake lock. Backgrounding removed all three listeners. The latest slower build
rendered four frames during a five-second near-flat stationary check on Pixel 7.
The earlier two-sensor build's zero-frame idle measurements are not claimed as
battery evidence for this revised three-sensor implementation.

The user's feedback that the stronger sloshing felt too fast and attached to the
rim led to the slower wave scale, softer impulses and reduced wall drag described
above. That build was installed on Pixel 7 before it disconnected. On 2026-10-20,
the same APK was installed on the authorized Pixel 8 emulator (`emulator-5556`).
At half fill, a recorded sequence of opposing 45-degree tilts returned to the
upright surface; a separate lateral shake produced curved crests and wall
rebounds that dissipated after input stopped. Emulator sensor values were then
restored to acceleration `0:9.77631:0.812349` and gyroscope `0:0:0`.

On this final build, emulator `dumpsys gfxinfo` recorded zero new frames during a
five-second settled interval. `dumpsys sensorservice` showed three Reanimated
listeners on Home, zero in Settings/background, and three after resuming Home.
No ReactNativeJS or AndroidRuntime errors were found in the inspected log window.
These emulator checks establish behavior and lifecycle, not real-device battery
life or the user's approval of the latest physical feel. That hands-on assessment
remains outstanding because Pixel 7 is disconnected.

For physical tuning, use a partial fill, tilt and shake, then hold still. Repeat
sideways, inverted and almost flat. Verify that the eventual surface normal points
down, while crests and rebounds dissipate. Compare native subscriptions on Home
versus Settings, background, hidden hero and Reduce Motion. Restore preferences
and emulator sensor values after checking.
