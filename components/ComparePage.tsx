
import React, { useState, useRef, useEffect } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ArrowLeft, Upload, Columns, Rows, FileText, X, GitCompare, FilePlus, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { detectFormat } from '../utils/parserUtils';
import { FileFormat } from '../types';

interface ComparePageProps {
  originalContent: string;
  originalFileName?: string;
  onBack: () => void;
  theme: 'dark' | 'light';
}

const ComparePage: React.FC<ComparePageProps> = ({ 
  originalContent, 
  originalFileName, 
  onBack, 
  theme 
}) => {
  // Local state to manage the original file if it wasn't passed in (no active file)
  const [leftFile, setLeftFile] = useState<{content: string, name: string}>({
     content: originalContent || '',
     name: originalFileName || ''
  });

  const [modifiedContent, setModifiedContent] = useState<string | null>(null);
  const [modifiedFileName, setModifiedFileName] = useState<string>('');
  const [splitView, setSplitView] = useState(true);
  const [showAllLines, setShowAllLines] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const leftFileInputRef = useRef<HTMLInputElement>(null);

  // Sync props if they change and our local state was based on them
  useEffect(() => {
    if (originalContent && (!leftFile.content || leftFile.content === '')) {
       setLeftFile({ content: originalContent, name: originalFileName || 'Original' });
    }
  }, [originalContent, originalFileName]);

  const processFile = (file: File, side: 'left' | 'right') => {
    setIsProcessing(true);
    // Timeout allows the UI to render the loading spinner before reading/diffing starts
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          if (side === 'left') {
            setLeftFile({ content: ev.target.result, name: file.name });
          } else {
            setModifiedContent(ev.target.result);
            setModifiedFileName(file.name);
          }
        }
        setIsProcessing(false);
      };
      reader.onerror = () => setIsProcessing(false);
      reader.readAsText(file);
    }, 100);
  };

  const handleLeftFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], 'left');
    }
  };

  const handleRightFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], 'right');
    }
  };

  const handleDropLeft = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], 'left');
    }
  };

  const handleDropRight = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], 'right');
    }
  };

  const clearModified = () => {
    setModifiedContent(null);
    setModifiedFileName('');
    if (rightFileInputRef.current) rightFileInputRef.current.value = '';
  };

  const clearOriginal = () => {
    setLeftFile({ content: '', name: '' });
    if (leftFileInputRef.current) leftFileInputRef.current.value = '';
  };

  // --- Syntax Highlighting for Diff ---
  const highlightSyntax = (str: string): React.ReactElement => {
    if (!str) return <span></span>;

    // Detect format based on content cues or filename if available
    // Defaulting to JSON-like highlighting as it covers most data structures nicely
    let format: FileFormat = 'json';
    if (leftFile.name && detectFormat(leftFile.name) !== 'json') format = detectFormat(leftFile.name);
    if (modifiedFileName && detectFormat(modifiedFileName) !== 'json') format = detectFormat(modifiedFileName);

    let highlighted = str;

    // Basic regex replacement for syntax coloring (Similar to CodeEditor but simplified)
    if (format === 'json' || format === 'yaml') {
        highlighted = highlighted
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          // Keys in quotes (JSON)
          .replace(/"([^"]+)":/g, '<span class="text-blue-600 dark:text-blue-400 font-bold">"$1"</span>:')
          // YAML Keys (simple)
          .replace(/^(\s*)([\w\d_]+):/g, '$1<span class="text-blue-600 dark:text-blue-400 font-bold">$2</span>:')
          // Strings in quotes
          .replace(/: "([^"]+)"/g, ': <span class="text-green-600 dark:text-green-400">"$1"</span>')
          // Booleans/Null
          .replace(/\b(true|false|null)\b/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>')
          // Numbers
          .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>');
    } else if (format === 'xml') {
        highlighted = highlighted
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          // Tags
          .replace(/(&lt;\/?[a-zA-Z0-9_:-]+)(&gt;)?/g, '<span class="text-blue-600 dark:text-blue-400 font-bold">$1</span>$2')
          // Attributes
          .replace(/([a-zA-Z0-9_:-]+)=/g, '<span class="text-orange-600 dark:text-orange-400">$1</span>=')
          // Strings
          .replace(/"([^"]+)"/g, '<span class="text-green-600 dark:text-green-400">"$1"</span>');
    }

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Styles for the DiffViewer
  const newStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#0f172a',
        diffViewerColor: '#e2e8f0',
        addedBackground: '#064e3b', // darker green
        addedColor: '#86efac',
        removedBackground: '#450a0a', // darker red
        removedColor: '#fca5a5',
        wordAddedBackground: '#065f46',
        wordRemovedBackground: '#7f1d1d',
        addedGutterBackground: '#064e3b',
        removedGutterBackground: '#450a0a',
        gutterBackground: '#1e293b',
        gutterColor: '#64748b',
      },
      light: {
        diffViewerBackground: '#ffffff',
        diffViewerColor: '#334155',
        addedBackground: '#e6fffa',
        addedColor: '#047857',
        removedBackground: '#fff5f5',
        removedColor: '#b91c1c',
        wordAddedBackground: '#b2f5ea',
        wordRemovedBackground: '#fed7d7',
        addedGutterBackground: '#d1fae5',
        removedGutterBackground: '#fee2e2',
        gutterBackground: '#f8fafc',
        gutterColor: '#94a3b8',
      }
    },
    line: {
      padding: '4px 0',
      fontSize: '13px',
      fontFamily: '"JetBrains Mono", monospace',
    },
    contentText: {
      lineHeight: '1.5',
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 relative">
      
      {/* Loading Overlay specific to Compare Page */}
      {isProcessing && (
         <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Analyzing Differences...</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Processing file content.</p>
         </div>
      )}

      {/* Header Toolbar */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 gap-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <GitCompare size={20} className="text-indigo-500" />
            Compare Files
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
             Comparing <span className="font-mono text-indigo-500">{leftFile.name || '...'}</span> with <span className="font-mono text-indigo-500">{modifiedFileName || '...'}</span>
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-4">
          {/* Expand/Collapse (Show All vs Diff Only) */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button 
               onClick={() => setShowAllLines(true)}
               className={`p-1.5 rounded transition-all ${showAllLines ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
               title="Expand All (Show Full File)"
             >
               <Maximize2 size={16} />
             </button>
             <button 
               onClick={() => setShowAllLines(false)}
               className={`p-1.5 rounded transition-all ${!showAllLines ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
               title="Collapse Unchanged (Show Diff Only)"
             >
               <Minimize2 size={16} />
             </button>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>

          {/* Split/Unified Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button 
               onClick={() => setSplitView(true)}
               className={`p-1.5 rounded transition-all ${splitView ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
               title="Split View"
             >
               <Columns size={16} />
             </button>
             <button 
               onClick={() => setSplitView(false)}
               className={`p-1.5 rounded transition-all ${!splitView ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
               title="Unified View"
             >
               <Rows size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative">
        {!leftFile.content ? (
           // STATE 1: No Original File Loaded (Showing Left Upload Only)
           <div className="flex h-full items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
              <div 
                 className="w-full max-w-lg border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-slate-900/50"
                 onClick={() => leftFileInputRef.current?.click()}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDropLeft}
               >
                  <input 
                    type="file" 
                    ref={leftFileInputRef}
                    className="hidden"
                    accept=".json,.yaml,.yml,.xml,.csv"
                    onChange={handleLeftFileUpload}
                  />
                  <div className="bg-indigo-50 dark:bg-slate-800 p-5 rounded-full mb-6">
                     <FilePlus size={40} className="text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Load Base File</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                    Select the original file you want to compare against.
                  </p>
                  <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                     Select Original File
                  </button>
               </div>
           </div>
        ) : !modifiedContent ? (
           // STATE 2: Original Loaded, Waiting for Modified (Split Layout)
           <div className="flex h-full">
              {/* Left Side Preview */}
              <div className="flex-1 border-r border-slate-200 dark:border-slate-800 p-6 overflow-auto bg-white dark:bg-slate-900">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <FileText size={16} /> Original: {leftFile.name}
                    </h3>
                    <button onClick={clearOriginal} className="text-xs text-red-500 hover:underline">Change File</button>
                 </div>
                 <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                    {leftFile.content.substring(0, 2000) + (leftFile.content.length > 2000 ? '\n... (truncated for preview)' : '')}
                 </pre>
              </div>

              {/* Right Side Upload */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
                 <div 
                   className="w-full max-w-md border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-slate-900/50"
                   onClick={() => rightFileInputRef.current?.click()}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={handleDropRight}
                 >
                    <input 
                      type="file" 
                      ref={rightFileInputRef}
                      className="hidden"
                      accept=".json,.yaml,.yml,.xml,.csv"
                      onChange={handleRightFileUpload}
                    />
                    <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                       <Upload size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Load Modified File</h3>
                    <p className="text-sm text-slate-500 mb-6">Drag & drop or click to upload</p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                       Select Modified File
                    </button>
                 </div>
              </div>
           </div>
        ) : (
           // STATE 3: Both Loaded - Diff Viewer
           <div className="h-full flex flex-col">
              {/* Diff Header Bar */}
              <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-500">
                 <div className="flex items-center gap-4 w-full">
                    <span className="flex-1 truncate text-red-500 dark:text-red-400 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-500"></span>
                       {leftFile.name}
                       <button onClick={clearOriginal} className="hover:text-red-700 ml-1 opacity-50 hover:opacity-100" title="Change Original"><X size={10} /></button>
                    </span>
                    <span className="flex-1 truncate text-green-600 dark:text-green-400 text-right flex items-center justify-end gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                       {modifiedFileName}
                       <button onClick={clearModified} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500" title="Change Modified">
                          <X size={12} />
                       </button>
                    </span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                <ReactDiffViewer
                  oldValue={leftFile.content}
                  newValue={modifiedContent}
                  splitView={splitView}
                  useDarkTheme={theme === 'dark'}
                  // @ts-ignore - Styles type definition mismatch in library sometimes
                  styles={newStyles}
                  leftTitle={leftFile.name || "Original"}
                  rightTitle={modifiedFileName || "Modified"}
                  compareMethod={DiffMethod.WORDS}
                  renderContent={highlightSyntax} 
                  showDiffOnly={!showAllLines}
                />
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
