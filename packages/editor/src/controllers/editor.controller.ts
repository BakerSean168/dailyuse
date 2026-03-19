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
  SearchEditorResourcesSchema,
} from '@dailyuse/contracts/editor';
import type {
  CreateEditorWorkspaceReq,
  UpdateEditorWorkspaceReq,
  SearchRequest,
} from '@dailyuse/contracts/editor';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface EditorUseCases {
  createWorkspace(data: CreateEditorWorkspaceReq, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateEditorWorkspaceReq): Promise<Result<unknown>>;
  deleteWorkspace(id: string): Promise<Result<unknown>>;
  searchResources(request: SearchRequest, ctx: Context): Promise<Result<unknown>>;
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

  async searchResources(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SearchEditorResourcesSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid search request',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.useCases.searchResources(parsed.data, ctx);
  }
}
