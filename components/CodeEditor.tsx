
import React, { useRef, useMemo, useState, useEffect } from 'react';
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

const LINE_HEIGHT = 24; // Fixed line height in pixels (matches Tailwind leading-6)

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [activeLine, setActiveLine] = useState(0);

  const lines = useMemo(() => value.split('\n'), [value]);
  const totalLines = lines.length;

  // --- Resize Observer to handle window resizing ---
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Sync Scroll ---
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);

    // Sync active line based on cursor position logic could go here, 
    // but we use click/keyup for that to be more precise
  };

  const updateActiveLine = () => {
    if (textareaRef.current) {
      const { selectionStart } = textareaRef.current;
      const val = textareaRef.current.value;
      // Faster way to count newlines up to selection
      let line = 0;
      for (let i = 0; i < selectionStart; i++) {
        if (val[i] === '\n') line++;
      }
      setActiveLine(line);
    }
  };

  const handleKeyUp = () => updateActiveLine();
  const handleClick = () => updateActiveLine();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    requestAnimationFrame(updateActiveLine);
  };

  // --- Search Auto-Scroll ---
  useEffect(() => {
    if (searchTerm && value && textareaRef.current) {
      const lowerVal = value.toLowerCase();
      const lowerTerm = searchTerm.toLowerCase();
      const index = lowerVal.indexOf(lowerTerm);

      if (index !== -1) {
        let lineIndex = 0;
        for (let i = 0; i < index; i++) {
          if (value[i] === '\n') lineIndex++;
        }
        const scrollTo = Math.max(0, (lineIndex * LINE_HEIGHT) - (containerHeight / 2));
        textareaRef.current.scrollTo({ top: scrollTo, behavior: 'auto' }); // 'auto' is faster than smooth for large jumps
        setScrollTop(scrollTo);
      }
    }
  }, [searchTerm, value, containerHeight]);


  // --- Virtualization Logic ---
  const startLine = Math.floor(scrollTop / LINE_HEIGHT);
  const visibleLinesCount = Math.ceil(containerHeight / LINE_HEIGHT);
  // Render a buffer of lines above and below to prevent white flashes while scrolling
  const renderStart = Math.max(0, startLine - 5);
  const renderEnd = Math.min(totalLines, startLine + visibleLinesCount + 5);

  const visibleLines = useMemo(() => {
    return lines.slice(renderStart, renderEnd).map((line, index) => ({
      index: renderStart + index,
      content: line
    }));
  }, [lines, renderStart, renderEnd]);


  // --- Syntax Highlighting ---
  const highlightCode = (code: string) => {
    if (!code) return '';

    // SAFETY CHECK: If line is too long, disable regex highlighting to prevent freeze
    if (code.length > 2000) {
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    const escapeHtml = (unsafe: string) => unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

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
    } else if (format === 'csv') {
      highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(?:""|[^"])*")|(,)|([^,\n\r]+)/g,
          (match, quoted, comma, val) => {
            if (quoted) return `<span class="text-green-600 dark:text-green-400">${quoted}</span>`;
            if (comma) return `<span class="text-slate-300 dark:text-slate-600 font-bold select-none">,</span>`;
            if (val) {
              if (!isNaN(Number(val.trim())) && val.trim() !== '') {
                return `<span class="text-orange-600 dark:text-orange-400">${val}</span>`;
              }
              return `<span class="text-blue-600 dark:text-blue-400">${val}</span>`;
            }
            return match;
          }
        );
    } else {
      // Simple fallback for YAML/XML/Others to avoid complex regex perf hit on scroll
      highlighted = escapeHtml(code);
    }

    if (searchTerm) {
      const term = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${term})(?![^<]*>)`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="bg-yellow-400 text-black rounded-[1px]">$1</span>`);
    }

    return highlighted;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full bg-slate-50 dark:bg-slate-950 font-mono text-sm overflow-hidden ${className} ${error ? 'border-2 border-red-500 rounded-lg' : ''}`}
    >

      {/* 1. Line Numbers Layer (Virtualized) */}
      {showLineNumbers && (
        <div
          className="w-14 shrink-0 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-right select-none z-10 overflow-hidden"
          style={{ height: '100%' }}
        >
          <div style={{ transform: `translateY(-${scrollTop}px)`, padding: '1rem 0' }}>
            {/* Only render line numbers that correspond to the visible lines */}
            {visibleLines.map(({ index }) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: (index * LINE_HEIGHT) + 16, // +16 for padding top
                  left: 0,
                  right: 12,
                  height: LINE_HEIGHT
                }}
                className={`leading-6 transition-colors ${index === activeLine
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : ''
                  }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="relative flex-1 h-full overflow-hidden">

        {/* Empty State */}
        {value.length === 0 && (
          <div
            className="absolute top-4 left-4 text-slate-400 dark:text-slate-600 font-mono text-sm pointer-events-none select-none z-20 leading-relaxed whitespace-pre"
          >
            {format === 'csv' ? (
              <>
                <span className="italic"># This file is empty. Start typing or paste CSV data.</span>
                {"\n"}
                <span className="italic"># Example format:</span>
                {"\n\n"}
                <span className="opacity-50 text-slate-500 dark:text-slate-500 italic">
                  ID,Product Name,Category,Price,Stock,IsActive{"\n"}
                  101,Pro Gaming Mouse,Electronics,59.99,140,true
                </span>
              </>
            ) : (
              <span className="italic opacity-75">// This file is empty. Start typing to add content.</span>
            )}
          </div>
        )}

        {/* 2A. Syntax Highlight Layer (Virtualized) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none whitespace-pre z-0"
          style={{
            transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
            padding: '1rem' // Match textarea padding
          }}
        >
          {visibleLines.map(({ index, content }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: (index * LINE_HEIGHT) + 16,
                left: 16,
                right: 0,
                height: LINE_HEIGHT,
                minWidth: "100%",
                width: "fit-content"
              }}
              className={`whitespace-pre ${index === activeLine ? 'bg-slate-200/50 dark:bg-slate-800/80 -mx-4 px-4' : ''}`}
            >
              <span dangerouslySetInnerHTML={{ __html: highlightCode(content) || '\u200B' }} />
            </div>
          ))}
        </div>

        {/* 2B. Native Textarea (Scroller) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          spellCheck={false}
          className="absolute inset-0 w-full h-full m-0 p-4 bg-transparent text-transparent caret-slate-900 dark:caret-white outline-none resize-none whitespace-pre overflow-auto z-10 leading-6"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-auto">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 border border-red-600">
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
