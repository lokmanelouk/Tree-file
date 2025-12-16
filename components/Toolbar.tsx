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
// @ts-ignore
import appLogo from "../assets/icon.png";

interface ToolbarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  activeFile: EditorFile | undefined;
  viewMode: "tree" | "raw";
  setViewMode: (mode: "tree" | "raw") => void;
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

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-30">
      {/* Single Toolbar Row */}
      <div className="h-14 flex items-center px-4 justify-between gap-4 select-none draggable-region">
        {/* GROUP 1: Sidebar Toggle & Logo (Left) */}
        <div className="flex items-center gap-4 shrink-0">
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
          {/* LOGO */}
          <div className="flex items-center gap-3 select-none px-2 py-3">
            {/* The Image */}
            <img
              src={appLogo}
              alt="Tree File Logo"
              className="w-8 h-8 rounded-lg shadow-md object-cover"
            />

            {/* The Text */}
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 truncate hidden md:block">
              Tree File
            </h1>
          </div>
        </div>

        {/* GROUP 2: View Controls & Search (Center) - Only visible in Editor */}
        {activeFile && isEditorView && (
          <div className="flex items-center gap-3 flex-1 justify-start max-w-3xl no-drag px-4">
            {/* Undo/Redo */}
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg shrink-0 mr-2 border border-slate-200 dark:border-slate-700">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-1.5 rounded transition-colors ${
                  canUndo
                    ? "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-1.5 rounded transition-colors ${
                  canRedo
                    ? "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${
                  viewMode === "tree"
                    ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <ListTree size={14} />{" "}
                <span className="hidden lg:inline">Tree</span>
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${
                  viewMode === "raw"
                    ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Code size={14} /> <span className="hidden lg:inline">Raw</span>
              </button>
            </div>

            {/* Search */}
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

        {/* GROUP 3: Tools & Global Actions (Right) */}
        <div className="flex items-center gap-2 no-drag shrink-0 justify-end">
          {activeFile && isEditorView && (
            <>
              {/* Data Cleanup Tools Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/40 dark:hover:text-pink-300 border border-pink-200 dark:border-pink-900/50"
                  title="Data Cleanup Tools"
                >
                  <Wrench size={14} />
                  <span className="hidden xl:inline text-xs font-medium">
                    Tools
                  </span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                {showToolsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowToolsMenu(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cleanup Actions
                      </div>

                      <button
                        onClick={() => {
                          onToolSortKeys();
                          setShowToolsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                      >
                        <ArrowDownAZ size={14} className="text-blue-500" /> Sort
                        Keys (A-Z)
                      </button>

                      <button
                        onClick={() => {
                          onToolSortKeysDesc();
                          setShowToolsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                      >
                        <ArrowUpAZ size={14} className="text-blue-500" /> Sort
                        Keys (Z-A)
                      </button>

                      <button
                        onClick={() => {
                          onToolRemoveNulls();
                          setShowToolsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                      >
                        <Trash2 size={14} className="text-red-500" /> Remove
                        Nulls
                      </button>

                      <button
                        onClick={() => {
                          onToolTrimStrings();
                          setShowToolsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                      >
                        <Scissors size={14} className="text-orange-500" /> Trim
                        Strings
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Convert Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowConvertMenu(!showConvertMenu)}
                  className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                  title="Convert Format"
                >
                  <ArrowRightLeft size={14} />
                  <span className="hidden xl:inline text-xs font-medium">
                    Convert
                  </span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                {showConvertMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowConvertMenu(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {(["json", "yaml", "xml", "csv"] as FileFormat[])
                        .filter((f) => f !== activeFile.format)
                        .map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => {
                              onConvert(fmt);
                              setShowConvertMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 uppercase"
                          >
                            {getFileIcon(fmt, 14)} To {fmt}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Export JSON Button */}
              {onExportJson && activeFile.format !== "json" && (
                <button
                  onClick={onExportJson}
                  className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40 dark:hover:text-yellow-300 border border-yellow-200 dark:border-yellow-900/50"
                  title="Export to JSON"
                >
                  <Download size={14} />
                  <span className="hidden xl:inline text-xs font-medium">
                    Export
                  </span>
                </button>
              )}

              {/* Get Types Button (New) */}
              <button
                onClick={onOpenTypeGenerator}
                className="p-1.5 px-3 rounded-lg transition-colors flex items-center gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50"
                title="Generate TypeScript Interfaces"
              >
                <Terminal size={14} />
                <span className="hidden xl:inline text-xs font-medium">
                  Get Types
                </span>
              </button>

              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>

              {/* Raw Controls */}
              {viewMode === "raw" && (
                <div className="flex items-center gap-1">
                  {setShowLineNumbers && (
                    <button
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className={`p-1.5 rounded transition-all ${
                        showLineNumbers
                          ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                          : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="Toggle Line Numbers"
                    >
                      <ListOrdered size={18} />
                    </button>
                  )}
                  <button
                    onClick={onFormat}
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Format (Pretty Print)"
                  >
                    <AlignLeft size={18} />
                  </button>
                  <button
                    onClick={onMinify}
                    disabled={activeFile.format === "yaml"}
                    className={`p-1.5 rounded transition-colors ${
                      activeFile.format === "yaml"
                        ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        : "text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    title="Minify (Compact)"
                  >
                    <Minimize size={18} />
                  </button>
                </div>
              )}

              {/* Tree Controls (Sort buttons removed as requested) */}
              {viewMode === "tree" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleExpandAll}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={
                      viewSettings.expandedLevel > 1
                        ? "Collapse All"
                        : "Expand All"
                    }
                  >
                    {viewSettings.expandedLevel > 1 ? (
                      <ChevronsUp size={18} />
                    ) : (
                      <ChevronsDown size={18} />
                    )}
                  </button>
                </div>
              )}

              {/* Copy Button */}
              <button
                onClick={onCopy}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copy Full Text"
              >
                {copySuccess ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
              </button>

              <div className="w-px h-5 bg-slate-300 dark:bg-slate-800 mx-1"></div>
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHistory}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm ${
                activeView === "history"
                  ? "bg-violet-600 text-white"
                  : "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800"
              }`}
              title="History"
            >
              <History size={20} />
            </button>

            {/* Compare Button - Enhanced Visibility - Orange */}
            <button
              onClick={onOpenCompare}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm ${
                activeView === "compare"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-800"
              }`}
              title="Compare Files"
            >
              <GitCompare size={20} />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all ml-1"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun
                  size={20}
                  className="text-yellow-500"
                  fill="currentColor"
                />
              ) : (
                <Moon size={20} className="text-blue-600" fill="currentColor" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
