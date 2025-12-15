
import React from 'react';
import { Check, AlertCircle, FileText, HardDrive, Box, Braces, AlignJustify } from 'lucide-react';
import { EditorFile } from '../types';
import { formatFileSize, JsonStats } from '../utils/jsonUtils';

interface StatusBarProps {
  activeFile: EditorFile | undefined;
  status: 'ready' | 'error';
  stats?: JsonStats;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeFile, status, stats }) => {
  return (
    <div className="h-7 bg-indigo-600 dark:bg-slate-900 border-t border-indigo-500 dark:border-slate-800 text-white flex items-center px-3 text-[11px] select-none shrink-0 font-sans z-40">
      
      {/* Left: Status & File Info */}
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div className={`flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded ${status === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-700 dark:bg-slate-800 text-indigo-100 dark:text-slate-300'}`}>
           {status === 'error' ? (
             <>
               <AlertCircle size={10} />
               <span className="font-bold">Error</span>
             </>
           ) : (
             <>
                <Check size={10} className="text-green-300" />
                <span className="font-bold uppercase tracking-wider">Ready</span>
             </>
           )}
        </div>

        {activeFile ? (
          <div className="flex items-center gap-2 overflow-hidden text-indigo-100 dark:text-slate-400">
             <FileText size={10} />
             <span className="truncate font-mono opacity-80" title={activeFile.path || activeFile.name}>
               {activeFile.path || activeFile.name}
             </span>
          </div>
        ) : (
          <span className="text-indigo-300 dark:text-slate-600 italic">No file open</span>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 shrink-0 text-indigo-100 dark:text-slate-400">
        {activeFile && (
           <>
             {/* Format Specific Stats */}
             {stats && (
               <>
                 {activeFile.format === 'csv' ? (
                   <div className="flex items-center gap-1.5" title="Rows (Objects)">
                      <AlignJustify size={10} />
                      <span className="font-mono">{stats.objects} Rows</span>
                   </div>
                 ) : (
                   <>
                      <div className="flex items-center gap-1.5" title="Objects Count">
                        <Box size={10} />
                        <span className="font-mono">{stats.objects}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Arrays Count">
                        <Braces size={10} />
                        <span className="font-mono">{stats.arrays}</span>
                      </div>
                   </>
                 )}
                 <div className="w-px h-3 bg-indigo-500 dark:bg-slate-700"></div>
               </>
             )}

             <div className="flex items-center gap-1.5" title="File Size">
               <HardDrive size={10} />
               <span className="font-mono">{formatFileSize(activeFile.meta?.size || 0)}</span>
             </div>
             
             <div className="w-px h-3 bg-indigo-500 dark:bg-slate-700"></div>
             
             <div className="flex items-center gap-1.5">
               <span className="uppercase text-[9px] font-bold opacity-70">Lines</span>
               <span className="font-mono">{activeFile.text.split('\n').length}</span>
             </div>

             <div className="w-px h-3 bg-indigo-500 dark:bg-slate-700"></div>

             <div className="flex items-center gap-1.5">
               <span className="uppercase font-bold opacity-70 bg-indigo-700 dark:bg-slate-800 px-1 rounded text-[9px]">{activeFile.format}</span>
             </div>
           </>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
