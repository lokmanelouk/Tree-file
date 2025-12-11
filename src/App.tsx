
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  FileJson,
  FileCode,
  Database
} from 'lucide-react';
import Home from './components/Home'; 
import Sidebar from './components/Sidebar'; 
import CodeEditor from './components/CodeEditor';
import Toolbar from './components/Toolbar';
import TreeViewer from './components/TreeViewer';
import HistoryPage from './components/HistoryPage';
import ConfirmModal from './components/ConfirmModal';
import ConversionConfirmModal from './components/ConversionConfirmModal';
import { sortJson, getJsonStats, updateValueAtPath, downloadJson } from './utils/jsonUtils';
import { detectFormat, parseContent, stringifyContent, minifyContent } from './utils/parserUtils';
import { JsonValue, EditorFile, SortOrder, ViewSettings, Path, FileFormat, HistoryItem } from './types';

type ViewState = 'home' | 'editor' | 'history';

function App() {
  // --- Global State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // --- File System State ---
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);

  // --- View State ---
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setViewSortOrder] = useState<SortOrder>('original');
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    expandedLevel: 1,
    showQuotes: false,
    showCommas: false,
    fontSize: 'base'
  });
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  // --- Refs ---
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Rename State ---
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // --- Modal State ---
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [fileToCloseId, setFileToCloseId] = useState<string | null>(null);
  const [isClosingApp, setIsClosingApp] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  
  // --- Conversion State ---
  const [pendingFormat, setPendingFormat] = useState<FileFormat | null>(null);

  // --- Copy Feedback State ---
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load Favorites on Mount
  useEffect(() => {
    if (window.electron) {
      window.electron.getFavorites().then(setFavorites);
    }
  }, []);

  useEffect(() => {
    if (window.electron) {
      const handleAppClosing = async () => {
        const dirtyFile = files.find(f => f.isDirty);
        if (dirtyFile) {
          setFileToCloseId(dirtyFile.id);
          setIsClosingApp(true);
          setShowCloseModal(true);
        } else {
          window.electron!.minimizeWindow();
        }
      };
      window.electron.onAppClosing(handleAppClosing);
    }
  }, [files]); 

  useEffect(() => {
    setIsRenaming(false);
  }, [activeFileId]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [isRenaming]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleTriggerOpenFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const processedJson = useMemo(() => {
    if (!activeFile?.json) return null;
    let result: JsonValue = activeFile.json;
    if (sortOrder !== 'original') {
      result = sortJson(result, sortOrder);
    }
    return result;
  }, [activeFile?.json, sortOrder]);

  const stats = useMemo(() => {
    if (!activeFile?.json) return { totalNodes: 0, maxDepth: 0 };
    return getJsonStats(activeFile.json);
  }, [activeFile?.json]);

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

  const handleFileLoaded = (loadedData: JsonValue, name: string, size: number, path?: string, rawContent?: string) => {
    const format = detectFormat(name);
    let text = rawContent;
    let json = loadedData;

    if (rawContent && Object.keys(loadedData).length === 0) {
       try {
         json = parseContent(rawContent, format);
         text = rawContent;
       } catch (e) {
         console.error(e);
       }
    }

    if (text === undefined) {
      text = stringifyContent(json, format);
    }

    const newFile: EditorFile = {
      id: crypto.randomUUID(),
      name,
      path,
      format,
      json,
      text,
      isDirty: false,
      meta: { name, size, type: format, lastModified: Date.now(), itemCount: 0 }
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setActiveView('editor'); // Switch to editor view

    if (!text || text.trim().length === 0) {
      setViewMode('raw');
    } else {
      setViewMode('tree');
    }

    if (window.electron && path) {
      window.electron.addToHistory({ name, path, format });
    }
  };

  const handleLoadFileFromPath = async (path: string, name: string) => {
    if (window.electron) {
      try {
        const result = await window.electron.readFile(path);
        if (result.success && result.content) {
          handleFileLoaded({}, name, 0, path, result.content);
        } else {
          alert(`Could not open file: ${result.error}`);
        }
      } catch (e: any) {
        alert(`Failed to open file: ${e.message}`);
      }
    }
  };

  const createNewFile = (format: FileFormat) => {
    setShowNewFileModal(false);
    const name = `untitled.${format}`;
    handleFileLoaded({}, name, 0, undefined, '');
  };

  const handleTriggerOpenFile = async () => {
    if (window.electron) {
      try {
        const result = await window.electron.openFileDialog();
        if (!result.canceled && result.content !== undefined && result.filePath && result.name) {
          const format = detectFormat(result.name);
          try {
            const parsed = parseContent(result.content, format);
            handleFileLoaded(parsed, result.name, result.content.length, result.filePath, result.content);
          } catch (e: any) {
            alert(`Failed to parse ${format.toUpperCase()} file: ${e.message}`);
          }
        }
      } catch (err) {
        console.error("Open File Error:", err);
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
        fileInputRef.current.click();
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result;
          if (typeof content === 'string') {
            const format = detectFormat(file.name);
            const parsed = parseContent(content, format);
            handleFileLoaded(parsed, file.name, file.size, undefined, content);
          }
        } catch (err: any) {
          alert(`Error parsing file: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const closeFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fileToClose = files.find(f => f.id === id);
    if (!fileToClose) return;

    if (fileToClose.isDirty) {
      setFileToCloseId(id);
      setIsClosingApp(false);
      setShowCloseModal(true);
      return;
    }
    performCloseFile(id);
  };

  const performCloseFile = (id: string) => {
    const fileIndex = files.findIndex(f => f.id === id);
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);

    if (activeFileId === id) {
      if (newFiles.length > 0) {
        const nextIndex = fileIndex > 0 ? fileIndex - 1 : 0;
        setActiveFileId(newFiles[nextIndex].id);
      } else {
        setActiveFileId(null);
        setActiveView('home'); // Go to home if no files
      }
    } else if (newFiles.length === 0) {
      setActiveView('home');
    }
  };

  const updateActiveFile = (updater: (file: EditorFile) => EditorFile) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? updater(f) : f));
  };

  const handleUpdateValue = (path: Path, newValue: JsonValue) => {
    if (!activeFile) return;
    try {
      const updatedJson = updateValueAtPath(activeFile.json, path, newValue);
      const newText = stringifyContent(updatedJson, activeFile.format);
      updateActiveFile(f => ({ ...f, json: updatedJson, text: newText, isDirty: true }));
    } catch (e) {
      console.error("Failed to update value", e);
    }
  };

  const handleRawChange = (newText: string) => {
    if (!activeFile) return;
    updateActiveFile(f => {
      let newJson = f.json;
      let error = null;
      try {
        newJson = parseContent(newText, f.format);
      } catch (e: any) {
        error = e.message;
      }
      return {
        ...f,
        text: newText,
        json: error ? f.json : newJson, 
        isDirty: true,
        error
      };
    });
  };

  const handleFormat = () => {
    if (!activeFile) return;
    try {
      const currentObj = parseContent(activeFile.text, activeFile.format);
      const formatted = stringifyContent(currentObj, activeFile.format);
      updateActiveFile(f => ({ ...f, text: formatted, json: currentObj, error: null, isDirty: true }));
    } catch (e: any) {
      alert("Cannot format: Invalid syntax.");
    }
  };

  const handleMinify = () => {
    if (!activeFile) return;
    if (activeFile.format === 'yaml') return; 
    try {
      const currentObj = parseContent(activeFile.text, activeFile.format);
      const minified = minifyContent(currentObj, activeFile.format);
      updateActiveFile(f => ({ ...f, text: minified, json: currentObj, error: null, isDirty: true }));
    } catch (e: any) {
      alert("Cannot minify: Invalid syntax.");
    }
  };

  const initiateConvert = (target: FileFormat) => {
    setPendingFormat(target);
  };

  const performConversion = () => {
    if (!activeFile || !pendingFormat) return;
    
    try {
      const newText = stringifyContent(activeFile.json, pendingFormat);
      let newName = activeFile.name;
      const parts = newName.split('.');
      if (parts.length > 1) {
        parts[parts.length - 1] = pendingFormat === 'yaml' ? 'yaml' : pendingFormat === 'xml' ? 'xml' : 'json';
        newName = parts.join('.');
      } else {
        newName = `${newName}.${pendingFormat}`;
      }

      updateActiveFile(f => ({
        ...f,
        format: pendingFormat,
        text: newText,
        name: newName,
        isDirty: true,
        error: null 
      }));
      
      setViewMode('raw');
      
    } catch (e: any) {
      alert(`Conversion Failed: ${e.message}`);
    } finally {
      setPendingFormat(null);
    }
  };

  const handleSaveFile = async (targetId?: string): Promise<boolean> => {
    const fileId = targetId || activeFileId;
    const file = files.find(f => f.id === fileId);
    if (!file) return false;
    if (file.error) {
      alert(`Cannot save: ${file.format.toUpperCase()} syntax error in Raw View.`);
      return false;
    }

    const content = stringifyContent(file.json, file.format);

    if (window.electron && file.path) {
      const result = await window.electron.saveFile(file.path, content);
      if (result.success) {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isDirty: false } : f));
        return true;
      } else {
        alert("Failed to save file: " + result.error);
        return false;
      }
    } 
    else if (window.electron && !file.path) {
      return await handleSaveAsCopy(fileId, true);
    }
    else {
      downloadJson(file.json, file.name); 
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isDirty: false } : f));
      return true;
    }
  };

  const handleSaveAsCopy = async (fileId?: string, updateContext = false): Promise<boolean> => {
    const targetId = fileId || activeFileId;
    const file = files.find(f => f.id === targetId);
    if (!file) return false;

    const content = stringifyContent(file.json, file.format);

    if (window.electron) {
      const result = await window.electron.saveFileAs(file.name, content, file.format);
      if (result.success && result.filePath) {
        const fileName = result.filePath.split(/[/\\]/).pop() || file.name;
        if (updateContext || !file.path) {
           setFiles(prev => prev.map(f => f.id === targetId ? {
             ...f,
             isDirty: false,
             path: result.filePath,
             name: fileName
           } : f));
        } else {
           alert(`Saved copy to: ${fileName}`);
        }
        return true;
      }
      return false;
    } else {
      downloadJson(file.json, "Copy_" + file.name);
      return true;
    }
  };

  const handleCopyFullText = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleModalSave = async () => {
    if (fileToCloseId) {
      const success = await handleSaveFile(fileToCloseId);
      if (success) {
        setShowCloseModal(false);
        if (isClosingApp) {
          window.electron?.minimizeWindow();
        } else {
          performCloseFile(fileToCloseId);
        }
        setFileToCloseId(null);
      }
    }
  };

  const handleModalDiscard = () => {
    setShowCloseModal(false);
    if (fileToCloseId) {
      if (isClosingApp) {
        window.electron?.minimizeWindow();
      } else {
        performCloseFile(fileToCloseId);
      }
      setFileToCloseId(null);
    }
  };

  const handleModalCancel = () => {
    setShowCloseModal(false);
    setFileToCloseId(null);
    setIsClosingApp(false);
  };

  const startRenaming = () => {
    if (!activeFile) return;
    setRenameValue(activeFile.name);
    setIsRenaming(true);
  };

  const saveRename = () => {
    if (!activeFile) return;
    const trimmed = renameValue.trim();
    if (trimmed !== "") {
      const newFormat = detectFormat(trimmed);
      updateActiveFile(f => ({ ...f, name: trimmed, format: newFormat }));
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveRename();
    else if (e.key === 'Escape') setIsRenaming(false);
  };

  // --- Favorite Logic ---
  const toggleCurrentFileFavorite = async () => {
    if (activeFile && activeFile.path && window.electron) {
      const item: HistoryItem = {
        name: activeFile.name,
        path: activeFile.path,
        format: activeFile.format,
        lastOpened: new Date().toISOString()
      };
      
      const isCurrentlyFav = favorites.some(f => f.path === item.path);
      if (isCurrentlyFav) {
        setFavorites(prev => prev.filter(f => f.path !== item.path));
      } else {
        setFavorites(prev => [item, ...prev]);
      }

      try {
        const updated = await window.electron.toggleFavorite(item);
        setFavorites(updated);
      } catch (error) {
        console.error("Failed to toggle favorite", error);
        if (window.electron) {
           window.electron.getFavorites().then(setFavorites);
        }
      }
    }
  };

  const dirtyFileForModal = files.find(f => f.id === fileToCloseId);
  
  // Calculate favorite status
  const isCurrentFileFavorite = activeFile?.path 
    ? favorites.some(f => f.path === activeFile.path) 
    : false;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200">
      <ConfirmModal 
        isOpen={showCloseModal}
        fileName={dirtyFileForModal?.name || 'Untitled'}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
      />

      <ConversionConfirmModal
        isOpen={!!pendingFormat}
        targetFormat={pendingFormat}
        onConfirm={performConversion}
        onCancel={() => setPendingFormat(null)}
      />

      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Create New File</h3>
                <button onClick={() => setShowNewFileModal(false)}><X size={20} className="text-slate-400" /></button>
             </div>
             <div className="p-4 flex gap-4 justify-center">
                <button onClick={() => createNewFile('json')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all w-24">
                   <FileJson size={24} className="text-yellow-500 dark:text-yellow-400" />
                   <span className="text-xs font-medium">JSON</span>
                </button>
                <button onClick={() => createNewFile('yaml')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all w-24">
                   <Database size={24} className="text-indigo-500 dark:text-indigo-400" />
                   <span className="text-xs font-medium">YAML</span>
                </button>
                <button onClick={() => createNewFile('xml')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition-all w-24">
                   <FileCode size={24} className="text-orange-500 dark:text-orange-400" />
                   <span className="text-xs font-medium">XML</span>
                </button>
             </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept=".json,.yaml,.yml,.xml,application/json,text/yaml,text/xml" />

      {/* TOOLBAR */}
      <Toolbar 
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        theme={theme}
        setTheme={setTheme}
        activeFile={activeFile}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setViewSortOrder={setViewSortOrder}
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        onFormat={handleFormat}
        onMinify={handleMinify}
        onCopy={handleCopyFullText}
        copySuccess={copySuccess}
        onConvert={initiateConvert}
        showLineNumbers={showLineNumbers}
        setShowLineNumbers={setShowLineNumbers}
        onOpenHistory={() => setActiveView('history')}
      />

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && activeView !== 'history' && (
          <Sidebar 
            activeFile={activeFile}
            onNewFile={() => setShowNewFileModal(true)}
            onOpenFile={handleTriggerOpenFile}
            stats={stats}
            onLoadFile={handleLoadFileFromPath}
            isFavorite={isCurrentFileFavorite} 
            onToggleFavorite={toggleCurrentFileFavorite}
            onSave={() => handleSaveFile()}
            onSaveAsCopy={() => handleSaveAsCopy(undefined, false)}
            isRenaming={isRenaming}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            saveRename={saveRename}
            handleRenameKeyDown={handleRenameKeyDown}
            startRenaming={startRenaming}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
          
          {/* Main Content Area */}
          {activeView === 'history' ? (
             <HistoryPage 
                onOpen={handleLoadFileFromPath} 
                onBack={() => {
                  if (files.length > 0) setActiveView('editor');
                  else setActiveView('home');
                }} 
             />
          ) : (
            <>
              {/* Tabs Container */}
              {activeView === 'editor' && (
                <div 
                  className="h-9 bg-gray-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center px-2 gap-1 overflow-x-auto draggable-region [&::-webkit-scrollbar]:hidden" 
                  style={{ scrollbarWidth: 'none' }}
                >
                  {files.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`group flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px] text-xs cursor-pointer border-t border-r border-l rounded-t-lg select-none transition-colors no-drag h-full mt-1 ${file.id === activeFileId ? 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-medium relative top-[1px]' : 'bg-gray-200 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-gray-200/80 dark:hover:bg-slate-700'}`}
                    >
                      {getFileIcon(file.format, 12, file.id === activeFileId ? '' : 'text-slate-400')}
                      <span className="truncate flex-1">{file.name}</span>
                      {file.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                      <button onClick={(e) => closeFile(file.id, e as any)} className="opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 rounded p-0.5 text-slate-500 dark:text-slate-400"><X size={10} /></button>
                    </div>
                  ))}
                   {/* ALIGNED PLUS BUTTON */}
                   <button onClick={() => setShowNewFileModal(true)} className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors no-drag shrink-0 mt-1 ml-0.5"><Plus size={14} /></button>
                </div>
              )}

              {activeView === 'home' ? (
                <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-slate-950">
                   <Home 
                     onFileLoaded={(data, name, size, path, content) => handleFileLoaded(data, name, size, path, content)} 
                     onError={(msg) => alert(msg)} 
                   />
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative">
                    {activeFile ? (
                      viewMode === 'tree' ? (
                         <TreeViewer 
                           data={processedJson} 
                           error={activeFile.error} 
                           settings={viewSettings} 
                           searchQuery={searchQuery} 
                           onUpdate={handleUpdateValue}
                         />
                      ) : (
                        <div className="h-full flex flex-col">
                           <CodeEditor 
                              value={activeFile.text} 
                              onChange={handleRawChange} 
                              className="flex-1"
                              searchTerm={searchQuery}
                              format={activeFile.format}
                              error={activeFile.error}
                              showLineNumbers={showLineNumbers}
                           />
                        </div>
                      )
                    ) : (
                      <Home 
                        onFileLoaded={(data, name, size, path, content) => handleFileLoaded(data, name, size, path, content)} 
                        onError={(msg) => alert(msg)} 
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
