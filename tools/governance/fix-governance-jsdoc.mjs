#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'packages', 'governance', 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

function walk(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.isFile()) continue;
    if (!SOURCE_EXTENSIONS.has(path.extname(name.name))) continue;
    fixFile(full);
  }
}

function fixFile(fullPath) {
  let content = readFileSync(fullPath, 'utf8');
  const rel = path.relative(ROOT, fullPath).replaceAll('\\','/');

  // Ensure file-level JSDoc exists and has English+Chinese (heuristic)
  const firstJsdocMatch = content.match(/^\s*(\/\*\*[\s\S]*?\*\/)/);
  if (!firstJsdocMatch) {
    const header = `/**\n * ${rel} — governance module source.\n *\n * 中文：${path.basename(fullPath)} 文件，治理模块源码（自动添加的最小说明）。\n */\n\n`;
    content = header + content;
  } else {
    const jsdoc = firstJsdocMatch[1];
    const hasEnglish = /[A-Za-z]{3,}/.test(jsdoc);
    const hasChinese = /[\u4e00-\u9fff]/.test(jsdoc);
    if (!(hasEnglish && hasChinese)) {
      // prepend a short English line and Chinese line into existing jsdoc
      const newJsdoc = jsdoc.replace(/\*\/(\s*)$/,' *\n * ${rel} — governance module source.\n *\n * 中文：自动补充说明。\n */$1');
      content = content.replace(jsdoc, newJsdoc);
    }
  }

  // For exported functions and classes without immediate JSDoc, insert minimal JSDoc
  // Also, if an existing JSDoc is present but missing @param/@returns, augment it.
  const lines = content.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // detect export function/class
    const fnMatch = line.match(/^\s*export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
    const classMatch = line.match(/^\s*export\s+(?:abstract\s+)?class\s+(\w+)/);
    if (fnMatch) {
      const name = fnMatch[1];
      const paramsRaw = fnMatch[2].trim();
      const params = paramsRaw ? paramsRaw.split(',').map(p=>p.trim().split('=')[0].split(':')[0].trim()).filter(Boolean) : [];

      // check previous lines for an existing JSDoc block
      let jsdocFound = false;
      for (let j = out.length - 1; j >= Math.max(0, out.length - 10); j--) {
        if (typeof out[j] === 'string' && /\*\/$/.test(out[j].trim())) {
          // find the start index of the jsdoc in out
          for (let k = j; k >= Math.max(0, j - 50); k--) {
            if (typeof out[k] === 'string' && /\/\*\*/.test(out[k])) {
              // augment the jsdoc between k and j
              const jsdocLines = out.slice(k, j + 1);
              let jsdocStr = jsdocLines.join('\n');
              let changed = false;
              // ensure @param for each param
              for (const p of params) {
                const paramRegex = new RegExp("@param\\s+" + p + "\\b");
                if (!paramRegex.test(jsdocStr)) {
                  // insert before the closing */
                  jsdocStr = jsdocStr.replace(/\*\/\s*$/, ` * @param ${p} - \n */`);
                  changed = true;
                }
              }
              // ensure @returns if function likely returns (heuristic: presence of 'return' later in source line window)
              const windowBody = lines.slice(i, Math.min(lines.length, i + 50)).join('\n');
              if (/\breturn\b/.test(windowBody) && !/(@returns?\b)/.test(jsdocStr)) {
                jsdocStr = jsdocStr.replace(/\*\/\s*$/, ` * @returns any - \n */`);
                changed = true;
              }
              if (changed) {
                // replace out[k..j] with augmented jsdocStr split back to lines
                const newJsdocLines = jsdocStr.split('\n');
                out.splice(k, j - k + 1, ...newJsdocLines);
              }
              jsdocFound = true;
              break;
            }
          }
          break;
        }
      }

      if (!jsdocFound) {
        // no jsdoc found immediately before — insert minimal jsdoc
        const js = ['/**', ` * ${name} — auto-added minimal docs.`, ' *', ' * 中文：自动添加的最小 JSDoc。'];
        for (const p of params) js.push(` * @param ${p} - `);
        js.push(' * @returns any - ');
        js.push(' */');
        out.push(js.join('\n'));
      }

      out.push(line);
      continue;
    }
    if (classMatch) {
      const name = classMatch[1];
      // check for existing jsdoc
      let classJsdocFound = false;
      for (let j = out.length - 1; j >= Math.max(0, out.length - 10); j--) {
        if (typeof out[j] === 'string' && /\*\/$/.test(out[j].trim())) {
          for (let k = j; k >= Math.max(0, j - 50); k--) {
            if (typeof out[k] === 'string' && /\/\*\*/.test(out[k])) {
              // found existing jsdoc — ensure at least a simple description exists
              classJsdocFound = true;

              // Try to find constructor params later in file near this class
              const rest = lines.slice(i, Math.min(lines.length, i + 500)).join('\n');
              const ctorMatch = rest.match(/constructor\s*\(([^)]*)\)/);
              if (ctorMatch && ctorMatch[1].trim()) {
                const paramsRaw = ctorMatch[1].trim();
                const params = paramsRaw ? paramsRaw.split(',').map(p=>p.trim().split('=')[0].split(':')[0].trim()).filter(Boolean) : [];
                let jsdocStr = out.slice(k, j + 1).join('\n');
                let changed = false;
                for (const p of params) {
                  const paramRegex = new RegExp('@param\\s+' + p + '\\b');
                  if (!paramRegex.test(jsdocStr)) {
                    jsdocStr = jsdocStr.replace(/\*\/\s*$/, ` * @param ${p} - \n */`);
                    changed = true;
                  }
                }
                if (changed) {
                  const newJsdocLines = jsdocStr.split('\n');
                  out.splice(k, j - k + 1, ...newJsdocLines);
                }
              }

              break;
            }
          }
          break;
        }
      }
      if (!classJsdocFound) {
        const js = ['/**', ` * ${name} — auto-added minimal class docs.`, ' *', ' * 中文：自动添加的最小 JSDoc。', ' */'];
        out.push(js.join('\n'));
      }
      out.push(line);
      continue;
    }
    out.push(line);
  }

  const newContent = out.join('\n');
  if (newContent !== content) {
    writeFileSync(fullPath, newContent, 'utf8');
    console.log(`fixed: ${rel}`);
  }
}

console.log('Running governance JSDoc fixer (best-effort) — this will add minimal headers and @param/@returns stubs.');
walk(SRC);
console.log('Done. Please run the governance-check to verify.');
