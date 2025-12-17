
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertOctagon, FileX, Copy, Code2, Link2, Loader2 } from 'lucide-react';
import JsonNode from './JsonNode';
import { JsonValue, ViewSettings, OnUpdateValue, Path } from '../types';

interface TreeViewerProps {
  data: JsonValue | null;
  error?: string | null;
  settings: ViewSettings;
  searchQuery: string;
  onUpdate: OnUpdateValue;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: Path;
  value: JsonValue;
  key: string | number;
}

const TreeViewer: React.FC<TreeViewerProps> = ({ 
  data, 
  error, 
  settings, 
  searchQuery, 
  onUpdate 
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  
  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(50);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset visible count when data changes or search changes
  useEffect(() => {
    setVisibleCount(50);
  }, [data, searchQuery]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 50);
        }
      },
      { rootMargin: '100px' }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [data, visibleCount]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const generatePathString = (path: Path): string => {
    if (path.length === 0) return '';
    return path.reduce<string>((acc, key, i) => {
      if (typeof key === 'number') {
        return `${acc}[${key}]`;
      }
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        return i === 0 ? key : `${acc}.${key}`;
      }
      return `${acc}["${key}"]`;
    }, '');
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, path: Path, value: JsonValue, key: string | number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      value,
      key
    });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  const isNodeSelected = (path: Path) => {
    if (!contextMenu) return false;
    if (path.length !== contextMenu.path.length) return false;
    return path.every((val, index) => val === contextMenu.path[index]);
  };

  // Helper to check if data is "empty"
  const isDataEmpty = (d: JsonValue) => {
    if (!d) return true;
    if (Array.isArray(d)) return d.length === 0;
    if (typeof d === 'object' && d !== null) return Object.keys(d).length === 0;
    return false;
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
        <AlertOctagon size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Invalid Syntax</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Unable to render Tree View. Please fix the errors in the Raw View to restore visualization.
        </p>
      </div>
    );
  }

  if (isDataEmpty(data)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80">
        <FileX size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">File is empty</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Switch to Raw View to add content.
        </p>
      </div>
    );
  }

  // Determine items to render
  let itemsToRender: React.ReactElement[] = [];
  let totalItems = 0;

  if (Array.isArray(data)) {
    totalItems = data.length;
    itemsToRender = data.slice(0, visibleCount).map((item, idx) => {
      const currentPath = [idx];
      return (
        <JsonNode 
          key={idx} 
          name={idx} 
          value={item} 
          isLast={idx === data.length - 1} 
          prefix="" 
          settings={settings} 
          path={currentPath} 
          onUpdate={onUpdate} 
          searchTerm={searchQuery} 
          depth={1} // Start at depth 1 so strict inequality checks (1 < 1) force collapse
          onContextMenu={handleContextMenu}
          isSelected={isNodeSelected(currentPath)}
        />
      );
    });
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    totalItems = entries.length;
    itemsToRender = entries.slice(0, visibleCount).map(([key, val], idx) => {
      const currentPath = [key];
      return (
        <JsonNode 
          key={key} 
          name={key} 
          value={val} 
          isLast={idx === entries.length - 1} 
          prefix="" 
          settings={settings} 
          path={currentPath} 
          onUpdate={onUpdate} 
          searchTerm={searchQuery} 
          depth={1} // Start at depth 1
          onContextMenu={handleContextMenu}
          isSelected={isNodeSelected(currentPath)}
        />
      );
    });
  }

  return (
    <div className={`p-6 min-w-fit ${settings.fontSize === 'sm' ? 'text-xs' : settings.fontSize === 'lg' ? 'text-lg' : 'text-sm'}`}>
      <div className="font-mono">
        {itemsToRender}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={bottomRef} className="h-10 w-full flex items-center justify-center mt-4">
        {visibleCount < totalItems && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            <span>Loading more items...</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 mb-1">
            Actions
          </div>
          
          <button 
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
            onClick={() => handleCopy(String(contextMenu.key))}
          >
            <Code2 size={14} className="text-blue-500" />
            Copy Key
          </button>
          
          <button 
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
            onClick={() => {
              const val = typeof contextMenu.value === 'object' && contextMenu.value !== null 
                ? JSON.stringify(contextMenu.value, null, 2) 
                : String(contextMenu.value);
              handleCopy(val);
            }}
          >
            <Copy size={14} className="text-green-500" />
            Copy Value
          </button>

          <button 
            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
            onClick={() => handleCopy(generatePathString(contextMenu.path))}
          >
            <Link2 size={14} className="text-orange-500" />
            Copy Path
          </button>
        </div>
      )}
    </div>
  );
};

export default TreeViewer;
