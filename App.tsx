import React, { useState, useMemo, useEffect, useRef, useCallback, useTransition } from 'react';
import {
  Plus,
  X,
  FileJson,
  FileCode,
  Database,
  FileSpreadsheet,
  Loader2,
  Info,
  Codesandbox
} from 'lucide-react';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Toolbar from './components/Toolbar';
import TreeViewer from './components/TreeViewer';
import TableViewer from './components/TableViewer';
import HistoryPage from './components/HistoryPage';
import ComparePage from './components/ComparePage';
import ConfirmModal from './components/ConfirmModal';
import ConversionConfirmModal from './components/ConversionConfirmModal';
import TypeGeneratorModal from './components/TypeGeneratorModal';
import CommandPalette from './components/CommandPalette';
import AiAssistant from './components/AiAssistant';
import { sortJson, getJsonStats, updateValueAtPath, downloadJson, JsonStats } from './utils/jsonUtils';
import { detectFormat, parseContent, stringifyContent, minifyContent } from './utils/parserUtils';
import { JsonValue, EditorFile, SortOrder, ViewSettings, Path, FileFormat, HistoryItem, JsonObject } from './types';

type ViewState = 'home' | 'editor' | 'history' | 'compare';
type EditorViewMode = 'tree' | 'table' | 'raw';

// Robust worker URL construction for environments with inconsistent import.meta support
const resolveWorkerUrl = (relativePath: string) => {
  try {
    // Standard ESM resolution
    return new URL(relativePath, import.meta.url);
  } catch (err) {
    // Fallback to location-based resolution
    const base = window.location.origin + window.location.pathname;
    const baseUrl = base.endsWith('/') ? base : base.substring(0, base.lastIndexOf('/') + 1);
    return new URL(relativePath, baseUrl);
  }
};

// --- Internal Component: FileWorkspace ---
interface FileWorkspaceProps {
  file: EditorFile;
  isActive: boolean;
  viewMode: EditorViewMode;
  sortOrder: SortOrder;
  searchQuery: string;
  viewSettings: ViewSettings;
  showLineNumbers: boolean;
  onUpdate: (path: Path, newValue: JsonValue) => void;
  onRawChange: (val: string) => void;
}

const FileWorkspace = React.memo(({
  file,
  isActive,
  viewMode,
  sortOrder,
  searchQuery,
  viewSettings,
  showLineNumbers,
  onUpdate,
  onRawChange
}: FileWorkspaceProps) => {

  const processedJson = useMemo(() => {
    if (!file.json) return null;
    let result: JsonValue = file.json;
    if (sortOrder !== 'original') {
      result = sortJson(result, sortOrder);
    }
    return result;
  }, [file.json, sortOrder]);

  return (
    <div className={isActive ? "flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300" : "hidden"}>
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative h-full">
        {viewMode === 'tree' ? (
          <TreeViewer
            data={processedJson}
            error={file.error}
            settings={viewSettings}
            searchQuery={searchQuery}
            onUpdate={onUpdate}
          />
        ) : viewMode === 'table' ? (
          <TableViewer
            data={processedJson || []}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="h-full flex flex-col">
            <CodeEditor
              value={file.text}
              onChange={onRawChange}
              className="flex-1"
              searchTerm={searchQuery}
              format={file.format}
              error={file.error}
              showLineNumbers={showLineNumbers}
            />
          </div>
        )}
      </div>
    </div>
  );
});

function App() {
  // --- Global State ---
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // --- React Transition State for Tab Switching ---
  const [isPending, startTransition] = useTransition();
  const [isSwitchingLoading, setIsSwitchingLoading] = useState(false);

  // --- File System State ---
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);

  // Stats State (Async calculation to prevent freezing)
  const [currentFileStats, setCurrentFileStats] = useState<JsonStats>({ totalNodes: 0, maxDepth: 0, objects: 0, arrays: 0, primitives: 0 });

  // Cleanup Tracking State
  const [activeCleanups, setActiveCleanups] = useState<string[]>([]);
  const preCleanupTextRef = useRef<Record<string, string>>({});

  // --- View State ---
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [viewMode, setViewMode] = useState<EditorViewMode>('tree');
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Rename State ---
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // --- Modal State ---
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [fileToCloseId, setFileToCloseId] = useState<string | null>(null);
  const [isClosingApp, setIsClosingApp] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showTypeGenerator, setShowTypeGenerator] = useState(false);

  // --- Conversion State ---
  const [pendingFormat, setPendingFormat] = useState<FileFormat | null>(null);

  // --- Copy Feedback State ---
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Drag & Drop State ---
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  // Handle CSV format to auto-switch to table mode ONLY when the active file changes
  useEffect(() => {
    if (!activeFile) return;
    if (activeFile.format === 'csv') {
      setViewMode('table');
    } else if (viewMode === 'table') {
      setViewMode('tree');
    }
    // Clear active cleanups visual when switching files
    setActiveCleanups([]);
  }, [activeFileId, activeFile?.format]);

  // --- HELPER: Async Action Wrapper ---
  const withLoading = useCallback((action: () => void, message: string = 'Processing...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          action();
        } catch (e) {
          console.error(e);
        } finally {
          setTimeout(() => setIsLoading(false), 50);
        }
      });
    }, 50);
  }, []);

  useEffect(() => {
    let timer: any;
    if (isPending) {
      timer = setTimeout(() => {
        setLoadingMessage('Switching File...');
        setIsLoading(true);
        setIsSwitchingLoading(true);
      }, 500);
    } else if (isSwitchingLoading) {
      setIsLoading(false);
      setIsSwitchingLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isPending, isSwitchingLoading]);

  useEffect(() => {
    if (!activeFile?.json) {
      setCurrentFileStats({ totalNodes: 0, maxDepth: 0, objects: 0, arrays: 0, primitives: 0 });
      return;
    }

    const timer = setTimeout(() => {
      const newStats = getJsonStats(activeFile.json);
      setCurrentFileStats(newStats);
    }, 100);

    return () => clearTimeout(timer);
  }, [activeFile?.json]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleTabSwitch = (id: string) => {
    if (id === activeFileId) return;
    startTransition(() => {
      setActiveFileId(id);
    });
  };

  const handleViewModeSwitch = (mode: EditorViewMode) => {
    if (mode === viewMode) return;
    const msgMap = {
      tree: 'Building Tree...',
      table: 'Generating Table...',
      raw: 'Rendering Text...'
    };
    withLoading(() => setViewMode(mode), msgMap[mode]);
  };

  const handleViewSortOrder = (order: SortOrder) => {
    withLoading(() => setViewSortOrder(order), 'Sorting...');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const initApp = async () => {
      if (window.electron) {
        try {
          const favs = await window.electron.getFavorites();
          setFavorites(favs);
        } catch (error) {
          console.error("Failed to load favorites:", error);
        }
      } else {
        const localFavs = localStorage.getItem('favorites');
        if (localFavs) {
          try { setFavorites(JSON.parse(localFavs)); } catch (e) { }
        }
      }
      setTimeout(() => setIsLoading(false), 300);
    };
    initApp();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
      }
      if ((e.key === 'j' || e.key === 'J') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowAiAssistant((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod) {
        // --- New Shortcuts ---
        // Save: Ctrl + S
        if (e.key === 's') {
          e.preventDefault();
          handleSaveFile(); // Using existing handleSaveFile
        }
        // New File: Ctrl + N
        if (e.key === 'n') {
          e.preventDefault();
          setShowNewFileModal(true); // Trigger "New File" modal
        }
        // Toggle Theme: Ctrl + Shift + T
        if (e.shiftKey && e.key.toLowerCase() === 't') {
          e.preventDefault();
          setTheme(prev => prev === 'dark' ? 'light' : 'dark');
        }
        // History: Ctrl + H
        if (e.key === 'h') {
          e.preventDefault();
          setActiveView('history');
        }
        // Toggle Sidebar: Ctrl + B
        if (e.key === 'b') {
          e.preventDefault();
          setShowSidebar(prev => !prev);
        }

        // --- Existing Shortcuts ---
        // Open File: Ctrl + O
        if (e.key === 'o') {
          e.preventDefault();
          handleTriggerOpenFile();
        }
        // Search/Find: Ctrl + F
        if (e.key === 'f') {
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }
        // Undo: Ctrl + Z
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        // Redo: Ctrl + Y or Ctrl + Shift + Z
        if (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, files]);

  const getFileIcon = (format: FileFormat, size = 16, className = "") => {
    let colorClass = "";
    if (!className.includes("text-")) {
      switch (format) {
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

  const handleFileLoadedAsync = async (rawContent: string, name: string, size: number, path?: string) => {
    setLoadingMessage('Optimizing Buffer...');
    setIsLoading(true);

    try {
      const format = detectFormat(name);
      let text = rawContent || '';
      let json: JsonValue = null;
      let fileSize = size;

      if (path && text.trim() === path.trim()) {
        throw new Error("Invalid file content read (content matches path).");
      }

      if (fileSize === 0 && text) {
        fileSize = new Blob([text]).size;
      }

      const isVeryLarge = text.length > 10 * 1024 * 1024; // 10MB

      if (isVeryLarge) {
        setNotification(`File is very large (${(fileSize / 1024 / 1024).toFixed(2)} MB). Opening in Raw Mode first.`);
        json = {};
      } else {
        setLoadingMessage('Neural Parsing (Off-Thread)...');
        try {
          json = await new Promise((resolve, reject) => {
            let worker: Worker;
            try {
              const workerUrl = resolveWorkerUrl('./utils/parserWorker.ts');
              worker = new Worker(workerUrl, { type: 'module' });
            } catch (err) {
              return reject(new Error("Worker construction failed. Fallback triggered."));
            }

            worker.onmessage = (ev) => {
              if (ev.data.success) resolve(ev.data.json);
              else reject(new Error(ev.data.error));
              worker.terminate();
            };
            worker.onerror = (_err) => {
              reject(new Error("Worker thread execution failed."));
              worker.terminate();
            };
            worker.postMessage({ content: text, format });
          });
        } catch (workerErr: any) {
          console.warn("Off-thread parsing failed, falling back to main thread:", workerErr.message);
          setLoadingMessage('Neural Parsing (Fallback)...');
          json = parseContent(text, format);
        }
      }

      const newFile: EditorFile = {
        id: crypto.randomUUID(),
        name,
        path,
        format,
        json,
        text,
        isDirty: false,
        meta: { name, size: fileSize, type: format, lastModified: Date.now(), itemCount: 0 },
        history: {
          snapshots: [text],
          currentIndex: 0
        },
        formatStyle: 'pretty'
      };

      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setActiveView('editor');

      if (isVeryLarge) {
        setViewMode('raw');
      } else if (!text || text.trim().length === 0) {
        setViewMode('raw');
      } else if (format === 'csv') {
        setViewMode('table');
      } else {
        setViewMode('tree');
      }

      setViewSettings(prev => ({ ...prev, expandedLevel: 1 }));

      if (window.electron && path) {
        window.electron.addToHistory({ name, path, format });
      } else {
        const historyPath = path || name;
        const item: HistoryItem = { name, path: historyPath, format, lastOpened: new Date().toISOString() };
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        const newHistory = [item, ...history.filter((h: any) => h.path !== item.path)].slice(0, 50);
        localStorage.setItem('history', JSON.stringify(newHistory));
      }

    } catch (e: any) {
      console.error("File Load Error:", e);
      const msg = e.message.length > 100 ? e.message.substring(0, 100) + '...' : e.message;
      alert(`Failed to load file: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFileFromPath = async (path: string, name: string) => {
    if (window.electron) {
      setIsLoading(true);
      setLoadingMessage('Reading File...');
      try {
        const result = await window.electron.readFile(path);
        if (result.success && typeof result.content === 'string') {
          handleFileLoadedAsync(result.content, name, result.content.length, path);
        } else {
          setIsLoading(false);
          alert(`Could not open file: ${result.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        setIsLoading(false);
        alert(`Failed to open file: ${e.message}`);
      }
    } else {
      alert("Cannot re-open files from history in Web Mode due to browser security.\nPlease re-upload the file.");
    }
  };

  const createNewFile = (format: FileFormat) => {
    setShowNewFileModal(false);
    const name = `untitled.${format}`;
    handleFileLoadedAsync('', name, 0, undefined);
  };

  const handleTriggerOpenFile = async () => {
    if (window.electron) {
      try {
        const result = await window.electron.openFileDialog();
        if (!result.canceled && result.content !== undefined && result.filePath && result.name) {
          handleFileLoadedAsync(result.content, result.name, result.content.length, result.filePath);
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
      setLoadingMessage('Reading File...');
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result;
          if (typeof content === 'string') {
            handleFileLoadedAsync(content, file.name, file.size, undefined);
          }
        } catch (err: any) {
          setIsLoading(false);
          alert(`Error reading file: ${err.message}`);
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
        setActiveView('home');
      }
    } else if (newFiles.length === 0) {
      setActiveView('home');
    }
  };

  const updateActiveFile = (updater: (file: EditorFile) => EditorFile) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? updater(f) : f));
  };

  const addToHistory = (file: EditorFile, newText: string): EditorFile => {
    const currentHist = file.history || { snapshots: [file.text], currentIndex: 0 };
    const past = currentHist.snapshots.slice(0, currentHist.currentIndex + 1);
    const nextSnapshots = [...past, newText];
    if (nextSnapshots.length > 50) {
      nextSnapshots.shift();
    }
    const nextIndex = nextSnapshots.length - 1;
    return {
      ...file,
      history: {
        snapshots: nextSnapshots,
        currentIndex: nextIndex
      }
    };
  };

  const handleUpdateValue = (path: Path, newValue: JsonValue) => {
    if (!activeFileId) return;
    setFiles(prevFiles => {
      const file = prevFiles.find(f => f.id === activeFileId);
      if (!file) return prevFiles;

      const updatedJson = updateValueAtPath(file.json, path, newValue);
      const newText = stringifyContent(updatedJson, file.format);
      const newSize = new Blob([newText]).size;

      const updatedFile = {
        ...file,
        json: updatedJson,
        text: newText,
        isDirty: true,
        meta: { ...file.meta, size: newSize },
        formatStyle: 'pretty' as const
      };
      return prevFiles.map(f => f.id === activeFileId ? addToHistory(updatedFile, newText) : f);
    });
  };

  const handleRawChange = (newText: string) => {
    if (!activeFileId) return;
    const newSize = new Blob([newText]).size;

    setFiles(prevFiles => {
      const file = prevFiles.find(f => f.id === activeFileId);
      if (!file) return prevFiles;

      let newJson = file.json;
      let error = null;
      if (newText.length <= 5 * 1024 * 1024) {
        try {
          newJson = parseContent(newText, file.format);
        } catch (e: any) {
          error = e.message;
        }
      } else {
        newJson = {};
      }

      const updatedFile = {
        ...file,
        text: newText,
        json: error ? file.json : newJson,
        isDirty: true,
        error,
        meta: { ...file.meta, size: newSize },
        formatStyle: undefined
      };

      return prevFiles.map(f => f.id === activeFileId ? addToHistory(updatedFile, newText) : f);
    });
  };

  const handleFormat = () => {
    if (!activeFile) return;
    withLoading(() => {
      try {
        const currentObj = parseContent(activeFile.text, activeFile.format);
        const formatted = stringifyContent(currentObj, activeFile.format);
        const newSize = new Blob([formatted]).size;
        updateActiveFile(f => ({ ...f, text: formatted, json: currentObj, error: null, isDirty: true, meta: { ...f.meta, size: newSize }, formatStyle: 'pretty' }));
      } catch (e: any) {
        alert("Cannot format: Invalid syntax.");
      }
    }, 'Formatting...');
  };

  const handleMinify = () => {
    if (!activeFile) return;
    if (activeFile.format === 'yaml') return;
    withLoading(() => {
      try {
        const currentObj = parseContent(activeFile.text, activeFile.format);
        const minified = minifyContent(currentObj, activeFile.format);
        const newSize = new Blob([minified]).size;
        updateActiveFile(f => ({ ...f, text: minified, json: currentObj, error: null, isDirty: true, meta: { ...f.meta, size: newSize }, formatStyle: 'compact' }));
      } catch (e: any) {
        alert("Cannot minify: Invalid syntax.");
      }
    }, 'Minifying...');
  };

  const applyJsonTool = (transform: (data: JsonValue) => JsonValue, label: string, toolId: string, excludeIds: string[] = []) => {
    if (!activeFile) return;

    // Toggle behavior logic
    if (activeCleanups.includes(toolId)) {
      const originalText = preCleanupTextRef.current[activeFile.id];
      if (originalText !== undefined) {
        withLoading(() => {
          handleRawChange(originalText);
          setActiveCleanups(prev => prev.filter(t => t !== toolId));
        }, "Reverting...");
        return;
      }
    }

    withLoading(() => {
      try {
        if (activeFile.text.length > 5 * 1024 * 1024 && Object.keys(activeFile.json as object).length === 0) {
          alert("Tool unavailable: File too large to parse safely.");
          return;
        }

        // Store checkpoint if this is the first cleanup applied to this file in this session
        if (!activeCleanups.length) {
          preCleanupTextRef.current[activeFile.id] = activeFile.text;
        }

        const newData = transform(activeFile.json);
        const newText = stringifyContent(newData, activeFile.format);
        const newSize = new Blob([newText]).size;

        updateActiveFile(f => {
          const updatedFile = {
            ...f,
            json: newData,
            text: newText,
            isDirty: true,
            meta: { ...f.meta, size: newSize }
          };
          return addToHistory(updatedFile, newText);
        });

        setActiveCleanups(prev => {
          const filtered = prev.filter(id => !excludeIds.includes(id));
          return [...new Set([...filtered, toolId])];
        });

      } catch (e: any) {
        alert(`Tool error: ${e.message}`);
      }
    }, label);
  };

  const recursiveRemoveNulls = (data: JsonValue): JsonValue => {
    if (Array.isArray(data)) {
      // Create a new array, removing nulls/undefined and recursing
      const nextArr: any[] = [];
      for (const val of data) {
        const processed = recursiveRemoveNulls(val);
        if (processed !== null && processed !== undefined) {
          nextArr.push(processed);
        }
      }
      return nextArr;
    }
    if (data !== null && typeof data === 'object') {
      const nextObj: JsonObject = {};
      for (const [key, val] of Object.entries(data)) {
        const processed = recursiveRemoveNulls(val);
        // Exclude the key if the result is null/undefined
        if (processed !== null && processed !== undefined) {
          nextObj[key] = processed;
        }
      }
      return nextObj;
    }
    return data;
  };

  const recursiveTrimStrings = (data: JsonValue): JsonValue => {
    if (typeof data === 'string') return data.trim();
    if (Array.isArray(data)) return data.map(recursiveTrimStrings);
    if (data !== null && typeof data === 'object') {
      const nextObj: JsonObject = {};
      for (const [key, val] of Object.entries(data)) {
        nextObj[key] = recursiveTrimStrings(val);
      }
      return nextObj;
    }
    return data;
  };

const handleToolSortKeys = () => applyJsonTool((data) => {
    // 1. Table Mode: If it's a List/CSV, sort the ROWS by the first column
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const firstKey = Object.keys(data[0] as JsonObject)[0];
      return [...data].sort((a, b) => {
        const valA = (a as JsonObject)[firstKey];
        const valB = (b as JsonObject)[firstKey];
        
        // Check if they are numbers
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        
        // Otherwise sort as text
        return String(valA).localeCompare(String(valB));
      });
    }
    // 2. Tree Mode: Sort Keys Alphabetically (Original logic)
    return sortJson(data, 'asc');
  }, 'Sorting Data (A-Z)...', 'sort_asc', ['sort_desc']);

  const handleToolSortKeysDesc = () => applyJsonTool((data) => {
    // 1. Table Mode: Sort ROWS Descending
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const firstKey = Object.keys(data[0] as JsonObject)[0];
      return [...data].sort((a, b) => {
        const valA = (a as JsonObject)[firstKey];
        const valB = (b as JsonObject)[firstKey];
        
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
        return String(valB).localeCompare(String(valA));
      });
    }
    // 2. Tree Mode: Sort KEYS Descending (Original logic)
    return sortJson(data, 'desc');
  }, 'Sorting Data (Z-A)...', 'sort_desc', ['sort_asc']);
  const handleToolRemoveNulls = () => applyJsonTool(recursiveRemoveNulls, 'Removing Nulls...', 'remove_nulls');
  const handleToolTrimStrings = () => applyJsonTool(recursiveTrimStrings, 'Trimming Strings...', 'trim_strings');

  const initiateConvert = (target: FileFormat) => {
    setPendingFormat(target);
  };

  const performConversion = () => {
    if (!activeFile || !pendingFormat) return;
    withLoading(() => {
      try {
        let dataToConvert = activeFile.json;
        if (activeFile.text.length > 5 * 1024 * 1024 && Object.keys(dataToConvert as object).length === 0) {
          dataToConvert = parseContent(activeFile.text, activeFile.format);
        }

        const newText = stringifyContent(dataToConvert, pendingFormat);
        const newSize = new Blob([newText]).size;

        if (pendingFormat === 'csv' && (!newText || newText.trim() === '')) {
          alert("Conversion Warning: Resulting CSV is empty. Ensure your data structure is compatible with CSV.");
          setPendingFormat(null);
          return;
        }

        let newName = activeFile.name;
        const parts = newName.split('.');
        if (parts.length > 1) {
          parts[parts.length - 1] = pendingFormat === 'yaml' ? 'yaml' : pendingFormat === 'xml' ? 'xml' : 'json';
          if (pendingFormat === 'csv') parts[parts.length - 1] = 'csv';
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
          error: null,
          history: { snapshots: [newText], currentIndex: 0 },
          meta: { ...f.meta, size: newSize },
          formatStyle: 'pretty'
        }));

        setViewMode('raw');
      } catch (e: any) {
        alert(`Conversion Failed: ${e.message}`);
      } finally {
        setPendingFormat(null);
      }
    }, 'Converting...');
  };

  const handleExportToJson = async () => {
    if (!activeFile) return;
    try {
      const jsonContent = stringifyContent(activeFile.json, 'json');
      const jsonName = activeFile.name.replace(/\.[^/.]+$/, "") + ".json";
      if (window.electron) {
        await window.electron.saveFileAs(jsonName, jsonContent, 'json');
      } else {
        downloadJson(activeFile.json, jsonName);
      }
    } catch (e) {
      alert("Export failed.");
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
      return await handleSaveAsCopy(fileId ?? undefined, true);
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

  const handleUndo = () => {
    if (!activeFile) return;
    const { history } = activeFile;
    if (history.currentIndex > 0) {
      const prevIndex = history.currentIndex - 1;
      const prevText = history.snapshots[prevIndex];
      let prevJson = activeFile.json;
      let error = null;
      try {
        if (prevText.length <= 5 * 1024 * 1024) {
          prevJson = parseContent(prevText, activeFile.format);
        } else {
          prevJson = {};
        }
      } catch (e: any) {
        error = e.message;
      }

      updateActiveFile(f => ({
        ...f,
        text: prevText,
        json: error ? prevJson : prevJson,
        error,
        history: { ...f.history, currentIndex: prevIndex },
        isDirty: true
      }));
    }
  };

  const handleRedo = () => {
    if (!activeFile) return;
    const { history } = activeFile;
    if (history.currentIndex < history.snapshots.length - 1) {
      const nextIndex = history.currentIndex + 1;
      const nextText = history.snapshots[nextIndex];
      let nextJson = activeFile.json;
      let error = null;
      try {
        if (nextText.length <= 5 * 1024 * 1024) {
          nextJson = parseContent(nextText, activeFile.format);
        } else {
          nextJson = {};
        }
      } catch (e: any) {
        error = e.message;
      }

      updateActiveFile(f => ({
        ...f,
        text: nextText,
        json: error ? nextJson : nextJson,
        error,
        history: { ...f.history, currentIndex: nextIndex },
        isDirty: true
      }));
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

  const handleToggleFavorite = async (item: HistoryItem) => {
    const isCurrentlyFav = favorites.some(f => f.path === item.path);
    let newFavorites;
    if (isCurrentlyFav) {
      newFavorites = favorites.filter(f => f.path !== item.path);
    } else {
      newFavorites = [item, ...favorites];
    }
    setFavorites(newFavorites);

    if (window.electron) {
      try {
        const updated = await window.electron.toggleFavorite(item);
        setFavorites(updated);
      } catch (error) {
        console.error("Failed to toggle favorite", error);
      }
    } else {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  };

  const toggleCurrentFileFavorite = () => {
    if (activeFile) {
      const item: HistoryItem = {
        name: activeFile.name,
        path: activeFile.path || activeFile.name,
        format: activeFile.format,
        lastOpened: new Date().toISOString()
      };
      handleToggleFavorite(item);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedFileId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    setDraggedFileId(null);
    if (sourceId === targetId) return;

    const sourceIndex = files.findIndex(f => f.id === sourceId);
    const targetIndex = files.findIndex(f => f.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newFiles = [...files];
      const [removed] = newFiles.splice(sourceIndex, 1);
      newFiles.splice(targetIndex, 0, removed);
      setFiles(newFiles);
    }
  };

  const dirtyFileForModal = files.find(f => f.id === fileToCloseId);
  const isCurrentFileFavorite = activeFile
    ? favorites.some(f => f.path === (activeFile.path || activeFile.name))
    : false;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 relative">
      <CommandPalette
        open={isCmdPaletteOpen}
        onOpenChange={setIsCmdPaletteOpen}
        onNewFile={() => setShowNewFileModal(true)}
        onOpenFile={handleTriggerOpenFile}
        onOpenHistory={() => setActiveView('history')}
        onOpenCompare={() => setActiveView('compare')}
        onGoHome={() => setActiveView('home')}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
        onFormat={handleFormat}
        onMinify={handleMinify}
        onCopy={handleCopyFullText}
        onGetTypes={() => setShowTypeGenerator(true)}
        onSortKeys={handleToolSortKeys}
        onSortKeysDesc={handleToolSortKeysDesc}
        onRemoveNulls={handleToolRemoveNulls}
        onTrimStrings={handleToolTrimStrings}
        onConvert={initiateConvert}
      />

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

      {showTypeGenerator && activeFile && (
        <TypeGeneratorModal
          data={activeFile.json}
          fileName={activeFile.name}
          onClose={() => setShowTypeGenerator(false)}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <Info size={20} className="shrink-0" />
            <p className="text-sm font-medium">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-indigo-200 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showNewFileModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] text-xs">Create New File</h3>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4">
              <button
                onClick={() => createNewFile('json')}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-yellow-500/50 dark:hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <FileJson size={32} className="text-yellow-500" />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">JSON</span>
              </button>
              <button
                onClick={() => createNewFile('yaml')}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Database size={32} className="text-indigo-500" />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">YAML</span>
              </button>
              <button
                onClick={() => createNewFile('xml')}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500/50 dark:hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <FileCode size={32} className="text-orange-500" />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">XML</span>
              </button>
              <button
                onClick={() => createNewFile('csv')}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-green-500/50 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <FileSpreadsheet size={32} className="text-green-500" />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept=".json,.yaml,.yml,.xml,.csv,application/json,text/yaml,text/xml,text/csv" />

      {/* TOOLBAR */}
      <Toolbar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        theme={theme}
        setTheme={setTheme}
        activeFile={activeFile}
        viewMode={viewMode}
        setViewMode={handleViewModeSwitch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setViewSortOrder={handleViewSortOrder}
        viewSettings={viewSettings}
        setViewSettings={setViewSettings}
        onFormat={handleFormat}
        onMinify={handleMinify}
        onCopy={handleCopyFullText}
        copySuccess={copySuccess}
        onConvert={initiateConvert}
        showLineNumbers={showLineNumbers}
        setShowLineNumbers={setShowLineNumbers}
        activeView={activeView}
        onOpenHistory={() => setActiveView('history')}
        onOpenCompare={() => setActiveView('compare')}
        onExportJson={handleExportToJson}
        searchInputRef={searchInputRef}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={!!activeFile?.history && activeFile.history.currentIndex > 0}
        canRedo={!!activeFile?.history && activeFile.history.currentIndex < activeFile.history.snapshots.length - 1}
        onToolSortKeys={handleToolSortKeys}
        onToolSortKeysDesc={handleToolSortKeysDesc}
        onToolRemoveNulls={handleToolRemoveNulls}
        onToolTrimStrings={handleToolTrimStrings}
        onOpenTypeGenerator={() => setShowTypeGenerator(true)}
        activeCleanups={activeCleanups}
      />

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && activeView !== 'history' && activeView !== 'compare' && (
          <Sidebar
            activeFile={activeFile}
            onNewFile={() => setShowNewFileModal(true)}
            onOpenFile={handleTriggerOpenFile}
            stats={currentFileStats}
            onLoadFile={handleLoadFileFromPath}
            isFavorite={isCurrentFileFavorite}
            onToggleFavorite={toggleCurrentFileFavorite}
            favorites={favorites}
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

        <div className="flex-1 flex min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {activeView === 'compare' ? (
              <ComparePage
                originalContent={activeFile?.text || ''}
                originalFileName={activeFile?.name}
                onBack={() => {
                  if (files.length > 0) setActiveView('editor');
                  else setActiveView('home');
                }}
                theme={theme}
              />
            ) : activeView === 'history' ? (
              <HistoryPage
                onOpen={handleLoadFileFromPath}
                onBack={() => {
                  if (files.length > 0) setActiveView('editor');
                  else setActiveView('home');
                }}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                activeFilePath={activeFile?.path}
              />
            ) : (
              <>
                {activeView === 'editor' && (
                  <div
                    className="h-9 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center px-2 gap-1 overflow-x-auto draggable-region [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {files.map(file => (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, file.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, file.id)}
                        onClick={() => handleTabSwitch(file.id)}
                        className={`group flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px] text-xs cursor-pointer rounded-t-lg select-none transition-all no-drag h-full mt-1 border-r border-l ${file.id === activeFileId
                          ? 'bg-white dark:bg-slate-950 border-t-2 border-t-indigo-500 border-r-slate-300 dark:border-r-slate-800 border-l-slate-300 dark:border-l-slate-800 text-indigo-700 dark:text-indigo-400 font-bold relative top-[1px] z-10'
                          : 'bg-slate-200 dark:bg-slate-800/50 border-t border-t-transparent border-r-transparent border-l-transparent text-slate-500 dark:text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-800'
                          } ${draggedFileId === file.id ? 'opacity-50' : ''}`}
                      >
                        {getFileIcon(file.format, 12, file.id === activeFileId ? '' : 'text-slate-400')}
                        <span className="truncate flex-1">{file.name}</span>
                        {file.isDirty && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                        <button onClick={(e) => closeFile(file.id, e as any)} className="opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 rounded p-0.5 text-slate-500 dark:text-slate-400 transition-opacity"><X size={10} /></button>
                      </div>
                    ))}
                    <button onClick={() => setShowNewFileModal(true)} className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors no-drag shrink-0 mt-1 ml-0.5"><Plus size={14} /></button>
                  </div>
                )}

                {activeView === 'home' ? (
                  <Home
                    onFileLoaded={(_, name, size, path, content) => handleFileLoadedAsync(content || '', name, size, path)}
                    onError={(msg) => alert(msg)}
                  />
                ) : (
                  <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {files.map(file => (
                      <FileWorkspace
                        key={file.id}
                        file={file}
                        isActive={file.id === activeFileId}
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        sortOrder={sortOrder}
                        viewSettings={viewSettings}
                        showLineNumbers={showLineNumbers}
                        onUpdate={handleUpdateValue}
                        onRawChange={handleRawChange}
                      />
                    ))}

                    {files.length === 0 && (
                      <Home
                        onFileLoaded={(_, name, size, path, content) => handleFileLoadedAsync(content || '', name, size, path)}
                        onError={(msg) => alert(msg)}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {showAiAssistant && activeView === 'editor' && activeFile && (
            <AiAssistant
              activeFile={activeFile}
              onClose={() => setShowAiAssistant(false)}
            />
          )}

          {!showAiAssistant && activeView === 'editor' && activeFile && (
            <button
              onClick={() => setShowAiAssistant(true)}
              className="fixed bottom-6 right-6 h-14 min-w-[3.5rem] bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-full shadow-2xl z-40 transition-all duration-500 hover:scale-110 active:scale-95 group flex items-center justify-center px-4 overflow-hidden ring-4 ring-white dark:ring-slate-900"
              title="Tree Assistant (Ctrl+J)"
            >
              <Codesandbox size={28} className="shrink-0 transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
              <span className="max-w-0 group-hover:max-w-xs transition-all duration-700 whitespace-nowrap text-xs font-black uppercase tracking-[0.2em] overflow-hidden group-hover:ml-3">
                Tree Assistant
              </span>
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl flex flex-col items-center border border-slate-200 dark:border-slate-800">
            <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{loadingMessage}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;