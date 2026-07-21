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
  if (!nitIiitTable?.rows?.length) return null;

  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <Watermark />
      <Header meta={meta} candidate={candidate} />
      <Footer meta={meta} pageNum={4} total={5} />
      <ProgrammeTable data={nitIiitTable} noteEntityLabel="NIT / IIIT / GFTI programmes" />
    </Page>
  );
};
