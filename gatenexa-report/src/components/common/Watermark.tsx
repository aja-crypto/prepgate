/**
 * src/components/common/Watermark.tsx
 * Low-opacity, absolutely-positioned watermark placed behind page content.
 * Rendered once per page (react-pdf re-runs the tree per page automatically
 * for `fixed` elements).
 */
import React from 'react';
import { View, Svg, Path, Defs, LinearGradient, Stop } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';

export const Watermark: React.FC = () => {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: layout.pageWidth,
        height: layout.pageHeight,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
      }}
    >
      <Svg viewBox="0 0 100 100" style={{ width: 340, height: 340, opacity: 0.035 }}>
        <Defs>
          <LinearGradient id="watermarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.brandVioletLight} />
            <Stop offset="100%" stopColor={colors.brandBlue} />
          </LinearGradient>
        </Defs>
        <Path d="M14 24 L14 78 L26 66 L26 46 L46 66 L54 58 L14 24 Z" fill="url(#watermarkGradient)" />
        <Path d="M86 24 L86 78 L74 66 L74 46 L54 66 L46 58 L86 24 Z" fill="url(#watermarkGradient)" />
        <Path d="M78 14 L34 62 L22 90 L58 48 L70 22 Z" fill="url(#watermarkGradient)" />
      </Svg>
    </View>
  );
};
