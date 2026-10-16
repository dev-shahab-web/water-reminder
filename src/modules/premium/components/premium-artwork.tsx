import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { premiumColors as colors } from './premium-style';

export function PremiumArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.art, compact && { height: 124 }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 360 180">
        <Defs>
          <LinearGradient id="plusTile" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#284F55" />
            <Stop offset="1" stopColor="#14343D" />
          </LinearGradient>
          <LinearGradient id="plusWater" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D9F9EF" />
            <Stop offset="0.55" stopColor="#93DDCC" />
            <Stop offset="1" stopColor="#41A5AE" />
          </LinearGradient>
        </Defs>
        <Circle cx="180" cy="90" r="79" fill="none" stroke={colors.border} strokeOpacity="0.5" />
        <Circle cx="180" cy="90" r="59" fill="none" stroke={colors.border} strokeOpacity="0.4" />
        <G transform="translate(27 46) rotate(-9 68 53)">
          <Rect width="135" height="107" rx="22" fill="url(#plusTile)" stroke="#4A6970" />
          <SvgText x="16" y="25" fill={colors.muted} fontSize="10" fontWeight="600">
            TODAY’S WATER
          </SvgText>
          <SvgText x="16" y="53" fill={colors.text} fontSize="25" fontWeight="700">
            1,500
          </SvgText>
          <SvgText x="93" y="53" fill={colors.muted} fontSize="12">
            ml
          </SvgText>
          <Rect x="16" y="66" width="103" height="5" rx="2.5" fill="#3A5960" />
          <Rect x="16" y="66" width="76" height="5" rx="2.5" fill={colors.mint} />
          <SvgText x="16" y="90" fill={colors.mint} fontSize="11">
            + Add water
          </SvgText>
        </G>
        <G transform="translate(247 24) rotate(12 32 65)">
          <Rect x="16" y="0" width="35" height="133" rx="13" fill="#2C474B" />
          <Rect x="0" y="24" width="67" height="87" rx="24" fill="#446064" />
          <Rect x="4" y="28" width="59" height="79" rx="21" fill="#0D252C" />
          <Circle cx="33.5" cy="64" r="20" stroke="#304E53" strokeWidth="5" fill="none" />
          <Path
            d="M33.5 44 A20 20 0 1 1 13.5 64"
            stroke={colors.mint}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <SvgText
            x="33.5"
            y="69"
            textAnchor="middle"
            fill={colors.text}
            fontWeight="700"
            fontSize="12"
          >
            75%
          </SvgText>
          <SvgText x="33.5" y="96" textAnchor="middle" fill={colors.muted} fontSize="7">
            STAY HYDRATED
          </SvgText>
        </G>
        <G transform="translate(143 28)">
          <Path
            d="M40 0 C33 17 0 51 0 76 A40 40 0 0 0 80 76 C80 51 47 17 40 0Z"
            fill="url(#plusWater)"
            stroke="#B8EFE0"
          />
          <Path
            d="M16 67 C13 83 21 95 33 98"
            stroke="#E2FFF6"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </G>
        <Path
          d="M238 8 L241 17 L250 20 L241 23 L238 32 L235 23 L226 20 L235 17Z"
          fill={colors.gold}
        />
        <Circle cx="113" cy="22" r="3" fill={colors.gold} />
        <Circle cx="231" cy="161" r="2" fill={colors.mint} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { height: 174, width: '100%', maxWidth: 400, alignSelf: 'center' },
});
