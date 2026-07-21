/**
 * src/pages/NitIiitTablePage.tsx
 * Page 4: NIT / IIIT / GFTI / IISc programmes table (section 5).
 */
import React from 'react';
import { Page, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../theme/colors';
import { layout } from '../theme/spacing';
import { Watermark } from '../components/common/Watermark';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { ProgrammeTable } from '../components/table/ProgrammeTable';
import { ReportData } from '../types/report.types';

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bgPage,
    paddingTop: layout.headerHeight + 30,
    paddingHorizontal: layout.pageMargin,
    paddingBottom: layout.footerHeight + 26,
  },
});

export interface NitIiitTablePageProps {
  data: ReportData;
}

export const NitIiitTablePage: React.FC<NitIiitTablePageProps> = ({ data }) => {
  const { meta, candidate, nitIiitTable } = data;

  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header meta={meta} candidate={candidate} />
      <Footer meta={meta} />
      <ProgrammeTable data={nitIiitTable} />
    </Page>
  );
};
