/**
 * src/components/common/ChanceBadge.tsx
 * Small colored pill used inline in tables to show a chance percentage,
 * colored per its tier via chanceUtils/theme.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { fontFamily, fontSize } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { ChanceTier } from '../../types/report.types';
import { colorsForTier } from '../../utils/chanceUtils';
import { formatPercent } from '../../utils/formatters';

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 2.5,
    paddingHorizontal: spacing.sm,
    minWidth: 34,
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.tableCell,
  },
});

export interface ChanceBadgeProps {
  percent: number;
  tier: ChanceTier;
}

export const ChanceBadge: React.FC<ChanceBadgeProps> = ({ percent, tier }) => {
  const { fg, bg } = colorsForTier(tier);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{formatPercent(percent)}</Text>
    </View>
  );
};

/** Small dot + label used in the table legend row above IIT/NIT tables. */
export interface LegendDotProps {
  tier: ChanceTier;
  label: string;
}

export const LegendDot: React.FC<LegendDotProps> = ({ tier, label }) => {
  const { fg } = colorsForTier(tier);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.md }}>
      <View
        style={{
          width: 5.5,
          height: 5.5,
          borderRadius: radius.circle,
          backgroundColor: fg,
          marginRight: 3.5,
        }}
      />
      <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.caption, color: '#B8AFD9' }}>
        {label}
      </Text>
    </View>
  );
};
