/**
 * src/pages/CounsellingStrategyPage.tsx
 * Page 5 (final): Counselling Strategy (3 summary stats + step-ordered
 * choice-filling plan), Disclaimer callout, and closing thank-you /
 * wordmark sign-off.
 */
import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../theme/colors';
import { fontFamily, fontSize, lineHeight } from '../theme/typography';
import { layout, spacing, radius } from '../theme/spacing';
import { Watermark } from '../components/common/Watermark';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { SectionTitle } from '../components/common/SectionTitle';
import { Wordmark } from '../components/logo/Wordmark';
import { ReportData } from '../types/report.types';

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bgPage,
    paddingTop: layout.headerHeight + 30,
    paddingHorizontal: layout.pageMargin,
    paddingBottom: layout.footerHeight + 26,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: colors.bgPanelAlt,
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  summaryValueSafe: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h2,
    color: colors.safe,
    marginBottom: 2,
  },
  summaryValueModerate: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h2,
    color: colors.moderate,
    marginBottom: 2,
  },
  summaryValueDream: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h2,
    color: colors.dream,
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  choiceFillingLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  stepBadge: {
    width: 52,
    paddingVertical: 4,
    borderWidth: 0.8,
    borderColor: colors.brandVioletLight,
    borderRadius: radius.md,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepBadgeText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodySm,
    color: colors.brandVioletLight,
  },
  stepTitle: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginBottom: 1,
  },
  stepDesc: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    lineHeight: lineHeight.normal,
  },
  disclaimerBox: {
    marginTop: spacing.lg,
    backgroundColor: '#241708',
    borderWidth: 0.8,
    borderColor: colors.moderate,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  disclaimerText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    lineHeight: lineHeight.normal,
  },
  disclaimerLabel: {
    fontFamily: fontFamily.sansBold,
    color: colors.moderate,
  },
  signOff: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 0.6,
    borderTopColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOffDivider: {
    width: 0.6,
    height: 30,
    backgroundColor: colors.hairlineStrong,
    marginHorizontal: spacing.lg,
  },
  signOffTextBlock: {
    alignItems: 'flex-start',
  },
  thankYou: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  thankYouSub: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});

export interface CounsellingStrategyPageProps {
  data: ReportData;
}

function summaryValueStyle(id: string) {
  if (id === 'safe') return styles.summaryValueSafe;
  if (id === 'dream') return styles.summaryValueDream;
  return styles.summaryValueModerate;
}

export const CounsellingStrategyPage: React.FC<CounsellingStrategyPageProps> = ({ data }) => {
  const { meta, candidate, counsellingSummary, counsellingSteps, disclaimer, thankYouNote } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header meta={meta} candidate={candidate} />
      <Footer meta={meta} pageNum={5} total={5} />

      <SectionTitle number={6} title="Counselling Strategy" />

      <View style={styles.summaryRow}>
        {counsellingSummary.map((s) => (
          <View style={styles.summaryCard} key={s.id}>
            <Text style={summaryValueStyle(s.id)}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.choiceFillingLabel}>Suggested choice-filling order for CCMT / COAP:</Text>

      <View>
        {counsellingSteps.map((step) => (
          <View style={styles.stepRow} key={step.rangeLabel} wrap={false}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step.rangeLabel}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerLabel}>Disclaimer {'\u2014'} </Text>
          {disclaimer}
        </Text>
      </View>

      <View style={[styles.summaryCard, { marginTop: spacing.lg, padding: spacing.lg, borderColor: `${colors.brandViolet}30`, borderWidth: 0.8, borderRadius: radius.md }]}>
        <Text style={{ fontFamily: fontFamily.sansBold, fontSize: fontSize.body, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' }}>
          AI Recommendation Summary
        </Text>
        <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm }}>
          This report analyzed {candidate.eligibleProgrammesCount} programmes across IIT, NIT, IIIT, and GFTI institutes using your predicted score of {candidate.gateScore} (AIR {candidate.predictedAirLow}\u2013{candidate.predictedAirHigh}).
        </Text>
        <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.caption, color: colors.textMuted, textAlign: 'center' }}>
          Prepared exclusively for {candidate.displayName} {'\u00B7'} {meta.generatedDate}
        </Text>
      </View>

      <View style={styles.signOff}>
        <Wordmark width={90} height={26} showTagline={false} gradientId="signOffGradient" />
        <View style={styles.signOffDivider} />
        <View style={styles.signOffTextBlock}>
          <Text style={styles.thankYou}>{thankYouNote}</Text>
          <Text style={styles.thankYouSub}>
            {meta.websiteUrl} {'\u00B7'} Prediction ID {meta.predictionId} {'\u00B7'} Report Version {meta.reportVersion}
          </Text>
        </View>
      </View>
    </Page>
  );
};
