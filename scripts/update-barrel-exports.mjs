#!/usr/bin/env node
/**
 * Script to update old layered package barrel exports to re-export from new packages.
 * This maintains backward compatibility so existing consumers don't break.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = ['goal', 'task', 'repository', 'editor', 'reminder', 'notification', 'schedule', 'setting'];

// Mapping: old package → layer in new packages → what modules had it
const PACKAGES = [
  { pkg: 'domain-shared', layer: 'domain-shared', allModules: MODULES },
  { pkg: 'domain-server', layer: 'domain-server', allModules: MODULES },
  { pkg: 'domain-client', layer: 'domain-client', allModules: MODULES },
  { pkg: 'application-server', layer: 'application-server', allModules: MODULES },
  { pkg: 'application-client', layer: 'application-client', allModules: MODULES.filter(m => m !== 'editor') },
  { pkg: 'infrastructure-server', layer: 'infrastructure-server', allModules: MODULES },
  { pkg: 'infrastructure-client', layer: 'infrastructure-client', allModules: MODULES.filter(m => m !== 'editor') },
];

for (const { pkg, layer, allModules } of PACKAGES) {
  const indexPath = path.join(ROOT, 'packages', pkg, 'src', 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`[SKIP] ${indexPath} - file not found`);
    continue;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  
  for (const mod of allModules) {
    // Replace the old module re-export with a re-export from the new package
    // Old: export * from './{module}'; (or similar patterns)
    // New: export * from '@dailyuse/{module}/{layer}';
    
    // Match various patterns of module exports
    const patterns = [
      // export * from './goal';
      new RegExp(`^\\s*export\\s+\\*\\s+from\\s+['\"]\\.\\/` + mod + `['\"];?\\s*$`, 'gm'),
      // export * from './goal/index';
      new RegExp(`^\\s*export\\s+\\*\\s+from\\s+['\"]\\.\\/` + mod + `/index['\"];?\\s*$`, 'gm'),
    ];
    
    let replaced = false;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, `export * from '@dailyuse/${mod}/${layer}';`);
        replaced = true;
        console.log(`  [OK] ${pkg}/src/index.ts: replaced '${mod}' re-export → @dailyuse/${mod}/${layer}`);
      }
    }
    
    if (!replaced) {
      // Check if the module is referenced via named exports or other patterns
      const namedExportPattern = new RegExp(`from\\s+['\"]\\.\\/` + mod + `(?:/[^'"]*)?['\"]`, 'g');
      if (namedExportPattern.test(content)) {
        // More complex named exports - log for manual review
        console.log(`  [INFO] ${pkg}/src/index.ts: '${mod}' has named exports - updating...`);
        
        // Replace the from path in any import/export referencing this module
        const replacePattern = new RegExp(`(from\\s+['"])\\.\\/` + mod + `(\\/[^'"]*)?(['"])`, 'g');
        content = content.replace(replacePattern, (match, prefix, subpath, suffix) => {
          if (subpath) {
            // Named sub-path like './goal/services' - keep using local for now
            // These will need manual attention
            console.log(`    [WARN] Sub-path import found: ${match} - keeping as-is`);
            return match;
          }
          return `${prefix}@dailyuse/${mod}/${layer}${suffix}`;
        });
      }
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
}

console.log('\n=== Old barrel re-exports updated ===');
