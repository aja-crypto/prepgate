import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
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
    paddingTop: 20,
    paddingHorizontal: layout.pageMargin,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.6,
    borderBottomColor: colors.brandViolet,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgName: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginLeft: 6,
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
    <View style={styles.container}>
      <View style={styles.left}>
        <Image src="/icons/WORDMARK.jpeg" style={{ width: 70, height: 20 }} />
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
