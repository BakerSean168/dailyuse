import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['packages/app-vue/src', 'apps/web/src'];
const exts = new Set(['.vue', '.ts', '.tsx']);
const keyRe = /(?:[^\w$.]|^)(?:\$t|t|te|tm)\(\s*(['"`])((?:[\w-]+\.)+[\w-]+)\1/g;
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name !== 'node_modules') walk(p);
    } else if (exts.has(extname(p)) && !p.endsWith('.spec.ts') && !p.endsWith('.test.ts')) {
      files.push(p);
    }
  }
}
roots.forEach(walk);
const keys = new Map();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let m;
  while ((m = keyRe.exec(src))) {
    const k = m[2];
    if (!keys.has(k)) keys.set(k, new Set());
    keys.get(k).add(f);
  }
}
const zh = (await import('../../packages/app-vue/src/locales/zh-CN/index.ts')).default;
const en = (await import('../../packages/app-vue/src/locales/en-US/index.ts')).default;
function resolve(obj, key) {
  let cur = obj;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}
const missing = [];
for (const k of [...keys.keys()].sort()) {
  const inZh = resolve(zh, k) !== undefined;
  const inEn = resolve(en, k) !== undefined;
  if (!inZh || !inEn) missing.push({ key: k, zh: inZh, en: inEn, files: [...keys.get(k)] });
}
const { writeFileSync } = await import('node:fs');
writeFileSync(
  'reports/pm-journey/i18n-missing.json',
  JSON.stringify({ totalUsed: keys.size, missingCount: missing.length, missing }, null, 1),
);
const ns = {};
for (const m of missing) {
  const n = m.key.split('.')[0];
  ns[n] = (ns[n] || 0) + 1;
}
console.log('used:', keys.size, 'missing:', missing.length);
console.log(ns);
