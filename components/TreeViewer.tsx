
import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, FileX, Copy, Code2, Link2 } from 'lucide-react';
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

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Generate JS Access Path (e.g., data[0].users['name'])
  const generatePathString = (path: Path): string => {
    if (path.length === 0) return '';
    
    return path.reduce<string>((acc, key, i) => {
      // If it's a number, it's an array index
      if (typeof key === 'number') {
        return `${acc}[${key}]`;
      }
      
      // If it's a string, check if it's a valid identifier
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        return i === 0 ? key : `${acc}.${key}`;
      }
      
      // Otherwise use bracket notation with quotes
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

  // Check if a specific node path matches the open context menu
  // Used to maintain highlight
  const isNodeSelected = (path: Path) => {
    if (!contextMenu) return false;
    // Simple path equality check
    if (path.length !== contextMenu.path.length) return false;
    return path.every((val, index) => val === contextMenu.path[index]);
  };

  // 1. Error State
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

  // Helper to check if data is "empty"
  const isDataEmpty = (d: JsonValue) => {
    if (!d) return true;
    if (Array.isArray(d)) return d.length === 0;
    if (typeof d === 'object' && d !== null) return Object.keys(d).length === 0;
    return false;
  };

  // 2. Empty State
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

  // 3. Render Tree
  return (
    <div className={`p-6 min-w-fit ${settings.fontSize === 'sm' ? 'text-xs' : settings.fontSize === 'lg' ? 'text-lg' : 'text-sm'}`}>
      <div className="font-mono">
        {Array.isArray(data) ? (
          data.map((item, idx, arr) => {
            const currentPath = [idx];
            return (
              <JsonNode 
                key={idx} 
                name={idx} 
                value={item} 
                isLast={idx === arr.length - 1} 
                prefix="" 
                settings={settings} 
                path={currentPath} 
                onUpdate={onUpdate} 
                searchTerm={searchQuery} 
                depth={0} 
                onContextMenu={handleContextMenu}
                isSelected={isNodeSelected(currentPath)}
              />
            );
          })
        ) : (
          Object.entries(data as object).map(([key, val], idx, arr) => {
            const currentPath = [key];
            return (
              <JsonNode 
                key={key} 
                name={key} 
                value={val} 
                isLast={idx === arr.length - 1} 
                prefix="" 
                settings={settings} 
                path={currentPath} 
                onUpdate={onUpdate} 
                searchTerm={searchQuery} 
                depth={0} 
                onContextMenu={handleContextMenu}
                isSelected={isNodeSelected(currentPath)}
              />
            );
          })
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
