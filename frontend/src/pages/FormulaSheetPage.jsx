// Formula Revision Sheet – searchable expandable formula cards per subject
import { useState, useMemo } from 'react';
import { FORMULA_SHEETS } from '../data/formulas';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';

export default function FormulaSheetPage() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [pinned, setPinned] = useState(() => {
    const saved = localStorage.getItem('pinned_formulas');
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
    localStorage.setItem('pinned_formulas', JSON.stringify(next));
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

  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">📚 Formula Revision Sheet</h1>
        <p className="text-sm text-text3 mt-0.5">Quick-reference formulas for all GATE CSE subjects</p>
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

      {pinned.length > 0 && !query && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="star" className="text-yellow-500 w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text2">Important Formulas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map((f) => (
              <div key={`pinned-${f.name}`} className="bg-primary/5 border border-primary/20 rounded-xl p-4 relative group">
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

      <div className="space-y-2">
        {filtered.map((sheet) => {
          const isOpen = expanded === sheet.id;
          return (
            <div key={sheet.id} className={`bg-surface border rounded-xl transition-all ${isOpen ? 'border-white/20' : 'border-border hover:border-white/10'}`}>
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
                  {sheet.formulas.map((f) => {
                    const isPinned = pinned.some(p => p.name === f.name);
                    return (
                      <div key={f.name} className="bg-bg-2 border border-border rounded-lg p-3">
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
        <div className="text-center py-12 text-text3">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No formulas match &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
