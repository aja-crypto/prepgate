import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { GateNexaReport, sampleReportData, downloadPdf, generatePdf } from '../lib/gatenexa-report/generate';
import toast from 'react-hot-toast';

function buildReportData(result) {
  if (!result) return sampleReportData;
  const predictedAirLow = result.airRange?.best || result.predictedRank || 0;
  const predictedAirHigh = result.airRange?.worst || result.predictedRank || 0;
  const eligibleCount = result.totalOpportunities || result.opportunities?.length || 0;
  return {
    ...sampleReportData,
    meta: {
      ...sampleReportData.meta,
      predictionId: result._id || `GTX-${Date.now().toString(16).toUpperCase()}`,
      generatedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
    candidate: {
      displayName: result.candidateName || 'GATE Aspirant',
      qualified: result.isQualified !== false,
      gateScore: result.predictedScore || 0,
      predictedAirLow,
      predictedAirHigh,
      eligibleProgrammesCount: eligibleCount,
      percentileLabel: result.percentileLabel || `top ${((1 - predictedAirHigh / 200000) * 100).toFixed(1)}% of the cohort`,
      confidencePct: result.confidenceScore || (result.confidence === 'High' ? 85 : result.confidence === 'Medium' ? 60 : 35),
    },
    headlineKpis: [
      { id: 'score', label: 'GATE Score', value: String(result.predictedScore || '-'), emphasis: 'default' },
      { id: 'air', label: 'Predicted AIR', value: `${predictedAirLow}-${predictedAirHigh}`, emphasis: 'default' },
      { id: 'qualified', label: 'Qualified', value: result.isQualified !== false ? 'YES' : 'NO', emphasis: result.isQualified !== false ? 'success' : 'danger' },
      { id: 'confidence', label: 'Confidence', value: `${result.confidenceScore || (result.confidence === 'High' ? 85 : result.confidence === 'Medium' ? 60 : 35)}%`, emphasis: 'default' },
      { id: 'eligible', label: 'Eligible Programs', value: String(eligibleCount), emphasis: 'brand' },
    ],
    eligibilityBreakdown: [
      { tier: 'safe', label: 'Safe', count: Math.round(eligibleCount * 0.35), rangeLabel: '85%+ chance' },
      { tier: 'high', label: 'High', count: Math.round(eligibleCount * 0.25), rangeLabel: '65-84% chance' },
      { tier: 'moderate', label: 'Moderate', count: Math.round(eligibleCount * 0.2), rangeLabel: '35-64% chance' },
      { tier: 'ambitious', label: 'Ambitious', count: Math.round(eligibleCount * 0.12), rangeLabel: '15-34% chance' },
      { tier: 'dream', label: 'Dream', count: Math.round(eligibleCount * 0.08), rangeLabel: '<15% chance' },
    ],
    instituteTypeCounts: [
      { type: 'IIT', count: result.totalIITs || 0 },
      { type: 'IISc', count: result.totalIISc || 0 },
      { type: 'NIT', count: result.totalNITs || 0 },
      { type: 'IIIT', count: result.totalIIITs || 0 },
      { type: 'GFTI', count: result.totalGFTIs || 0 },
      { type: 'IIEST', count: result.totalIIEST || 0 },
      { type: 'Other', count: result.totalOther || 0 },
    ],
    iitTable: sampleReportData.iitTable,
    nitIiitTable: sampleReportData.nitIiitTable,
    counsellingSummary: sampleReportData.counsellingSummary,
    counsellingSteps: sampleReportData.counsellingSteps,
  };
}

export default function ReportPage() {
  const location = useLocation();
  const result = location.state?.result;
  const data = buildReportData(result);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadPdf(data);
      toast.success('Report downloaded');
    } catch (e) {
      toast.error('Download failed: ' + (e.message || e));
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A16] flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-[#3A2E6E] bg-[#0A0A16]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FileText size={14} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white">Admission Report</h1>
            <p className="text-[9px] text-slate-500">{data.candidate.displayName}</p>
          </div>
        </div>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50">
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {generating ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      <PDFViewer style={{ flex: 1, width: '100%', border: 'none' }} showToolbar>
        <GateNexaReport data={data} />
      </PDFViewer>
    </div>
  );
}
