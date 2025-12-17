
import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  fullWidth?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  side = 'top', 
  delay = 400,
  className = '',
  fullWidth = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700',
  };

  // Determine base display class
  const displayClass = fullWidth ? 'block w-full' : 'inline-flex';

  return (
    <div 
      className={`relative ${displayClass} ${className}`} 
      onMouseEnter={show} 
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-[10px] font-medium text-white bg-slate-800 dark:bg-slate-700 rounded shadow-lg whitespace-pre animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${positionClasses[side]}`}>
          {content}
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-[4px] border-transparent ${arrowClasses[side]}`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
