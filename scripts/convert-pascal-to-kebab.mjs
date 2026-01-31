#!/usr/bin/env node
/**
 * Script to:
 * 1. Find all PascalCase .ts files
 * 2. Copy content to kebab-case files
 * 3. Update internal imports to kebab-case
 * 4. Remove method signatures from interfaces
 * 5. Delete PascalCase files
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';

const CONTRACTS_SRC = 'd:/home/projects/dailyuse/packages/contracts/src';

/**
 * Convert PascalCase to kebab-case
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Find all PascalCase .ts files recursively
 */
function findPascalCaseFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findPascalCaseFiles(fullPath));
    } else if (entry.endsWith('.ts') && /^[A-Z]/.test(entry)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Convert imports from PascalCase to kebab-case in file content
 */
function convertImports(content) {
  // Match import/export from statements with PascalCase paths
  return content.replace(
    /(from\s+['"]\.\/[^'"]*\/)([A-Z][^'"]*?)(['"])/g,
    (match, prefix, fileName, suffix) => {
      const kebabName = toKebabCase(fileName);
      return `${prefix}${kebabName}${suffix}`;
    }
  );
}

/**
 * Check if line is a method signature in an interface
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
  const methodPattern = /^\s*(?:readonly\s+)?(\w+)\s*\([^)]*\)\s*:\s*.+;?\s*$/;
  
  if (methodPattern.test(line)) {
    // Make sure it's not a property with arrow function type
    const arrowFunctionProp = /^\s*(?:readonly\s+)?(\w+)\s*:\s*\([^)]*\)\s*=>/;
    if (arrowFunctionProp.test(line)) {
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Remove method signatures from interface content
 */
function removeMethodSignatures(content) {
  const lines = content.split('\n');
  const newLines = [];
  let inInterface = false;
  let removedCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track interface blocks
    if (/^\s*export\s+interface\s+\w+/.test(line)) {
      inInterface = true;
    }
    
    // Check for method signatures inside interfaces
    if (inInterface && isMethodSignature(line)) {
      removedCount++;
      continue; // Skip method signatures
    }
    
    // Track end of interface
    if (inInterface && line.trim() === '}') {
      inInterface = false;
    }
    
    newLines.push(line);
  }
  
  return { content: newLines.join('\n'), removedCount };
}

/**
 * Main execution
 */
function main() {
  console.log('Processing PascalCase to kebab-case conversion...\n');
  
  const pascalFiles = findPascalCaseFiles(join(CONTRACTS_SRC, 'modules'));
  let convertedCount = 0;
  let totalMethodsRemoved = 0;
  
  for (const pascalPath of pascalFiles) {
    const dir = dirname(pascalPath);
    const fileName = basename(pascalPath, '.ts');
    const kebabName = toKebabCase(fileName);
    const kebabPath = join(dir, kebabName + '.ts');
    
    // Read PascalCase content
    let content = readFileSync(pascalPath, 'utf-8');
    
    // Convert internal imports
    content = convertImports(content);
    
    // Remove method signatures
    const result = removeMethodSignatures(content);
    content = result.content;
    totalMethodsRemoved += result.removedCount;
    
    // Write to kebab-case file
    writeFileSync(kebabPath, content, 'utf-8');
    
    // Delete PascalCase file
    unlinkSync(pascalPath);
    
    const relativePath = pascalPath.replace(CONTRACTS_SRC + '/', '').replace(/\\/g, '/');
    console.log(`Converted: ${relativePath} -> ${kebabName}.ts (removed ${result.removedCount} methods)`);
    convertedCount++;
  }
  
  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Files converted: ${convertedCount}`);
  console.log(`  Methods removed: ${totalMethodsRemoved}`);
  console.log('========================================\n');
}

main();
