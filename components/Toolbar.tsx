import React, { useState } from "react";
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
  GitCompare,
  Wrench,
  Trash2,
  Scissors,
  Terminal,
} from "lucide-react";
import { EditorFile, FileFormat, SortOrder, ViewSettings } from "../types";
import appLogo from '../assets/icon.png';
import Tooltip from "./Tooltip";

interface ToolbarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  activeFile: EditorFile | undefined;
  viewMode: "tree" | "table" | "raw";
  setViewMode: (mode: "tree" | "table" | "raw") => void;
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

  // Navigation
  activeView: "home" | "editor" | "history" | "compare";
  onOpenHistory: () => void;
  onOpenCompare: () => void;

  // Export
  onExportJson?: () => void;

  // Search Ref
  searchInputRef?: React.RefObject<HTMLInputElement | null>;

  // Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Data Tools
  onToolSortKeys: () => void;
  onToolSortKeysDesc: () => void;
  onToolRemoveNulls: () => void;
  onToolTrimStrings: () => void;
  activeCleanups?: string[];

  // Code Gen
  onOpenTypeGenerator: () => void;
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
  canRedo,
  onToolSortKeys,
  onToolSortKeysDesc,
  onToolRemoveNulls,
  onToolTrimStrings,
  activeCleanups = [],
  onOpenTypeGenerator,
}) => {
  const [showConvertMenu, setShowConvertMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // Toggle expand all (Level 100) vs collapse all (Level 1)
  const toggleExpandAll = () => {
    setViewSettings((prev) => ({
      ...prev,
      expandedLevel: prev.expandedLevel > 1 ? 1 : 100,
    }));
  };

  const getFileIcon = (format: FileFormat, size = 16, className = "") => {
    let colorClass = "";
    if (!className.includes("text-")) {
      switch (format) {
        case "json":
          colorClass = "text-yellow-500 dark:text-yellow-400";
          break;
        case "yaml":
          colorClass = "text-indigo-500 dark:text-indigo-400";
          break;
        case "xml":
          colorClass = "text-orange-500 dark:text-orange-400";
          break;
        case "csv":
          colorClass = "text-green-500 dark:text-green-400";
          break;
        default:
          colorClass = "text-blue-500";
      }
    }
    const finalClass = `${className} ${colorClass}`.trim();

    switch (format) {
      case "json":
        return <FileJson size={size} className={finalClass} />;
      case "yaml":
        return <Database size={size} className={finalClass} />;
      case "xml":
        return <FileCode size={size} className={finalClass} />;
      case "csv":
        return <FileSpreadsheet size={size} className={finalClass} />;
      default:
        return <FileJson size={size} className={finalClass} />;
    }
  };

  const isEditorView = activeView === "editor" || activeView === "home";

  const isFormatSupported = activeFile && !['yaml', 'csv'].includes(activeFile.format);

  const isPrettyActive = activeFile?.formatStyle === 'pretty';
  const isCompactActive = activeFile?.formatStyle === 'compact';

  const isCsv = activeFile?.format === 'csv';
  const isVisualActive = viewMode === 'tree' || viewMode === 'table';

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-[2000] isolation-auto" style={{ isolation: 'isolate' }}>
      <div className="h-14 flex items-center px-4 justify-between gap-4 select-none draggable-region">
        <div className="flex items-center gap-4 shrink-0">
          <Tooltip content={showSidebar ? "Close Sidebar" : "Open Sidebar"} side="bottom">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 no-drag transition-colors"
            >
              {showSidebar ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
          </Tooltip>
          <div className="flex items-center gap-3 select-none px-2 py-3">
            <img
              src={appLogo}
              alt="Tree File Logo"
              className="w-8 h-8 rounded-lg shadow-md object-cover"
            />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 truncate hidden md:block">
              Tree File
            </h1>
          </div>
        </div>

        {activeFile && isEditorView && (
          <div className="flex items-center gap-3 flex-1 justify-start max-w-3xl no-drag px-4">
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg shrink-0 mr-2 border border-slate-200 dark:border-slate-700">
              <Tooltip content="Undo (Ctrl+Z)" side="bottom">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`p-1.5 rounded transition-colors ${canUndo
                    ? "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                    }`}
                >
                  <Undo2 size={14} />
                </button>
              </Tooltip>
              <Tooltip content="Redo (Ctrl+Y)" side="bottom">
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`p-1.5 rounded transition-colors ${canRedo
                    ? "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                    }`}
                >
                  <Redo2 size={14} />
                </button>
              </Tooltip>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode(isCsv ? "table" : "tree")}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${isVisualActive
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
              >
                {isCsv ? <FileSpreadsheet size={14} /> : <ListTree size={14} />}
                <span className="hidden lg:inline">{isCsv ? "Table" : "Tree"}</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${viewMode === "raw"
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
              >
                <Code size={14} /> <span className="hidden lg:inline">Raw</span>
              </button>
            </div>

            <div className="relative flex-1 w-full max-w-md group transition-all duration-300 focus-within:scale-[1.01] ml-4">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-600 transition-colors duration-300"
              />
              <input
                ref={searchInputRef as React.LegacyRef<HTMLInputElement>}
                type="text"
                placeholder="Search... (Ctrl+F)"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-900 focus:shadow-md text-slate-800 dark:text-slate-200 placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
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

        <div className="flex items-center gap-2 no-drag shrink-0 justify-end">
          {activeFile && isEditorView && (
            <>
              <div className="relative">
                <Tooltip content="Clean & Sort Data" side="bottom">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 border z-[2100] ${activeCleanups.length
                      ? 'bg-violet-600 text-white border-violet-600 shadow-md hover:bg-violet-700'
                      : 'bg-white text-slater-700 hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700'
                      }`}
                  >
                    <Wrench size={14} />
                    <span className="hidden xl:inline text-xs font-medium">
                      Tools
                    </span>
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                </Tooltip>
                {showToolsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[2050]"
                      onClick={() => setShowToolsMenu(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[2200] overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1 ring-1 ring-black/5">
                      <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 mb-1">
                        Cleanup Actions
                      </div>

                      <button
                        onClick={() => {
                          onToolSortKeys();
                          setShowToolsMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${activeCleanups.includes('sort_asc')
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <ArrowDownAZ size={14} className="text-teal-500" />
                        Sort Keys (A-Z)
                        {activeCleanups.includes('sort_asc') && <Check size={12} className="ml-auto" />}
                      </button>

                      <button
                        onClick={() => {
                          onToolSortKeysDesc();
                          setShowToolsMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${activeCleanups.includes('sort_desc')
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <ArrowUpAZ size={14} className="text-teal-500" />
                        Sort Keys (Z-A)
                        {activeCleanups.includes('sort_desc') && <Check size={12} className="ml-auto" />}
                      </button>

                      <button
                        onClick={() => {
                          onToolRemoveNulls();
                          setShowToolsMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${activeCleanups.includes('remove_nulls')
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <Trash2 size={14} className="text-rose-500" />
                        Remove Nulls
                        {activeCleanups.includes('remove_nulls') && <Check size={12} className="ml-auto" />}
                      </button>

                      <button
                        onClick={() => {
                          onToolTrimStrings();
                          setShowToolsMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${activeCleanups.includes('trim_strings')
                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <Scissors size={14} className="text-amber-500" />
                        Trim Strings
                        {activeCleanups.includes('trim_strings') && <Check size={12} className="ml-auto" />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <Tooltip content="Convert File Format" side="bottom">
                  <button
                    onClick={() => setShowConvertMenu(!showConvertMenu)}
                    className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                  >
                    <ArrowRightLeft size={14} />
                    <span className="hidden xl:inline text-xs font-medium">
                      Convert
                    </span>
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                </Tooltip>
                {showConvertMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[2050]"
                      onClick={() => setShowConvertMenu(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-44 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[2200] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
                      {(["json", "yaml", "xml", "csv"] as FileFormat[])
                        .filter((f) => f !== activeFile.format)
                        .map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => {
                              onConvert(fmt);
                              setShowConvertMenu(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 uppercase transition-colors"
                          >
                            {getFileIcon(fmt, 14)} To {fmt}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {onExportJson && activeFile.format !== "json" && (
                <Tooltip content="Export as JSON file" side="bottom">
                  <button
                    onClick={onExportJson}
                    className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 dark:hover:text-indigo-300 border border-yellow-200 dark:border-yellow-900/50"
                  >
                    <Download size={14} />
                    <span className="hidden xl:inline text-xs font-medium">
                      Export
                    </span>
                  </button>
                </Tooltip>
              )}

              <Tooltip content="Generate TypeScript Interfaces" side="bottom">
                <button
                  onClick={onOpenTypeGenerator}
                  className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50"
                >
                  <Terminal size={14} />
                  <span className="hidden xl:inline text-xs font-medium">
                    Get Types
                  </span>
                </button>
              </Tooltip>

              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>

              {viewMode === "raw" && (
                <div className="flex items-center gap-1">
                  {setShowLineNumbers && (
                    <Tooltip content="Toggle Line Numbers" side="bottom">
                      <button
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`p-1.5 rounded transition-all ${showLineNumbers
                          ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                          : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        <ListOrdered size={18} />
                      </button>
                    </Tooltip>
                  )}
                  {isFormatSupported && (
                    <>
                      <Tooltip content="Format (Pretty Print)" side="bottom">
                        <button
                          onClick={onFormat}
                          className={`p-1.5 rounded transition-colors ${isPrettyActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
                            : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                          <AlignLeft size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Minify (Compact)" side="bottom">
                        <button
                          onClick={onMinify}
                          className={`p-1.5 rounded transition-colors ${isCompactActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
                            : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                          <Minimize size={18} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              )}

              {viewMode === "tree" && (
                <div className="flex items-center gap-1">
                  <Tooltip content={viewSettings.expandedLevel > 1 ? "Collapse All" : "Expand All"} side="bottom">
                    <button
                      onClick={toggleExpandAll}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {viewSettings.expandedLevel > 1 ? (
                        <ChevronsUp size={18} />
                      ) : (
                        <ChevronsDown size={18} />
                      )}
                    </button>
                  </Tooltip>
                </div>
              )}

              <Tooltip content={copySuccess ? "Copied!" : "Copy Full Text"} side="bottom">
                <button
                  onClick={onCopy}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copySuccess ? (
                    <Check size={18} className="text-green-600" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </Tooltip>

              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Tooltip content="Recent Files History" side="bottom">
              <button
                onClick={onOpenHistory}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm ${activeView === "history"
                  ? "bg-violet-600 text-white"
                  : "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800"
                  }`}
              >
                <History size={20} />
              </button>
            </Tooltip>

            <Tooltip content="Compare Files" side="bottom">
              <button
                onClick={onOpenCompare}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm ${activeView === "compare"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-800"
                  }`}
              >
                <GitCompare size={20} />
              </button>
            </Tooltip>

            <Tooltip content={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`} side="bottom">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all ml-1"
              >
                {theme === "dark" ? (
                  <Sun size={20} className="text-yellow-500" fill="currentColor" />
                ) : (
                  <Moon size={20} className="text-blue-600" fill="currentColor" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;