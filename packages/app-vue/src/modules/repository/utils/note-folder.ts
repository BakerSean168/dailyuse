import type { TreeNode } from '@dailyuse/contracts/repository';

const NOTES_FOLDER_PATH = '/notes';
const NOTES_FOLDER_NAME = 'notes';

export function findNotesFolderId(nodes: TreeNode[]): string | null {
  for (const node of flattenTreeNodes(nodes)) {
    if (node.type !== 'folder') {
      continue;
    }

    if (isNotesFolder(node)) {
      return node.id;
    }
  }

  return null;
}

function isNotesFolder(node: TreeNode): boolean {
  const normalizedName = normalizePathSegment(node.name);
  if (normalizedName === NOTES_FOLDER_NAME) {
    return true;
  }

  const normalizedPath = normalizeNodePath(node.path);
  return normalizedPath === NOTES_FOLDER_PATH || normalizedPath.endsWith(`${NOTES_FOLDER_PATH}/`);
}

function flattenTreeNodes(nodes: TreeNode[]): TreeNode[] {
  const flattened: TreeNode[] = [];

  for (const node of nodes) {
    flattened.push(node);
    if (Array.isArray(node.children) && node.children.length > 0) {
      flattened.push(...flattenTreeNodes(node.children));
    }
  }

  return flattened;
}

function normalizeNodePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').trim();
  if (!normalized.startsWith('/')) {
    return `/${normalized}`.replace(/\/+/g, '/');
  }

  return normalized.replace(/\/+/g, '/');
}

function normalizePathSegment(value: string): string {
  return value.trim().toLowerCase();
}

export const __test__ = {
  normalizeNodePath,
};
