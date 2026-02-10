/**
 * Fix imports after deleting old layered packages.
 * 
 * Transform: @dailyuse/<old-layer>/<module> → @dailyuse/<module>/<old-layer>
 * Also handle bare @dailyuse/<old-layer> imports in module-specific contexts.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const ROOT = process.cwd();

// Old layer packages that were deleted
const OLD_LAYERS = [
  'domain-server',
  'domain-client',
  'application-server',
  'application-client',
  'infrastructure-server',
  'infrastructure-client',
];

// Known modules that have been extracted to standalone packages
const MODULES = [
  'goal', 'task', 'repository', 'editor', 'reminder',
  'notification', 'schedule', 'setting', 'account',
  'authentication', 'ai', 'sync', 'dashboard',
];

// Directories to scan
const SCAN_DIRS = [
  'apps/web/src',
  'apps/desktop/src',
  'apps/api/src',
  'packages/goal/src',
  'packages/task/src',
  'packages/repository/src',
  'packages/editor/src',
  'packages/reminder/src',
  'packages/notification/src',
  'packages/schedule/src',
  'packages/setting/src',
  'packages/account/src',
  'packages/authentication/src',
  'packages/ai/src',
  'packages/governance/src',
  'packages/test-utils/src',
];

// File extensions to process
const EXTENSIONS = new Set(['.ts', '.tsx', '.vue', '.js', '.mjs']);

function getAllFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') continue;
          results.push(...getAllFiles(fullPath));
        } else if (EXTENSIONS.has(extname(entry))) {
          results.push(fullPath);
        }
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* skip */ }
  return results;
}

let totalFilesModified = 0;
let totalReplacements = 0;

for (const scanDir of SCAN_DIRS) {
  const fullScanDir = join(ROOT, scanDir);
  const files = getAllFiles(fullScanDir);
  
  for (const filePath of files) {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Pattern 1: @dailyuse/<layer>/<module> → @dailyuse/<module>/<layer>
    // Matches: from '@dailyuse/domain-server/goal' or import('@dailyuse/domain-server/goal')
    for (const layer of OLD_LAYERS) {
      for (const mod of MODULES) {
        const oldImport = `@dailyuse/${layer}/${mod}`;
        const newImport = `@dailyuse/${mod}/${layer}`;
        
        if (content.includes(oldImport)) {
          content = content.replaceAll(oldImport, newImport);
          modified = true;
          totalReplacements++;
        }
      }
    }
    
    // Pattern 2: Bare @dailyuse/<layer> imports (without subpath)
    // These need context-aware replacement based on what's being imported
    for (const layer of OLD_LAYERS) {
      const barePattern = new RegExp(
        `from\\s+['"]@dailyuse/${layer}['"]`,
        'g'
      );
      
      const dynamicPattern = new RegExp(
        `import\\(['"]@dailyuse/${layer}['"]\\)`,
        'g'
      );
      
      if (barePattern.test(content) || dynamicPattern.test(content)) {
        // Determine which module this file belongs to from its path
        const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
        
        // Try to determine the module from the file path
        let targetModule = null;
        
        // Check if we're in a module-specific directory
        const moduleMatch = relPath.match(/modules[/\\](goal|task|repository|editor|reminder|notification|schedule|setting|account|authentication|ai|sync|dashboard)/);
        if (moduleMatch) {
          targetModule = moduleMatch[1];
        }
        
        // Check if we're in a module package
        const pkgMatch = relPath.match(/packages[/\\](goal|task|repository|editor|reminder|notification|schedule|setting|account|authentication|ai)/);
        if (pkgMatch) {
          targetModule = pkgMatch[1];
        }
        
        if (targetModule) {
          const oldBare = `'@dailyuse/${layer}'`;
          const newBare = `'@dailyuse/${targetModule}/${layer}'`;
          const oldBareDouble = `"@dailyuse/${layer}"`;
          const newBareDouble = `"@dailyuse/${targetModule}/${layer}"`;
          
          if (content.includes(oldBare)) {
            content = content.replaceAll(oldBare, newBare);
            modified = true;
            totalReplacements++;
          }
          if (content.includes(oldBareDouble)) {
            content = content.replaceAll(oldBareDouble, newBareDouble);
            modified = true;
            totalReplacements++;
          }
        } else {
          // Can't determine module - log for manual fix
          console.log(`MANUAL FIX NEEDED: ${relPath} - bare @dailyuse/${layer} import`);
        }
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      totalFilesModified++;
      const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
      console.log(`Updated: ${relPath}`);
    }
  }
}

console.log(`\nDone! Modified ${totalFilesModified} files with ${totalReplacements} replacements.`);
