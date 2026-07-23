/**
 * LocalVaultBinding — Desktop-selected Obsidian vault root for a profile.
 * 本地 Vault 绑定 —— Desktop profile 选定的 Obsidian vault 根目录。
 *
 * This is local-only metadata. It must never imply GitHub sync permission.
 * 仅本地元数据，绝不隐含 GitHub 同步授权。
 *
 * Residual 793: Res duals retired — nested DTO + Res use sole *Schema + z.infer.
 * Residual 795: Req duals retired — sole *ReqSchema + z.infer.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { IdentityId } from '../../../primitives';

export const LocalVaultBindingStatusSchema = z.enum([
  'Active',
  'Missing',
  'Unreadable',
  'Detached',
]);
export type LocalVaultBindingStatus = z.infer<typeof LocalVaultBindingStatusSchema>;

export const LocalVaultBindingClientDTOSchema = z.object({
  id: z.string(),
  /**
   * Profile / identity owner. Guest profiles use the deterministic guest identity.
   * profile / 身份所有者；访客使用确定性访客 identity。
   */
  identityId: brandedId<IdentityId>(),
  /** Absolute filesystem path to the vault root. */
  rootPath: z.string(),
  displayName: z.string(),
  status: LocalVaultBindingStatusSchema,
  /** Optional Obsidian vault id if known. */
  obsidianVaultId: z.string().nullable(),
  lastScannedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type LocalVaultBindingClientDTO = z.infer<typeof LocalVaultBindingClientDTOSchema>;

// Residual 795: select vault Req dual retired — sole ReqSchema + z.infer.
export const SelectLocalVaultReqSchema = z.object({
  /** Optional picker starting point. The renderer cannot bind an arbitrary path directly. */
  suggestedPath: z.string().optional(),
});
export type SelectLocalVaultReq = z.infer<typeof SelectLocalVaultReqSchema>;

export const LocalVaultNoteSummaryDTOSchema = z.object({
  relativePath: z.string(),
  title: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  outgoingLinks: z.array(z.string()),
  size: z.number(),
  updatedAt: z.number(),
});
export type LocalVaultNoteSummaryDTO = z.infer<typeof LocalVaultNoteSummaryDTOSchema>;

export const LocalVaultNoteDTOSchema = LocalVaultNoteSummaryDTOSchema.extend({
  contentMarkdown: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
});
export type LocalVaultNoteDTO = z.infer<typeof LocalVaultNoteDTOSchema>;

// Residual 793: scan Res dual retired — sole ResSchema + z.infer.
export const ScanLocalVaultResSchema = z.object({
  binding: LocalVaultBindingClientDTOSchema,
  notes: z.array(LocalVaultNoteSummaryDTOSchema),
  scannedAt: z.number(),
});
export type ScanLocalVaultRes = z.infer<typeof ScanLocalVaultResSchema>;

// Residual 795: read note Req dual retired — sole ReqSchema + z.infer.
export const ReadLocalVaultNoteReqSchema = z.object({
  relativePath: z.string(),
});
export type ReadLocalVaultNoteReq = z.infer<typeof ReadLocalVaultNoteReqSchema>;

export type ReadLocalVaultNoteRes = LocalVaultNoteDTO;

// Residual 795: search vault Req dual retired — sole ReqSchema + z.infer.
export const SearchLocalVaultReqSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});
export type SearchLocalVaultReq = z.infer<typeof SearchLocalVaultReqSchema>;

export const LocalVaultSearchMatchDTOSchema = z.object({
  lineNumber: z.number(),
  lineContent: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
});
export type LocalVaultSearchMatchDTO = z.infer<typeof LocalVaultSearchMatchDTOSchema>;

export const LocalVaultSearchResultDTOSchema = z.object({
  note: LocalVaultNoteSummaryDTOSchema,
  matches: z.array(LocalVaultSearchMatchDTOSchema),
});
export type LocalVaultSearchResultDTO = z.infer<typeof LocalVaultSearchResultDTOSchema>;

// Residual 793: search Res dual retired — sole ResSchema + z.infer.
export const SearchLocalVaultResSchema = z.object({
  query: z.string(),
  results: z.array(LocalVaultSearchResultDTOSchema),
});
export type SearchLocalVaultRes = z.infer<typeof SearchLocalVaultResSchema>;

// Residual 795: open-in-obsidian req dual retired — sole ReqSchema + z.infer.
export const OpenLocalVaultInObsidianReqSchema = z.object({
  relativePath: z.string().optional(),
});
export type OpenLocalVaultInObsidianReq = z.infer<typeof OpenLocalVaultInObsidianReqSchema>;

// Residual 795: confirmed write req dual retired — sole ReqSchema + z.infer.
export const ConfirmedLocalVaultWriteReqSchema = z.object({
  relativePath: z.string(),
  contentMarkdown: z.string(),
  proposalId: z.string(),
  proposalRevision: z.number(),
  requestId: z.string(),
});
export type ConfirmedLocalVaultWriteReq = z.infer<typeof ConfirmedLocalVaultWriteReqSchema>;

// Residual 793: confirmed write Res dual retired — sole ResSchema + z.infer.
export const ConfirmedLocalVaultWriteResSchema = z.object({
  note: LocalVaultNoteDTOSchema,
  created: z.boolean(),
});
export type ConfirmedLocalVaultWriteRes = z.infer<typeof ConfirmedLocalVaultWriteResSchema>;
