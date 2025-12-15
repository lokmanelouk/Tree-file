
import React, { useEffect } from 'react';
import { AlertTriangle, X, ArrowRightLeft } from 'lucide-react';
import { FileFormat } from '../types';

interface ConversionConfirmModalProps {
  isOpen: boolean;
  targetFormat: FileFormat | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConversionConfirmModal: React.FC<ConversionConfirmModalProps> = ({ isOpen, targetFormat, onConfirm, onCancel }) => {
  
  // Handle Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !targetFormat) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel} // Close on backdrop click
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <ArrowRightLeft size={20} />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Convert Format</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            You are about to convert this file to <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{targetFormat}</span>.
            <br/><br/>
            <span className="flex items-start gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs border border-amber-200 dark:border-amber-800/50">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Warning: Conversion may lose specific data types (like XML attributes) or comments.</span>
            </span>
            <br/>
            Continue?
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversionConfirmModal;
