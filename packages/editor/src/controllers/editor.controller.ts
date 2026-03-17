/**
 * Editor Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateEditorWorkspaceSchema,
  UpdateEditorWorkspaceSchema,
  CreateDocumentSchema,
  SearchEditorDocumentsSchema,
  UpdateDocumentSchema,
} from '@dailyuse/contracts/editor';
import type {
  CreateEditorWorkspaceReq,
  UpdateEditorWorkspaceReq,
  CreateDocumentReq,
  SearchRequest,
  UpdateDocumentReq,
} from '@dailyuse/contracts/editor';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface EditorUseCases {
  createWorkspace(data: CreateEditorWorkspaceReq, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateEditorWorkspaceReq): Promise<Result<unknown>>;
  deleteWorkspace(id: string): Promise<Result<unknown>>;
  createDocument(data: CreateDocumentReq, ctx: Context): Promise<Result<unknown>>;
  listDocuments(
    params: { workspaceId?: string; folderId?: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getDocument(id: string): Promise<Result<unknown>>;
  updateDocument(id: string, data: UpdateDocumentReq): Promise<Result<unknown>>;
  deleteDocument(id: string): Promise<Result<unknown>>;
  searchDocuments(request: SearchRequest, ctx: Context): Promise<Result<unknown>>;
}

export class EditorController {
  constructor(private readonly useCases: EditorUseCases) {}

  // ==================== Workspace Operations ====================

  async createWorkspace(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateEditorWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid workspace data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createWorkspace(parsed.data, ctx);
  }

  async listWorkspaces(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.listWorkspaces(ctx);
  }

  async getWorkspace(id: string): Promise<Result<unknown>> {
    return this.useCases.getWorkspace(id);
  }

  async updateWorkspace(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateEditorWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid workspace update data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateWorkspace(id, parsed.data);
  }

  async deleteWorkspace(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteWorkspace(id);
  }

  // ==================== Document Operations ====================

  async createDocument(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid document data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createDocument(parsed.data, ctx);
  }

  async listDocuments(
    query: { workspaceId?: string; folderId?: string },
    ctx: Context,
  ): Promise<Result<unknown>> {
    return this.useCases.listDocuments(query, ctx);
  }

  async getDocument(id: string): Promise<Result<unknown>> {
    return this.useCases.getDocument(id);
  }

  async updateDocument(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid document update data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateDocument(id, parsed.data);
  }

  async deleteDocument(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteDocument(id);
  }

  async searchDocuments(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SearchEditorDocumentsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid search request',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.useCases.searchDocuments(parsed.data, ctx);
  }
}
