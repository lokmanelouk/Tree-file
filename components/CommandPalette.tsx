
import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { 
  FilePlus, 
  FolderOpen, 
  History, 
  GitCompare, 
  Sun, 
  Moon, 
  Home,
  AlignLeft, 
  Minimize, 
  Copy, 
  Terminal, 
  Trash2, 
  ArrowDownAZ, 
  ArrowUpAZ, 
  Scissors, 
  FileJson, 
  Database, 
  FileCode, 
  FileSpreadsheet 
} from 'lucide-react';
import { FileFormat } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // General
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onGoHome: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';

  // Editor Actions
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  
  // Tools
  onGetTypes: () => void;
  onSortKeys: () => void;
  onSortKeysDesc: () => void;
  onRemoveNulls: () => void;
  onTrimStrings: () => void;

  // Convert
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
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Handle ESC key manually since we replaced Command.Dialog
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  // Close when clicking the backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
     onOpenChange(false);
  };

  // Prevent closing when clicking inside the modal content
  const handleContentClick = (e: React.MouseEvent) => {
     e.stopPropagation();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200 ring-1 ring-slate-900/5 rounded-xl"
        onClick={handleContentClick}
      >
        <Command 
          label="Global Command Menu"
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
          loop
        >
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3">
            <SearchIcon className="w-4 h-4 text-slate-400 mr-2" />
            <Command.Input 
              autoFocus
              className="w-full py-4 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
              placeholder="Type a command or search..."
            />
            <div className="flex items-center gap-1">
               <span 
                 onClick={() => onOpenChange(false)}
                 className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ESC
                </span>
            </div>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar scroll-py-2">
            <Command.Empty className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No results found.
            </Command.Empty>

            <Command.Group heading="General" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 mt-2 select-none">
              <Item onSelect={() => run(onNewFile)} icon={<FilePlus />}>New File</Item>
              <Item onSelect={() => run(onOpenFile)} icon={<FolderOpen />}>Open File...</Item>
              <Item onSelect={() => run(onGoHome)} icon={<Home />}>Go Home</Item>
              <Item onSelect={() => run(onOpenHistory)} icon={<History />}>View History</Item>
              <Item onSelect={() => run(onOpenCompare)} icon={<GitCompare />}>Compare Files</Item>
              <Item onSelect={() => run(onToggleTheme)} icon={theme === 'dark' ? <Sun /> : <Moon />}>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </Item>
            </Command.Group>

            <Command.Group heading="Editor Actions" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4 select-none">
              <Item onSelect={() => run(onFormat)} icon={<AlignLeft />}>Format Document (Pretty Print)</Item>
              <Item onSelect={() => run(onMinify)} icon={<Minimize />}>Minify (Compact)</Item>
              <Item onSelect={() => run(onCopy)} icon={<Copy />}>Copy Full Text</Item>
              <Item onSelect={() => run(onGetTypes)} icon={<Terminal />}>Generate Types (TypeScript)</Item>
            </Command.Group>

            <Command.Group heading="Data Tools" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4 select-none">
               <Item onSelect={() => run(onSortKeys)} icon={<ArrowDownAZ />}>Sort Keys (A-Z)</Item>
               <Item onSelect={() => run(onSortKeysDesc)} icon={<ArrowUpAZ />}>Sort Keys (Z-A)</Item>
               <Item onSelect={() => run(onRemoveNulls)} icon={<Trash2 />}>Remove Null Values</Item>
               <Item onSelect={() => run(onTrimStrings)} icon={<Scissors />}>Trim All Strings</Item>
            </Command.Group>

            <Command.Group heading="Convert To..." className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4 select-none">
              <Item onSelect={() => run(() => onConvert('json'))} icon={<FileJson />}>Convert to JSON</Item>
              <Item onSelect={() => run(() => onConvert('yaml'))} icon={<Database />}>Convert to YAML</Item>
              <Item onSelect={() => run(() => onConvert('xml'))} icon={<FileCode />}>Convert to XML</Item>
              <Item onSelect={() => run(() => onConvert('csv'))} icon={<FileSpreadsheet />}>Convert to CSV</Item>
            </Command.Group>

          </Command.List>
          
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400">
             <span>Use arrow keys to navigate</span>
             <span>Enter to select</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

// Helper components for styling
interface ItemProps {
  children?: React.ReactNode;
  icon: React.ReactNode;
  onSelect: () => void;
}

const Item: React.FC<ItemProps> = ({ children, icon, onSelect }) => {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer aria-selected:bg-indigo-600 aria-selected:text-white transition-colors group data-[selected=true]:bg-indigo-600 data-[selected=true]:text-white"
    >
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
        size: 16, 
        className: "text-slate-400 group-data-[selected=true]:text-indigo-200 transition-colors" 
      }) : icon}
      <span>{children}</span>
    </Command.Item>
  );
};

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export default CommandPalette;
