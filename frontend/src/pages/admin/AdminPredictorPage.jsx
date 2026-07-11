import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminPredictorService } from '../../services/adminApi';
import toast from 'react-hot-toast';
import {
  Database, Upload, Plus, Trash2, RefreshCw, Download, Search, Filter,
  BarChart3, School, Building2, TrendingUp, X, CheckCircle2, AlertCircle,
  FileText, Table, Eye, Layers, ChevronDown, ChevronRight, Loader2,
  Activity, PieChart, Target, Award, Clock,
} from 'lucide-react';

const DATASET_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'import', label: 'Smart Import', icon: Upload },
  { id: 'marks-score', label: 'Marks→Score', icon: TrendingUp },
  { id: 'score-rank', label: 'Score→Rank', icon: TrendingUp },
  { id: 'rank-percentile', label: 'Rank→Percentile', icon: TrendingUp },
  { id: 'gate-statistics', label: 'GATE Stats', icon: BarChart3 },
  { id: 'ccmt', label: 'CCMT Cutoffs', icon: Database },
  { id: 'coap', label: 'COAP Offers', icon: Database },
  { id: 'seat-matrix', label: 'Seat Matrix', icon: Layers },
  { id: 'branch-stats', label: 'Branch Stats', icon: Activity },
  { id: 'cutoffs', label: 'Qualifying', icon: TrendingUp },
  { id: 'rank-data', label: 'Rank Data', icon: BarChart3 },
  { id: 'score-data', label: 'Score Data', icon: BarChart3 },
  { id: 'colleges', label: 'Colleges', icon: School },
  { id: 'college-cutoffs', label: 'College Cutoffs', icon: Building2 },
  { id: 'psus', label: 'PSUs', icon: Building2 },
  { id: 'psu-recruitment', label: 'PSU Recruitment', icon: Building2 },
  { id: 'feedback', label: 'Feedback', icon: Award },
  { id: 'accuracy', label: 'Accuracy', icon: Target },
  { id: 'predictions', label: 'Predictions', icon: PieChart },
];

const DATASET_LABELS = {
  'overview': 'Overview', 'import': 'Smart Import', 'marks-score': 'Marks → Score',
  'score-rank': 'Score → Rank', 'rank-percentile': 'Rank → Percentile',
  'gate-statistics': 'GATE Statistics', 'ccmt': 'CCMT Cutoffs', 'coap': 'COAP Offers',
  'seat-matrix': 'Seat Matrix', 'branch-stats': 'Branch Statistics',
  'cutoffs': 'Qualifying Cutoffs', 'rank-data': 'Rank Data', 'score-data': 'Score Data',
  'colleges': 'Colleges', 'college-cutoffs': 'College Cutoffs',
  'psus': 'PSU Requirements', 'psu-recruitment': 'PSU Recruitment',
  'feedback': 'Prediction Feedback', 'accuracy': 'Prediction Accuracy', 'predictions': 'All Predictions',
};

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between mb-2">
        {Icon && <Icon size={16} style={{ color }} />}
        {sub && <span className="text-[9px] text-text3">{sub}</span>}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value ?? '—'}</div>
      <div className="text-[10px] text-text3 uppercase mt-1">{label}</div>
    </div>
  );
}

function SmartImportTab() {
  const [jsonInput, setJsonInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [detectedType, setDetectedType] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [year, setYear] = useState('');
  const [paper, setPaper] = useState('CS');
  const [activeTab, setActiveTab] = useState('json');

  const parseJSON = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) { toast.error('JSON must be an array'); return; }
      if (data.length === 0) { toast.error('Array is empty'); return; }
      handlePreview(data);
    } catch (e) { toast.error('Invalid JSON: ' + e.message); }
  };

  const parseCSV = () => {
    try {
      const lines = csvInput.trim().split('\n');
      if (lines.length < 2) { toast.error('CSV must have header + data rows'); return; }
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).filter(l => l.trim()).map(l => {
        const vals = l.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      });
      handlePreview(data);
    } catch (e) { toast.error('CSV parse error: ' + e.message); }
  };

  const handlePreview = async (data) => {
    try {
      const res = await adminPredictorService.previewImport(data);
      setDetectedType(res.data.type);
      setPreview(res.data);
      toast.success(`Detected: ${res.data.type} (${res.data.totalRows} rows)`);
    } catch (e) {
      toast.error('Preview failed: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleImport = async () => {
    let data;
    try {
      data = JSON.parse(jsonInput);
    } catch (e) { toast.error('Invalid JSON'); return; }
    if (!Array.isArray(data) || data.length === 0) { toast.error('Empty array'); return; }
    setImporting(true);
    try {
      const res = await adminPredictorService.importSmart(data, null, year ? parseInt(year) : undefined, paper);
      if (res.data.success) {
        toast.success(`Imported ${res.data.inserted || res.data.count || 0} rows (${res.data.type})`);
        setPreview(null);
        setJsonInput('');
      } else {
        toast.error('Import had issues: ' + (res.data.errorCount || 0) + ' errors');
        setPreview(res.data);
      }
    } catch (e) {
      toast.error('Import failed: ' + (e.response?.data?.message || e.message));
    } finally { setImporting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => setActiveTab('json')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'json' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-text3 border border-border hover:text-text'}`}>
          <FileText size={12} className="inline mr-1" /> JSON
        </button>
        <button onClick={() => setActiveTab('csv')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'csv' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-text3 border border-border hover:text-text'}`}>
          <Table size={12} className="inline mr-1" /> CSV
        </button>
        <div className="ml-auto flex gap-2">
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="Year (optional)" className="w-20 px-2 py-1.5 rounded-lg text-xs bg-bg-2 border border-border text-text outline-none" />
          <input value={paper} onChange={e => setPaper(e.target.value)} placeholder="Paper (CS)" className="w-20 px-2 py-1.5 rounded-lg text-xs bg-bg-2 border border-border text-text outline-none" />
        </div>
      </div>

      {activeTab === 'json' ? (
        <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={`[{\n  "institute": "IIT Bombay",\n  "program": "M.Tech CSE",\n  "category": "General",\n  "closingScore": 750,\n  "year": 2024\n}]`}
          className="w-full h-48 rounded-xl px-4 py-3 text-xs font-mono bg-bg-2 border border-border text-text placeholder-text3 outline-none focus:border-purple-500/30 resize-y" />
      ) : (
        <textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} placeholder={`institute,program,category,closingScore,year\nIIT Bombay,M.Tech CSE,General,750,2024\nIIT Delhi,M.Tech CSE,General,720,2024`}
          className="w-full h-48 rounded-xl px-4 py-3 text-xs font-mono bg-bg-2 border border-border text-text placeholder-text3 outline-none focus:border-purple-500/30 resize-y" />
      )}

      <div className="flex gap-2">
        <button onClick={activeTab === 'json' ? parseJSON : parseCSV} className="px-4 py-2 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center gap-1.5">
          <Eye size={12} /> Preview
        </button>
        {preview && (
          <button onClick={handleImport} disabled={importing} className="px-4 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center gap-1.5">
            {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {importing ? 'Importing...' : `Import to ${detectedType}`}
          </button>
        )}
        {preview && <button onClick={() => { setPreview(null); setDetectedType(null); }} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text"><X size={12} className="inline mr-1" /> Clear</button>}
      </div>

      {detectedType && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <span className="text-xs font-medium text-purple-300">Detected: {DATASET_LABELS[detectedType] || detectedType}</span>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          {preview.warnings?.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.12)' }}>
              <div className="text-xs font-medium text-yellow-400 mb-2">⚠ Warnings ({preview.warnings.length})</div>
              {preview.warnings.slice(0, 5).map((w, i) => (
                <div key={i} className="text-[10px] text-yellow-300/70">Row {w.row}: {w.message}</div>
              ))}
            </div>
          )}
          {preview.errors?.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <div className="text-xs font-medium text-red-400 mb-2">✗ Errors ({preview.errors.length})</div>
              {preview.errors.slice(0, 5).map((e, i) => (
                <div key={i} className="text-[10px] text-red-300/70">Row {e.row}: {e.message}</div>
              ))}
            </div>
          )}
          {preview.sample && preview.sample.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    {Object.keys(preview.sample[0]).map(k => (
                      <th key={k} className="px-3 py-2 text-left font-medium text-text3">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-text truncate max-w-[150px]">{String(v ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataTable({ data, columns, loading, onDelete }) {
  if (loading) return <div className="text-center py-12 text-sm text-text3">Loading...</div>;
  if (!data || data.length === 0) return <div className="text-center py-12 text-sm text-text3">No data. Import using Smart Import tab.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map(col => (
              <th key={col.key} className="px-3 py-2.5 text-left font-medium text-text3">{col.label}</th>
            ))}
            <th className="px-3 py-2.5 text-right font-medium text-text3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 200).map((item, idx) => (
            <tr key={item._id || idx} className="border-b border-border/50 hover:bg-hover/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-3 py-2.5 text-text truncate max-w-[200px]">
                  {col.render ? col.render(item[col.key], item) : item[col.key] ?? '—'}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right">
                <button onClick={() => onDelete?.(item._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 200 && <div className="px-3 py-2 text-[10px] text-text3">Showing 200 of {data.length}</div>}
    </div>
  );
}

function FeedbackTab({ data, loading }) {
  if (loading) return <div className="text-center py-12 text-sm text-text3">Loading...</div>;
  if (!data || data.length === 0) return <div className="text-center py-12 text-sm text-text3">No feedback yet.</div>;
  return (
    <div className="space-y-2">
      {data.map((fb, idx) => (
        <div key={fb._id || idx} className="rounded-xl p-4 border border-border" style={{ background: fb.isCorrect ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${fb.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {fb.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
              <span className="text-[10px] text-text3">{new Date(fb.createdAt).toLocaleDateString()}</span>
            </div>
            {fb.user && <span className="text-[10px] text-text3">{fb.user.name || fb.user.email}</span>}
          </div>
          <div className="text-xs text-text2">{fb.feedbackText || 'No feedback'}</div>
          {(fb.actualRank || fb.actualScore) && (
            <div className="flex gap-3 mt-1 text-[10px] text-text3">
              {fb.actualRank && <span>Actual Rank: {fb.actualRank}</span>}
              {fb.actualScore && <span>Actual Score: {fb.actualScore}</span>}
              {fb.actualCollege && <span>College: {fb.actualCollege}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminPredictorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [counts, setCounts] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await adminPredictorService.getDatasetCounts();
      setCounts(res.data.data);
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchData = useCallback(async (tab) => {
    setDataLoading(true);
    try {
      if (tab === 'feedback') {
        const res = await adminPredictorService.getFeedback({ limit: 100 });
        setData(res.data.data || []);
        return;
      }
      if (tab === 'accuracy') {
        const res = await adminPredictorService.getAccuracy();
        setData(res.data.data ? [res.data.data] : []);
        return;
      }
      if (tab === 'predictions') {
        const res = await adminPredictorService.getStats();
        setData([]);
        return;
      }
      const svc = adminPredictorService[tab];
      if (svc?.list) {
        const res = await svc.list({ limit: 200 });
        setData(res.data.data || []);
      } else {
        setData([]);
      }
    } catch (e) { setData([]); }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { if (activeTab !== 'overview' && activeTab !== 'import') fetchData(activeTab); }, [activeTab, fetchData]);

  const handleDelete = async (tab, id) => {
    if (!confirm('Delete this item?')) return;
    try {
      const svc = adminPredictorService[tab];
      if (svc?.delete) await svc.delete(id);
      toast.success('Deleted');
      fetchData(tab);
      fetchCounts();
    } catch (e) { toast.error('Delete failed'); }
  };

  const getColumns = (tab) => {
    switch (tab) {
      case 'marks-score': return [
        { key: 'year', label: 'Year' }, { key: 'marks', label: 'Marks' }, { key: 'score', label: 'Score' },
      ];
      case 'score-rank': return [
        { key: 'year', label: 'Year' }, { key: 'score', label: 'Score' }, { key: 'rank', label: 'Rank' },
      ];
      case 'rank-percentile': return [
        { key: 'year', label: 'Year' }, { key: 'rank', label: 'Rank' }, { key: 'percentile', label: 'Percentile' },
      ];
      case 'gate-statistics': return [
        { key: 'year', label: 'Year' }, { key: 'totalCandidates', label: 'Candidates' },
        { key: 'meanMarks', label: 'Mean' }, { key: 'qualifyingMarks', label: 'Qualifying' },
      ];
      case 'ccmt': return [
        { key: 'year', label: 'Year' }, { key: 'institute', label: 'Institute' },
        { key: 'program', label: 'Program' }, { key: 'category', label: 'Category' },
        { key: 'closingScore', label: 'Closing' }, { key: 'round', label: 'Rnd' },
      ];
      case 'coap': return [
        { key: 'year', label: 'Year' }, { key: 'institute', label: 'Institute' },
        { key: 'program', label: 'Program' }, { key: 'closingScore', label: 'Closing' },
        { key: 'offerRound', label: 'Round' },
      ];
      case 'seat-matrix': return [
        { key: 'year', label: 'Year' }, { key: 'institute', label: 'Institute' },
        { key: 'program', label: 'Program' }, { key: 'totalSeats', label: 'Seats' },
      ];
      case 'branch-stats': return [
        { key: 'year', label: 'Year' }, { key: 'branch', label: 'Branch' },
        { key: 'avgScore', label: 'Avg' }, { key: 'totalSeats', label: 'Seats' },
      ];
      case 'cutoffs': return [
        { key: 'year', label: 'Year' }, { key: 'category', label: 'Category' },
        { key: 'qualifyingMarks', label: 'Marks' }, { key: 'source', label: 'Source' },
      ];
      case 'rank-data': return [
        { key: 'year', label: 'Year' }, { key: 'marks', label: 'Marks' }, { key: 'rank', label: 'Rank' },
      ];
      case 'score-data': return [
        { key: 'year', label: 'Year' }, { key: 'score', label: 'Score' }, { key: 'rank', label: 'Rank' },
      ];
      case 'colleges': return [
        { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
        { key: 'state', label: 'State' }, { key: 'nirfRanking', label: 'NIRF' },
      ];
      case 'college-cutoffs': return [
        { key: 'collegeName', label: 'College' }, { key: 'program', label: 'Program' },
        { key: 'category', label: 'Category' }, { key: 'closingScore', label: 'Score' },
        { key: 'year', label: 'Year' },
      ];
      case 'psus': return [
        { key: 'name', label: 'Name' }, { key: 'year', label: 'Year' },
        { key: 'category', label: 'Category' }, { key: 'cutoffScore', label: 'Cutoff' },
      ];
      case 'psu-recruitment': return [
        { key: 'name', label: 'Name' }, { key: 'year', label: 'Year' },
        { key: 'status', label: 'Status' }, { key: 'totalPosts', label: 'Posts' },
      ];
      case 'feedback': return [];
      case 'accuracy': return [
        { key: 'overallAccuracy', label: 'Accuracy' }, { key: 'totalPredictions', label: 'Total' },
        { key: 'correctPredictions', label: 'Correct' }, { key: 'incorrectPredictions', label: 'Incorrect' },
      ];
      default: return [];
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">NEXA Predictor v2 — Dataset Manager</h1>
          <p className="text-sm text-text3 mt-0.5">Manage all prediction datasets: GATE, CCMT, COAP, Seat Matrix, Statistics</p>
        </div>
        <button onClick={fetchCounts} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-bg-2 text-text3 border border-border hover:border-white/15 transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {DATASET_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all shrink-0 ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-text3 hover:text-text border border-transparent hover:bg-hover'}`}>
            <tab.icon size={11} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: 'GATE Years', value: counts.gateYears, color: '#8B5CF6', icon: Database },
            { label: '▸ Marks→Score', value: counts.marksScore, color: '#06B6D4', icon: TrendingUp },
            { label: '▸ Score→Rank', value: counts.scoreRank, color: '#06B6D4', icon: TrendingUp },
            { label: '▸ Rank→Percentile', value: counts.rankPercentile, color: '#06B6D4', icon: TrendingUp },
            { label: 'GATE Statistics', value: counts.statistics, color: '#06B6D4', icon: BarChart3 },
            { label: 'Qualifying Cutoffs', value: counts.gateCutoffs, color: '#22C55E', icon: TrendingUp },
            { label: 'Rank Data', value: counts.rankData, color: '#22C55E', icon: BarChart3 },
            { label: 'Score Data', value: counts.scoreData, color: '#22C55E', icon: BarChart3 },
            { label: 'CCMT Cutoffs', value: counts.ccmtCutoffs, color: '#EAB308', icon: Database, sub: '🏛️ Admission data' },
            { label: 'COAP Offers', value: counts.coapCutoffs, color: '#F97316', icon: Database },
            { label: 'Seat Matrix', value: counts.seatMatrix, color: '#EC4899', icon: Layers },
            { label: 'Branch Stats', value: counts.branchStats, color: '#EC4899', icon: Activity },
            { label: 'Colleges', value: counts.colleges, color: '#8B5CF6', icon: School },
            { label: 'College Cutoffs', value: counts.collegeCutoffs, color: '#8B5CF6', icon: Building2 },
            { label: 'PSU Requirements', value: counts.psus, color: '#EF4444', icon: Building2 },
            { label: 'PSU Recruitments', value: counts.psuRecruitments, color: '#EF4444', icon: Building2 },
            { label: 'Predictions', value: counts.predictions, color: '#A855F7', icon: PieChart },
            { label: 'User Feedback', value: counts.feedback, color: '#22C55E', icon: Award },
            { label: 'Accuracy', value: counts.predictionAccuracy != null ? `${counts.predictionAccuracy}%` : '—', color: '#22C55E', icon: Target },
            { label: 'Total Data Points', value: counts.totalDataPoints, color: '#8B5CF6', icon: Database },
          ].map((item, idx) => (
            <StatCard key={idx} {...item} />
          ))}
        </div>
      )}

      {/* Smart Import */}
      {activeTab === 'import' && <SmartImportTab />}

      {/* Feedback */}
      {activeTab === 'feedback' && <FeedbackTab data={data} loading={dataLoading} />}

      {/* Accuracy */}
      {activeTab === 'accuracy' && (
        <div className="space-y-4">
          {data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Overall Accuracy" value={`${data[0].overallAccuracy || 0}%`} color="#22C55E" icon={Target} />
              <StatCard label="Total Predictions" value={data[0].totalPredictions || 0} color="#8B5CF6" icon={PieChart} />
              <StatCard label="Correct" value={data[0].correctPredictions || 0} color="#22C55E" icon={CheckCircle2} />
              <StatCard label="Incorrect" value={data[0].incorrectPredictions || 0} color="#EF4444" icon={AlertCircle} />
            </div>
          )}
          {data.length === 0 && <div className="text-center py-12 text-sm text-text3">No accuracy data yet. User feedback will populate this.</div>}
        </div>
      )}

      {/* Predictions (just show count) */}
      {activeTab === 'predictions' && (
        <div className="text-center py-12 text-sm text-text3">
          {counts?.predictions || 0} total predictions saved in database.{' '}
          <button onClick={() => setActiveTab('overview')} className="text-purple-400 underline">View overview</button>
        </div>
      )}

      {/* Data tables for all other tabs */}
      {activeTab !== 'overview' && activeTab !== 'import' && activeTab !== 'feedback' && activeTab !== 'accuracy' && activeTab !== 'predictions' && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-surface flex items-center justify-between">
            <span className="text-xs font-medium text-text3">{DATASET_LABELS[activeTab] || activeTab}</span>
            <span className="text-[10px] text-text3">{data.length} entries</span>
          </div>
          <DataTable data={data} columns={getColumns(activeTab)} loading={dataLoading} onDelete={(id) => handleDelete(activeTab, id)} />
        </div>
      )}
    </div>
  );
}
