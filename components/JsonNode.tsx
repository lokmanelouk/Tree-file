
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JsonValue, ViewSettings, Path, OnUpdateValue } from '../types';
import { ChevronRight, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { hasSearchMatch } from '../utils/jsonUtils';

interface JsonNodeProps {
  name: string | number;
  value: JsonValue;
  isLast: boolean;
  prefix: string;
  settings: ViewSettings;
  path: Path;
  onUpdate?: OnUpdateValue;
  searchTerm: string;
  depth: number;
  onContextMenu?: (e: React.MouseEvent, path: Path, value: JsonValue, name: string | number) => void;
  isSelected?: boolean;
}

const HighlightText: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term || !text) return <>{text}</>;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.toString().split(new RegExp(`(${escapedTerm})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <span key={i} className="bg-yellow-300 dark:bg-yellow-400 text-black font-bold px-0.5 rounded-[1px]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const JsonNode: React.FC<JsonNodeProps> = ({
  name,
  value,
  isLast,
  prefix,
  settings,
  path,
  onUpdate,
  searchTerm,
  depth,
  onContextMenu,
  isSelected
}) => {
  const matchesSearch = useMemo(() => hasSearchMatch(value, searchTerm), [value, searchTerm]);
  const nameMatches = String(name).toLowerCase().includes(searchTerm.toLowerCase());

  // Logic: Expand if Search Match OR if depth is within allowed level
  const shouldExpand = searchTerm
    ? (matchesSearch || nameMatches)
    : depth < settings.expandedLevel;

  const [expanded, setExpanded] = useState<boolean>(shouldExpand);

  useEffect(() => {
    setExpanded(shouldExpand);
  }, [settings.expandedLevel, shouldExpand]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let val = '';
    if (value === null) val = 'null';
    else val = String(value);
    setEditValue(val);
    setIsEditing(true);
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onUpdate) return;
    let newValue: JsonValue = editValue;
    if (typeof value === 'number') {
      const num = Number(editValue);
      if (!isNaN(num)) newValue = num;
    } else if (typeof value === 'boolean') {
      newValue = editValue.toLowerCase() === 'true';
    } else if (value === null) {
      if (editValue.toLowerCase() !== 'null') newValue = editValue;
    }
    onUpdate(path, newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.stopPropagation(); // Stop bubbling so only the clicked node triggers menu
      e.preventDefault();
      onContextMenu(e, path, value, name);
    }
  };

  const isPrimitive = value === null || typeof value !== 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isArray ? value.length === 0 : (value && Object.keys(value).length === 0);
  const connector = isLast ? '└── ' : '├── ';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const renderValue = (val: JsonValue) => {
    if (val === null) return <span className="text-pink-600 dark:text-pink-400 italic">null</span>;
    if (typeof val === 'boolean') return <span className="text-purple-600 dark:text-purple-400"><HighlightText text={String(val)} term={searchTerm} /></span>;
    if (typeof val === 'number') return <span className="text-orange-600 dark:text-orange-400"><HighlightText text={String(val)} term={searchTerm} /></span>;
    if (typeof val === 'string') return <span className="text-green-700 dark:text-green-400 whitespace-nowrap truncate inline-block max-w-[300px] align-bottom" title={String(val)}>"{String(val).replace(/\n/g, '\\n')}"</span>;
    return null; // Should not reach here for primitives
  };

  // Type label logic
  const typeLabel = useMemo(() => {
    if (value === null) return null;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return 'Object';
    return null;
  }, [value]);

  return (
    <div className="font-mono text-[13px] leading-6">
      <div
        className={`group flex items-center rounded-sm whitespace-pre transition-colors cursor-pointer 
          ${isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30' // Selected state (Context Menu Open)
            : (matchesSearch && searchTerm)
              ? 'bg-yellow-100 dark:bg-slate-800/30'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800/50'
          }
        `}
        onClick={!isPrimitive ? toggleExpand : undefined}
        onContextMenu={handleRightClick}
      >
        <span className="text-slate-500 dark:text-slate-500 font-normal select-none">{prefix}{connector}</span>
        {!isPrimitive && !isEmpty ? (
          <span className="text-slate-500 cursor-pointer -ml-1 mr-1 hover:text-slate-800 dark:hover:text-slate-300">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-4"></span>
        )}
        <span className="mr-2">
          <span className="text-blue-700 dark:text-blue-300 font-semibold">
            <HighlightText text={String(name)} term={searchTerm} />
          </span>
          <span className="text-slate-400 dark:text-slate-500">:</span>
        </span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 h-6 min-w-[100px] shadow-sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={handleSave} className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"><Check size={14} /></button>
            <button onClick={() => setIsEditing(false)} className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"><X size={14} /></button>
          </div>
        ) : (
          <span className="text-slate-700 dark:text-slate-300">
            {isPrimitive ? (
              renderValue(value)
            ) : (
              // For Objects/Arrays: Display type label (Object/Array(N)) always, in gray italic
              <span className="text-slate-400 dark:text-slate-500 italic text-xs select-none">
                {typeLabel}
              </span>
            )}
          </span>
        )}
        {!isEditing && isPrimitive && onUpdate && !searchTerm && (
          <button
            onClick={handleEditClick}
            className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-opacity"
            title="Edit value"
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>
      {expanded && !isPrimitive && !isEmpty && (
        <div>
          {isArray ? (
            (value as JsonValue[]).map((item, idx, arr) => (
              <JsonNode
                key={idx}
                name={idx}
                value={item}
                isLast={idx === arr.length - 1}
                prefix={childPrefix}
                settings={settings}
                path={[...path, idx]}
                onUpdate={onUpdate}
                searchTerm={searchTerm}
                depth={depth + 1}
                onContextMenu={onContextMenu}
                isSelected={isSelected}
              />
            ))
          ) : (
            Object.entries(value as object).map(([k, v], idx, arr) => (
              <JsonNode
                key={k}
                name={k}
                value={v}
                isLast={idx === arr.length - 1}
                prefix={childPrefix}
                settings={settings}
                path={[...path, k]}
                onUpdate={onUpdate}
                searchTerm={searchTerm}
                depth={depth + 1}
                onContextMenu={onContextMenu}
                isSelected={isSelected}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(JsonNode);
