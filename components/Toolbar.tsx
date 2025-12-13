
import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Sun,
  Moon,
  ListTree,
  Code,
  Search,
  ArrowRightLeft,
  ChevronDown,
  AlignLeft,
  Minimize,
  Check,
  Copy,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronsDown,
  ChevronsUp,
  ListOrdered,
  FileJson,
  FileCode,
  History,
  FileSpreadsheet,
  Download,
  Undo2,
  Redo2,
  X,
  GitCompare
} from 'lucide-react';
import { EditorFile, FileFormat, SortOrder, ViewSettings } from '../types';

interface ToolbarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activeFile: EditorFile | undefined;
  viewMode: 'tree' | 'raw';
  setViewMode: (mode: 'tree' | 'raw') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: SortOrder;
  setViewSortOrder: (order: SortOrder) => void;
  viewSettings: ViewSettings;
  setViewSettings: (settings: React.SetStateAction<ViewSettings>) => void;
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  copySuccess: boolean;
  onConvert: (format: FileFormat) => void;
  showLineNumbers?: boolean;
  setShowLineNumbers?: (show: boolean) => void;
  
  // New Navigation
  activeView: 'home' | 'editor' | 'history' | 'compare';
  onOpenHistory: () => void;
  onOpenCompare?: () => void;

  // New Export
  onExportJson?: () => void;

  // Search Ref
  searchInputRef?: React.RefObject<HTMLInputElement | null>;

  // Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  showSidebar,
  setShowSidebar,
  theme,
  setTheme,
  activeFile,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setViewSortOrder,
  viewSettings,
  setViewSettings,
  onFormat,
  onMinify,
  onCopy,
  copySuccess,
  onConvert,
  showLineNumbers = true,
  setShowLineNumbers,
  activeView,
  onOpenHistory,
  onOpenCompare,
  onExportJson,
  searchInputRef,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [showConvertMenu, setShowConvertMenu] = useState(false);

  // Toggle expand all (Level 100) vs collapse all (Level 1)
  const toggleExpandAll = () => {
    setViewSettings(prev => ({
      ...prev,
      expandedLevel: prev.expandedLevel > 1 ? 1 : 100
    }));
  };

  const getFileIcon = (format: FileFormat, size = 16, className = "") => {
    let colorClass = "";
    if (!className.includes("text-")) {
       switch(format) {
         case 'json': colorClass = "text-yellow-500 dark:text-yellow-400"; break;
         case 'yaml': colorClass = "text-indigo-500 dark:text-indigo-400"; break;
         case 'xml': colorClass = "text-orange-500 dark:text-orange-400"; break;
         case 'csv': colorClass = "text-green-500 dark:text-green-400"; break;
         default: colorClass = "text-blue-500";
       }
    }
    const finalClass = `${className} ${colorClass}`.trim();

    switch (format) {
      case 'json': return <FileJson size={size} className={finalClass} />;
      case 'yaml': return <Database size={size} className={finalClass} />;
      case 'xml': return <FileCode size={size} className={finalClass} />;
      case 'csv': return <FileSpreadsheet size={size} className={finalClass} />;
      default: return <FileJson size={size} className={finalClass} />;
    }
  };

  const isEditorView = activeView === 'editor' || activeView === 'home';

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-30">
      {/* Single Toolbar Row */}
      <div className="h-14 flex items-center px-4 justify-between gap-4 select-none draggable-region">
        
        {/* GROUP 1: Sidebar Toggle & Logo (Left) */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 no-drag transition-colors"
          >
            {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          {/* LOGO */}
          <div className="flex items-center gap-2 select-none">
             <div className="bg-indigo-600 p-1.5 rounded-md shadow-lg shadow-indigo-500/20 flex items-center justify-center">
               <Database size={16} className="text-white" />
             </div>
             <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400 truncate hidden md:block">
               Tree File
             </h1>
          </div>
        </div>

        {/* GROUP 2: View Controls & Search (Center) - Only visible in Editor */}
        {activeFile && isEditorView && (
          <div className="flex items-center gap-3 flex-1 justify-start max-w-3xl no-drag px-4">
            
            {/* Undo/Redo */}
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg shrink-0 mr-2 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={onUndo} 
                disabled={!canUndo}
                className={`p-1.5 rounded transition-colors ${canUndo ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo}
                className={`p-1.5 rounded transition-colors ${canRedo ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'}`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('tree')} 
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'tree' ? 'bg-slate-100 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <ListTree size={14} /> <span className="hidden lg:inline">Tree</span>
              </button>
              <button 
                onClick={() => setViewMode('raw')} 
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'raw' ? 'bg-slate-100 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Code size={14} /> <span className="hidden lg:inline">Raw</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full max-w-md group transition-all duration-300 focus-within:scale-[1.01] ml-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors duration-300" />
              <input 
                ref={searchInputRef as React.LegacyRef<HTMLInputElement>}
                type="text" 
                placeholder="Search... (Ctrl+F)" 
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-900 focus:shadow-md text-slate-800 dark:text-slate-200 placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    if (searchInputRef?.current) searchInputRef.current.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all animate-in fade-in zoom-in duration-200"
                  title="Clear Search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* GROUP 3: Tools & Global Actions (Right) */}
        <div className="flex items-center gap-2 no-drag shrink-0 justify-end">
          {activeFile && isEditorView && (
            <>
               {/* Export JSON Button */}
               {onExportJson && activeFile.format !== 'json' && (
                 <button
                   onClick={onExportJson}
                   className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 dark:hover:text-yellow-300 border border-yellow-200 dark:border-yellow-900/50"
                   title="Export to JSON"
                 >
                   <Download size={18} />
                   <span className="hidden xl:inline text-xs font-medium">Export JSON</span>
                 </button>
               )}

               {/* Convert Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowConvertMenu(!showConvertMenu)}
                  className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                  title="Convert Format"
                >
                  <ArrowRightLeft size={18} />
                  <span className="hidden xl:inline text-xs font-medium">Convert</span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                {showConvertMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowConvertMenu(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {(['json', 'yaml', 'xml', 'csv'] as FileFormat[]).filter(f => f !== activeFile.format).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => { onConvert(fmt); setShowConvertMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 uppercase"
                        >
                          {getFileIcon(fmt, 14)} To {fmt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>

              {/* Raw Controls */}
              {viewMode === 'raw' && (
                <div className="flex items-center gap-1">
                  {setShowLineNumbers && (
                    <button 
                      onClick={() => setShowLineNumbers(!showLineNumbers)} 
                      className={`p-1.5 rounded transition-all ${showLineNumbers ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      title="Toggle Line Numbers"
                    >
                      <ListOrdered size={18} />
                    </button>
                  )}
                  <button onClick={onFormat} className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Format (Pretty Print)"><AlignLeft size={18} /></button>
                  <button onClick={onMinify} disabled={activeFile.format === 'yaml'} className={`p-1.5 rounded transition-colors ${activeFile.format === 'yaml' ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`} title="Minify (Compact)"><Minimize size={18} /></button>
                </div>
              )}

              {/* Tree Controls */}
              {viewMode === 'tree' && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={() => setViewSortOrder('original')} className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${sortOrder === 'original' ? 'bg-slate-100 dark:bg-slate-600 text-slate-900 dark:text-white shadow-inner' : 'text-slate-500'}`}>ORG</button>
                    <button onClick={() => setViewSortOrder('asc')} className={`p-1 rounded transition-colors ${sortOrder === 'asc' ? 'bg-slate-100 dark:bg-slate-600 text-blue-500 shadow-inner' : 'text-slate-500'}`}><ArrowDownAZ size={12} /></button>
                    <button onClick={() => setViewSortOrder('desc')} className={`p-1 rounded transition-colors ${sortOrder === 'desc' ? 'bg-slate-100 dark:bg-slate-600 text-blue-500 shadow-inner' : 'text-slate-500'}`}><ArrowUpAZ size={12} /></button>
                  </div>
                  <button 
                    onClick={toggleExpandAll} 
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                    title={viewSettings.expandedLevel > 1 ? "Collapse All" : "Expand All"}
                  >
                    {viewSettings.expandedLevel > 1 ? <ChevronsUp size={18} /> : <ChevronsDown size={18} />}
                  </button>
                </div>
              )}

              {/* Copy Button */}
              <button onClick={onCopy} className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Copy Full Text">
                {copySuccess ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
              
              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>
            </>
          )}

          <div className="flex items-center gap-1">
            
            <button
              onClick={onOpenHistory}
              className={`p-1.5 rounded-lg transition-colors ${
                activeView === 'history'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title="History"
            >
              <History size={18} />
            </button>

            {/* COMPARE BUTTON - POSITIONED AFTER HISTORY */}
            {onOpenCompare && (
              <button
                onClick={onOpenCompare}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                  activeView === 'compare'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' 
                    : 'text-slate-500 hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                }`}
                title="Compare / Diff"
              >
                <GitCompare size={18} />
                {activeView !== 'compare' && <span className="text-xs font-medium hidden xl:inline">Compare</span>}
              </button>
            )}

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
