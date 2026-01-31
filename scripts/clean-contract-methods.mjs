#!/usr/bin/env node
/**
 * Script to remove method signatures from interface definitions in contracts package
 * This script:
 * 1. Removes entire "Static" interfaces (e.g., GoalClientStatic)
 * 2. Removes method signatures from interfaces (lines with parentheses)
 * 3. Keeps data properties, type exports, and const exports
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const CONTRACTS_SRC = 'd:/home/projects/dailyuse/packages/contracts/src';

// Files to skip - these contain function definitions, not interface methods
const SKIP_PATTERNS = [
  /\/result\//,           // result module contains functions
  /\/response\//,         // response module contains functions  
  /\/services\.ts$/,      // services contain function signatures on purpose
  /\/constants\.ts$/,     // constants files
  /\/index\.ts$/,         // re-export files may have complex patterns
  /ai-provider-template/, // template with required method signatures
];

/**
 * Find all TypeScript files recursively
 */
function findTsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.startsWith('index')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if line is a method signature in an interface
 * Method signatures have: name(params): returnType; or name(): returnType;
 */
function isMethodSignature(line) {
  const trimmed = line.trim();
  
  // Skip comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return false;
  }
  
  // Skip empty lines and closing braces
  if (!trimmed || trimmed === '}' || trimmed === '{') {
    return false;
  }
  
  // Method pattern: word(anything): something
  // But NOT property with function type like: handler: (x: number) => void
  const methodPattern = /^\s*(?:readonly\s+)?(\w+)\s*\([^)]*\)\s*:\s*.+;?\s*$/;
  
  if (methodPattern.test(line)) {
    // Make sure it's not a property with arrow function type
    // Properties look like: propName: (args) => ReturnType
    const arrowFunctionProp = /^\s*(?:readonly\s+)?(\w+)\s*:\s*\([^)]*\)\s*=>/;
    if (arrowFunctionProp.test(line)) {
      return false; // This is a property with function type, keep it
    }
    return true;
  }
  
  return false;
}

/**
 * Check if we're at a JSDoc comment that precedes a method (which will be removed)
 */
function isJSDocForMethod(lines, startIndex) {
  // Check if we're at a JSDoc start
  const line = lines[startIndex]?.trim();
  if (!line?.startsWith('/**')) return { isJSDoc: false, endIndex: startIndex };
  
  // Find the end of this JSDoc
  let endIndex = startIndex;
  while (endIndex < lines.length) {
    if (lines[endIndex].includes('*/')) {
      break;
    }
    endIndex++;
  }
  
  // Check if the line after JSDoc is a method signature
  let nextLineIndex = endIndex + 1;
  // Skip empty lines
  while (nextLineIndex < lines.length && !lines[nextLineIndex].trim()) {
    nextLineIndex++;
  }
  
  if (nextLineIndex < lines.length && isMethodSignature(lines[nextLineIndex])) {
    return { isJSDoc: true, endIndex: nextLineIndex };
  }
  
  return { isJSDoc: false, endIndex: startIndex };
}

/**
 * Check if we're entering a Static interface block
 */
function isStaticInterfaceStart(line) {
  return /export\s+interface\s+\w+Static\s*\{/.test(line);
}

/**
 * Check if line is interface definition  
 */
function isInterfaceStart(line) {
  return /^\s*export\s+interface\s+\w+/.test(line) && line.includes('{');
}

/**
 * Process a single file to remove method signatures
 */
function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  
  let inStaticInterface = false;
  let inInterface = false;
  let braceDepth = 0;
  let modified = false;
  let removedMethods = [];
  let removedStaticInterfaces = [];
  let skipUntilIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    // Skip lines if we're skipping a JSDoc + method block
    if (i <= skipUntilIndex) {
      continue;
    }
    
    const line = lines[i];
    
    // Check for Static interface start
    if (isStaticInterfaceStart(line)) {
      inStaticInterface = true;
      braceDepth = 1;
      removedStaticInterfaces.push(line.match(/interface\s+(\w+Static)/)?.[1] || 'unknown');
      modified = true;
      continue; // Skip this line
    }
    
    // If in Static interface, skip until we close it
    if (inStaticInterface) {
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }
      if (braceDepth === 0) {
        inStaticInterface = false;
      }
      continue; // Skip all lines in Static interface
    }
    
    // Track regular interface blocks
    if (isInterfaceStart(line) && !inStaticInterface) {
      inInterface = true;
    }
    
    // Inside interface: check for JSDoc that precedes a method
    if (inInterface && line.trim().startsWith('/**')) {
      const jsdocCheck = isJSDocForMethod(lines, i);
      if (jsdocCheck.isJSDoc) {
        // Skip this entire JSDoc + method block
        const methodLine = lines[jsdocCheck.endIndex];
        const methodMatch = methodLine?.match(/^\s*(?:readonly\s+)?(\w+)\s*\(/);
        if (methodMatch) {
          removedMethods.push(methodMatch[1]);
        }
        skipUntilIndex = jsdocCheck.endIndex;
        modified = true;
        continue;
      }
    }
    
    // Check for method signatures inside interfaces (without preceding JSDoc)
    if (inInterface && isMethodSignature(line)) {
      const methodMatch = line.match(/^\s*(?:readonly\s+)?(\w+)\s*\(/);
      if (methodMatch) {
        removedMethods.push(methodMatch[1]);
      }
      modified = true;
      continue; // Skip method signatures
    }
    
    // Track end of interface
    if (inInterface && line.trim() === '}') {
      inInterface = false;
    }
    
    newLines.push(line);
  }
  
  // Clean up empty comment blocks that may be left over
  // (e.g., // ===== Methods ===== followed by nothing)
  const cleanedLines = [];
  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i];
    const trimmed = line.trim();
    
    // Skip section comment headers for methods that are now empty
    if (trimmed.match(/\/\/\s*={3,}.*(?:方法|Methods|业务方法|UI.*方法|操作|格式化).*={3,}/i)) {
      // Check if next non-empty line is closing brace
      let nextContentLine = i + 1;
      while (nextContentLine < newLines.length && !newLines[nextContentLine].trim()) {
        nextContentLine++;
      }
      if (nextContentLine < newLines.length && newLines[nextContentLine].trim() === '}') {
        modified = true;
        continue; // Skip this comment header
      }
    }
    
    cleanedLines.push(line);
  }
  
  return {
    newContent: cleanedLines.join('\n'),
    modified,
    removedMethods,
    removedStaticInterfaces
  };
}

/**
 * Main execution
 */
function main() {
  console.log('Scanning contracts package for method signatures...\n');
  
  const allFiles = findTsFiles(CONTRACTS_SRC);
  let totalModified = 0;
  let totalMethodsRemoved = 0;
  let totalStaticRemoved = 0;
  const modifiedFiles = [];
  
  for (const filePath of allFiles) {
    const relativePath = relative(CONTRACTS_SRC, filePath).replace(/\\/g, '/');
    
    // Check if file should be skipped
    if (SKIP_PATTERNS.some(pattern => pattern.test(relativePath))) {
      continue;
    }
    
    const result = processFile(filePath);
    
    if (result.modified) {
      writeFileSync(filePath, result.newContent, 'utf-8');
      totalModified++;
      totalMethodsRemoved += result.removedMethods.length;
      totalStaticRemoved += result.removedStaticInterfaces.length;
      modifiedFiles.push({
        path: relativePath,
        methods: result.removedMethods,
        statics: result.removedStaticInterfaces
      });
      console.log(`Modified: ${relativePath}`);
      if (result.removedStaticInterfaces.length > 0) {
        console.log(`  - Removed Static interfaces: ${result.removedStaticInterfaces.join(', ')}`);
      }
      if (result.removedMethods.length > 0) {
        console.log(`  - Removed methods: ${result.removedMethods.join(', ')}`);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Files modified: ${totalModified}`);
  console.log(`  Static interfaces removed: ${totalStaticRemoved}`);
  console.log(`  Method signatures removed: ${totalMethodsRemoved}`);
  console.log('========================================\n');
}

main();
