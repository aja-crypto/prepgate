/**
 * src/components/common/KPICard.tsx
 * A single stat block: big value + small caption label, used for the
 * headline KPI row on the cover and executive-summary pages.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { KPIStat } from '../../types/report.types';

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  value: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.kpiValue,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  valueSuccess: {
    color: colors.success,
  },
  valueBrand: {
    color: colors.brandVioletLight,
  },
  label: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
    textAlign: 'center',
  },
});

export interface KPICardProps {
  stat: KPIStat;
}

export const KPICard: React.FC<KPICardProps> = ({ stat }) => {
  const valueStyle = [
    styles.value,
    stat.emphasis === 'success' ? styles.valueSuccess : undefined,
    stat.emphasis === 'brand' ? styles.valueBrand : undefined,
  ];

  return (
    <View style={styles.card}>
      <Text style={valueStyle}>{stat.value}</Text>
      <Text style={styles.label}>{stat.label.toUpperCase()}</Text>
    </View>
  );
};

export interface KPIRowProps {
  stats: KPIStat[];
  gap?: number;
}

export const KPIRow: React.FC<KPIRowProps> = ({ stats, gap = spacing.sm }) => {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {stats.map((stat) => (
        <KPICard key={stat.id} stat={stat} />
      ))}
    </View>
  );
};
