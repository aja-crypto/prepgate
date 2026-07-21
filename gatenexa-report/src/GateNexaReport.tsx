/**
 * src/GateNexaReport.tsx
 * The top-level <Document> that assembles every page in order. This is the
 * single component you render/export with @react-pdf/renderer's `pdf()`,
 * `<PDFViewer/>`, or `<PDFDownloadLink/>`.
 */
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { registerFonts } from './fonts/registerFonts';
import {
  CoverPage,
  ExecutiveSummaryPage,
  IITTablePage,
  NitIiitTablePage,
  CounsellingStrategyPage,
} from './pages';
import { ReportData } from './types/report.types';

registerFonts();

export interface GateNexaReportProps {
  data: ReportData;
}

export const GateNexaReport: React.FC<GateNexaReportProps> = ({ data }) => {
  return (
    <Document
      title={`${data.meta.reportTitle} - ${data.candidate.displayName}`}
      author={data.meta.organisationName}
      subject={data.meta.reportTitle}
      creator={data.meta.organisationName}
      producer={data.meta.organisationName}
    >
      <CoverPage data={data} />
      <ExecutiveSummaryPage data={data} />
      <IITTablePage data={data} />
      <NitIiitTablePage data={data} />
      <CounsellingStrategyPage data={data} />
    </Document>
  );
};
