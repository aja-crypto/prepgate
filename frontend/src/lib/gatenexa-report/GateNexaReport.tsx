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
  const hasIitRows = data.iitTable?.rows?.length > 0;
  const hasNitRows = data.nitIiitTable?.rows?.length > 0;

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
      {hasIitRows && <IITTablePage data={data} />}
      {hasNitRows && <NitIiitTablePage data={data} />}
      <CounsellingStrategyPage data={data} />
    </Document>
  );
};
