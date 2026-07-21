/**
 * src/pages/CoverPage.tsx
 * Page 1: wordmark + tagline, subtitle, large N-symbol medallion, report
 * title, candidate summary card (qualified badge + score/AIR/eligible-count),
 * and the database/prediction-id/date/version meta line. Matches the
 * reference PDF's cover exactly, driven entirely by ReportData.
 */
import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../theme/colors';
import { fontFamily, fontSize, letterSpacing, lineHeight } from '../theme/typography';
import { layout, spacing, radius } from '../theme/spacing';
import { Watermark } from '../components/common/Watermark';
import { NSymbol } from '../components/logo/NSymbol';
import { Wordmark } from '../components/logo/Wordmark';
import { ReportData } from '../types/report.types';

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bgPage,
    paddingTop: 60,
    paddingHorizontal: 44,
    paddingBottom: 50,
    alignItems: 'center',
  },
  wordmarkBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    letterSpacing: letterSpacing.widest,
    marginTop: spacing.xs,
  },
  medallionRing: {
    width: 180,
    height: 180,
    borderRadius: radius.circle,
    borderWidth: 0.8,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 46,
    marginBottom: 46,
  },
  medallionRingInner: {
    width: 132,
    height: 132,
    borderRadius: radius.circle,
    borderWidth: 0.8,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  titleBold: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
  },
  titleLight: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.h1,
    color: colors.textSecondary,
  },
  divider: {
    width: 64,
    height: 2,
    backgroundColor: colors.brandViolet,
    borderRadius: 1,
    marginBottom: 30,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.bgPanel,
    borderWidth: 0.8,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  candidateLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
    marginBottom: 3,
  },
  candidateName: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h4,
    color: colors.textPrimary,
  },
  qualifiedPill: {
    backgroundColor: colors.successBg,
    borderWidth: 0.8,
    borderColor: colors.success,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  qualifiedPillText: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.caption,
    color: colors.success,
    letterSpacing: letterSpacing.wide,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.6,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  statBlock: {
    flexGrow: 1,
    flexBasis: 0,
    alignItems: 'center',
  },
  statDivider: {
    width: 0.6,
    backgroundColor: colors.hairline,
  },
  statValue: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.kpiValueLg,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
  },
  metaLine: {
    marginTop: spacing.lg,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.relaxed,
  },
  metaValue: {
    fontFamily: fontFamily.sansSemibold,
    color: colors.textSecondary,
  },
  confidential: {
    position: 'absolute',
    bottom: 40,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    letterSpacing: letterSpacing.widest,
  },
});

export interface CoverPageProps {
  data: ReportData;
}

export const CoverPage: React.FC<CoverPageProps> = ({ data }) => {
  const { meta, candidate, coverKpis } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Watermark />

      <View style={styles.wordmarkBlock}>
        <Wordmark width={170} height={48} showTagline />
        <Text style={styles.eyebrow}>{meta.reportTitle.toUpperCase()}</Text>
      </View>

      <View style={styles.medallionRing}>
        <View style={styles.medallionRingInner}>
          <NSymbol size={64} gradientId="coverMedallionGradient" />
        </View>
      </View>

      <View style={styles.titleLine}>
        <Text style={styles.titleBold}>M.Tech Admission{' '}</Text>
        <Text style={styles.titleLight}>Intelligence Report</Text>
      </View>
      <View style={styles.divider} />

      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.candidateLabel}>CANDIDATE</Text>
            <Text style={styles.candidateName}>{candidate.displayName}</Text>
          </View>
          <View style={styles.qualifiedPill}>
            <Text style={styles.qualifiedPillText}>
              {candidate.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {coverKpis.map((stat, idx) => (
            <React.Fragment key={stat.id}>
              {idx > 0 && <View style={styles.statDivider} />}
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <Text style={styles.metaLine}>
        Database: <Text style={styles.metaValue}>{meta.database}</Text>
        {'  |  '}Prediction ID: <Text style={styles.metaValue}>{meta.predictionId}</Text>
        {'\n'}
        Generated: <Text style={styles.metaValue}>{meta.generatedDate}</Text>
        {'  |  '}Report Version: <Text style={styles.metaValue}>{meta.reportVersion}</Text>
      </Text>

      <Text style={styles.confidential} fixed>
        C O N F I D E N T I A L
      </Text>
    </Page>
  );
};
