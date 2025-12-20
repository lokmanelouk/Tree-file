
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonArray = JsonValue[];

export type FileFormat = 'json' | 'yaml' | 'xml' | 'csv';

export interface FileMetaData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  itemCount: number;
}

export interface FileHistory {
  snapshots: string[];
  currentIndex: number;
}

export interface EditorFile {
  id: string;
  name: string;
  path?: string; // Native file path on disk
  format: FileFormat; // json, yaml, or xml
  json: JsonValue;
  text: string;
  isDirty: boolean;
  meta: FileMetaData;
  error?: string | null;
  history: FileHistory;
  formatStyle?: 'pretty' | 'compact'; // Tracks if the file is currently formatted or minified
}

export type SortOrder = 'original' | 'asc' | 'desc';

export interface ViewSettings {
  expandedLevel: number;
  showQuotes: boolean;
  showCommas: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}

export type Path = (string | number)[];

export type OnUpdateValue = (path: Path, newValue: JsonValue) => void;

export interface HistoryItem {
  name: string;
  path: string;
  format: FileFormat;
  lastOpened: string;
  size?: number;
}

// FIX: Added optional isError property to support error message display in the AI Assistant
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

// Electron API Definition
declare global {
  interface Window {
    electron?: {
      openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; content?: string; name?: string }>;
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      saveFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      saveFileAs: (defaultName: string, content: string, format: FileFormat) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
      minimizeWindow: () => void;
      quitApp: () => void;
      onAppClosing: (callback: () => void) => void;
      
      // History
      getHistory: () => Promise<HistoryItem[]>;
      addToHistory: (item: { name: string; path: string; format: string }) => Promise<void>;
      removeHistoryItems: (paths: string[]) => Promise<HistoryItem[]>;
      clearHistory: () => Promise<void>;

      // Favorites
      getFavorites: () => Promise<HistoryItem[]>;
      toggleFavorite: (item: { name: string; path: string; format: string }) => Promise<HistoryItem[]>;
      platform: string;
    };
  }
}
