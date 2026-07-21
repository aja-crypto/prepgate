/**
 * src/components/logo/Wordmark.tsx
 *
 * Vector "NEXA — Unlock Next Level" wordmark. Uses <Text> inside <Svg>
 * (react-pdf supports SVG text nodes) styled with letter-spacing and the
 * brand gradient fill so no raster asset is embedded.
 */
import React from 'react';
import { Svg, Text as SvgText, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';

export interface WordmarkProps {
  width?: number;
  height?: number;
  showTagline?: boolean;
  gradientId?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({
  width = 160,
  height = 44,
  showTagline = true,
  gradientId = 'wordmarkGradient',
}) => {
  return (
    <Svg viewBox="0 0 320 88" style={{ width, height }}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={colors.brandVioletLight} />
          <Stop offset="55%" stopColor={colors.brandViolet} />
          <Stop offset="100%" stopColor={colors.brandBlue} />
        </LinearGradient>
      </Defs>

      <SvgText
        x="160"
        y="46"
        textAnchor="middle"
        fill={`url(#${gradientId})`}
        style={{ fontSize: 44, fontFamily: 'Inter-Bold', fontWeight: 700 }}
      >
        NEXA
      </SvgText>

      {showTagline && (
        <>
          <Rect x="14" y="66" width="36" height="0.8" fill={colors.textMuted} />
          <SvgText
            x="160"
            y="72"
            textAnchor="middle"
            fill={colors.textSecondary}
            style={{ fontSize: 8.5, fontFamily: 'Inter', fontWeight: 400 }}
          >
            UNLOCK NEXT LEVEL.
          </SvgText>
          <Rect x="270" y="66" width="36" height="0.8" fill={colors.textMuted} />
        </>
      )}
    </Svg>
  );
};
