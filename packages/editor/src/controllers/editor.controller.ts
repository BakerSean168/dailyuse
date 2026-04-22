/**
 * Editor Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result, ResultErrorDetail } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateEditorWorkspaceSchema,
  UpdateEditorWorkspaceSchema,
  SearchEditorResourcesSchema,
  CreateEditorSessionSchema,
  UpdateEditorSessionSchema,
  CreateEditorGroupSchema,
  UpdateEditorGroupSchema,
  CreateEditorTabSchema,
  UpdateEditorTabSchema,
  SaveEditorContentSchema,
} from '@dailyuse/contracts/editor';
import type {
  CreateEditorWorkspaceReq,
  UpdateEditorWorkspaceReq,
  SearchRequest,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
} from '@dailyuse/contracts/editor';
import { formatZodErrors } from '@dailyuse/utils/result';

export interface EditorUseCases {
  createWorkspace(data: CreateEditorWorkspaceReq, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateEditorWorkspaceReq): Promise<Result<unknown>>;
  deleteWorkspace(id: string): Promise<Result<unknown>>;
  createSession(data: CreateEditorSessionRequest, ctx: Context): Promise<Result<unknown>>;
  listSessions(workspaceId: string, ctx: Context): Promise<Result<unknown>>;
  getSession(id: string, ctx: Context): Promise<Result<unknown>>;
  updateSession(id: string, data: UpdateEditorSessionRequest, ctx: Context): Promise<Result<unknown>>;
  activateSession(workspaceId: string, sessionId: string, ctx: Context): Promise<Result<unknown>>;
  deleteSession(id: string, ctx: Context): Promise<Result<unknown>>;
  createGroup(
    data: CreateEditorGroupRequest & { workspaceId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateGroup(
    id: string,
    data: UpdateEditorGroupRequest & { workspaceId: string; sessionId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteGroup(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  createTab(
    data: CreateEditorTabRequest & { workspaceId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateTab(
    id: string,
    data: UpdateEditorTabRequest & { workspaceId: string; sessionId: string; groupId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  activateTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  getContent(resourceId: string, ctx: Context): Promise<Result<unknown>>;
  saveContent(resourceId: string, content: string, ctx: Context): Promise<Result<unknown>>;
  autoSaveContent(resourceId: string, content: string, ctx: Context): Promise<Result<unknown>>;
  searchResources(request: SearchRequest, ctx: Context): Promise<Result<unknown>>;
}

function validationError(message: string, details: ResultErrorDetail[]): Result<unknown> {
  return fail({
    code: 'VALIDATION_ERROR',
    message,
    details,
  });
}

export class EditorController {
  constructor(private readonly useCases: EditorUseCases) {}

  async createWorkspace(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateEditorWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid workspace data', formatZodErrors(parsed.error.issues));
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
      return validationError('Invalid workspace update data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.updateWorkspace(id, parsed.data);
  }

  async deleteWorkspace(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteWorkspace(id);
  }

  async createSession(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateEditorSessionSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid session data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.createSession(parsed.data, ctx);
  }

  async listSessions(workspaceId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.listSessions(workspaceId, ctx);
  }

  async getSession(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getSession(id, ctx);
  }

  async updateSession(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateEditorSessionSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid session update data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.updateSession(id, parsed.data, ctx);
  }

  async activateSession(workspaceId: string, sessionId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.activateSession(workspaceId, sessionId, ctx);
  }

  async deleteSession(id: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.deleteSession(id, ctx);
  }

  async createGroup(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateEditorGroupSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid group data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.createGroup(parsed.data, ctx);
  }

  async updateGroup(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateEditorGroupSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid group update data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.updateGroup(id, parsed.data, ctx);
  }

  async deleteGroup(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    ctx: Context,
  ): Promise<Result<unknown>> {
    return this.useCases.deleteGroup(workspaceId, sessionId, groupId, ctx);
  }

  async createTab(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateEditorTabSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid tab data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.createTab(parsed.data, ctx);
  }

  async updateTab(id: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = UpdateEditorTabSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid tab update data', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.updateTab(id, parsed.data, ctx);
  }

  async activateTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>> {
    return this.useCases.activateTab(workspaceId, sessionId, groupId, tabId, ctx);
  }

  async deleteTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>> {
    return this.useCases.deleteTab(workspaceId, sessionId, groupId, tabId, ctx);
  }

  async getContent(resourceId: string, ctx: Context): Promise<Result<unknown>> {
    return this.useCases.getContent(resourceId, ctx);
  }

  async saveContent(resourceId: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SaveEditorContentSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid content payload', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.saveContent(resourceId, parsed.data.content, ctx);
  }

  async autoSaveContent(resourceId: string, input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SaveEditorContentSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid content payload', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.autoSaveContent(resourceId, parsed.data.content, ctx);
  }

  async searchResources(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = SearchEditorResourcesSchema.safeParse(input);
    if (!parsed.success) {
      return validationError('Invalid search request', formatZodErrors(parsed.error.issues));
    }

    return this.useCases.searchResources(parsed.data, ctx);
  }
}
