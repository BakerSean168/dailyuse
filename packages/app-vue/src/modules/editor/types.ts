import type { SimpleEditorTab } from '@dailyuse/contracts/shared';

export type EditorTab = SimpleEditorTab;

export interface EditorOpenFileInput {
  id?: string;
  title: string;
  fileType: EditorTab['fileType'];
  filePath: string;
  content?: string;
}

export interface EditorController {
  openFile(file: EditorOpenFileInput): EditorTab | null;
  closeTab(tabId: string): void;
  closeAllTabs(): void;
  saveCurrentFile(): void;
  saveAllFiles(): void;
  tabs?: EditorTab[];
  activeTab?: EditorTab | null;
}
