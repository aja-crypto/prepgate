// Formula Revision Sheet – searchable expandable formula cards per subject
import { useState, useMemo } from 'react';
import { FORMULA_SHEETS } from '../data/formulas';
import { useProgress } from '../context/ProgressContext';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';

export default function FormulaSheetPage() {
  const { notes } = useProgress();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [pinned, setPinned] = useState(() => {
    const saved = localStorage.getItem('gatenexa_pinned_formulas');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePin = (f) => {
    const isPinned = pinned.some(p => p.name === f.name);
    let next;
    if (isPinned) {
      next = pinned.filter(p => p.name !== f.name);
      toast.success('Removed from important');
    } else {
      next = [...pinned, f];
      toast.success('Added to important');
    }
    setPinned(next);
    localStorage.setItem('gatenexa_pinned_formulas', JSON.stringify(next));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Formula copied!');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FORMULA_SHEETS;
    return FORMULA_SHEETS.filter((sheet) =>
      sheet.subject.toLowerCase().includes(q) ||
      sheet.formulas.some((f) =>
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.note && f.note.toLowerCase().includes(q))
      )
    ).map((sheet) => ({
      ...sheet,
      formulas: sheet.formulas.filter((f) =>
        !q ||
        sheet.subject.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.formula.toLowerCase().includes(q) ||
        (f.note && f.note.toLowerCase().includes(q))
      ),
    }));
  }, [query]);

  const formulaNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (notes || []).filter((note) => {
      const haystack = `${note.title || ''} ${note.subject || ''} ${note.content || ''} ${note.ocrText || ''}`.toLowerCase();
      const isFormula = note.type === 'formula_sheet' || haystack.includes('formula');
      return isFormula && (!q || haystack.includes(q));
    });
  }, [notes, query]);

  const finalRevisionBook = useMemo(() => {
    const fromPinned = pinned.slice(0, 12);
    if (fromPinned.length >= 8) return fromPinned;
    const topFormulas = FORMULA_SHEETS.flatMap((sheet) => sheet.formulas.slice(0, 2)).slice(0, 12 - fromPinned.length);
    return [...fromPinned, ...topFormulas];
  }, [pinned]);

  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">📚 Formula Sheet Hub</h1>
        <p className="text-sm text-text3 mt-0.5">Formula gallery, OCR search, pinned sheets, and final revision book</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Formula Gallery', value: FORMULA_SHEETS.reduce((s, sh) => s + sh.formulas.length, 0), color: '#4f8dff' },
          { label: 'Subjects', value: FORMULA_SHEETS.length, color: '#06d6a0' },
          { label: 'Pinned', value: pinned.length, color: '#ff9f43' },
          { label: 'OCR Sheets', value: formulaNotes.length, color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text3">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search formulas, subjects, or topics..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="text-[11px] text-text3 mb-4">{filtered.length} subject{filtered.length !== 1 ? 's' : ''} · {filtered.reduce((s, sh) => s + sh.formulas.length, 0)} formulas</div>

      {formulaNotes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="search" className="text-primary w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text2">OCR Search Results</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {formulaNotes.slice(0, 6).map((note) => (
              <div key={note._id || note.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="text-sm font-semibold text-text">{note.title}</div>
                <div className="text-[10px] text-text3 uppercase mt-1">{note.subject}</div>
                <p className="text-xs text-text2 mt-2 line-clamp-2">{note.ocrText || note.content || 'Formula sheet image/PDF'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pinned.length > 0 && !query && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="star" className="text-yellow-500 w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text2">Important Formulas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map((f, idx) => (
              <div key={`pinned-${idx}-${f.name}`} className="bg-primary/5 border border-primary/20 rounded-xl p-4 relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-text">{f.name}</div>
                  <button onClick={() => togglePin(f)} className="text-yellow-500">
                    <Icon name="star" className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div className="font-mono text-sm text-primary mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {f.formula}
                </div>
                <button 
                  onClick={() => copyToClipboard(f.formula)}
                  className="text-[10px] font-bold text-primary uppercase hover:underline flex items-center gap-1"
                >
                  <Icon name="copy" className="w-3 h-3" /> Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="note" className="text-primary w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text2">Final Revision Formula Book</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {finalRevisionBook.map((f, idx) => (
              <div key={`final-${idx}-${f.name}`} className="bg-bg-2 border border-border rounded-xl p-3">
                <div className="text-xs font-bold text-text mb-1">{f.name}</div>
                <div className="font-mono text-xs text-primary overflow-x-auto whitespace-nowrap">{f.formula}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((sheet, sheetIdx) => {
          const isOpen = expanded === sheet.id;
          return (
            <div key={`sheet-${sheetIdx}-${sheet.id}`} className={`bg-surface border rounded-xl transition-all ${isOpen ? 'border-white/20' : 'border-border hover:border-white/10'}`}>
              <button onClick={() => toggle(sheet.id)} className="w-full p-4 flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${sheet.color}20` }}>
                  {sheet.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text">{sheet.subject}</div>
                  <div className="text-[11px] text-text3 mt-0.5">{sheet.formulas.length} formulas</div>
                </div>
                <span className="text-text3 text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-border p-4 space-y-3">
                  {sheet.formulas.map((f, fIdx) => {
                    const isPinned = pinned.some(p => p.name === f.name);
                    return (
                      <div key={`formula-${sheetIdx}-${fIdx}-${f.name}`} className="bg-bg-2 border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-medium text-text">{f.name}</div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(f.formula)}
                              className="p-1.5 hover:bg-bg-3 rounded-lg text-text3 hover:text-primary transition-colors"
                              title="Copy formula"
                            >
                              <Icon name="copy" className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => togglePin(f)}
                              className={`p-1.5 hover:bg-bg-3 rounded-lg transition-colors ${isPinned ? 'text-yellow-500' : 'text-text3'}`}
                              title={isPinned ? 'Remove from important' : 'Mark as important'}
                            >
                              <Icon name="star" className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                        <div className="font-mono text-sm text-primary bg-primary/5 border border-primary/10 rounded px-3 py-2 my-2 overflow-x-auto">
                          {f.formula}
                        </div>
                        {f.note && <div className="text-[11px] text-text3">💡 {f.note}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
            <Icon name="search" className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-text mb-2">No Formulas Match</h3>
          <p className="text-sm text-text3 max-w-xs leading-relaxed mb-6">Try adjusting your filters or search terms</p>
          <button onClick={() => setQuery('')} className="text-sm bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Clear Filters</button>
        </div>
      )}
    </div>
  );
}
