/**
 * src/components/logo/NSymbol.tsx
 *
 * Vector recreation of the GateNexa "N" mark: two interlocking chevrons
 * with a diagonal lightning spine, rendered as native react-pdf <Svg/>
 * paths (not a rasterized <Image/>) so it stays crisp at any size and the
 * PDF file stays small. Colors are driven by the theme's brand gradient
 * tokens rather than hardcoded hex so re-theming only touches theme/colors.ts.
 */
import React from 'react';
import { Svg, Path, Defs, LinearGradient, Stop } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';

export interface NSymbolProps {
  size?: number;
  gradientId?: string;
}

export const NSymbol: React.FC<NSymbolProps> = ({ size = 40, gradientId = 'nSymbolGradient' }) => {
  return (
    <Svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.brandVioletLight} />
          <Stop offset="45%" stopColor={colors.brandViolet} />
          <Stop offset="100%" stopColor={colors.brandBlue} />
        </LinearGradient>
      </Defs>

      {/* Left chevron: down-up-down stroke forming an "M/N" wing */}
      <Path
        d="M14 24 L14 78 L26 66 L26 46 L46 66 L54 58 L14 24 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Right chevron mirrored, forming the second wing of the N */}
      <Path
        d="M86 24 L86 78 L74 66 L74 46 L54 66 L46 58 L86 24 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Diagonal lightning spine connecting both wings */}
      <Path
        d="M78 14 L34 62 L22 90 L58 48 L70 22 Z"
        fill={`url(#${gradientId})`}
        opacity={0.96}
      />
    </Svg>
  );
};
