import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
describe('GoalDialog vNext surface', () => { it('edits Direction fields without retired taxonomy', () => { const source=fs.readFileSync(path.resolve(__dirname,'../dialogs/GoalDialog.vue'),'utf8'); expect(source).toContain('dueDate'); expect(source).toContain('ProductDialogShell'); for (const retired of ['targetDate','folderId','parentGoalId','category','importance']) expect(source).not.toContain(retired); }); });
