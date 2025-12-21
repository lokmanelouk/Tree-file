import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  X, 
  Sparkles, 
  Terminal, 
  BrainCircuit, 
  Copy, 
  Check, 
  Codesandbox,
  SearchCode,
  Layers,
  Zap,
  Fingerprint,
  Activity,
  RotateCcw,
  AlertTriangle,
  ZapOff
} from 'lucide-react';
import { ChatMessage, EditorFile } from '../types';

interface AiAssistantProps {
  activeFile: EditorFile | undefined;
  onClose: () => void;
}

const Typewriter: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ 
  text, 
  speed = 4, 
  onComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (indexRef.current < textRef.current.length) {
        setDisplayedText(textRef.current.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (onComplete) onComplete();
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [speed, onComplete]);

  return <span>{displayedText}</span>;
};

const AiAssistant: React.FC<AiAssistantProps> = ({ activeFile, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    try {
      // Robust URL creation with manual fallback to handle 'Invalid URL' errors
      let workerUrl;
      try {
        const base = (typeof import.meta !== 'undefined' && import.meta.url) 
          ? import.meta.url 
          : window.location.origin + window.location.pathname;
        workerUrl = new URL('../utils/aiWorker.ts', base);
      } catch (e) {
        // Fallback to absolute relative path if origin construction is needed
        workerUrl = new URL('./utils/aiWorker.ts', window.location.origin + '/');
      }
      
      workerRef.current = new Worker(workerUrl, { type: 'module' });

      workerRef.current.onmessage = (e) => {
        const { type, text, message } = e.data;

        if (type === 'chunk') {
          setIsThinking(false);
          setIsTyping(true);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'model' && !last.isError) {
              const next = [...prev];
              next[next.length - 1] = { ...last, text: (last.text || '') + text };
              return next;
            } else {
              return [...prev, { role: 'model', text, timestamp: Date.now() }];
            }
          });
        } else if (type === 'complete') {
          setIsTyping(false);
          setIsThinking(false);
        } else if (type === 'error') {
          setIsThinking(false);
          setIsTyping(false);
          const cleanMsg = cleanErrorMessage(message);
          setMessages(prev => [...prev, {
            role: 'model',
            isError: true,
            text: cleanMsg,
            timestamp: Date.now()
          }]);
        }
      };
    } catch (err) {
      console.error("AI Worker creation failed:", err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isClearing) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, isThinking, isClearing]);

  const intelligenceNodes = [
    { label: 'Audit', icon: <SearchCode size={12} />, prompt: 'Perform a strict structural audit. Detect inconsistencies, naming violations, and data type anomalies.' },
    { label: 'Architect', icon: <Layers size={12} />, prompt: 'Visualize the underlying data model. Map out key entities and relational cardinality.' },
    { label: 'Optimize', icon: <Zap size={12} />, prompt: 'Suggest a strategy to optimize this data structure for minimal storage and max query speed.' },
    { label: 'TS Types', icon: <Terminal size={12} />, prompt: 'Generate precise TypeScript definitions for this structure, including JSDoc for complex fields.' }
  ];

  const cleanErrorMessage = (rawError: string) => {
    const lower = rawError.toLowerCase();
    if (lower.includes("quota")) {
      return "⚠️ Neural Link Overload: Daily Rate Limit Exceeded. Please try again later.";
    }
    if (lower.includes("model")) {
      return "⚠️ Model Unavailable: Switching neural pathways...";
    }
    return rawError.replace(/[{}]/g, '').trim();
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopyingId(index);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const executeClear = () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    setTimeout(() => {
      setMessages([]);
      setIsClearing(false);
    }, 400);
  };

  // ... (keep your existing useEffect / imports) ...

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isTyping || isThinking || !activeFile || !workerRef.current) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    const dataSample = activeFile.text.length > 60000 
      ? activeFile.text.substring(0, 60000) + "\n... [DATA_BUFFER_MAXED]"
      : activeFile.text;

    // 1. Get the API Key correctly from Vite
    const apiKey = import.meta.env.VITE_API_KEY;

    workerRef.current.postMessage({
      apiKey: apiKey, // Pass the key here!
      
      // 2. Use the STABLE, FREE model
      model: 'gemini-2.5-flash', 
      
      contents: [
        {
          role: 'user',
          parts: [{
            text: `[SYSTEM_DIRECTIVE]: Tree Assistant | Senior Data Architect.
            [FILE]: ${activeFile.name} | [FORMAT]: ${activeFile.format.toUpperCase()}
            [RAW_DATA_BUFFER]:
            ${dataSample}
            
            [TASK]: High-reasoning technical analysis. Be dense, professional, and Markdown-focused.
            [REQUEST]: ${textToSend}`
          }]
        }
      ],
      // 3. REMOVED thinkingConfig (It causes errors on Flash models)
      config: {} 
    });
  };

  return (
    <div className="w-full max-w-full sm:w-[420px] md:w-[460px] flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden h-full z-50 relative">
      
      {showClearConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-[320px] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 mb-4 ring-1 ring-rose-500/20">
                 <ZapOff size={32} className="animate-pulse" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-100 mb-2">Context Purge</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase leading-relaxed mb-6 opacity-70 px-4">
                Execute link severing? This will flush the neural reasoning buffer and erase history.
              </p>
              <div className="flex flex-col w-full gap-2">
                 <button 
                   onClick={executeClear}
                   className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                 >
                   Execute Refresh
                 </button>
                 <button 
                   onClick={() => setShowClearConfirm(false)}
                   className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                 >
                   Abort
                 </button>
              </div>
           </div>
        </div>
      )}

      <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-inner">
              <Codesandbox size={20} className="text-emerald-600 dark:text-emerald-400 transition-transform duration-1000 ease-in-out group-hover:rotate-[360deg]" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[12px] text-slate-900 dark:text-white uppercase tracking-wider">Tree Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Logic Engine Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)} 
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 group relative" 
              title="Start New Session"
            >
              <RotateCcw size={16} className="group-active:rotate-[180deg] transition-transform duration-300" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div 
        ref={scrollRef} 
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar-refined bg-slate-50 dark:bg-slate-950 transition-all duration-400 ${isClearing ? 'opacity-0 translate-y-8 blur-md' : 'opacity-100 translate-y-0'}`}
      >
        <section className="space-y-2">
           <div className="flex items-center gap-2 mb-3">
              <span className="text-[8px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">Reasoning Modules</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
           </div>
           <div className="grid grid-cols-2 gap-2">
            {intelligenceNodes.map((node, i) => (
              <button
                key={i}
                onClick={() => handleSend(node.prompt)}
                disabled={isTyping || isThinking || isClearing}
                className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors">
                  {node.icon}
                </div>
                <span className="text-[9px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-tight">{node.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between group shadow-sm hover:border-emerald-500/20 transition-all">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shadow-inner">
                   <Activity size={16} className="animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                   <h4 className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Sync Logic</h4>
                   <p className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase opacity-80 truncate max-w-[120px]">{activeFile?.name}</p>
                </div>
             </div>
             <button 
               onClick={() => handleSend("Analyze this file for deep patterns, hidden anomalies, and structural optimization paths.")}
               disabled={isTyping || isThinking || isClearing}
               className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-lg shadow-emerald-500/10"
             >
                Analyze
             </button>
          </div>
        </section>

        <div className="space-y-5 pb-4">
          {messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
               <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
                  <Sparkles className="text-emerald-600 dark:text-emerald-500" size={24} />
               </div>
               <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] mb-2">Neural Interface Ready</h4>
               <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase max-w-[200px] leading-relaxed opacity-80">
                 System initialized for <span className="text-emerald-600 dark:text-emerald-500">{activeFile?.name}</span>. Reasoning engine active.
               </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex items-center gap-1.5 mb-1 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-4 h-4 rounded flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600 dark:bg-indigo-500' : msg.isError ? 'bg-rose-500' : 'bg-emerald-600'} shadow-sm`}>
                    {msg.role === 'user' ? <Fingerprint size={10} className="text-white" /> : <Codesandbox size={10} className="text-white" />}
                 </div>
                 <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${msg.isError ? 'text-rose-600 dark:text-rose-500' : 'text-slate-600 dark:text-slate-500'}`}>
                    {msg.role === 'user' ? 'Operator' : msg.isError ? 'System Alert' : 'TREE ASSISTANT'}
                 </span>
              </div>

              <div className={`group relative max-w-[92%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm border transition-all ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent rounded-tr-none' 
                  : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/50 text-rose-900 dark:text-rose-100 rounded-tl-none'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
              }`}>
                <div className="flex items-start gap-3">
                  {msg.isError && <AlertTriangle size={14} className="mt-1 shrink-0 text-rose-600 dark:text-rose-500" />}
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans font-medium selection:bg-emerald-500/20 text-inherit">
                    {msg.role === 'model' && !msg.isError && i === messages.length - 1 && isTyping ? (
                      <Typewriter text={msg.text} />
                    ) : (
                      msg.text
                    )}
                    {msg.role === 'model' && !msg.isError && isTyping && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse ml-1 align-middle"></span>
                    )}
                  </div>
                </div>
                
                {msg.role === 'model' && msg.text && !isTyping && (
                  <button 
                    onClick={() => handleCopy(msg.text, i)}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 shadow-xl rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                  >
                    {copyingId === i ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex flex-col items-start space-y-2 animate-in fade-in duration-300">
               <div className="flex items-center gap-1.5 mb-1 px-1">
                 <div className="w-4 h-4 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/10">
                    <Loader2 size={10} className="text-emerald-600 dark:text-emerald-500 animate-spin" />
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Deep Reasoning Active</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/10 rounded-2xl p-4 flex flex-col gap-3 min-w-[240px] shadow-lg shadow-emerald-500/5 rounded-tl-none">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/40 blur-lg rounded-full animate-pulse"></div>
                    <BrainCircuit size={22} className="text-emerald-600 dark:text-emerald-500 relative" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-1/3 animate-[loading_1.5s_infinite_ease-in-out]"></div>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Syncing logic core (Off-Thread)...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isClearing}
            placeholder="Search patterns or request architecting..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[13px] placeholder-slate-500 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 font-medium resize-none min-h-[38px] max-h-[100px] custom-scrollbar disabled:opacity-50"
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping || isThinking || isClearing}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition-all active:scale-90 shadow-lg shadow-emerald-600/10 shrink-0 h-9 w-9 flex items-center justify-center"
          >
            {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar-refined::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-refined::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-refined::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .dark .custom-scrollbar-refined::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default AiAssistant;