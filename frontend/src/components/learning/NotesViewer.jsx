import { useState, useMemo } from 'react';

function simpleMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/### (.+)/g, '<h3 class="text-base font-semibold text-gray-100 mt-4 mb-2">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-lg font-semibold text-gray-100 mt-5 mb-2">$1</h2>')
    .replace(/# (.+)/g, '<h1 class="text-xl font-bold text-gray-100 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-200 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-purple-300 px-1 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)/gm, '<li class="text-gray-300 ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-300 mb-2">')
    .replace(/\n/g, '<br />');
}

export default function NotesViewer({ content, contentType, title }) {
  const [copied, setCopied] = useState(false);

  const rendered = useMemo(() => {
    if (!content) return '<p class="text-gray-500 italic">No content available.</p>';
    if (contentType === 'markdown' || contentType === 'text') {
      return simpleMarkdown(content);
    }
    return content;
  }, [content, contentType]);

  const copyContent = () => {
    navigator.clipboard.writeText(typeof content === 'string' ? content : '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-gray-950 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-200">{title}</span>
          <button onClick={copyContent} className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <div className="p-4 max-h-[70vh] overflow-y-auto notes-content">
        <div dangerouslySetInnerHTML={{ __html: rendered }} className="text-sm leading-relaxed" />
      </div>
      <style>{`
        .notes-content pre { background: #0d0d1a !important; border: 1px solid rgba(139,92,246,0.1); }
        .notes-content code { font-size: 0.8rem; }
        .notes-content img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
        .notes-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .notes-content th, .notes-content td { border: 1px solid rgba(139,92,246,0.15); padding: 0.5rem; text-align: left; }
        .notes-content th { background: rgba(139,92,246,0.08); color: #e2e8f0; font-weight: 600; }
        .notes-content td { color: #cbd5e1; }
      `}</style>
    </div>
  );
}
