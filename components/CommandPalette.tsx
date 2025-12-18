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
  ArrowRightLeft,
  Search
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
  onConvert
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
               <CommandItem onSelect={() => { onNewFile(); onOpenChange(false); }} icon={<FilePlus size={14} />} text="New File" shortcut="Ctrl+N" />
               <CommandItem onSelect={() => { onOpenFile(); onOpenChange(false); }} icon={<FolderOpen size={14} />} text="Open File" shortcut="Ctrl+O" />
               <CommandItem onSelect={() => { onGoHome(); onOpenChange(false); }} icon={<Home size={14} />} text="Go Home" />
            </Command.Group>
            
            <Command.Group heading="View" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
               <CommandItem onSelect={() => { onOpenHistory(); onOpenChange(false); }} icon={<History size={14} />} text="History" />
               <CommandItem onSelect={() => { onOpenCompare(); onOpenChange(false); }} icon={<GitCompare size={14} />} text="Compare Files" />
               <CommandItem onSelect={() => { onToggleTheme(); onOpenChange(false); }} icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} text="Toggle Theme" />
            </Command.Group>

            <Command.Group heading="Editor Actions" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
               <CommandItem onSelect={() => { onFormat(); onOpenChange(false); }} icon={<AlignLeft size={14} />} text="Format Document" />
               <CommandItem onSelect={() => { onMinify(); onOpenChange(false); }} icon={<Minimize size={14} />} text="Minify" />
               <CommandItem onSelect={() => { onCopy(); onOpenChange(false); }} icon={<Copy size={14} />} text="Copy Content" />
               <CommandItem onSelect={() => { onGetTypes(); onOpenChange(false); }} icon={<Terminal size={14} />} text="Generate TypeScript Types" />
            </Command.Group>
            
             <Command.Group heading="Data Tools" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
               <CommandItem onSelect={() => { onSortKeys(); onOpenChange(false); }} icon={<ArrowDownAZ size={14} />} text="Sort Keys (A-Z)" />
               <CommandItem onSelect={() => { onSortKeysDesc(); onOpenChange(false); }} icon={<ArrowUpAZ size={14} />} text="Sort Keys (Z-A)" />
               <CommandItem onSelect={() => { onRemoveNulls(); onOpenChange(false); }} icon={<Trash2 size={14} />} text="Remove Null Values" />
               <CommandItem onSelect={() => { onTrimStrings(); onOpenChange(false); }} icon={<Scissors size={14} />} text="Trim Strings" />
            </Command.Group>

             <Command.Group heading="Convert To" className="text-xs font-bold text-slate-400 mb-2 px-2 mt-2 select-none">
               <CommandItem onSelect={() => { onConvert('json'); onOpenChange(false); }} icon={<ArrowRightLeft size={14} />} text="Convert to JSON" />
               <CommandItem onSelect={() => { onConvert('yaml'); onOpenChange(false); }} icon={<ArrowRightLeft size={14} />} text="Convert to YAML" />
               <CommandItem onSelect={() => { onConvert('xml'); onOpenChange(false); }} icon={<ArrowRightLeft size={14} />} text="Convert to XML" />
               <CommandItem onSelect={() => { onConvert('csv'); onOpenChange(false); }} icon={<ArrowRightLeft size={14} />} text="Convert to CSV" />
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  );
};

const CommandItem = ({ onSelect, icon, text, shortcut }: any) => {
  return (
    <Command.Item 
      onSelect={onSelect}
      className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
    >
      {icon}
      <span>{text}</span>
      {shortcut && <span className="ml-auto text-xs opacity-50 font-mono">{shortcut}</span>}
    </Command.Item>
  )
}

export default CommandPalette;