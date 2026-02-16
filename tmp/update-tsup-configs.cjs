const fs = require('fs');

const packages = [
  'goal', 'task', 'schedule', 'reminder', 'notification',
  'setting', 'ai', 'repository', 'editor', 'account', 'authentication'
];

const electronExternals = ['electron', 'better-sqlite3'];

packages.forEach(pkg => {
  const filePath = `packages/${pkg}/tsup.config.ts`;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Add 'src/electron-entry/index.ts' to entry
  if (!content.includes('electron-entry')) {
    // Check if it's object-style (authentication)
    if (content.includes("api: 'src/api/index.ts'")) {
      content = content.replace(
        "api: 'src/api/index.ts',",
        "api: 'src/api/index.ts',\n    'electron-entry': 'src/electron-entry/index.ts',"
      );
    } else {
      // Array-style: find the closing ] of the entry array and add before it
      const entryArrayRegex = /(entry:\s*\[)([\s\S]*?)(\s*\])/;
      const match = content.match(entryArrayRegex);
      if (match) {
        const entries = match[2];
        const lastCommaIdx = entries.lastIndexOf(',');
        // Add our entry after the last existing entry
        const newEntries = entries.trimEnd() + (entries.trimEnd().endsWith(',') ? '' : ',') + "\n    'src/electron-entry/index.ts',";
        content = content.replace(entryArrayRegex, `$1${newEntries}\n  ]`);
      }
    }
  }

  // 2. Add electron and better-sqlite3 to externals
  electronExternals.forEach(ext => {
    if (!content.includes(`'${ext}'`)) {
      content = content.replace(
        /external:\s*\[/,
        `external: [\n    '${ext}',`
      );
    }
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${pkg}`);
  } else {
    console.log(`No changes: ${pkg}`);
  }
});

// Also add 'src/electron/index.ts' to contracts tsup config
const contractsPath = 'packages/contracts/tsup.config.ts';
let contractsContent = fs.readFileSync(contractsPath, 'utf8');
if (!contractsContent.includes('electron/index.ts')) {
  // contracts uses createTsupConfig helper with entry array
  contractsContent = contractsContent.replace(
    "'src/shared/index.ts',",
    "'src/shared/index.ts',\n    'src/electron/index.ts',"
  );
  fs.writeFileSync(contractsPath, contractsContent);
  console.log('Updated: contracts');
} else {
  console.log('No changes: contracts');
}
