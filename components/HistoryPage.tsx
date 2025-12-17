
import React, { useEffect, useState, useMemo} from 'react';
import { 
  History, 
  Star, 
  Clock, 
  ArrowLeft, 
  FileJson, 
  Database, 
  FileCode, 
  ArrowDownAZ, 
  Calendar,
  HardDrive,
  Filter,
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Square,
  X,
  Search,
  Copy,
  Folder
} from 'lucide-react';
import { HistoryItem, FileFormat } from '../types';
import { formatFileSize } from '../utils/jsonUtils';
import Tooltip from './Tooltip';

interface HistoryPageProps {
  onOpen: (path: string, name: string) => void;
  onBack: () => void;
  favorites: HistoryItem[];
  onToggleFavorite: (item: HistoryItem) => void;
  activeFilePath?: string;
}

type SortType = 'date' | 'name' | 'size';

// Helper component for text highlighting
const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span className="truncate">{text}</span>;
  }
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span className="truncate">
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-200 rounded-[1px] px-0.5 font-semibold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const HistoryPage: React.FC<HistoryPageProps> = ({ onOpen, onBack, favorites, onToggleFavorite, activeFilePath }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Filter & Sort State
  const [sortType, setSortType] = useState<SortType>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection State
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'selected' | 'all'>('selected');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: HistoryItem } | null>(null);

  useEffect(() => {
    loadHistory();
    // Close context menu on global click
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const loadHistory = async () => {
    if (window.electron) {
      const data = await window.electron.getHistory();
      setHistory(data);
    } else {
      // Web Fallback: Load from LocalStorage
      try {
        const local = localStorage.getItem('history');
        if (local) {
          setHistory(JSON.parse(local));
        }
      } catch (e) { console.error(e); }
    }
  };

  const isFavorite = (path: string) => favorites.some(f => f.path === path);

  const handleToggleStar = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    onToggleFavorite(item);
  };

  const getFormatIcon = (format: FileFormat) => {
    switch (format) {
      case 'json': return <FileJson size={18} className="text-yellow-500" />;
      case 'yaml': return <Database size={18} className="text-indigo-500" />;
      case 'xml': return <FileCode size={18} className="text-orange-500" />;
      case 'csv': return <FileSpreadsheet size={18} className="text-green-500" />;
      default: return <FileJson size={18} className="text-blue-500" />;
    }
  };

  // --- Context Menu Logic ---
  const handleContextMenu = (e: React.MouseEvent, item: HistoryItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // --- Selection Logic ---
  const toggleSelection = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedPaths);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedPaths(newSet);
  };

  const clearSelection = () => setSelectedPaths(new Set());

  const selectAll = () => {
    const allPaths = filteredAndSortedHistory.map(h => h.path);
    setSelectedPaths(new Set(allPaths));
  };

  const promptDeleteSelected = () => {
    if (selectedPaths.size > 0) {
      setDeleteMode('selected');
      setShowDeleteModal(true);
    }
  };

  const promptClearAll = () => {
    setDeleteMode('all');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (window.electron) {
      if (deleteMode === 'selected') {
         const remaining = await window.electron.removeHistoryItems(Array.from(selectedPaths));
         setHistory(remaining);
         setSelectedPaths(new Set());
      } else {
         await window.electron.clearHistory();
         setHistory([]);
         setSelectedPaths(new Set());
      }
    } else {
      // Web Fallback: LocalStorage Delete
      let newHistory = [...history];
      if (deleteMode === 'selected') {
         newHistory = newHistory.filter(h => !selectedPaths.has(h.path));
      } else {
         newHistory = [];
      }
      localStorage.setItem('history', JSON.stringify(newHistory));
      setHistory(newHistory);
      setSelectedPaths(new Set());
    }
    setShowDeleteModal(false);
  };

  // --- Filter and Sort Logic ---
  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];

    // Filter by Search Query
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerQ) || 
        item.path.toLowerCase().includes(lowerQ)
      );
    }

    // Filter by Favorites
    if (showFavoritesOnly) {
      result = result.filter(item => isFavorite(item.path));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortType) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (b.size || 0) - (a.size || 0); // Largest first
        case 'date':
        default:
          return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
      }
    });

    return result;
  }, [history, favorites, sortType, showFavoritesOnly, searchQuery]);

  const hasSelection = selectedPaths.size > 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="font-semibold text-slate-800 dark:text-slate-100">Confirm Deletion</h3>
                 <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-6">
                 <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {deleteMode === 'selected' 
                       ? `Are you sure you want to delete ${selectedPaths.size} item(s) from your history?`
                       : `Are you sure you want to clear your entire history? This cannot be undone.`
                    }
                 </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                 <button 
                   onClick={() => setShowDeleteModal(false)}
                   className="flex-1 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-sm"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 gap-4">
        <Tooltip content="Go Back" side="bottom">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </Tooltip>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <History size={20} className="text-indigo-500" />
            File History
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Manage your recently opened files
          </p>
        </div>

        {/* Clear All Button */}
        {history.length > 0 && (
           <Tooltip content="Permanently remove all items" side="left">
             <button 
               onClick={promptClearAll}
               className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 transition-colors"
             >
                <Trash2 size={14} /> Clear All
             </button>
           </Tooltip>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center gap-4 sticky top-0 z-10 backdrop-blur-sm">
        
        {/* Search Bar */}
        <div className="relative w-full max-w-xs group">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
             type="text"
             placeholder="Search history..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 text-slate-800 dark:text-slate-200"
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
             >
               <X size={12} />
             </button>
           )}
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <Tooltip content="Sort by Last Opened" side="bottom">
            <button 
              onClick={() => setSortType('date')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'date' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              <Calendar size={14} /> Date
            </button>
          </Tooltip>
          <Tooltip content="Sort Alphabetically" side="bottom">
            <button 
              onClick={() => setSortType('name')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'name' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              <ArrowDownAZ size={14} /> Name
            </button>
          </Tooltip>
          <Tooltip content="Sort by File Size" side="bottom">
            <button 
              onClick={() => setSortType('size')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'size' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              <HardDrive size={14} /> Size
            </button>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        {/* Filter Toggle */}
        <button 
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border ${showFavoritesOnly ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          <Filter size={14} /> 
          {showFavoritesOnly ? 'Favorites' : 'All Files'}
        </button>

        <div className="ml-auto text-xs font-mono text-slate-400">
           {filteredAndSortedHistory.length} Files
        </div>
      </div>

      {/* Selection Actions Bar */}
      {hasSelection && (
         <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedPaths.size} Selected</span>
            <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
            <button onClick={selectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Select All</button>
            <button onClick={clearSelection} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Deselect All</button>
            <div className="ml-auto">
               <button 
                 onClick={promptDeleteSelected}
                 className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
               >
                 <Trash2 size={12} /> Delete Selected
               </button>
            </div>
         </div>
      )}

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        <div className="max-w-5xl mx-auto space-y-2 pb-20">
          {filteredAndSortedHistory.length > 0 ? (
             filteredAndSortedHistory.map((item, idx) => {
                const fav = isFavorite(item.path);
                const isActive = item.path === activeFilePath;
                const isSelected = selectedPaths.has(item.path);

                return (
                  <Tooltip key={`${item.path}-${idx}`} content="Left-click to Open&#10;Right-click for Options" side="right" delay={500} fullWidth>
                    <div 
                      onClick={() => onOpen(item.path, item.name)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={`group flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer relative border select-none ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                          : isActive 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md'
                      }`}
                    >
                      {/* Checkbox */}
                      <div 
                        onClick={(e) => toggleSelection(e, item.path)}
                        className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer p-1"
                      >
                        {isSelected ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" /> : <Square size={18} />}
                      </div>

                      <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                        {getFormatIcon(item.format)}
                      </div>
                      
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-5 min-w-0 flex flex-col justify-center">
                          <h5 className="font-semibold text-sm truncate" title={item.name}>
                            <HighlightText text={item.name} highlight={searchQuery} />
                          </h5>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono" title={item.path}>
                              <HighlightText text={item.path} highlight={searchQuery} />
                          </p>
                        </div>

                        <div className="md:col-span-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock size={12} className="opacity-70" />
                          <span className="truncate">{new Date(item.lastOpened).toLocaleString()}</span>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                          <HardDrive size={12} className="opacity-70" />
                          <span>{item.size ? formatFileSize(item.size) : 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleToggleStar(e, item)}
                        className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0 ${fav ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400 dark:hover:text-yellow-400'}`}
                        title={fav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star size={18} fill={fav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </Tooltip>
                );
             })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <History size={48} className="mb-4 opacity-20" />
               <p className="text-lg font-medium">No files found</p>
               <p className="text-sm opacity-60">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu Modal */}
      {contextMenu && (
        <div 
          className="fixed z-[100] min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 mb-1">
             {contextMenu.item.name}
          </div>
          
          <button 
            onClick={() => copyToClipboard(contextMenu.item.name)}
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
          >
            <Copy size={14} className="text-indigo-500" />
            Copy Filename
          </button>

          <button 
            onClick={() => copyToClipboard(contextMenu.item.path)}
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
          >
            <Folder size={14} className="text-amber-500" />
            Copy Full Path
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
