
import { JsonValue, JsonObject, JsonArray, SortOrder, Path } from '../types';

export interface JsonStats {
  totalNodes: number;
  maxDepth: number;
  objects: number;
  arrays: number;
  primitives: number;
}

/**
 * Checks if a value contains the search query recursively.
 */
export const hasSearchMatch = (data: JsonValue, query: string): boolean => {
  if (!query) return false;
  if (data === undefined) return false;
  
  const lowerQuery = query.toLowerCase();

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return String(data).toLowerCase().includes(lowerQuery);
  }
  
  if (data === null) {
    return 'null'.includes(lowerQuery);
  }

  if (Array.isArray(data)) {
    return data.some(item => hasSearchMatch(item, query));
  }

  if (typeof data === 'object') {
    return Object.entries(data).some(([key, value]) => {
      return key.toLowerCase().includes(lowerQuery) || hasSearchMatch(value, query);
    });
  }

  return false;
};

/**
 * Sorts keys of a JSON object based on the specified order.
 */
export const sortJson = (data: JsonValue, order: SortOrder): JsonValue => {
  if (order === 'original') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sortJson(item, order));
  }

  if (data !== null && typeof data === 'object') {
    const keys = Object.keys(data);
    
    if (order === 'asc') keys.sort();
    if (order === 'desc') keys.sort().reverse();

    const sortedObj: JsonObject = {};
    keys.forEach(key => {
      sortedObj[key] = sortJson((data as JsonObject)[key], order);
    });
    return sortedObj;
  }

  return data;
};

/**
 * Updates a value deep inside the JSON structure using a path array.
 */
export const updateValueAtPath = (data: JsonValue, path: Path, newValue: JsonValue): JsonValue => {
  if (path.length === 0) return newValue;
  
  const [head, ...tail] = path;
  
  if (Array.isArray(data)) {
    const index = typeof head === 'string' ? parseInt(head, 10) : head;
    if (isNaN(index) || index < 0 || index >= data.length) return data;

    const newData = [...data];
    newData[index] = updateValueAtPath(data[index], tail, newValue);
    return newData;
  }
  
  if (data && typeof data === 'object') {
    const key = head as string;
    return {
      ...data,
      [key]: updateValueAtPath((data as JsonObject)[key], tail, newValue)
    };
  }
  
  return data;
};

export const downloadJson = (data: JsonValue, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const countKeys = (data: JsonValue): number => {
  if (Array.isArray(data)) return data.length;
  if (data !== null && typeof data === 'object') return Object.keys(data).length;
  return 1;
};

export const safeStringify = (data: JsonValue): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return '';
  }
};

export const getJsonStats = (data: JsonValue, currentDepth = 0): JsonStats => {
  let stats: JsonStats = {
    totalNodes: 1,
    maxDepth: currentDepth,
    objects: 0,
    arrays: 0,
    primitives: 0
  };

  if (Array.isArray(data)) {
    stats.arrays = 1;
    data.forEach(item => {
      const child = getJsonStats(item, currentDepth + 1);
      stats.totalNodes += child.totalNodes;
      stats.maxDepth = Math.max(stats.maxDepth, child.maxDepth);
      stats.objects += child.objects;
      stats.arrays += child.arrays;
      stats.primitives += child.primitives;
    });
  } else if (data !== null && typeof data === 'object') {
    stats.objects = 1;
    Object.values(data).forEach(item => {
      const child = getJsonStats(item, currentDepth + 1);
      stats.totalNodes += child.totalNodes;
      stats.maxDepth = Math.max(stats.maxDepth, child.maxDepth);
      stats.objects += child.objects;
      stats.arrays += child.arrays;
      stats.primitives += child.primitives;
    });
  } else {
    stats.primitives = 1;
  }
  
  return stats;
};
