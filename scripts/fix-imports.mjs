#!/usr/bin/env node
/**
 * Script to fix import paths in the newly extracted packages.
 * 
 * Changes needed in copied source files:
 * 1. domain-client files import from '@dailyuse/domain-shared/{module}' → '../domain-shared' (local)
 * 2. application-server files import from '@dailyuse/domain-server/{module}' → references should use @dailyuse/contracts/{module} etc.
 * 3. infrastructure-server files import from '@dailyuse/domain-server/{module}' → '../domain-server'
 * 4. infrastructure-client files import from '@dailyuse/infrastructure-client' → should be local
 * 5. application-client files import from '@dailyuse/infrastructure-client' → should use local or package ref
 * 
 * The key imports to fix:
 * - @dailyuse/domain-shared/{module} → @dailyuse/domain-shared/{module} (KEEP - still valid from original package)
 *   OR change to local '@/domain-shared' 
 * - @dailyuse/domain-server/{module} → '@/domain-server'  (within same new package)
 * - @dailyuse/domain-client/{module} → '@/domain-client' (within same new package)
 * - @dailyuse/application-server/{module} → '@/application-server' (within same new package)   
 * - @dailyuse/application-client/{module} → '@/application-client' (within same new package)
 * - @dailyuse/infrastructure-server/{module} → '@/infrastructure-server' (within same new package)
 * - @dailyuse/infrastructure-client/{module} → '@/infrastructure-client' (within same new package)
 * - @dailyuse/infrastructure-client → keep if referring to container/types from infra-client package
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = ['goal', 'task', 'repository', 'editor', 'reminder', 'notification', 'schedule', 'setting'];

function getAllTsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

let totalChanges = 0;

for (const mod of MODULES) {
  const pkgSrcDir = path.join(ROOT, 'packages', mod, 'src');
  const files = getAllTsFiles(pkgSrcDir);
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;
    const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');

    // Determine which layer this file is in
    const relToSrc = path.relative(pkgSrcDir, filePath).replace(/\\/g, '/');
    const currentLayer = relToSrc.split('/')[0]; // e.g., 'domain-server', 'application-client'
    
    // Fix cross-layer imports within the same module package
    // These imports referenced the old monolithic layer packages with subpath
    // e.g., from '@dailyuse/domain-server/goal' → from '@/domain-server'
    // e.g., from '@dailyuse/domain-shared/goal' → from '@/domain-shared'
    
    const layerNames = [
      'domain-shared', 'domain-server', 'domain-client',
      'application-server', 'application-client',
      'infrastructure-server', 'infrastructure-client'
    ];
    
    for (const layer of layerNames) {
      // Match imports like: from '@dailyuse/{layer}/{module}'
      // But not from '@dailyuse/{layer}/{module}/something' (deeper paths)
      const importRegex = new RegExp(
        `(from\\s+['"])@dailyuse/${layer}/${mod}(['"])`,
        'g'
      );
      
      if (importRegex.test(content)) {
        // If importing from same layer, use relative path
        if (currentLayer === layer) {
          // Same layer - use relative import within that layer
          // This shouldn't normally happen but just in case
          content = content.replace(importRegex, `$1@/$2`);
        } else {
          // Cross-layer import within the same module package
          // Use @/ alias to reference the other layer
          content = content.replace(importRegex, `$1@/${layer}$2`);
        }
        changed = true;
      }
    }
    
    // Also fix: domain-client files that import from '@dailyuse/domain-shared/goal' 
    // These should now be '@/domain-shared' since domain-shared is collocated
    // But wait - domain-shared/{module} is actually still valid as the domain-shared
    // package still exports those. However, within the new package, we want to use local imports.
    
    // Fix imports that reference the infrastructure-client package directly for containers
    // e.g., from '@dailyuse/infrastructure-client' (no subpath) in application-client
    // These should reference '@/infrastructure-client' if the module has its own infra-client layer
    if (currentLayer === 'application-client') {
      // Replace container imports like: from '@dailyuse/infrastructure-client'
      // Only if the container is for this specific module
      const containerImportRegex = new RegExp(
        `(from\\s+['"])@dailyuse/infrastructure-client(['"])`,
        'g'
      );
      if (containerImportRegex.test(content)) {
        content = content.replace(containerImportRegex, `$1@/infrastructure-client$2`);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalChanges++;
      console.log(`  [FIXED] ${relPath}`);
    }
  }
}

console.log(`\nTotal files modified: ${totalChanges}`);
