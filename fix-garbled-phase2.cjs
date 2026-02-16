/**
 * Fix remaining build-breaking garbled patterns in desktop source files.
 * 
 * Patterns caused by earlier \uFFFD? replacement that incorrectly placed
 * quote characters in the middle of strings, plus other encoding corruption.
 */
const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(fullPath, ext));
    else if (ext.some(e => entry.name.endsWith(e))) results.push(fullPath);
  }
  return results;
}

// For each pattern: [regex, replacement_function]
// These handle the build-breaking syntax patterns
const patterns = [
  // Pattern 1: '处理'..' → '处理中...'  (quotes around loading/processing text with ..)
  {
    regex: /'([\u4e00-\u9fff]+)'(\.\.')/g,
    replace: (m, chinese, dots) => `'${chinese}中...'`
  },
  // Pattern 2: JSX text with <.. → 中...  (e.g., <span>加载<..</span> → <span>加载中...</span>)
  {
    regex: /([\u4e00-\u9fff]+)<(\.\.)/g,
    replace: (m, chinese, dots) => `${chinese}中...`
  },
  // Pattern 3: '加载'..'; → '加载中...';  (in regular strings with semicolons)
  {
    regex: /'([\u4e00-\u9fff]+)'(\.\.';)/g,
    replace: (m, chinese, rest) => `'${chinese}中...';`
  },
  // Pattern 4: Label with <* → 值 * (e.g., >目标<*</Label> → >目标值 *</Label>)
  {
    regex: /([\u4e00-\u9fff]+)<\*<\/Label>/g,
    replace: (m, chinese) => `${chinese}值 *</Label>`
  },
  // Pattern 5: 增加<* → 增加值 *
  {
    regex: /增加<\*/g,
    replace: () => '增加值 *'
  },
  // Pattern 6: 开始日<* → 开始日期 *
  {
    regex: /开始日<\*/g,
    replace: () => '开始日期 *'
  },
  // Pattern 7: 开始时<* → 开始时间 *
  {
    regex: /开始时<\*/g,
    replace: () => '开始时间 *'
  },
  // Pattern 8: JSX text<{expression → text成 {expression (or appropriate char)
  // e.g., 已完<{template → 已完成 {template
  {
    regex: /已完<\{/g,
    replace: () => '已完成 {'
  },
  {
    regex: /创建<\{/g,
    replace: () => '创建于 {'
  },
  // Pattern 9: 使<AI → 使用 AI
  {
    regex: /使<AI/g,
    replace: () => '使用 AI'
  },
  // Pattern 10: 使<DailyUse → 使用 DailyUse
  {
    regex: /使<DailyUse/g,
    replace: () => '使用 DailyUse'
  },
  // Pattern 11: 添<Widget → 添加 Widget
  {
    regex: /添<Widget/g,
    replace: () => '添加 Widget'
  },
  // Pattern 12: 钟<< → 钟吧<  (broken JSX closing)
  {
    regex: /茄钟<</g,
    replace: () => '茄钟吧<'
  },
  // Pattern 13: 短休息时<(分钟) → 短休息时间(分钟)
  {
    regex: /休息时<\(/g,
    replace: () => '休息时间('
  },
  // Pattern 14: '最'(1)' → '最高(1)'
  {
    regex: /'最'\(1\)'/g,
    replace: () => "'最高(1)'"
  },
  // Pattern 15: '最'(5)' → '最低(5)'
  {
    regex: /'最'\(5\)'/g,
    replace: () => "'最低(5)'"
  },
  // Pattern 16: 长休息间<(次数) → 长休息间隔(次数)
  {
    regex: /休息间<\(/g,
    replace: () => '休息间隔('
  },
  // Pattern 17: 所属目< → 所属目标
  {
    regex: /所属目</g,
    replace: () => '所属目标<'
  },
  // Pattern 18: 状< {selectedGroup → 状态: {selectedGroup
  {
    regex: /状< \{/g,
    replace: () => '状态: {'
  },
  // Pattern 19: 优先< → 优先级:
  {
    regex: /优先< \{/g,
    replace: () => '优先级: {'
  },
  // Pattern 20: 实例< → 实例:
  {
    regex: /实例< \{/g,
    replace: () => '实例: {'
  },
  // Pattern 21: 完成< → 完成:
  {
    regex: /完成< \{/g,
    replace: () => '完成: {'
  },
  // Pattern 22: 已启' → 已启用
  {
    regex: /已启'/g,
    replace: () => "已启用'"
  },
  // Pattern 23: 已禁' → 已禁用
  {
    regex: /已禁'\}/g,
    replace: () => "已禁用'}"
  },
  // Pattern 24: 坚果'(Nutstore)' → 坚果云 (Nutstore)
  {
    regex: /坚果'\(Nutstore\)'/g,
    replace: () => "坚果云 (Nutstore)"
  },
  // Pattern 25: 用户名至'个字 → 用户名至少3个字符
  {
    regex: /用户名至'个字/g,
    replace: () => "用户名至少3个字符"
  },
  // Pattern 26: 第 {n} 个番<
  {
    regex: /个番</g,
    replace: () => '个番茄<'
  },
  // Pattern 27: '专注'..' → '专注中...'
  // Already handled by pattern 1

  // Pattern 28: 执行历史记录加载<.. → 执行历史记录加载中...
  // Already handled by pattern 2

  // Pattern 29: 不能超<0000 → 不能超过 10000
  {
    regex: /不能超<0000/g,
    replace: () => '不能超过 10000'
  },
];

const srcDir = path.join(__dirname, 'apps', 'desktop', 'src');
const files = findFiles(srcDir, ['.ts', '.tsx']);
let totalChanges = 0;
let filesChanged = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const p of patterns) {
    content = content.replace(p.regex, p.replace);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const changes = original.length - content.length; // approximate
    filesChanged++;
    console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\nDone: Fixed ${filesChanged} files`);
