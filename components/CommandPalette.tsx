import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  FilePlus,
  FolderOpen,
  History,
  GitCompare,
  Home,
  Moon,
  Sun,
  AlignLeft,
  Minimize,
  Copy,
  Terminal,
  ArrowDownAZ,
  ArrowUpAZ,
  Trash2,
  Scissors,
  Search,
  FileJson,
  FileCode,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import { FileFormat } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onGoHome: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onGetTypes: () => void;
  onSortKeys: () => void;
  onSortKeysDesc: () => void;
  onRemoveNulls: () => void;
  onTrimStrings: () => void;
  onConvert: (format: FileFormat) => void;
  activeCleanups?: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onNewFile,
  onOpenFile,
  onOpenHistory,
  onOpenCompare,
  onGoHome,
  onToggleTheme,
  theme,
  onFormat,
  onMinify,
  onCopy,
  onGetTypes,
  onSortKeys,
  onSortKeysDesc,
  onRemoveNulls,
  onTrimStrings,
  onConvert,
  activeCleanups = []
}) => {

  // Handle Escape Key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-100 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Global Command Menu"
          className="w-full"
          loop
        >
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <Command.Input
              autoFocus
              className="w-full py-3 bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm font-medium"
              placeholder="Type a command or search..."
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

            <Command.Group heading="General" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
              <CommandItem onSelect={() => { onNewFile(); onOpenChange(false); }} icon={<FilePlus size={14} />} text="New File" shortcut="Ctrl+N" colorClass="text-green-500" />
              <CommandItem onSelect={() => { onOpenFile(); onOpenChange(false); }} icon={<FolderOpen size={14} />} text="Open File" shortcut="Ctrl+O" colorClass="text-blue-500" />
              <CommandItem onSelect={() => { onGoHome(); onOpenChange(false); }} icon={<Home size={14} />} text="Go Home" colorClass="text-indigo-500" />
            </Command.Group>

            <Command.Group heading="View" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
              <CommandItem onSelect={() => { onOpenHistory(); onOpenChange(false); }} icon={<History size={14} />} text="History" shortcut="Ctrl+H" colorClass="text-purple-500" />
              <CommandItem onSelect={() => { onOpenCompare(); onOpenChange(false); }} icon={<GitCompare size={14} />} text="Compare Files" colorClass="text-orange-500" />
              <CommandItem onSelect={() => { onToggleTheme(); onOpenChange(false); }} icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} text="Toggle Theme" shortcut="Ctrl+Shift+T" colorClass="text-yellow-500" />
            </Command.Group>

            <Command.Group heading="Editor Actions" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
              <CommandItem onSelect={() => { onFormat(); onOpenChange(false); }} icon={<AlignLeft size={14} />} text="Format Document" colorClass="text-cyan-500" />
              <CommandItem onSelect={() => { onMinify(); onOpenChange(false); }} icon={<Minimize size={14} />} text="Minify" colorClass="text-pink-500" />
              <CommandItem onSelect={() => { onCopy(); onOpenChange(false); }} icon={<Copy size={14} />} text="Copy Content" colorClass="text-teal-500" />
              <CommandItem onSelect={() => { onGetTypes(); onOpenChange(false); }} icon={<Terminal size={14} />} text="Generate TypeScript Types" colorClass="text-blue-600" />
            </Command.Group>

            <Command.Group heading="Data Tools" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
              <CommandItem
                onSelect={() => { onSortKeys(); onOpenChange(false); }}
                icon={<ArrowDownAZ size={14} />}
                text="Sort Keys (A-Z)"
                colorClass="text-indigo-500"
                isActive={activeCleanups.includes('sort_asc')}
              />
              <CommandItem
                onSelect={() => { onSortKeysDesc(); onOpenChange(false); }}
                icon={<ArrowUpAZ size={14} />}
                text="Sort Keys (Z-A)"
                colorClass="text-indigo-500"
                isActive={activeCleanups.includes('sort_desc')}
              />
              <CommandItem
                onSelect={() => { onRemoveNulls(); onOpenChange(false); }}
                icon={<Trash2 size={14} />}
                text="Remove Null Values"
                colorClass="text-red-500"
                isActive={activeCleanups.includes('remove_nulls')}
              />
              <CommandItem
                onSelect={() => { onTrimStrings(); onOpenChange(false); }}
                icon={<Scissors size={14} />}
                text="Trim Strings"
                colorClass="text-orange-500"
                isActive={activeCleanups.includes('trim_strings')}
              />
            </Command.Group>

            <Command.Group heading="Convert To" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
              <CommandItem onSelect={() => { onConvert('json'); onOpenChange(false); }} icon={<FileJson size={14} />} text="Convert to JSON" colorClass="text-yellow-500" />
              <CommandItem onSelect={() => { onConvert('yaml'); onOpenChange(false); }} icon={<Database size={14} />} text="Convert to YAML" colorClass="text-indigo-500" />
              <CommandItem onSelect={() => { onConvert('xml'); onOpenChange(false); }} icon={<FileCode size={14} />} text="Convert to XML" colorClass="text-orange-500" />
              <CommandItem onSelect={() => { onConvert('csv'); onOpenChange(false); }} icon={<FileSpreadsheet size={14} />} text="Convert to CSV" colorClass="text-green-500" />
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  );
};

const CommandItem = ({ onSelect, icon, text, shortcut, colorClass = "text-slate-500 dark:text-slate-400", isActive = false }: any) => {
  return (
    <Command.Item
      onSelect={onSelect}
      className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 
      ${isActive 
        ? 'bg-blue-600 text-white data-[selected=true]:bg-blue-700 data-[selected=true]:text-white' 
        : 'text-slate-500 dark:text-slate-400 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800 data-[selected=true]:text-slate-900 dark:data-[selected=true]:text-white'
      }`}
    >
      <div className={`p-1 rounded-md transition-colors 
        ${isActive 
          ? 'bg-white/20 text-white group-data-[selected=true]:text-white' 
          : `bg-slate-50 dark:bg-slate-800 ${colorClass} group-data-[selected=true]:text-teal-500`
        } `}>
        {icon}
      </div>
      <span className="flex-1 flex items-center gap-2">
        {text}
        {isActive && <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 rounded-full">ACTIVE</span>}
      </span>
      {shortcut && (
        <span className={`ml-auto text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border 
          ${isActive 
            ? 'bg-white/20 text-white border-white/20' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
          {shortcut}
        </span>
      )}
    </Command.Item>
  )
}

export default CommandPalette;