
import React, { useState, useRef } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ArrowLeft, Upload, Columns, Rows, FileText, X, GitCompare } from 'lucide-react';

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
  const [modifiedContent, setModifiedContent] = useState<string | null>(null);
  const [modifiedFileName, setModifiedFileName] = useState<string>('');
  const [splitView, setSplitView] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setModifiedContent(ev.target.result);
          setModifiedFileName(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setModifiedContent(ev.target.result);
          setModifiedFileName(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const clearModified = () => {
    setModifiedContent(null);
    setModifiedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
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
             Comparing <span className="font-mono text-indigo-500">{originalFileName || 'Untitled'}</span> with <span className="font-mono text-indigo-500">{modifiedFileName || '...'}</span>
          </p>
        </div>

        {/* View Controls */}
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative">
        {!modifiedContent ? (
           // Split Layout for Initial Upload
           <div className="flex h-full">
              {/* Left Side Preview */}
              <div className="flex-1 border-r border-slate-200 dark:border-slate-800 p-6 overflow-auto bg-white dark:bg-slate-900">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                    <FileText size={16} /> Original File
                 </h3>
                 <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                    {originalContent || "// No content loaded"}
                 </pre>
              </div>

              {/* Right Side Upload */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
                 <div 
                   className="w-full max-w-md border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-slate-900/50"
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={handleDrop}
                 >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                       <Upload size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Load Comparison File</h3>
                    <p className="text-sm text-slate-500 mb-6">Drag & drop or click to upload</p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                       Browse Files
                    </button>
                 </div>
              </div>
           </div>
        ) : (
           // Diff Viewer
           <div className="h-full flex flex-col">
              {/* Diff Header Bar */}
              <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-500">
                 <div className="flex items-center gap-4 w-full">
                    <span className="flex-1 truncate text-red-500 dark:text-red-400">Original: {originalFileName}</span>
                    <span className="flex-1 truncate text-green-600 dark:text-green-400 text-right flex items-center justify-end gap-2">
                       Modified: {modifiedFileName}
                       <button onClick={clearModified} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500" title="Close File">
                          <X size={12} />
                       </button>
                    </span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                <ReactDiffViewer
                  oldValue={originalContent}
                  newValue={modifiedContent}
                  splitView={splitView}
                  useDarkTheme={theme === 'dark'}
                  // @ts-ignore - Styles type definition mismatch in library sometimes
                  styles={newStyles}
                  leftTitle={originalFileName || "Original"}
                  rightTitle={modifiedFileName || "Modified"}
                  compareMethod={DiffMethod.WORDS}
                />
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
