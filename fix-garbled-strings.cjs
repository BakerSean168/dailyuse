/**
 * Fix garbled UTF-8 strings in desktop source files.
 * 
 * Pattern: The last Chinese character in a string/text was replaced by U+FFFD,
 * and the closing delimiter (', ", <) was replaced by ? (0x3F).
 * 
 * This script detects the context and restores the closing delimiter.
 */
const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, ext));
    } else if (ext.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('\uFFFD')) return false;

  let fixed = content;
  let changes = 0;

  // Strategy: replace \uFFFD? based on what the closing delimiter should be
  // Scan backwards from each \uFFFD to find what kind of string/element we're in
  
  const fffdRegex = /\uFFFD\?/g;
  let match;
  const replacements = [];
  
  while ((match = fffdRegex.exec(content)) !== null) {
    const pos = match.index;
    // Scan backwards to find the opening delimiter
    let delimiter = '';
    let singleQuotes = 0;
    let doubleQuotes = 0;
    let inJSXText = false;
    
    for (let i = pos - 1; i >= Math.max(0, pos - 200); i--) {
      const ch = content[i];
      if (ch === "'" && content[i-1] !== '\\') {
        delimiter = "'";
        break;
      }
      if (ch === '"' && content[i-1] !== '\\') {
        delimiter = '"';
        break;
      }
      if (ch === '`' && content[i-1] !== '\\') {
        delimiter = '`';
        break;
      }
      if (ch === '>') {
        // Check if this is JSX text (after a closing >)
        delimiter = '<';
        break;
      }
      if (ch === '\n' || ch === '{' || ch === '(' || ch === '[') {
        // Probably in JSX text or other context
        break;
      }
    }
    
    if (delimiter) {
      replacements.push({ pos, len: 2, replacement: delimiter });
      changes++;
    }
  }

  // Also handle lone \uFFFD not followed by ? (just remove them)
  // These are in comments and don't break builds, but clean them up
  
  // Apply replacements in reverse order to maintain positions
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    fixed = fixed.slice(0, r.pos) + r.replacement + fixed.slice(r.pos + r.len);
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Fixed ${changes} garbled strings in ${path.relative(process.cwd(), filePath)}`);
  }
  return changes > 0;
}

// Find all affected files
const srcDir = path.join(__dirname, 'apps', 'desktop', 'src');
const files = findFiles(srcDir, ['.ts', '.tsx']);
let totalFixed = 0;
let filesFixed = 0;

for (const file of files) {
  if (fixFile(file)) {
    filesFixed++;
    totalFixed++;
  }
}

// Also scan packages for known affected files
const pkgDirs = ['packages/task/src', 'packages/notification/src', 'packages/goal/src'];
for (const dir of pkgDirs) {
  const fullDir = path.join(__dirname, dir);
  if (fs.existsSync(fullDir)) {
    const pkgFiles = findFiles(fullDir, ['.ts', '.tsx']);
    for (const file of pkgFiles) {
      if (fixFile(file)) {
        filesFixed++;
        totalFixed++;
      }
    }
  }
}

console.log(`\nDone: Fixed ${filesFixed} files`);
