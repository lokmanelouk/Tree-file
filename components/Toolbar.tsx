
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
  History
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
  onOpenHistory: () => void;
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
  onOpenHistory
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
         default: colorClass = "text-blue-500";
       }
    }
    const finalClass = `${className} ${colorClass}`.trim();

    switch (format) {
      case 'json': return <FileJson size={size} className={finalClass} />;
      case 'yaml': return <Database size={size} className={finalClass} />;
      case 'xml': return <FileCode size={size} className={finalClass} />;
      default: return <FileJson size={size} className={finalClass} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-30">
      {/* Single Toolbar Row */}
      <div className="h-14 flex items-center px-4 justify-between gap-4 select-none draggable-region">
        
        {/* GROUP 1: Sidebar Toggle & Logo (Left) */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 no-drag transition-colors"
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

        {/* GROUP 2: View Controls & Search (Center) */}
        {activeFile && (
          <div className="flex items-center gap-3 flex-1 justify-center max-w-2xl no-drag px-4">
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
              <button 
                onClick={() => setViewMode('tree')} 
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'tree' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <ListTree size={14} /> <span className="hidden lg:inline">Tree</span>
              </button>
              <button 
                onClick={() => setViewMode('raw')} 
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'raw' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Code size={14} /> <span className="hidden lg:inline">Raw</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full max-w-md transition-opacity">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search... (Ctrl+F)" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* GROUP 3: Tools & Global Actions (Right) */}
        <div className="flex items-center gap-2 no-drag shrink-0 justify-end">
          {activeFile && (
            <>
               {/* Convert Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowConvertMenu(!showConvertMenu)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors flex items-center gap-1"
                  title="Convert Format"
                >
                  <ArrowRightLeft size={18} />
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                {showConvertMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowConvertMenu(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {(['json', 'yaml', 'xml'] as FileFormat[]).filter(f => f !== activeFile.format).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => { onConvert(fmt); setShowConvertMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 uppercase"
                        >
                          {getFileIcon(fmt, 14)} To {fmt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

              {/* Raw Controls */}
              {viewMode === 'raw' && (
                <div className="flex items-center gap-1">
                  {setShowLineNumbers && (
                    <button 
                      onClick={() => setShowLineNumbers(!showLineNumbers)} 
                      className={`p-1.5 rounded transition-all ${showLineNumbers ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      title="Toggle Line Numbers"
                    >
                      <ListOrdered size={18} />
                    </button>
                  )}
                  <button onClick={onFormat} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Format (Pretty Print)"><AlignLeft size={18} /></button>
                  <button onClick={onMinify} disabled={activeFile.format === 'yaml'} className={`p-1.5 rounded transition-colors ${activeFile.format === 'yaml' ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Minify (Compact)"><Minimize size={18} /></button>
                </div>
              )}

              {/* Tree Controls */}
              {viewMode === 'tree' && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setViewSortOrder('original')} className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${sortOrder === 'original' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>ORG</button>
                    <button onClick={() => setViewSortOrder('asc')} className={`p-1 rounded transition-colors ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-600 text-blue-500 shadow-sm' : 'text-slate-500'}`}><ArrowDownAZ size={12} /></button>
                    <button onClick={() => setViewSortOrder('desc')} className={`p-1 rounded transition-colors ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-600 text-blue-500 shadow-sm' : 'text-slate-500'}`}><ArrowUpAZ size={12} /></button>
                  </div>
                  <button 
                    onClick={toggleExpandAll} 
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                    title={viewSettings.expandedLevel > 1 ? "Collapse All" : "Expand All"}
                  >
                    {viewSettings.expandedLevel > 1 ? <ChevronsUp size={18} /> : <ChevronsDown size={18} />}
                  </button>
                </div>
              )}

              {/* Copy Button */}
              <button onClick={onCopy} className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Copy Full Text">
                {copySuccess ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
              
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
            </>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="History"
            >
              <History size={18} />
            </button>

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
