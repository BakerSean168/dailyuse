/**
 * Script to remove method signatures and Static interfaces from contracts package
 */
const fs = require('fs');
const path = require('path');

const contractsPath = path.join(__dirname, '..', 'packages', 'contracts', 'src');

function getAllTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllTsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = content;
  let changes = [];
  
  // 1. Remove toClientDTO(), toServerDTO(), toPersistenceDTO() method signatures
  const methodPatterns = [
    /^\s*toClientDTO\(\):[^\n]+\n/gm,
    /^\s*toServerDTO\(\):[^\n]+\n/gm,
    /^\s*toPersistenceDTO\(\):[^\n]+\n/gm,
  ];
  
  for (const pattern of methodPatterns) {
    const matches = modified.match(pattern);
    if (matches) {
      changes.push(`Removed ${matches.length} method signature(s) matching ${pattern.source.substring(0, 30)}...`);
      modified = modified.replace(pattern, '');
    }
  }
  
  // 2. Remove entire Static interface blocks (including IXxxStatic)
  // Match: export interface XxxStatic { ... }
  const staticInterfacePattern = /export interface \w+Static\s*\{[\s\S]*?\n\}\s*\n?/g;
  const staticMatches = modified.match(staticInterfacePattern);
  if (staticMatches) {
    changes.push(`Removed ${staticMatches.length} Static interface(s)`);
    modified = modified.replace(staticInterfacePattern, '');
  }
  
  // 3. Clean up multiple consecutive blank lines (leave max 1)
  const beforeCleanup = modified;
  modified = modified.replace(/\n{3,}/g, '\n\n');
  if (modified !== beforeCleanup) {
    changes.push('Cleaned up extra blank lines');
  }
  
  // 4. Trim trailing whitespace at end of file
  modified = modified.trimEnd() + '\n';
  
  if (modified !== content) {
    fs.writeFileSync(filePath, modified);
    return { path: filePath, changes };
  }
  
  return null;
}

function processIndexFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = content;
  let changes = [];
  
  // Remove lines containing Static exports
  // Pattern: lines with just "  XxxStatic,"
  const staticLinePattern = /^\s*\w+Static,\s*\n/gm;
  let matches = modified.match(staticLinePattern);
  if (matches) {
    changes.push(`Removed ${matches.length} Static export line(s)`);
    modified = modified.replace(staticLinePattern, '');
  }
  
  // Pattern: Remove XxxStatic from multi-item exports like { A, B, XxxStatic }
  // Also need to handle { XxxStatic } alone
  const inlineStaticPattern = /,\s*\w+Static(?=\s*[,}])/g;
  matches = modified.match(inlineStaticPattern);
  if (matches) {
    changes.push(`Removed ${matches.length} inline Static export(s)`);
    modified = modified.replace(inlineStaticPattern, '');
  }
  
  // Pattern: Remove leading XxxStatic, from exports like { XxxStatic, B }
  const leadingStaticPattern = /\{\s*\w+Static,\s*/g;
  matches = modified.match(leadingStaticPattern);
  if (matches) {
    changes.push(`Removed ${matches.length} leading Static export(s)`);
    modified = modified.replace(leadingStaticPattern, '{ ');
  }
  
  // Pattern: Remove entire export lines that only export Static: export type { XxxStatic } from '...'
  const singleStaticExportPattern = /^export type \{\s*\w+Static\s*\} from '[^']+';?\s*\n/gm;
  matches = modified.match(singleStaticExportPattern);
  if (matches) {
    changes.push(`Removed ${matches.length} single Static export statement(s)`);
    modified = modified.replace(singleStaticExportPattern, '');
  }
  
  // Clean up multiple consecutive blank lines
  modified = modified.replace(/\n{3,}/g, '\n\n');
  modified = modified.trimEnd() + '\n';
  
  if (modified !== content) {
    fs.writeFileSync(filePath, modified);
    return { path: filePath, changes };
  }
  
  return null;
}

// Main execution
console.log('Processing contracts package files...\n');

const allFiles = getAllTsFiles(contractsPath);
const nonIndexFiles = allFiles.filter(f => !f.endsWith('index.ts'));
const indexFiles = allFiles.filter(f => f.endsWith('index.ts'));

console.log(`Found ${nonIndexFiles.length} non-index files and ${indexFiles.length} index files\n`);

// Process non-index files first
const modifiedNonIndex = [];
for (const file of nonIndexFiles) {
  const result = processFile(file);
  if (result) {
    modifiedNonIndex.push(result);
  }
}

console.log(`\n=== Modified ${modifiedNonIndex.length} non-index files ===\n`);
for (const { path: filePath, changes } of modifiedNonIndex) {
  const relativePath = path.relative(contractsPath, filePath);
  console.log(`  ${relativePath}:`);
  for (const change of changes) {
    console.log(`    - ${change}`);
  }
}

// Process index files
const modifiedIndex = [];
for (const file of indexFiles) {
  const result = processIndexFile(file);
  if (result) {
    modifiedIndex.push(result);
  }
}

console.log(`\n=== Modified ${modifiedIndex.length} index files ===\n`);
for (const { path: filePath, changes } of modifiedIndex) {
  const relativePath = path.relative(contractsPath, filePath);
  console.log(`  ${relativePath}:`);
  for (const change of changes) {
    console.log(`    - ${change}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total files modified: ${modifiedNonIndex.length + modifiedIndex.length}`);
