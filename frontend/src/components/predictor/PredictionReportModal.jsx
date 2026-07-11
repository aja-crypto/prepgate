import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, TrendingUp, DollarSign, Star, Award, MapPin, Target, ListOrdered } from 'lucide-react';
import toast from 'react-hot-toast';

const TIER_ICON = { 1: '\uD83C\uDFC6', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

function ChanceBadge({ prob }) {
  if (prob >= 95) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">{'\uD83D\uDFE2'} Extremely High</span>;
  if (prob >= 80) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{'\uD83D\uDFE2'} High</span>;
  if (prob >= 60) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">{'\uD83D\uDFE1'} Moderate</span>;
  if (prob >= 40) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">{'\uD83D\uDFE0'} Low</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">{'\uD83D\uDD34'} Very Low</span>;
}

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return <span className="text-[11px]">{'\u2605'.repeat(full)}{half ? '\u2BEF' : ''}{'\u2606'.repeat(5 - full - (half ? 1 : 0))}</span>;
}

const FONT_SIZES = {
  coverTitle: 24, coverSubtitle: 14, coverBody: 11,
  sectionTitle: 16, cardTitle: 13, body: 10, small: 8,
};

export default function PredictionReportModal({ isOpen, onClose, result, compareList, choiceOrder }) {
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const opps = result?.opportunities || [];
  const dream = opps.filter(o => o.path === 'Dream');
  const target = opps.filter(o => o.path === 'Target');
  const safe = opps.filter(o => o.path === 'Safe');

  const candName = result.candidateName || 'GATE Aspirant';
  const predId = result.historyId ? result.historyId.toString().slice(-6).toUpperCase() : 'N/A';

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');

      const loadImg = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
          const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg'));
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
      const [wordmark, watermark, appIcon] = await Promise.all([
        loadImg('/icons/WORDMARK.jpeg'),
        loadImg('/icons/WATERMARK.jpeg'),
        loadImg('/icons/APP ICON.jpeg'),
      ]);

      const nLogo = appIcon || wordmark;
      const MARGIN = 15;
      const BOTTOM_MARGIN = 22;
      let y = MARGIN;
      let currentPage = 1;

      const applyWatermark = () => {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.06 }));
        if (nLogo) {
          doc.addImage(nLogo, 'JPEG', 105 - 25, 148.5 - 25, 50, 50);
        } else {
          doc.setFontSize(60); doc.setTextColor(100, 70, 230);
          doc.text('N', 105, 155, { align: 'center' });
        }
        doc.restoreGraphicsState();
      };

      const addPage = () => {
        doc.addPage();
        currentPage++;
        y = MARGIN + 10;
        applyWatermark();
        doc.setFontSize(8); doc.setTextColor(120, 120, 140);
        doc.text('GateNexa AI  |  Report GTX-26-' + predId, 50, 10);
        doc.setDrawColor(100, 80, 200); doc.setLineWidth(0.3);
        doc.line(MARGIN, 13, 195, 13);
      };

      const checkSpace = (needed) => {
        if (y + needed > 275) { addPage(); }
      };

      const coverDivider = () => {
        doc.setDrawColor(100, 80, 200); doc.setLineWidth(0.5);
        doc.line(40, y, 170, y); y += 8;
      };

      // ================================================================
      // PAGE 1 — COVER
      // ================================================================
      doc.setFillColor(15, 8, 40); doc.rect(0, 0, 210, 297, 'F');
      applyWatermark();

      // N logo
      if (nLogo) {
        doc.addImage(nLogo, 'JPEG', 105 - 15, 35, 30, 30);
      } else {
        doc.setFontSize(36); doc.setTextColor(139, 92, 246);
        doc.text('N', 105, 58, { align: 'center' });
      }

      doc.setFontSize(FONT_SIZES.coverTitle); doc.setTextColor(255, 255, 255);
      doc.text('GateNexa AI', 105, 80, { align: 'center' });
      doc.setFontSize(FONT_SIZES.coverSubtitle); doc.setTextColor(180, 160, 240);
      doc.text('M.Tech Admission Report', 105, 92, { align: 'center' });

      y = 105;
      coverDivider();

      // Candidate info card
      doc.setFillColor(25, 18, 55); doc.setDrawColor(80, 60, 180);
      doc.roundedRect(35, y, 140, 58, 4, 4, 'FD');

      let iy = y + 10;
      doc.setFontSize(FONT_SIZES.coverBody); doc.setTextColor(200, 200, 230);
      const infoLines = [
        `Candidate:  ${candName}`,
        `Marks:  ${result.predictedScore || 'N/A'}`,
        `Category:  General`,
        `Predicted Score:  ${result.predictedScore || 'N/A'}`,
        `Predicted AIR:  ${result.airRange ? result.airRange.best + ' - ' + result.airRange.worst : 'N/A'}`,
        `Confidence:  ${result.confidence || 'N/A'}${result.confidenceScore ? ' (' + result.confidenceScore + '/100)' : ''}`,
      ];
      infoLines.forEach((line, idx) => {
        doc.text(line, 50, iy + idx * 7);
      });

      y += 68;
      coverDivider();

      // Database + Prediction ID
      doc.setFontSize(FONT_SIZES.small); doc.setTextColor(140, 120, 200);
      doc.text('Database: CCMT 2025 | ' + (result.databaseCoverage || opps.length || 'N/A') + ' programmes', 105, y, { align: 'center' }); y += 5;
      doc.text('Prediction ID: GTX-26-' + predId, 105, y, { align: 'center' }); y += 6;

      doc.setFontSize(10); doc.setTextColor(160, 140, 220);
      doc.text('Generated by AI', 105, y + 4, { align: 'center' });

      // CONFIDENTIAL footer
      doc.setFontSize(7); doc.setTextColor(120, 100, 180);
      doc.text('CONFIDENTIAL \u2014 GateNexa AI Predictor v1.0', 105, 285, { align: 'center' });

      // ================================================================
      // PAGE 2+ — CONTENT
      // ================================================================
      addPage();

      const section = (title, fn) => {
        checkSpace(18);
        doc.setFontSize(FONT_SIZES.sectionTitle); doc.setTextColor(100, 70, 230);
        doc.text(title, MARGIN, y); y += 10;
        doc.setDrawColor(200, 180, 255); doc.setLineWidth(0.3);
        doc.line(MARGIN, y, 195, y); y += 8;
        doc.setFontSize(FONT_SIZES.body); doc.setTextColor(60, 60, 60);
        fn();
      };

      const txt = (str, x, size, color) => {
        doc.setFontSize(size || FONT_SIZES.body);
        const c = typeof color === 'string' ? color : '#3c3c3c';
        const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
        doc.setTextColor(parseInt(hex.slice(1,3),16)||0, parseInt(hex.slice(3,5),16)||0, parseInt(hex.slice(5,7),16)||0);
        doc.text(String(str), x || MARGIN, y);
      };

      // ---- EXECUTIVE SUMMARY ----
      section('Executive Summary', () => {
        const air = result.airRange ? `${result.airRange.best} - ${result.airRange.worst}` : 'N/A';
        txt(`Based on historical admission trends and your predicted GATE score of ${result.predictedScore || 'N/A'},`, MARGIN, 11, '#2d2d2d'); y += 7;
        txt(`you are competitive for approximately ${opps.length} programmes`, MARGIN, 11, '#2d2d2d'); y += 7;
        txt(`across multiple institutes. Your Estimated AIR: ${air}.`, MARGIN, 11, '#2d2d2d'); y += 8;

        doc.setDrawColor(220, 220, 220); doc.line(MARGIN, y, 195, y); y += 6;

        txt(`Predicted GATE Score: ${result.predictedScore || 'N/A'}`, 20, 10, '#555'); y += 6;
        txt(`Estimated AIR Range: ${air}`, 20, 10, '#555'); y += 6;
        txt(`Qualifying Cutoff: ${result.qualifyingCutoff || 'N/A'}`, 20, 10, '#555'); y += 6;
        txt(`Database Coverage: ${result.databaseCoverage || opps.length || 'N/A'} Programmes`, 20, 10, '#555'); y += 6;
        txt(`Recommended: ${opps.length} Programmes`, 20, 10, '#555'); y += 6;
        txt(`Confidence: ${result.confidence || 'Moderate'}${result.confidenceScore ? ` (${result.confidenceScore}/100)` : ''}`, 20, 10, '#555'); y += 4;
      });

      // ---- CANDIDATE PROFILE (KPI Cards) ----
      section('Candidate Profile', () => {
        const air = result.airRange ? `${result.airRange.best} - ${result.airRange.worst}` : 'N/A';
        const score = result.predictedScore || 'N/A';
        const qual = result.isQualified ? 'YES' : 'NO';
        const conf = result.confidenceScore || result.confidence || 'N/A';
        const confStr = typeof conf === 'number' ? conf + '%' : conf;

        let airPercentile = '';
        if (result.airRange?.average) {
          const pct = Math.max(0, Math.min(99.99, 100 - (result.airRange.average / 150000) * 100));
          airPercentile = `Top ${pct.toFixed(1)}%`;
        }

        const cards = [
          { label: 'Predicted Score', val: String(score), sub: 'GATE Score' },
          { label: 'Estimated AIR', val: air, sub: airPercentile || 'Projected range' },
          { label: 'Qualified', val: qual, sub: 'Category: General' },
          { label: 'Confidence', val: confStr, sub: 'Based on historical data' },
        ];

        cards.forEach((c, i) => {
          checkSpace(34);
          const cx = MARGIN + i * 46;
          doc.setFillColor(248, 248, 255); doc.setDrawColor(200, 190, 230);
          doc.roundedRect(cx, y, 44, 30, 4, 4, 'FD');
          doc.setDrawColor(180, 170, 220);
          doc.roundedRect(cx, y, 44, 30, 4, 4, 'S');

          doc.setFontSize(16); doc.setTextColor(100, 70, 230);
          doc.text(String(c.val).substring(0, 10), cx + 22, y + 10, { align: 'center' });

          doc.setFontSize(7); doc.setTextColor(120, 120, 120);
          doc.text(String(c.label), cx + 22, y + 18, { align: 'center' });

          doc.setFontSize(6); doc.setTextColor(170, 170, 170);
          doc.text(String(c.sub).substring(0, 18), cx + 22, y + 24, { align: 'center' });
        });
        y += 36;
      });

      // ---- CONFIDENCE ANALYSIS ----
      section('Confidence Analysis', () => {
        const confScore = result.confidenceScore || 0;
        txt(`${result.confidence || 'Moderate'} \u2014 ${confScore}/100`, MARGIN, 11, '#7C3AED'); y += 8;

        doc.setDrawColor(220, 220, 220); doc.line(MARGIN, y, 195, y); y += 6;

        const hasSeatData = result.opportunities?.some(o => o.seats != null && o.seats > 0);
        const hasMultiYear = (result.airRange?.uncertaintyPct || 100) < 60;

        const factors = [
          { label: 'Historical Cutoffs', status: 'Complete', checked: true },
          { label: 'Seat Matrix', status: hasSeatData ? 'Partial' : 'Not Available', checked: hasSeatData },
          { label: 'Multi-Year Trends', status: hasMultiYear ? 'Complete' : 'In Progress', checked: hasMultiYear },
          { label: 'Category Matching', status: 'Complete', checked: true },
          { label: 'Score vs Cutoff Gap', status: result.isQualified ? 'Available' : 'Below Cutoff', checked: result.isQualified },
        ];

        factors.forEach(f => {
          const icon = f.checked ? '[OK]' : '[--]';
          txt(`${icon} ${f.label} (${f.status})`, 20, 10, f.checked ? '#555' : '#aaa'); y += 6;
        });

        y += 3;

        if (result.airRange?.uncertaintyPct !== undefined && result.airRange.uncertaintyPct < 80) {
          const unc = Math.min(100, Math.max(0, Math.round(result.airRange.uncertaintyPct)));
          txt(`Prediction uncertainty: ${unc}%`, MARGIN, 9, '#888'); y += 5;
        }
        txt(`Total data points: ${result.totalDataPoints || 'N/A'}`, MARGIN, 9, '#888'); y += 5;
        txt(`CCMT cutoff records: ${result.databaseCoverage || opps.length || 'N/A'}`, MARGIN, 9, '#888'); y += 5;
      });

      // ---- 5-TIER ELIGIBILITY SUMMARY ----
      section('Eligibility Summary', () => {
        txt('Database Coverage: ' + (result.databaseCoverage || opps.length || 'N/A') + ' Programmes', MARGIN, 10, '#555'); y += 7;

        doc.setDrawColor(200, 200, 200); doc.line(MARGIN, y, 195, y); y += 6;

        const tiers = [
          { label: 'Very High Chance (90-100%)', count: opps.filter(o => o.path === 'Very High Chance').length, color: '#16A34A' },
          { label: 'Likely (70-89%)', count: opps.filter(o => o.path === 'High Chance').length, color: '#3B82F6' },
          { label: 'Competitive (40-69%)', count: opps.filter(o => o.path === 'Good Chance').length, color: '#EAB308' },
          { label: 'Ambitious (15-39%)', count: opps.filter(o => o.path === 'Competitive').length, color: '#F97316' },
          { label: 'Dream (0-14%)', count: opps.filter(o => o.path === 'Dream').length, color: '#EF4444' },
        ];

        tiers.forEach(t => {
          const rgb = t.color.match(/\w\w/g).map(c => parseInt(c, 16));
          doc.setTextColor(rgb[0], rgb[1], rgb[2]);
          doc.text(t.label + ': ' + t.count, 20, y); y += 7;
        });

        doc.setTextColor(60, 60, 60);
        doc.setDrawColor(200, 200, 200); doc.line(MARGIN, y, 195, y); y += 6;

        txt('By Institute Type:', MARGIN, 10, '#555'); y += 6;
        const instituteTypes = {};
        opps.forEach(o => { instituteTypes[o.collegeType] = (instituteTypes[o.collegeType] || 0) + 1; });
        for (const [type, count] of Object.entries(instituteTypes)) {
          txt(`  ${type}: ${count}`, 20, 10, '#777'); y += 5;
        }
      });

      // ---- TOP RECOMMENDATIONS (Grouped) ----
      section('Top Recommendations', () => {
        const iits = opps.filter(o => o.collegeType === 'IIT').sort((a, b) => (b.probability || 0) - (a.probability || 0));
        const nonIits = opps.filter(o => o.collegeType !== 'IIT').sort((a, b) => (b.probability || 0) - (a.probability || 0));
        const safeChoices = nonIits.filter(o => (o.probability || 0) >= 80);
        const targetChoices = nonIits.filter(o => { const p = o.probability || 0; return p >= 60 && p < 80; });
        const competitiveChoices = nonIits.filter(o => { const p = o.probability || 0; return p >= 40 && p < 60; });
        const dreamNonIits = nonIits.filter(o => (o.probability || 0) < 40);

        const renderCard = (item, rank, sectionColor) => {
          checkSpace(26);
          const cardH = 24;
          const rgb = sectionColor.match(/\w\w/g).map(c => parseInt(c, 16));

          doc.setFillColor(248, 248, 255); doc.setDrawColor(rgb[0], rgb[1], rgb[2], 0.3);
          doc.roundedRect(MARGIN, y, 180, cardH, 3, 3, 'FD');

          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(MARGIN, y, 2, cardH, 'F');

          doc.setFontSize(FONT_SIZES.cardTitle); doc.setTextColor(rgb[0], rgb[1], rgb[2]);
          doc.text(String(rank), MARGIN + 6, y + 6);

          doc.setFontSize(9); doc.setTextColor(30, 30, 30);
          doc.text((item.college || '').substring(0, 50), MARGIN + 14, y + 6);
          doc.setFontSize(7); doc.setTextColor(120, 120, 120);
          doc.text((item.program || '').substring(0, 35), MARGIN + 14, y + 12);

          let mx = MARGIN + 100;
          doc.setFontSize(6); doc.setTextColor(100, 100, 100);
          const metrics = [
            { label: 'Admission', val: (item.probability || 0) + '%' },
            { label: 'Match Score', val: item.matchScore ? String(item.matchScore) : '-' },
            { label: 'Cutoff', val: item.closingScore ? String(item.closingScore) : '-' },
            { label: 'Fees', val: item.fees ? 'Rs ' + (item.fees / 100000).toFixed(1) + 'L' : '-' },
            { label: 'Package', val: item.avgPlacement ? 'Rs ' + item.avgPlacement + 'L' : '-' },
          ];
          metrics.forEach((m, mi) => {
            doc.text(m.label, mx, y + 5);
            doc.setFontSize(6); doc.setTextColor(50, 50, 50);
            doc.text(m.val, mx, y + 10);
            mx += 17;
          });

          const diff = item.closingScore && result.predictedScore
            ? (result.predictedScore - item.closingScore) : null;
          const reason = diff != null
            ? (diff >= 0 ? '+' + diff + ' above cutoff' : '' + diff + ' below cutoff')
            : '';
          if (reason) {
            doc.setFontSize(6); doc.setTextColor(140, 140, 140);
            doc.text('Why: ' + reason, MARGIN + 14, y + 18);
          }

          y += cardH + 3;
        };

        const renderSubSection = (title, items, color, maxItems) => {
          if (items.length === 0) return;
          checkSpace(16);
          doc.setFontSize(10);
          const rgb = color.match(/\w\w/g).map(c => parseInt(c, 16));
          doc.setTextColor(rgb[0], rgb[1], rgb[2]);
          doc.text(title + '  (' + items.length + ')', MARGIN, y); y += 7;
          items.slice(0, maxItems || 5).forEach((item, i) => renderCard(item, i + 1, color));
        };

        // Section 1: DREAM IITS (all IITs, grouped by tier)
        const tier1Iits = iits.filter(o => o.tier === 1);
        const tier2Iits = iits.filter(o => o.tier === 2 || o.tier === 3);
        const otherIits = iits.filter(o => o.tier !== 1 && o.tier !== 2 && o.tier !== 3);
        if (iits.length > 0) {
          checkSpace(12);
          doc.setFontSize(FONT_SIZES.body + 1); doc.setTextColor(139, 92, 246);
          doc.text('DREAM IITS  (' + iits.length + ')', MARGIN, y); y += 6;
          if (tier1Iits.length > 0) {
            doc.setFontSize(8); doc.setTextColor(120, 120, 120);
            doc.text('Tier 1', MARGIN + 4, y); y += 3;
            tier1Iits.slice(0, 4).forEach((item, i) => renderCard(item, i + 1, '#A855F7'));
          }
          if (tier2Iits.length > 0) {
            doc.setFontSize(8); doc.setTextColor(120, 120, 120);
            doc.text('Tier 2', MARGIN + 4, y); y += 3;
            tier2Iits.slice(0, 4).forEach((item, i) => renderCard(item, tier1Iits.length + i + 1, '#A855F7'));
          }
          if (otherIits.length > 0) {
            otherIits.slice(0, 3).forEach((item, i) => renderCard(item, tier1Iits.length + tier2Iits.length + i + 1, '#A855F7'));
          }
        } else {
          checkSpace(6);
          doc.setFontSize(FONT_SIZES.small); doc.setTextColor(160, 160, 160);
          doc.text('No IIT programmes in your current range. Consider increasing your target score.', MARGIN, y); y += 5;
        }

        // Section 2: SAFE CHOICES (non-IIT >= 80%)
        renderSubSection('SAFE CHOICES', safeChoices, '#16A34A', 5);

        // Section 3: TARGET (non-IIT 60-79%)
        renderSubSection('TARGET', targetChoices, '#EAB308', 5);

        // Section 4: COMPETITIVE (non-IIT 40-59%)
        renderSubSection('COMPETITIVE', competitiveChoices, '#F97316', 5);

        // Section 5: DREAM (non-IIT < 40%)
        renderSubSection('DREAM (Non-IIT)', dreamNonIits, '#EF4444', 3);

        // Note about Match Score
        checkSpace(8);
        doc.setFontSize(FONT_SIZES.small); doc.setTextColor(140, 140, 140);
        doc.text('Match Score combines admission confidence, placements, ROI, fees, and institute quality.', MARGIN, y); y += 4;

        const remainingTotal = Math.max(0, iits.length - 11) + Math.max(0, safeChoices.length - 5) + Math.max(0, targetChoices.length - 5) + Math.max(0, competitiveChoices.length - 5) + Math.max(0, dreamNonIits.length - 3);
        if (remainingTotal > 0) {
          checkSpace(6);
          doc.setFontSize(FONT_SIZES.small); doc.setTextColor(140, 140, 140);
          doc.text(`+ ${remainingTotal} more programmes in the full list. Download CSV for complete details.`, MARGIN, y); y += 5;
        }
      });

      // ---- COLLEGE COMPARISON ----
      if (compareList && compareList.length >= 2) {
        checkSpace(20);
        section('College Comparison', () => {
          const cm = compareList.slice(0, 5);
          doc.setFontSize(7);
          const cc = [48, 16, 16, 14, 16, 12, 12];
          const ch = ['College', 'Avg Pkg', 'High Pkg', 'Place%', 'Fees', 'ROI', 'Rating'];
          let cx = 15;
          ch.forEach((h, i) => { doc.text(h, cx, y); cx += cc[i]; }); y += 5;
          doc.line(15, y, 195, y); y += 4;
          cm.forEach(o => {
            checkSpace(6);
            let cx = 15;
            const vals = [
              o.college?.substring(0, 22) || '-',
              o.avgPlacement ? 'Rs' + o.avgPlacement + 'L' : '-',
              o.highestPlacement ? 'Rs' + o.highestPlacement + 'L' : '-',
              o.placementPercentage ? o.placementPercentage + '%' : '-',
              o.fees ? 'Rs' + (o.fees / 100000).toFixed(1) + 'L' : '-',
              o.roiScore || '-', o.academicsRating || '-',
            ];
            vals.forEach((v, j) => { doc.text(v, cx, y); cx += cc[j]; });
            y += 5;
          });
        });
      }

      // ---- CHOICE ORDER ----
      if (choiceOrder && choiceOrder.length > 0) {
        checkSpace(20);
        section('Suggested CCMT Choice Filling Order (Top 20)', () => {
          const top20 = choiceOrder.slice(0, 20);
          doc.setFontSize(7);
          const rc = [6, 50, 28, 14, 12, 12, 12, 12];
          const rh = ['#', 'College', 'Program', 'Chance', 'Cutoff', 'Place', 'Fees', 'Type'];
          let rx = 15;
          rh.forEach((h, i) => { doc.text(h, rx, y); rx += rc[i]; }); y += 5;
          doc.line(15, y, 195, y); y += 4;
          top20.forEach((o, i) => {
            checkSpace(6);
            let rx = 15;
            const vals = [
              String(o.rank || i + 1), o.college?.substring(0, 22) || '-', o.program?.substring(0, 14) || '-',
              o.probability ? o.probability + '%' : '-', String(o.closingScore || '-'),
              o.avgPlacement ? 'Rs' + o.avgPlacement + 'L' : '-',
              o.fees ? 'Rs' + (o.fees / 100000).toFixed(1) + 'L' : '-',
              o.collegeType || '-',
            ];
            vals.forEach((v, j) => { doc.text(v, rx, y); rx += rc[j]; });
            y += 5;
          });
        });
      }

      // ---- COUNSELLING STRATEGY ----
      checkSpace(24);
      section('Counselling Strategy', () => {
        const iitCount = opps.filter(o => o.collegeType === 'IIT').length;
        const nitCount = opps.filter(o => o.collegeType === 'NIT').length;
        const iiitCount = opps.filter(o => o.collegeType === 'IIIT').length;
        const gftiCount = opps.filter(o => o.collegeType === 'GFTI').length;
        const safeCount = opps.filter(o => (o.probability || 0) >= 80).length;
        const targetCount = opps.filter(o => { const p = o.probability || 0; return p >= 60 && p < 80; }).length;
        const dreamCount = opps.filter(o => (o.probability || 0) < 40).length;

        txt('You have:', MARGIN, 10, '#555'); y += 6;
        txt('  [SAFE]  Safe choices (>=80%): ' + safeCount, 20, 10, '#555'); y += 5;
        txt('  [TARGET]  Target choices (60-79%): ' + targetCount, 20, 10, '#555'); y += 5;
        txt('  [DREAM]  Dream choices (<40%): ' + dreamCount, 20, 10, '#555'); y += 8;

        doc.setDrawColor(200, 200, 200); doc.line(MARGIN, y, 195, y); y += 7;

        txt('Suggested Choice Filling Order:', MARGIN, 10, '#555'); y += 6;

        let runningStart = 1;
        const ranges = [];
        if (iitCount > 0) { ranges.push({ label: 'Dream IITs', count: iitCount }); runningStart += iitCount; }
        if (nitCount > 0) { ranges.push({ label: 'Tier-1 NITs', count: Math.min(nitCount, 10) }); runningStart += Math.min(nitCount, 10); }
        if (iiitCount > 0) { ranges.push({ label: 'IIITs', count: Math.min(iiitCount, 8) }); runningStart += Math.min(iiitCount, 8); }
        if (gftiCount > 0) { ranges.push({ label: 'GFTIs', count: Math.min(gftiCount, 8) }); runningStart += Math.min(gftiCount, 8); }
        ranges.push({ label: 'Safe Backup Choices', count: Math.min(safeCount, 10) });

        let rangeStart = 1;
        ranges.forEach(r => {
          checkSpace(6);
          const rangeEnd = rangeStart + r.count - 1;
          const rangeStr = rangeStart === rangeEnd ? String(rangeStart) : rangeStart + '-' + rangeEnd;
          doc.text('  ' + rangeStr + '.  ' + r.label, MARGIN, y); y += 6;
          rangeStart += r.count;
        });

        y += 3;
        doc.setFontSize(8); doc.setTextColor(140, 140, 140);
        doc.text('Always verify with official CCMT/COAP counselling guidelines before finalizing your choices.', MARGIN, y); y += 5;
      });

      // ---- FOOTER ----
      checkSpace(16);
      doc.setDrawColor(200, 180, 255); doc.line(MARGIN, y, 195, y); y += 6;
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text('Generated by GateNexa AI Predictor v1.0', MARGIN, y); y += 5;
      doc.text('Database: CCMT 2025 | ' + (result.databaseCoverage || opps.length) + ' programmes', MARGIN, y); y += 5;
      doc.text('Model v2.0 | Confidence: ' + (result.confidence || 'N/A') + ' | GTX-26-' + predId, MARGIN, y); y += 5;
      doc.text('Copyright \u00A9 GateNexa | www.gatenexa.vercel.app', MARGIN, y);

      // ---- Apply watermark to every page ----
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.06 }));
        if (nLogo) {
          doc.addImage(nLogo, 'JPEG', 105 - 25, 148.5 - 25, 50, 50);
        } else {
          doc.setFontSize(60); doc.setTextColor(100, 70, 230);
          doc.text('N', 105, 155, { align: 'center' });
        }
        doc.restoreGraphicsState();
      }

      doc.save('GateNexa-Admission-Report.pdf');
    } catch (e) {
      console.error('PDF generation failed:', e);
      toast.error('Failed to generate PDF: ' + (e.message || e));
    }
    setGenerating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: 'rgba(12,18,34,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <FileText size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admission Report</h2>
                  <p className="text-[11px] text-slate-500">Personalized M.Tech counselling report</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50">
                  {generating ? <span className="animate-spin inline-block w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full" /> : <Download size={14} />}
                  {generating ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Report Preview */}
            <div ref={reportRef} className="space-y-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {/* Score Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'GATE Score', value: result.predictedScore, icon: Award, color: '#8B5CF6' },
                  { label: 'AIR', value: result.predictedRank, icon: Target, color: '#06B6D4' },
                  { label: 'Percentile', value: `${result.predictedPercentile}%`, icon: TrendingUp, color: '#22C55E' },
                  { label: 'Confidence', value: result.confidence, icon: Star, color: '#EAB308' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                    <div className="text-lg font-bold text-white font-mono">{s.value ?? '\u2014'}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-purple-400" />
                  <span className="text-xs font-semibold text-white">Opportunities Summary</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-red-400">{'\uD83D\uDD34'} Dream:</span> <span className="text-white font-mono">{dream.length}</span></div>
                  <div><span className="text-orange-400">{'\uD83D\uDFE0'} Target:</span> <span className="text-white font-mono">{target.length}</span></div>
                  <div><span className="text-green-400">{'\uD83D\uDFE2'} Safe:</span> <span className="text-white font-mono">{safe.length}</span></div>
                  <div><span className="text-slate-400">{'\uD83C\uDFDB\uFE0F'} Total:</span> <span className="text-white font-mono">{opps.length}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['IIT', 'NIT', 'IIIT', 'GFTI'].map(type => {
                    const count = opps.filter(o => o.collegeType === type).length;
                    if (!count) return null;
                    return <span key={type} className="px-2 py-0.5 rounded text-[9px] font-medium bg-white/5 text-slate-300">{type}: {count}</span>;
                  })}
                </div>
              </div>

              {/* Top 10 */}
              <div>
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <ListOrdered size={14} className="text-cyan-400" /> Top 10 Recommendations
                </h3>
                <div className="space-y-2">
                  {opps.sort((a, b) => b.probability - a.probability).slice(0, 10).map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{o.college}</div>
                          <div className="text-[10px] text-slate-500">{o.program}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px]">{TIER_ICON[o.tier] || `T${o.tier}`}</span>
                        <ChanceBadge prob={o.probability} />
                        {o.avgPlacement && <span className="text-[10px] text-slate-400">{'\u20B9'}{o.avgPlacement}L</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* College Details */}
              {compareList && compareList.length >= 2 && (
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-yellow-400" /> Colleges Compared
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compareList.slice(0, 4).map((o, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-xs font-semibold text-white mb-2">{o.college}</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                          <span>Placement: <span className="text-white">{'\u20B9'}{o.avgPlacement}L</span></span>
                          <span>Highest: <span className="text-white">{'\u20B9'}{o.highestPlacement}L</span></span>
                          <span>Place %: <span className="text-white">{o.placementPercentage}%</span></span>
                          <span>Fees: <span className="text-white">{'\u20B9'}{(o.fees / 100000).toFixed(1)}L</span></span>
                          <span>ROI: <span className="text-white">{o.roiScore}</span></span>
                          <span>Rating: <span className="text-white"><Stars rating={o.academicsRating} /></span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                    <Award size={14} className="text-cyan-400" /> Counselling Tips
                  </h3>
                  <ul className="space-y-1">
                    {result.recommendations.slice(0, 6).map((rec, i) => (
                      <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">{'\u2022'}</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-600 pt-2 border-t border-white/5">
                Generated by GateNexa | Data: CCMT historical cutoffs (2022-2026) | {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
