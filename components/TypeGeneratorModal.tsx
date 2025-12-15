
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';
import { JsonValue } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TypeGeneratorModalProps {
  data: JsonValue;
  fileName: string;
  onClose: () => void;
}

// Internal helper to generate TypeScript definitions
const generateTypeDefinitions = (data: any, rootName: string = 'RootObject'): string => {
  const interfaces = new Map<string, string>();
  
  // Helper to check if value is a valid object
  const isObj = (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val);

  const getTypeName = (val: any, key: string): string => {
    if (val === null) return 'null';
    const type = typeof val;
    
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (type === 'undefined') return 'any';

    if (Array.isArray(val)) {
       if (val.length === 0) return 'any[]';
       
       // Process all items in array to find common type
       const types = Array.from(new Set(val.map(item => getTypeName(item, key))));
       
       if (types.length === 1) return `${types[0]}[]`;
       return `(${types.join(' | ')})[]`;
    }

    if (isObj(val)) {
       return createInterface(key, val);
    }

    return 'any';
  };

  const createInterface = (key: string, obj: any): string => {
     // 1. Determine Interface Name
     let name = key.charAt(0).toUpperCase() + key.slice(1);
     
     // Singularize simple plural names (e.g. "sources" -> "Source")
     if (name.endsWith('s') && !name.endsWith('ss') && name.length > 3) {
        name = name.slice(0, -1);
     }
     
     // Remove invalid chars
     name = name.replace(/[^a-zA-Z0-9_$]/g, '');
     if (!name || /^\d/.test(name)) name = 'Object';

     // 2. Generate Properties Body
     const props: string[] = [];
     for (const [propKey, propValue] of Object.entries(obj)) {
        const type = getTypeName(propValue, propKey);
        
        // Quote key if it contains special chars
        const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propKey) ? propKey : `"${propKey}"`;
        
        props.push(`  ${validKey}: ${type};`);
     }
     
     const body = `{\n${props.join('\n')}\n}`;

     // 3. Deduplication
     for (const [existingName, existingBody] of interfaces.entries()) {
         if (existingBody === body) {
             return existingName;
         }
     }

     // 4. Name Collision Handling
     let finalName = name;
     let counter = 2;
     while (interfaces.has(finalName)) {
        finalName = `${name}${counter++}`;
     }
     
     interfaces.set(finalName, body);
     return finalName;
  };

  // --- Execution Flow ---
  
  if (Array.isArray(data)) {
      // If root is array
      const type = getTypeName(data, rootName);
      const definitions = Array.from(interfaces.entries())
        .map(([name, body]) => `export interface ${name} ${body}`)
        .join('\n\n');
      
      return `${definitions}\n\nexport type ${rootName} = ${type};`.trim();

  } else if (isObj(data)) {
      // If root is object
      createInterface(rootName, data);
      
      return Array.from(interfaces.entries())
        .map(([name, body]) => `export interface ${name} ${body}`)
        .join('\n\n');
        
  } else {
      // Primitive root
      return `export type ${rootName} = ${typeof data};`;
  }
};

const TypeGeneratorModal: React.FC<TypeGeneratorModalProps> = ({ data, fileName, onClose }) => {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!data) {
        setCode('');
        return;
      }

      // Ensure data is parsed if passed as string
      const content = typeof data === 'string' ? JSON.parse(data) : data;
      
      const result = generateTypeDefinitions(content, 'RootObject');
      setCode(result);
      setError(null);
    } catch (e: any) {
      console.error("Type Generation Error:", e);
      setError("Could not generate types. Ensure the data is valid JSON.");
      setCode(`// Error: ${e.message}`);
    }
  }, [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header - Fixed Height */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Code size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                TypeScript Interfaces <span className="text-indigo-500 dark:text-indigo-400 mx-1">-</span> <span className="font-mono text-base">{fileName}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generated from your current JSON data</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Flex Grow & Scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#1e1e1e] relative">
          {error ? (
            <div className="p-8 text-red-400 font-mono text-sm">{error}</div>
          ) : (
            <SyntaxHighlighter 
              language="typescript" 
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                fontSize: '14px',
                lineHeight: '1.5',
                background: 'transparent',
                minHeight: '100%'
              }}
              showLineNumbers={true}
              wrapLines={true}
            >
              {code}
            </SyntaxHighlighter>
          )}
        </div>

        {/* Footer - Fixed Height */}
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 z-10">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TypeGeneratorModal;
