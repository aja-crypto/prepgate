/**
 * src/pages/ExecutiveSummaryPage.tsx
 * Page 2: Executive Summary (narrative + 5 KPI cards), Eligibility
 * Breakdown (5 tier cards + institute-type strip), and Prediction Basis
 * (data sources + how-to-read panels). Combined onto one page — matching
 * the reference PDF's page-2 layout — to keep the report at 5 pages total.
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
import { KPIRow } from '../components/common/KPICard';
import { RecommendationRow } from '../components/common/RecommendationCard';
import { InfoPanel, InfoPanelBody, DataSourceRow } from '../components/common/InfoPanel';
import { ReportData } from '../types/report.types';

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bgPage,
    paddingTop: layout.headerHeight + 30,
    paddingHorizontal: layout.pageMargin,
    paddingBottom: layout.footerHeight + 26,
  },
  summaryBox: {
    backgroundColor: colors.bgPanelAlt,
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: lineHeight.relaxed,
  },
  strong: {
    fontFamily: fontFamily.sansBold,
    color: colors.textPrimary,
  },
  sectionSpacer: {
    marginTop: spacing.xl,
  },
  instituteStrip: {
    marginTop: spacing.md,
    backgroundColor: colors.bgPanelAlt,
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  instituteStripText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  instituteStripValue: {
    fontFamily: fontFamily.sansBold,
    color: colors.textPrimary,
  },
  panelsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});

export interface ExecutiveSummaryPageProps {
  data: ReportData;
}

export const ExecutiveSummaryPage: React.FC<ExecutiveSummaryPageProps> = ({ data }) => {
  const { meta, candidate, executiveSummaryText, headlineKpis, eligibilityBreakdown, instituteTypeCounts, dataSources, howToReadTitle, howToReadText } = data;

  const instituteStripLabel = instituteTypeCounts
    .map((i) => `${i.type} ${i.count}`)
    .join('  |  ');

  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header meta={meta} candidate={candidate} />
      <Footer meta={meta} />

      <SectionTitle number={1} title="Executive Summary" />
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>{executiveSummaryText}</Text>
      </View>

      <KPIRow stats={headlineKpis} />

      <View style={styles.sectionSpacer}>
        <SectionTitle number={2} title="Eligibility Breakdown" />
        <RecommendationRow tiers={eligibilityBreakdown} />

        <View style={styles.instituteStrip}>
          <Text style={styles.instituteStripText}>
            By institute type {'\u2014'}{' '}
            {instituteTypeCounts.map((i, idx) => (
              <Text key={i.type}>
                <Text style={styles.instituteStripValue}>{i.type} {i.count}</Text>
                {idx < instituteTypeCounts.length - 1 ? '  |  ' : ''}
              </Text>
            ))}
          </Text>
        </View>
      </View>

      <View style={styles.sectionSpacer}>
        <SectionTitle number={3} title="Prediction Basis" />
        <View style={styles.panelsRow}>
          <InfoPanel title="Data Sources Used">
            {dataSources.map((ds) => (
              <DataSourceRow key={ds.name} name={ds.name} available={ds.available} />
            ))}
          </InfoPanel>
          <InfoPanel title={howToReadTitle}>
            <InfoPanelBody text={howToReadText} />
          </InfoPanel>
        </View>
      </View>
    </Page>
  );
};
