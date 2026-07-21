import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { GateNexaReport } from './GateNexaReport';
import { sampleReportData } from './data/sampleReportData';
import { registerFonts } from './fonts/registerFonts';

registerFonts();

export { GateNexaReport } from './GateNexaReport';
export { sampleReportData } from './data/sampleReportData';

export async function generatePdf(data = sampleReportData): Promise<Blob> {
  const blob = await pdf(<GateNexaReport data={data} />).toBlob();
  return blob;
}

export async function downloadPdf(data = sampleReportData): Promise<void> {
  const blob = await generatePdf(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = (data.candidate.displayName || 'GATE_Aspirant').replace(/\s+/g, '_');
  link.href = url;
  link.download = `GateNexa_Admission_Report_${name}_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
