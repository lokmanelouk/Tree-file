
import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface HomeProps {
  onFileLoaded: (data: any, fileName: string, size: number, path?: string, content?: string) => void;
  onError: (msg: string) => void;
}

const Home: React.FC<HomeProps> = ({ onFileLoaded, onError }) => {
  
  const validateAndLoad = (file: File) => {
    const validExtensions = ['.json', '.yaml', '.yml', '.xml', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      onError(`Unsupported file type: ${file.name}. Please use JSON, YAML, XML, or CSV.`);
      return;
    }

    // @ts-ignore
    const filePath = file.path; 

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          onFileLoaded({}, file.name, file.size, filePath, result); 
        }
      } catch (err) {
        onError('Error reading file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFile = (file: File) => {
    validateAndLoad(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden items-center justify-center">
      <div className="w-full max-w-2xl px-8 flex flex-col items-center">
        
        {/* Upload Area */}
        <div 
          className="w-full flex flex-col items-center justify-center min-h-[320px] border border-slate-200 dark:border-slate-700 rounded-2xl transition-all cursor-pointer group bg-white dark:bg-slate-900/50 shadow-lg dark:shadow-none hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-xl"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input 
            type="file" 
            id="fileInput" 
            accept=".json,.yaml,.yml,.xml,.csv" 
            className="hidden" 
            onChange={onInputChange}
          />
          
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-blue-500/10 bg-blue-50 dark:bg-slate-800">
            <Upload size={40} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3 text-slate-800 dark:text-slate-200">Open Data File</h3>
          <p className="max-w-md text-center text-slate-600 dark:text-slate-400 leading-relaxed px-4 text-sm font-medium">
            Drag & drop files here or click to browse.<br/>
            Supports JSON, YAML, XML, and CSV.
          </p>

          <div className="mt-8 flex gap-3">
             <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">JSON</span>
             <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">YAML</span>
             <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">XML</span>
             <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">CSV</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
