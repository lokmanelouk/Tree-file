
import React, { useMemo } from 'react';
import { JsonValue } from '../types';

interface TableViewerProps {
  data: JsonValue;
  searchQuery?: string;
}

const TableViewer: React.FC<TableViewerProps> = ({ data, searchQuery = '' }) => {
  const tableData = useMemo(() => {
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const headers = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0] as object);
  }, [tableData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const lowerQuery = searchQuery.toLowerCase();
    return tableData.filter((row: any) => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [tableData, searchQuery]);

  if (tableData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 font-medium">
        No data available to display in table.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto custom-scrollbar bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm text-left table-auto">
        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-900 shadow-md">
          <tr>
            <th className="px-4 py-4 border-b-2 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider text-[10px] w-14 text-center bg-slate-100 dark:bg-slate-900">
              #
            </th>
            {headers.map((header) => (
              <th 
                key={header} 
                className="px-4 py-4 border-b-2 border-indigo-200 dark:border-indigo-900 text-slate-800 dark:text-slate-100 font-black uppercase tracking-wider text-[10px] min-w-[150px] bg-slate-100 dark:bg-slate-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredData.map((row: any, idx) => (
            <tr 
              key={idx} 
              className={`hover:bg-indigo-50/70 dark:hover:bg-indigo-900/20 transition-colors group
                ${idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/50 dark:bg-slate-900/40'}
              `}
            >
              <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-400 dark:text-indigo-500 text-center select-none font-bold">
                {idx + 1}
              </td>
              {headers.map((header) => {
                const val = row[header];
                const isMatch = searchQuery && String(val).toLowerCase().includes(searchQuery.toLowerCase());
                
                return (
                  <td 
                    key={header} 
                    className={`px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-sm font-mono text-[12px] border-r border-slate-100 dark:border-slate-800/50
                      ${isMatch ? 'bg-yellow-100 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100 font-bold' : 'text-slate-600 dark:text-slate-300'}
                    `}
                  >
                    {val === null ? (
                      <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                    ) : typeof val === 'boolean' ? (
                      <span className="text-purple-500 dark:text-purple-400 font-black">{String(val)}</span>
                    ) : typeof val === 'number' ? (
                      <span className="text-orange-500 dark:text-orange-400 font-bold">{val}</span>
                    ) : (
                      <span className="opacity-90">{String(val)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-20 text-center text-slate-500 dark:text-slate-400 font-medium italic bg-slate-50/50 dark:bg-slate-900/20">
          No matches found for query: <span className="text-indigo-500 font-bold">"{searchQuery}"</span>
        </div>
      )}
    </div>
  );
};

export default TableViewer;
