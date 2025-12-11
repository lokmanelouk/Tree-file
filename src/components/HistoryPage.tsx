
import React, { useEffect, useState, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
import { HistoryItem, FileFormat } from '../types';
import { formatFileSize } from '../utils/jsonUtils';

interface HistoryPageProps {
  onOpen: (path: string, name: string) => void;
  onBack: () => void;
}

type SortType = 'date' | 'name' | 'size';

const HistoryPage: React.FC<HistoryPageProps> = ({ onOpen, onBack }) => {
  // Extending HistoryItem locally to support size until types are updated
  const [history, setHistory] = useState<(HistoryItem & { size?: number })[]>([]);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  
  // Filter & Sort State
  const [sortType, setSortType] = useState<SortType>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (window.electron) {
      window.electron.getHistory().then(setHistory);
      window.electron.getFavorites().then(setFavorites);
    }
  }, []);

  const isFavorite = (path: string) => favorites.some(f => f.path === path);

  const handleToggleStar = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    if (window.electron) {
      const updatedFavorites = await window.electron.toggleFavorite(item);
      setFavorites(updatedFavorites);
    }
  };

  const getFormatIcon = (format: FileFormat) => {
    switch (format) {
      case 'json': return <FileJson size={18} className="text-yellow-500" />;
      case 'yaml': return <Database size={18} className="text-indigo-500" />;
      case 'xml': return <FileCode size={18} className="text-orange-500" />;
      default: return <FileJson size={18} className="text-blue-500" />;
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedHistory = useMemo(() => {
    let result = [...history];

    // Filter
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
  }, [history, favorites, sortType, showFavoritesOnly]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 gap-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <History size={20} className="text-indigo-500" />
            File History
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Manage your recently opened files
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center gap-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => setSortType('date')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'date' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Calendar size={14} /> Date
          </button>
          <button 
            onClick={() => setSortType('name')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'name' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <ArrowDownAZ size={14} /> Name
          </button>
          <button 
            onClick={() => setSortType('size')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${sortType === 'size' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <HardDrive size={14} /> Size
          </button>
        </div>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

        <button 
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border ${showFavoritesOnly ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          <Filter size={14} /> 
          {showFavoritesOnly ? 'Showing Favorites' : 'Filter Favorites'}
        </button>

        <div className="ml-auto text-xs font-mono text-slate-400">
           {filteredAndSortedHistory.length} Files
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-2">
          {filteredAndSortedHistory.length > 0 ? (
             filteredAndSortedHistory.map((item, idx) => {
                const fav = isFavorite(item.path);
                return (
                  <div 
                    key={`${item.path}-${idx}`}
                    onClick={() => onOpen(item.path, item.name)}
                    className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
                  >
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                      {getFormatIcon(item.format)}
                    </div>
                    
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <div className="md:col-span-5 min-w-0">
                         <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{item.name}</h5>
                         <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono" title={item.path}>{item.path}</p>
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
    </div>
  );
};

export default HistoryPage;
