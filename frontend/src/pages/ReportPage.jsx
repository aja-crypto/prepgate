import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FileText, Download, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { sampleReportData, downloadPdf, GateNexaReport as GateNexaReportComponent } from '../lib/gatenexa-report/generate';
import { adaptPredictionResult } from '../lib/gatenexa-report/adapter';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function PdfViewer({ data }) {
  const [PDFViewer, setPDFViewer] = useState(null);
  const [GateNexaReport, setGateNexaReport] = useState(null);
  useEffect(() => {
    Promise.all([
      import('@react-pdf/renderer').then(mod => setPDFViewer(() => mod.PDFViewer)),
      Promise.resolve().then(() => setGateNexaReport(() => GateNexaReportComponent))
    ]);
  }, []);
  if (!PDFViewer || !GateNexaReport) {
    return <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Loading PDF viewer...</div>;
  }
  return (
    <PDFViewer style={{ flex: 1, width: '100%', border: 'none' }} showToolbar>
      <GateNexaReport data={data} />
    </PDFViewer>
  );
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rawResult = location.state?.result;
  const compareList = location.state?.compareList;
  const choiceOrder = location.state?.choiceOrder;
  const buildData = () => {
    let d;
    if (rawResult) {
      try { sessionStorage.setItem('gatenexa_report_result', JSON.stringify({ result: rawResult, compareList, choiceOrder })); } catch {}
      d = adaptPredictionResult(rawResult, compareList, choiceOrder);
    } else if (location.state?.data) {
      d = location.state.data;
    } else {
      // Restore from sessionStorage (survives refresh / direct URL after prediction)
      try {
        const saved = sessionStorage.getItem('gatenexa_report_result');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.result) d = adaptPredictionResult(parsed.result, parsed.compareList, parsed.choiceOrder);
          else if (parsed?.data) d = parsed.data;
        }
      } catch {}
    }
    if (d) {
      // Always surface the logged-in user's current name (falls back to candidate name / sample)
      const realName = user?.name?.trim();
      if (realName) {
        d = { ...d, candidate: { ...d.candidate, displayName: realName } };
      }
    }
    return d || null;
  };
  const [data, setData] = useState(buildData);
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadPdf(data);
      toast.success('Report downloaded');
    } catch {
      toast.error('Download failed');
    }
    setGenerating(false);
  };
  return (
    <div className="h-screen flex flex-col bg-[#0A0A16]">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {!data ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center">
            <FileText size={28} className="text-purple-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">No prediction found</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Run a prediction in the NEXA Predictor first to generate your admission report. A report can't be generated without prediction results.
            </p>
          </div>
          <Link to="/opportunity-predictor" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
            Go to NEXA Predictor <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
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
          <div className="flex-1 flex">
            <PdfViewer data={data} />
          </div>
        </>
      )}
    </div>
  );
}
