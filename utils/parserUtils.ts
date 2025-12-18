
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import Papa from 'papaparse';
import { JsonValue, FileFormat } from '../types';

/**
 * Detects file format based on extension
 */
export const detectFormat = (filename: string): FileFormat => {
  // Ensure filename is a string and trimmed to prevent crashes
  const lower = String(filename || '').trim().toLowerCase();
  
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.xml')) return 'xml';
  if (lower.endsWith('.csv')) return 'csv';
  
  // Default to JSON for .json or unknown extensions
  return 'json';
};

/**
 * Parses raw string content into a JavaScript Object based on format.
 * Throws error if parsing fails.
 */
export const parseContent = (content: string, format: FileFormat): JsonValue => {
  if (!content || !content.trim()) return {};

  switch (format) {
    case 'yaml':
      return yaml.load(content) as JsonValue;
    
    case 'xml':
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true
      });
      // Validation check for XML to ensure structural integrity
      try {
         const result = parser.parse(content);
         return result as JsonValue;
      } catch (e) {
         throw new Error("Invalid XML structure");
      }

    case 'csv':
      const result = Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      // Filter out "UndetectableDelimiter" which is often just a warning defaulting to comma
      const realErrors = result.errors.filter(e => 
        e.code !== 'UndetectableDelimiter' && 
        !e.message.includes("Unable to auto-detect delimiting character")
      );

      if (realErrors.length > 0) {
        throw new Error(`Invalid CSV: ${realErrors[0].message}`);
      }
      return result.data as JsonValue;
    
    case 'json':
    default:
      // Basic safeguard: if it looks like a file path (starts with drive letter or /), throw early
      const trimmed = content.trim();
      if ((/^[a-zA-Z]:\\/.test(trimmed) || trimmed.startsWith('/')) && !trimmed.includes('{') && !trimmed.includes('[')) {
          throw new Error("Invalid JSON: Content appears to be a file path, not data.");
      }
      return JSON.parse(content);
  }
};

/**
 * Converts JavaScript Object back to formatted string based on format (Pretty Print).
 */
export const stringifyContent = (data: JsonValue, format: FileFormat): string => {
  switch (format) {
    case 'yaml':
      return yaml.dump(data, { indent: 2 });
    
    case 'xml':
      const builder = new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      return builder.build(data);

    case 'csv':
      try {
        let csvData = data;
        // Papa.unparse expects array of objects or array of arrays. 
        // If data is a single object, wrap it.
        if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
           csvData = [data];
        }
        return Papa.unparse(csvData as any, { quotes: true });
      } catch (e) {
        return '';
      }
    
    case 'json':
    default:
      return JSON.stringify(data, null, 2);
  }
};

/**
 * Converts JavaScript Object back to minified string (No whitespace).
 */
export const minifyContent = (data: JsonValue, format: FileFormat): string => {
  switch (format) {
    case 'yaml':
      // YAML cannot be truly minified to a single line without losing structure.
      return yaml.dump(data);
    
    case 'xml':
      const builder = new XMLBuilder({
        format: false, // Disable formatting for minification
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      return builder.build(data);
    
    case 'csv':
       // CSV minification just means standard CSV (lines are required)
       return Papa.unparse(data as any, { quotes: false });

    case 'json':
    default:
      return JSON.stringify(data);
  }
};
