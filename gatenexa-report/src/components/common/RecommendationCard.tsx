/**
 * src/components/common/RecommendationCard.tsx
 * Colored tier card used in the Eligibility Breakdown section — big count,
 * tier label, and chance-range caption, tinted per tier.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { EligibilityTier } from '../../types/report.types';
import { colorsForTier } from '../../utils/chanceUtils';

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: radius.md,
    borderWidth: 0.8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  count: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h2,
    marginBottom: 1,
  },
  label: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodySm,
    marginBottom: 1,
  },
  range: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.micro,
    color: '#8A81AC',
  },
});

export interface RecommendationCardProps {
  tierData: EligibilityTier;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ tierData }) => {
  const { fg, bg } = colorsForTier(tierData.tier);
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.count, { color: fg }]}>{tierData.count}</Text>
      <Text style={[styles.label, { color: fg }]}>{tierData.label.toUpperCase()}</Text>
      <Text style={styles.range}>{tierData.rangeLabel}</Text>
    </View>
  );
};

export interface RecommendationRowProps {
  tiers: EligibilityTier[];
}

export const RecommendationRow: React.FC<RecommendationRowProps> = ({ tiers }) => {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {tiers.map((t) => (
        <RecommendationCard key={t.tier} tierData={t} />
      ))}
    </View>
  );
};
