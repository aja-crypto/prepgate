/**
 * src/index.tsx
 * Node-side build script. Run with `npm run build` to render the sample
 * fixture to ./output/GateNexa-Admission-Report.pdf using @react-pdf/renderer's
 * Node renderer (pdf().toFile). In a web app, import `GateNexaReport` directly
 * and use <PDFViewer/> / <PDFDownloadLink/> instead of this file.
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import * as fs from 'fs';
import * as path from 'path';
import { GateNexaReport } from './GateNexaReport';
import { sampleReportData } from './data/sampleReportData';

async function main() {
  const outDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputPath = path.join(outDir, 'GateNexa-Admission-Report.pdf');

  const instance = pdf(<GateNexaReport data={sampleReportData} />);
  const buffer = await instance.toBuffer();

  await new Promise<void>((resolve, reject) => {
    const chunks: Buffer[] = [];
    buffer.on('data', (chunk: Buffer) => chunks.push(chunk));
    buffer.on('end', () => {
      fs.writeFileSync(outputPath, Buffer.concat(chunks));
      resolve();
    });
    buffer.on('error', reject);
  });

  // eslint-disable-next-line no-console
  console.log(`GateNexa report generated: ${outputPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate report:', err);
  process.exit(1);
});
