/**
 * Editor Controller
 *
 * Encapsulates validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Note: Editor contracts use plain TypeScript interfaces (no Zod schemas),
 * so validation is done with manual type-checking.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { EditorRouteHandlers } from './routes';

export class EditorController {
  constructor(private readonly handlers: EditorRouteHandlers) {}

  // ==================== Workspace Operations ====================

  async createWorkspace(input: unknown, identityId: string): Promise<Result<unknown>> {
    const body = input as Record<string, unknown> | undefined;
    if (!body?.name || typeof body.name !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'name is required' });
    }
    if (!body.projectPath || typeof body.projectPath !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'projectPath is required' });
    }
    if (!body.projectType || typeof body.projectType !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'projectType is required' });
    }
    const data = await this.handlers.createWorkspace(identityId, body as any);
    return ok(data);
  }

  async listWorkspaces(identityId: string): Promise<Result<unknown>> {
    const data = await this.handlers.listWorkspaces(identityId);
    return ok(data);
  }

  async getWorkspace(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getWorkspace(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Workspace not found' });
    }
    return ok(data);
  }

  async updateWorkspace(id: string, input: unknown): Promise<Result<unknown>> {
    const data = await this.handlers.updateWorkspace(id, input as any);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Workspace not found' });
    }
    return ok(data);
  }

  async deleteWorkspace(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteWorkspace(id);
    return ok(null);
  }

  // ==================== Document Operations ====================

  async createDocument(input: unknown, identityId: string): Promise<Result<unknown>> {
    const body = input as Record<string, unknown> | undefined;
    if (!body?.workspaceId || typeof body.workspaceId !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'workspaceId is required' });
    }
    if (!body.name || typeof body.name !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'name is required' });
    }
    const data = await this.handlers.createDocument(identityId, body as any);
    return ok(data);
  }

  async listDocuments(identityId: string, query: { workspaceId?: string; folderId?: string }): Promise<Result<unknown>> {
    const data = await this.handlers.listDocuments({
      workspaceId: query.workspaceId,
      folderId: query.folderId,
      identityId,
    });
    return ok(data);
  }

  async getDocument(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getDocument(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    return ok(data);
  }

  async updateDocument(id: string, input: unknown): Promise<Result<unknown>> {
    const data = await this.handlers.updateDocument(id, input as any);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    return ok(data);
  }

  async deleteDocument(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteDocument(id);
    return ok(null);
  }
}
