import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { JsonValue, FileFormat } from '../types';

/**
 * Detects file format based on extension
 */
export const detectFormat = (filename: string): FileFormat => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.xml')) return 'xml';
  return 'json';
};

/**
 * Parses raw string content into a JavaScript Object based on format.
 * Throws error if parsing fails.
 */
export const parseContent = (content: string, format: FileFormat): JsonValue => {
  if (!content.trim()) return {};

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
    
    case 'json':
    default:
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
      // YAML cannot be truly minified to a single line without losing structure or becoming JSON flow-style.
      // We return the standard dump, effectively disabling "minify" for YAML.
      return yaml.dump(data);
    
    case 'xml':
      const builder = new XMLBuilder({
        format: false, // Disable formatting for minification
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      return builder.build(data);
    
    case 'json':
    default:
      return JSON.stringify(data);
  }
};