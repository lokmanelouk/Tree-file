
import { JsonValue } from '../types';

const isObject = (val: any): val is Record<string, any> =>
  val !== null && typeof val === 'object' && !Array.isArray(val);

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const generateTypeScriptDefinitions = (
  json: JsonValue,
  rootName: string = 'RootObject'
): string => {
  const interfaces: Map<string, string> = new Map();
  
  // Helper to determine type of a value
  const getType = (value: any, keyName: string): string => {
    if (value === null) return 'null';
    
    switch (typeof value) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'undefined': return 'any';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      
      // Get types of all elements in array
      const types = new Set(value.map(v => getType(v, keyName)));
      const typeArray = Array.from(types);
      
      if (typeArray.length === 1) {
        return `${typeArray[0]}[]`;
      }
      return `(${typeArray.join(' | ')})[]`;
    }

    if (isObject(value)) {
      const interfaceName = capitalize(keyName);
      generateInterface(value, interfaceName);
      return interfaceName;
    }

    return 'any';
  };

  const generateInterface = (obj: Record<string, any>, name: string) => {
    // Avoid re-generating if same name exists (basic dedup)
    // In a real app, you might want smarter structural deduction
    let uniqueName = name;
    let counter = 1;
    while (interfaces.has(uniqueName)) {
        // If content is identical, return existing name? 
        // For simplicity, we just check if key exists. 
        // A smarter dedup would check structure equality.
        // For this snippet, we append numbers if name collision.
        uniqueName = `${name}${counter}`;
        counter++;
    }

    const props = Object.entries(obj).map(([key, value]) => {
      const type = getType(value, key);
      // Check if key needs quotes
      const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      return `  ${validKey}: ${type};`;
    });

    const interfaceDef = `export interface ${uniqueName} {\n${props.join('\n')}\n}`;
    interfaces.set(uniqueName, interfaceDef);
  };

  // Entry point
  if (Array.isArray(json)) {
     // If root is array, generate for first item (or merge logic)
     if (json.length > 0) {
        getType(json[0], rootName); 
     } else {
        return `export type ${rootName} = any[];`;
     }
  } else if (isObject(json)) {
     generateInterface(json, rootName);
  } else {
     return `export type ${rootName} = ${typeof json};`;
  }

  return Array.from(interfaces.values()).reverse().join('\n\n');
};
