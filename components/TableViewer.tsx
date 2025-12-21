import React, { useMemo, useState, useRef, useEffect } from 'react';
import { JsonValue } from '../types';

interface TableViewerProps {
  data: JsonValue;
  searchQuery?: string;
}

const ROW_HEIGHT = 48; // Constant row height in pixels
const BUFFER_SIZE = 10; // Number of rows to render above/below the viewport

const TableViewer: React.FC<TableViewerProps> = ({ data, searchQuery = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const tableData = useMemo(() => {
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const headers = useMemo(() => {
    if (tableData.length === 0) return [];
    
    // Robust header discovery: Sample up to 100 rows to find all unique keys
    // This handles cases where some rows might have missing keys due to cleanup actions
    const keySet = new Set<string>();
    const sampleSize = Math.min(tableData.length, 100);
    for (let i = 0; i < sampleSize; i++) {
        const row = tableData[i];
        if (row && typeof row === 'object' && !Array.isArray(row)) {
            Object.keys(row).forEach(key => keySet.add(key));
        }
    }
    
    return Array.from(keySet);
  }, [tableData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const lowerQuery = searchQuery.toLowerCase();
    return tableData.filter((row: any) => 
      Object.values(row || {}).some(val => 
        val !== undefined && val !== null && String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [tableData, searchQuery]);

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Virtualization Calculations
  const totalRows = filteredData.length;
  const totalHeight = totalRows * ROW_HEIGHT;
  
  // Calculate which rows are currently visible
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE);
  
  const visibleRows = useMemo(() => {
    return filteredData.slice(startIndex, endIndex).map((row, i) => ({
      data: row,
      index: startIndex + i
    }));
  }, [filteredData, startIndex, endIndex]);

  if (tableData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 font-medium">
        No data available to display in table.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-auto custom-scrollbar bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        
        {/* Virtual Table Header - Sticky via CSS */}
        <div className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-900 border-b-2 border-indigo-200 dark:border-indigo-900 shadow-sm flex min-w-max">
           <div className="px-4 py-4 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider text-[10px] w-14 text-center shrink-0 border-r border-slate-200 dark:border-slate-800">
             #
           </div>
           {headers.map((header) => (
              <div 
                key={header} 
                className="px-4 py-4 text-slate-800 dark:text-slate-100 font-black uppercase tracking-wider text-[10px] min-w-[200px] border-r border-slate-200 dark:border-slate-800"
              >
                {header}
              </div>
           ))}
        </div>

        {/* Rendered Visible Rows */}
        {visibleRows.map((row) => (
           <div 
             key={row.index}
             className={`absolute left-0 right-0 flex min-w-max border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/20 transition-colors group ${row.index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/50 dark:bg-slate-900/40'}`}
             style={{ 
               top: row.index * ROW_HEIGHT + ROW_HEIGHT, // +ROW_HEIGHT to account for header
               height: ROW_HEIGHT 
             }}
           >
              <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-400 dark:text-indigo-500 text-center select-none font-bold w-14 shrink-0 flex items-center justify-center">
                {row.index + 1}
              </div>
              {headers.map((header) => {
                const val = row.data && typeof row.data === 'object' ? (row.data as any)[header] : undefined;
                const isMatch = searchQuery && val !== undefined && val !== null && String(val).toLowerCase().includes(searchQuery.toLowerCase());
                
                return (
                  <div 
                    key={header} 
                    className={`px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis min-w-[200px] font-mono text-[12px] border-r border-slate-100 dark:border-slate-800/50 flex items-center
                      ${isMatch ? 'bg-yellow-100 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100 font-bold' : 'text-slate-600 dark:text-slate-300'}
                    `}
                  >
                    {val === null ? (
                      <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                    ) : val === undefined ? (
                      <span className="text-slate-400 dark:text-slate-500 italic opacity-40 text-[10px]">missing</span>
                    ) : typeof val === 'boolean' ? (
                      <span className="text-purple-500 dark:text-purple-400 font-black">{String(val)}</span>
                    ) : typeof val === 'number' ? (
                      <span className="text-orange-500 dark:text-orange-400 font-bold">{val}</span>
                    ) : (
                      <span className="opacity-90">{String(val)}</span>
                    )}
                  </div>
                );
              })}
           </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-medium italic bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-xl">
            No matches found for query: <span className="text-indigo-500 font-bold">"{searchQuery}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableViewer;