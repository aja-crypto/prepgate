import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

const MARKDOWN_COMPONENTS = {
  pre({ children }) {
    return (
      <pre
        className="overflow-x-auto rounded-lg text-[11px] leading-relaxed my-2 p-3 font-mono"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </pre>
    );
  },
  code({ inline, className, children, ...props }) {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd' }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-2 -mx-1 px-1">
        <table
          className="w-full text-[11px] border-collapse"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead>{children}</thead>;
  },
  tbody({ children }) {
    return <tbody>{children}</tbody>;
  },
  th({ children }) {
    return (
      <th
        className="px-2.5 py-1.5 text-left font-bold text-text whitespace-nowrap"
        style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td
        className="px-2.5 py-1.5 border-b text-text2"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        {children}
      </td>
    );
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: '#22d3ee' }}
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="list-disc ml-4 space-y-0.5 my-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal ml-4 space-y-0.5 my-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="text-text2 leading-relaxed">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote
        className="border-l-2 my-2 pl-3 italic"
        style={{ borderColor: 'rgba(139,92,246,0.3)', color: 'rgba(255,255,255,0.5)' }}
      >
        {children}
      </blockquote>
    );
  },
  h1({ children }) {
    return <h1 className="text-sm font-bold mt-3 mb-1 text-text">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xs font-bold mt-3 mb-1 text-text">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-[11px] font-bold mt-2 mb-1 text-text">{children}</h3>;
  },
  p({ children }) {
    return <p className="my-1 leading-relaxed text-text2">{children}</p>;
  },
  hr() {
    return <hr className="my-3 border-border" />;
  },
  strong({ children }) {
    return <strong className="font-bold text-text">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
};

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  return (
    <div className={`text-[11px] text-text2 leading-relaxed ${className}`}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={MARKDOWN_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
