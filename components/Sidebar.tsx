
import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Plus, 
  FolderOpen, 
  Hash, 
  Info,
  Database,
  FileJson,
  FileCode,
  FilePlus,
  Star,
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  Check
} from 'lucide-react';
import { EditorFile, FileFormat, HistoryItem } from '../types';

interface SidebarProps {
  activeFile: EditorFile | undefined;
  onNewFile: () => void;
  onOpenFile: () => void;
  stats: { totalNodes: number; maxDepth: number };
  onLoadFile?: (path: string, name: string) => void;
  isFavorite?: boolean; 
  onToggleFavorite?: () => void;
  
  // File Control Props
  onSave?: () => void;
  onSaveAsCopy?: () => void;
  isRenaming?: boolean;
  renameValue?: string;
  setRenameValue?: (val: string) => void;
  saveRename?: () => void;
  handleRenameKeyDown?: (e: React.KeyboardEvent) => void;
  startRenaming?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeFile,
  onNewFile,
  onOpenFile,
  stats,
  onLoadFile,
  isFavorite,
  onToggleFavorite,
  onSave,
  onSaveAsCopy,
  isRenaming,
  renameValue,
  setRenameValue,
  saveRename,
  handleRenameKeyDown,
  startRenaming
}) => {
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(true);

  useEffect(() => {
    if (window.electron) {
      window.electron.getFavorites().then(setFavorites);
    }
  }, [activeFile, isFavorite]); 

  const handleFavoriteClick = (item: HistoryItem) => {
    if (onLoadFile) {
      onLoadFile(item.path, item.name);
    }
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
    <aside className="w-64 bg-gray-100 dark:bg-slate-900/50 border-r border-slate-300 dark:border-slate-800 flex flex-col px-4 pb-4 pt-4 gap-4 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers size={12} /> Explorer
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={onNewFile} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" title="New File">
            <Plus size={16} />
          </button>
          <button onClick={onOpenFile} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400" title="Open File (Ctrl+O)">
            <FolderOpen size={16} />
          </button>
        </div>
      </div>

      {activeFile ? (
        <>
          <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3 shadow-sm animate-in slide-in-from-left-2 duration-300">
             {/* Header: Icon, Name, Controls */}
             <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200 dark:border-slate-700 h-8">
               <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                 {getFileIcon(activeFile.format, 18, "shrink-0")}
                 {isRenaming && setRenameValue ? (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <input 
                          autoFocus
                          value={renameValue} 
                          onChange={(e) => setRenameValue(e.target.value)} 
                          onBlur={saveRename} 
                          onKeyDown={handleRenameKeyDown} 
                          className="w-full text-sm px-1.5 py-0.5 border border-blue-500 rounded bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none shadow-sm focus:ring-1 focus:ring-blue-500/50" 
                        />
                    </div>
                 ) : (
                    <span className="font-semibold text-sm truncate text-slate-700 dark:text-slate-200 select-all" title={activeFile.name}>
                       {activeFile.name}
                    </span>
                 )}
               </div>
               
               <div className="flex items-center gap-1 shrink-0">
                  {!isRenaming && onToggleFavorite && (
                    <button 
                      onClick={onToggleFavorite} 
                      className={`hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors ${isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                      title={isFavorite ? "Unpin File" : "Pin File"}
                    >
                      <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                  )}
                  
                  {isRenaming ? (
                    <button 
                      onClick={saveRename} 
                      className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Save Name (Enter)"
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    startRenaming && (
                      <button 
                        onClick={startRenaming} 
                        className="text-slate-400 hover:text-blue-500 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors" 
                        title="Rename File"
                      >
                        <Pencil size={14} />
                      </button>
                    )
                  )}
               </div>
             </div>

             {/* Buttons: Save & Save As Copy */}
             <div className="flex gap-2">
                <button 
                  onClick={onSave}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg w-10 h-10 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                  title="Save (Ctrl+S)"
                >
                  <Save size={18} />
                </button>
                <button 
                  onClick={onSaveAsCopy}
                  className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all hover:shadow-sm active:scale-95"
                >
                  Save as Copy
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 shadow-sm animate-in slide-in-from-left-2 duration-300">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1"><Hash size={12} /> Statistics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Format</span>
                  <span className="font-mono text-xs font-bold text-blue-500 uppercase">{activeFile.format}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase">Nodes</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{stats.totalNodes}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase">Depth</span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{stats.maxDepth}</span>
                </div>
              </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50">
          <FilePlus size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">No active file</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Open or create a file to get started</p>
          <button 
            onClick={onNewFile}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Create File
          </button>
        </div>
      )}
      
      <div className="mt-auto flex flex-col gap-4">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-lg overflow-hidden">
            <button 
              onClick={() => setShowFavorites(!showFavorites)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Star size={12} className="text-yellow-500" /> Favorites
              </div>
              {showFavorites ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {showFavorites && (
              <div className="px-2 pb-2 flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                {favorites.map((fav, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleFavoriteClick(fav)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700/50 text-xs text-slate-600 dark:text-slate-300 transition-colors text-left"
                    title={fav.path}
                  >
                    {getFileIcon(fav.format, 12)}
                    <span className="truncate">{fav.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Info size={12} /> Tips</h3>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
            <li><span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px] font-bold">Ctrl+O</span> to Open</li>
            <li><span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded text-[10px] font-bold">Ctrl+F</span> to Search</li>
            <li>Convert formats via Toolbar</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
