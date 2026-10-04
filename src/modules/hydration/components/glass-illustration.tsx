import { memo, useId } from 'react';
import { View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import vessels from '../../../../assets/illustrations/glass-vessels.json';

const getVessel = (amountMl: number) =>
  amountMl < 180
    ? 'cup'
    : amountMl < 280
      ? 'tumbler'
      : amountMl < 400
        ? 'mug'
        : amountMl < 650
          ? 'tall'
          : amountMl < 950
            ? 'bottle'
            : 'pitcher';

// Physical dimensions grow with the cube root of volume. Keep tiny and very
// large custom capacities legible within the same baseline-aligned slot.
export const getGlassIllustrationHeight = (amountMl: number) =>
  Math.min(96, Math.max(42, 82 * Math.cbrt(amountMl / 750)));

export const GlassIllustration = memo(function GlassIllustration({
  amountMl,
  compact = false,
  scale = 1,
}: {
  amountMl: number;
  compact?: boolean;
  scale?: number;
}) {
  const id = useId().replace(/:/g, '');
  const kind = getVessel(amountMl);
  const vessel = vessels[kind];
  const height = getGlassIllustrationHeight(amountMl) * (compact ? 0.78 : 1) * scale;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: (compact ? 76 : 98) * scale,
        width: (compact ? 80 : 96) * scale,
      }}
    >
      <Svg width={(height * 100) / 112} height={height} viewBox="0 0 100 112">
        <Defs>
          <ClipPath id={`${id}-body`}>
            <Path d={vessel.body} />
          </ClipPath>
          <LinearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#67D6FA" />
            <Stop offset="1" stopColor="#258EEC" />
          </LinearGradient>
        </Defs>
        <Ellipse
          cx="50"
          cy="105"
          rx={kind === 'cup' ? 32 : 29}
          ry="3"
          fill="#8BAEC4"
          opacity={0.18}
        />
        {'handle' in vessel && (
          <Path
            d={vessel.handle}
            fill="none"
            stroke="#318BC1"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        )}
        <Path d={vessel.body} fill="#EFFAFF" />
        <G clipPath={`url(#${id}-body)`}>
          <Path
            d={`M8 ${vessel.waterY} Q28 ${vessel.waterY - 6} 49 ${vessel.waterY} T94 ${vessel.waterY} V102 H8 Z`}
            fill={`url(#${id}-water)`}
          />
          <Path
            d={`M8 ${vessel.waterY + 3} Q30 ${vessel.waterY + 9} 52 ${vessel.waterY + 2} T96 ${vessel.waterY + 4}`}
            fill="none"
            stroke="#A5E8FF"
            strokeWidth="2"
          />
          <Path
            d={vessel.highlight}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={0.75}
          />
        </G>
        <Path d={vessel.body} fill="none" stroke="#318BC1" strokeWidth="3" strokeLinejoin="round" />
        <Path d={vessel.rim} fill="none" stroke="#277DAF" strokeWidth="4" strokeLinecap="round" />
        {kind === 'cup' && (
          <Path d="M20 94 H74" stroke="#318BC1" strokeWidth="3" strokeLinecap="round" />
        )}
        {kind === 'bottle' && (
          <Rect
            x="38"
            y="8"
            width="24"
            height="10"
            rx="3"
            fill="#64C4F1"
            stroke="#318BC1"
            strokeWidth="3"
          />
        )}
      </Svg>
    </View>
  );
});
