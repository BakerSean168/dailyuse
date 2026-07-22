/**
 * LocalVaultBinding — Desktop-selected Obsidian vault root for a profile.
 * 本地 Vault 绑定 —— Desktop profile 选定的 Obsidian vault 根目录。
 *
 * This is local-only metadata. It must never imply GitHub sync permission.
 * 仅本地元数据，绝不隐含 GitHub 同步授权。
 */

import type { IdentityId, TransferDate } from '../../../primitives';

export type LocalVaultBindingStatus = 'Active' | 'Missing' | 'Unreadable' | 'Detached';

export interface LocalVaultBindingClientDTO {
  id: string;
  /**
   * Profile / identity owner. Guest profiles use the deterministic guest identity.
   * profile / 身份所有者；访客使用确定性访客 identity。
   */
  identityId: IdentityId;
  /** Absolute filesystem path to the vault root. */
  rootPath: string;
  displayName: string;
  status: LocalVaultBindingStatus;
  /** Optional Obsidian vault id if known. */
  obsidianVaultId: string | null;
  lastScannedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

export interface SelectLocalVaultReq {
  /** Optional picker starting point. The renderer cannot bind an arbitrary path directly. */
  suggestedPath?: string;
}

export interface LocalVaultNoteSummaryDTO {
  relativePath: string;
  title: string;
  excerpt: string;
  tags: string[];
  outgoingLinks: string[];
  size: number;
  updatedAt: TransferDate;
}

export interface LocalVaultNoteDTO extends LocalVaultNoteSummaryDTO {
  contentMarkdown: string;
  frontmatter: Record<string, unknown>;
}

export interface ScanLocalVaultRes {
  binding: LocalVaultBindingClientDTO;
  notes: LocalVaultNoteSummaryDTO[];
  scannedAt: TransferDate;
}

export interface ReadLocalVaultNoteReq {
  relativePath: string;
}

export type ReadLocalVaultNoteRes = LocalVaultNoteDTO;

export interface SearchLocalVaultReq {
  query: string;
  limit?: number;
}

export interface LocalVaultSearchMatchDTO {
  lineNumber: number;
  lineContent: string;
  startIndex: number;
  endIndex: number;
}

export interface LocalVaultSearchResultDTO {
  note: LocalVaultNoteSummaryDTO;
  matches: LocalVaultSearchMatchDTO[];
}

export interface SearchLocalVaultRes {
  query: string;
  results: LocalVaultSearchResultDTO[];
}

export interface OpenLocalVaultInObsidianReq {
  relativePath?: string;
}

export interface ConfirmedLocalVaultWriteReq {
  relativePath: string;
  contentMarkdown: string;
  proposalId: string;
  proposalRevision: number;
  requestId: string;
}

export interface ConfirmedLocalVaultWriteRes {
  note: LocalVaultNoteDTO;
  created: boolean;
}
