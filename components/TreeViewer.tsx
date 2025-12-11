import React from 'react';
import { AlertOctagon, FileX } from 'lucide-react';
import JsonNode from './JsonNode';
import { JsonValue, ViewSettings, OnUpdateValue } from '../types';

interface TreeViewerProps {
  data: JsonValue | null;
  error?: string | null;
  settings: ViewSettings;
  searchQuery: string;
  onUpdate: OnUpdateValue;
}

const TreeViewer: React.FC<TreeViewerProps> = ({ 
  data, 
  error, 
  settings, 
  searchQuery, 
  onUpdate 
}) => {
  
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
          data.map((item, idx, arr) => (
            <JsonNode 
              key={idx} 
              name={idx} 
              value={item} 
              isLast={idx === arr.length - 1} 
              prefix="" 
              settings={settings} 
              path={[idx]} 
              onUpdate={onUpdate} 
              searchTerm={searchQuery} 
              depth={0} 
            />
          ))
        ) : (
          Object.entries(data as object).map(([key, val], idx, arr) => (
            <JsonNode 
              key={key} 
              name={key} 
              value={val} 
              isLast={idx === arr.length - 1} 
              prefix="" 
              settings={settings} 
              path={[key]} 
              onUpdate={onUpdate} 
              searchTerm={searchQuery} 
              depth={0} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TreeViewer;