// Admin PYQ bulk import — CSV/JSON (legal content only, no scraping)
import { useState, useEffect } from 'react';
import { adminPyqService, getApiErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminPYQTab() {
  const [template, setTemplate] = useState(null);
  const [dbPyqs, setDbPyqs] = useState([]);
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState('json');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upsert, setUpsert] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tpl, pyqs] = await Promise.all([
        adminPyqService.getImportTemplate(),
        adminPyqService.getAll({ limit: 100 }),
      ]);
      setTemplate(tpl.data.data);
      setDbPyqs(pyqs.data.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load PYQ admin data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validate = async () => {
    try {
      const rows = importFormat === 'json' ? JSON.parse(importText) : null;
      if (importFormat === 'json') {
        const res = await adminPyqService.validate(Array.isArray(rows) ? rows : rows.questions || []);
        setValidation(res.data.data);
        toast.success(`Valid: ${res.data.data.valid.length}, Invalid: ${res.data.data.invalid.length}`);
      } else {
        toast('CSV validation runs on import', { icon: 'ℹ️' });
      }
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  const runImport = async () => {
    setLoading(true);
    try {
      let res;
      if (importFormat === 'json') {
        const rows = JSON.parse(importText);
        res = await adminPyqService.importJson(Array.isArray(rows) ? rows : rows.questions || [], upsert);
      } else {
        res = await adminPyqService.importCsv(importText, upsert);
      }
      const { inserted, failed } = res.data.data;
      toast.success(`Imported ${inserted.length} questions (${failed.length} failed)`);
      if (failed.length) console.warn('Import failures:', failed);
      setImportText('');
      setValidation(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import failed'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    if (!template) return;
    const blob = new Blob([JSON.stringify(template.example, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pyq-import-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text">PYQ Import System</h3>
            <p className="text-[11px] text-text3 mt-1">
              Import legally obtained PYQs via CSV or JSON. Do not scrape copyrighted content.
            </p>
          </div>
          <button type="button" onClick={downloadTemplate} className="text-xs btn-ghost">Download Template</button>
        </div>

        {template?.notes && (
          <ul className="text-[10px] text-text3 space-y-1 mb-4 list-disc pl-4">
            {template.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        )}

        <div className="flex gap-2 mb-3">
          {['json', 'csv'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setImportFormat(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border uppercase ${
                importFormat === f ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
              }`}
            >
              {f}
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-[10px] text-text3 ml-auto">
            <input type="checkbox" checked={upsert} onChange={(e) => setUpsert(e.target.checked)} />
            Upsert existing
          </label>
        </div>

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={importFormat === 'json'
            ? '[{"title":"...","subjectCode":"OS","topicName":"Deadlock","year":2022,...}]'
            : 'title,subjectCode,topicName,year,difficulty,marks,questionType,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation'}
          rows={8}
          className="input-field font-mono text-xs mb-3"
        />

        <div className="flex gap-2">
          {importFormat === 'json' && (
            <button type="button" onClick={validate} className="btn-ghost">Validate</button>
          )}
          <button type="button" disabled={!importText || loading} onClick={runImport} className="btn-primary flex-1">
            {loading ? 'Importing...' : 'Import PYQs'}
          </button>
        </div>

        {validation && (
          <div className="mt-3 text-[10px] text-text3">
            Validation: {validation.valid.length} valid, {validation.invalid.length} invalid
            {validation.invalid.slice(0, 3).map((inv) => (
              <div key={inv.index} className="text-red-400 mt-1">Row {inv.index}: {inv.errors.join(', ')}</div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Database PYQs ({dbPyqs.length})</h3>
          <button type="button" onClick={load} className="text-xs btn-ghost">Refresh</button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {dbPyqs.map((p) => (
            <div key={p._id} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg p-3 text-sm">
              <div>
                <span className="text-text">{p.title}</span>
                <span className="text-[10px] text-text3 ml-2">
                  {p.subject?.code} · {p.topic?.name || '—'} · {p.year}
                </span>
              </div>
              <span className="text-[10px] text-text3 capitalize">{p.difficulty}</span>
            </div>
          ))}
          {!dbPyqs.length && (
            <p className="text-xs text-text3 text-center py-6">
              No PYQs in database. Run <code className="text-primary">npm run seed</code> or import above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
