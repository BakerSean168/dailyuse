#!/usr/bin/env node
/**
 * Script to fix import paths from PascalCase to kebab-case in index.ts files
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
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
 * Find all index.ts files recursively
 */
function findIndexFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findIndexFiles(fullPath));
    } else if (entry === 'index.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if a file path is PascalCase and needs to be converted
 */
function isPascalCasePath(path) {
  const fileName = basename(path, '.ts');
  // Check if first char is uppercase
  return /^[A-Z]/.test(fileName);
}

/**
 * Process a single index file to fix import paths
 */
function processIndexFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const dir = dirname(filePath);
  const lines = content.split('\n');
  const newLines = [];
  let modified = false;
  let fixedCount = 0;
  
  for (const line of lines) {
    // Match import/export from statements
    const importMatch = line.match(/(from\s+['"])(\.[^'"]+)(['"])/);
    
    if (importMatch) {
      const prefix = importMatch[1];
      const importPath = importMatch[2];
      const suffix = importMatch[3];
      
      // Get the file name part from the path
      const pathParts = importPath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      if (isPascalCasePath(lastPart)) {
        // Convert to kebab-case
        const kebabName = toKebabCase(lastPart);
        pathParts[pathParts.length - 1] = kebabName;
        const newPath = pathParts.join('/');
        
        // Check if the kebab-case file exists
        const fullNewPath = join(dir, newPath + '.ts');
        if (existsSync(fullNewPath)) {
          const newLine = line.replace(importPath, newPath);
          newLines.push(newLine);
          modified = true;
          fixedCount++;
          continue;
        } else {
          // Maybe it's an index.ts in a folder
          const folderPath = join(dir, newPath, 'index.ts');
          if (existsSync(folderPath)) {
            const newLine = line.replace(importPath, newPath);
            newLines.push(newLine);
            modified = true;
            fixedCount++;
            continue;
          }
        }
      }
    }
    
    newLines.push(line);
  }
  
  if (modified) {
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  }
  
  return { modified, fixedCount };
}

/**
 * Main execution
 */
function main() {
  console.log('Fixing import paths in index.ts files...\n');
  
  const indexFiles = findIndexFiles(CONTRACTS_SRC);
  let totalModified = 0;
  let totalFixed = 0;
  
  for (const filePath of indexFiles) {
    const result = processIndexFile(filePath);
    if (result.modified) {
      totalModified++;
      totalFixed += result.fixedCount;
      const relativePath = filePath.replace(CONTRACTS_SRC + '/', '').replace(/\\/g, '/');
      console.log(`Fixed ${result.fixedCount} imports in: ${relativePath}`);
    }
  }
  
  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Files modified: ${totalModified}`);
  console.log(`  Import paths fixed: ${totalFixed}`);
  console.log('========================================\n');
}

main();
