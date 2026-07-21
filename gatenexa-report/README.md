# GateNexa AI — M.Tech Admission Intelligence Report

Production React PDF implementation of the GateNexa AI Admission Intelligence
Report, built with `@react-pdf/renderer`. Recreates the reference PDF
(cover, executive summary, eligibility breakdown, prediction basis, IIT
table, NIT/IIIT/GFTI table, counselling strategy, disclaimer) as a fully
typed, componentized, data-driven document — condensed onto **5 pages**.

## Setup

```bash
npm install
npm run build
```

This renders `src/data/sampleReportData.ts` through `GateNexaReport` and
writes `output/GateNexa-Admission-Report.pdf`.

For live preview during development (e.g. inside a web app), import the
document component directly instead of using the Node build script:

```tsx
import { PDFViewer } from '@react-pdf/renderer';
import { GateNexaReport } from './src/GateNexaReport';
import { sampleReportData } from './src/data/sampleReportData';

function Preview() {
  return (
    <PDFViewer width="100%" height="100%">
      <GateNexaReport data={sampleReportData} />
    </PDFViewer>
  );
}
```

## Using real data

Every page/component reads exclusively from the `ReportData` type defined in
`src/types/report.types.ts`. To generate a report for a real candidate,
build an object matching that shape (see `src/data/sampleReportData.ts` for
a fully worked example) and pass it to `<GateNexaReport data={...} />`. No
other file needs to change.

## Folder structure

```
src/
  GateNexaReport.tsx        # Root <Document>, assembles all 5 pages
  index.tsx                 # Node build script (renders sample data to PDF)
  types/
    report.types.ts         # Canonical ReportData contract
  theme/
    colors.ts                # Palette tokens (brand gradient, tiers, status)
    typography.ts             # Font family / size / line-height / letter-spacing scale
    spacing.ts                 # Spacing, radius, A4 layout constants
    index.ts                    # Barrel + combined `theme` object
  fonts/
    registerFonts.ts          # Embeds Inter, Inter-SemiBold/Bold, RobotoMono, NotoSans (₹ glyph)
  utils/
    formatters.ts              # Number/currency/date formatting
    chanceUtils.ts              # Chance % → tier mapping, tier colors/labels
    layoutUtils.ts               # Table column widths, row-slicing for pagination
  components/
    logo/
      NSymbol.tsx               # Vector N-mark (SVG paths, brand gradient)
      Wordmark.tsx                # Vector "NEXA / Unlock Next Level" wordmark
    common/
      Watermark.tsx              # Faint full-page N-mark watermark
      Header.tsx                  # Repeating page header (logo, title, meta)
      Footer.tsx                   # Repeating footer (copyright, page X of Y)
      KPICard.tsx                   # Headline stat card + row
      ChanceBadge.tsx                # Colored chance-% pill + legend dot
      RecommendationCard.tsx          # Eligibility-tier stat card + row
      SectionTitle.tsx                 # Numbered section heading
      InfoPanel.tsx                     # Bordered panel (data sources / how-to-read)
    table/
      TableCell.tsx               # Low-level cell primitive
      TableHeader.tsx               # Violet header row
      TableRow.tsx                   # Zebra-striped programme row
      ProgrammeTable.tsx               # Composite: legend + header + rows + CSV note
  pages/
    CoverPage.tsx                # Page 1
    ExecutiveSummaryPage.tsx     # Page 2 — summary, KPIs, eligibility, prediction basis
    IITTablePage.tsx             # Page 3
    NitIiitTablePage.tsx         # Page 4
    CounsellingStrategyPage.tsx  # Page 5 — strategy, disclaimer, sign-off
  data/
    sampleReportData.ts          # Sample fixture (only file with literal report values)
```

## Design notes

- **Vector logos, not raster.** `NSymbol` and `Wordmark` are hand-built SVG
  (paths + gradient defs), matching the uploaded brand assets, so the PDF
  stays crisp and small — no embedded PNG/JPEG.
- **Embedded fonts + Unicode.** `registerFonts.ts` embeds Inter (400/500/700),
  dedicated SemiBold/Bold families, Roboto Mono, and Noto Sans (for the ₹
  glyph and broader Unicode coverage), and disables hyphenation so institute
  names never break mid-word.
- **Page budget.** Sections were grouped (Executive Summary + Eligibility +
  Prediction Basis on one page; Counselling + Disclaimer + sign-off on the
  last) specifically to hold the report at 5 pages as requested, without
  cutting any required section.
- **Reusability.** `ProgrammeTable` is used identically for both the IIT and
  NIT/IIIT/GFTI sections; only `ReportData.iitTable` / `.nitIiitTable` differ.
