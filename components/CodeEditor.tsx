import React, { useRef, useMemo } from 'react';
import { FileFormat } from '../types';
import { AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  searchTerm?: string;
  format: FileFormat;
  error?: string | null;
  showLineNumbers?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  className = '', 
  searchTerm = '', 
  format, 
  error,
  showLineNumbers = true
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
    }
  };

  const lines = useMemo(() => {
    if (!showLineNumbers) return [];
    const count = value.split('\n').length;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [value, showLineNumbers]);

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const highlightCode = (code: string) => {
    if (!code) return '';
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let highlighted = '';

    if (format === 'json') {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
          (token) => {
            let cls = 'text-orange-600 dark:text-orange-400';
            if (/^"/.test(token)) {
              if (/:$/.test(token)) cls = 'text-blue-600 dark:text-blue-400 font-bold';
              else cls = 'text-green-600 dark:text-green-400';
            } else if (/true|false/.test(token)) cls = 'text-purple-600 dark:text-purple-400';
            else if (/null/.test(token)) cls = 'text-pink-600 dark:text-pink-400';
            return `<span class="${cls}">${token}</span>`;
          }
        );
    } else if (format === 'yaml') {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /^(\s*)([\w\d_]+)(:)(.*)$/gm, 
          (match, indent, key, colon, value) => `${indent}<span class="text-blue-600 dark:text-blue-400 font-bold">${key}</span>${colon}<span class="text-green-600 dark:text-green-400">${value}</span>`
        )
        .replace(/(- )/g, '<span class="text-purple-600 dark:text-purple-400 font-bold">- </span>');
    } else if (format === 'xml') {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /(&lt;\/?[a-zA-Z0-9_:-]+)(\s.*?)*(&gt;)/g,
          (match, startTag, attrs, endTag) => {
             let coloredAttrs = '';
             if (attrs) {
               coloredAttrs = attrs.replace(
                 /([a-zA-Z0-9_:-]+)=(".*?"|'.*?')/g, 
                 '<span class="text-orange-600 dark:text-orange-400">$1</span>=<span class="text-green-600 dark:text-green-400">$2</span>'
               );
             }
             return `<span class="text-blue-600 dark:text-blue-400 font-bold">${startTag}</span>${coloredAttrs || ''}<span class="text-blue-600 dark:text-blue-400 font-bold">${endTag}</span>`;
          }
        );
    } else {
      highlighted = escapeHtml(code);
    }

    if (searchTerm) {
       const term = escapeRegExp(searchTerm);
       const regex = new RegExp(`(${term})(?![^<]*>)`, 'gi');
       highlighted = highlighted.replace(regex, `<span class="bg-yellow-400 text-black rounded-[1px]">$1</span>`);
    }

    return highlighted;
  };

  return (
    <div className={`flex h-full w-full bg-slate-50 dark:bg-slate-950 font-mono text-sm transition-colors duration-200 overflow-hidden ${className} ${error ? 'border-2 border-red-500 rounded-lg' : ''}`}>
      
      {/* Line Numbers Gutter */}
      {showLineNumbers && (
        <div 
          ref={gutterRef}
          className="w-12 shrink-0 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-right pr-3 pt-4 select-none overflow-hidden leading-6"
        >
          {lines.map(line => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}

      <div className="relative flex-1 h-full overflow-hidden">
        {/* Empty State Placeholder */}
        {value.length === 0 && (
          <div className="absolute top-4 left-4 text-slate-400 dark:text-slate-500 italic pointer-events-none z-20 select-none font-sans">
            // This file is empty. Start typing to add content.
          </div>
        )}

        {/* Syntax Highlight Layer */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 p-4 pointer-events-none whitespace-pre-wrap break-words overflow-hidden leading-6"
          dangerouslySetInnerHTML={{ __html: highlightCode(value) }}
        />
        {/* Input Layer */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full m-0 p-4 bg-transparent text-transparent caret-slate-900 dark:caret-white outline-none resize-none whitespace-pre-wrap break-words z-10 leading-6"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-none">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 border border-red-600 pointer-events-auto">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90">Syntax Error</h4>
              <p className="text-sm font-mono break-all">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;