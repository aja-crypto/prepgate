/**
 * src/components/common/Header.tsx
 * Repeats on every inner page (fixed): mini logo, report title, and the
 * candidate/prediction-id + date meta line, right-aligned — matching the
 * reference PDF's page 2–5 header band.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { NSymbol } from '../logo/NSymbol';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../../theme/typography';
import { layout, spacing } from '../../theme/spacing';
import { ReportMeta, Candidate } from '../../types/report.types';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: layout.pageWidth,
    paddingTop: 22,
    paddingHorizontal: layout.pageMargin,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,
    borderBottomColor: colors.hairlineStrong,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgName: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  centerTitle: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  right: {
    alignItems: 'flex-end',
  },
  rightLine: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});

export interface HeaderProps {
  meta: ReportMeta;
  candidate: Candidate;
}

export const Header: React.FC<HeaderProps> = ({ meta, candidate }) => {
  return (
    <View style={styles.container} fixed>
      <View style={styles.left}>
        <NSymbol size={16} gradientId="headerNGradient" />
        <Text style={styles.orgName}>{meta.organisationName}</Text>
      </View>

      <Text style={styles.centerTitle}>GATENEXA AI PREDICTION REPORT</Text>

      <View style={styles.right}>
        <Text style={styles.rightLine}>
          {candidate.displayName} {'\u2022'} {meta.predictionId}
        </Text>
        <Text style={styles.rightLine}>{meta.generatedDate}</Text>
      </View>
    </View>
  );
};
