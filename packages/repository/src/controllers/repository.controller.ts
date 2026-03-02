/**
 * Repository Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import {
  CreateRepositorySchema,
  UpdateRepositorySchema,
  CreateResourceSchema,
  UpdateResourceSchema,
} from '@dailyuse/contracts/repository';
import type {
  CreateRepositoryZodReq,
  UpdateRepositoryZodReq,
  CreateResourceZodReq,
  UpdateResourceZodReq,
} from '@dailyuse/contracts/repository';
import { formatZodErrors } from '@dailyuse/utils/result';

// ============ Use Case Port ============

export interface RepositoryUseCases {
  // Repository CRUD
  createRepository(data: CreateRepositoryZodReq, ctx: Context): Promise<Result<unknown>>;
  listRepositories(
    filters: { status?: string; type?: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getRepository(id: string): Promise<Result<unknown>>;
  updateRepository(id: string, data: UpdateRepositoryZodReq): Promise<Result<unknown>>;
  deleteRepository(id: string): Promise<Result<unknown>>;
  archiveRepository(id: string): Promise<Result<unknown>>;
  activateRepository(id: string): Promise<Result<unknown>>;
  // Resource CRUD
  createResource(data: CreateResourceZodReq & { repositoryId: string }): Promise<Result<unknown>>;
  listResources(
    repositoryId: string,
    filters: { folderId?: string; status?: string },
  ): Promise<Result<unknown>>;
  getResource(id: string): Promise<Result<unknown>>;
  updateResource(id: string, data: UpdateResourceZodReq): Promise<Result<unknown>>;
  deleteResource(id: string): Promise<Result<unknown>>;
}

export class RepositoryController {
  constructor(private readonly useCases: RepositoryUseCases) {}

  // ==================== Repository Operations ====================

  async createRepository(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateRepositorySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid repository data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createRepository(parsed.data, ctx);
  }

  async listRepositories(
    filters: { status?: string; type?: string },
    ctx: Context,
  ): Promise<Result<unknown>> {
    return this.useCases.listRepositories(filters, ctx);
  }

  async getRepository(id: string): Promise<Result<unknown>> {
    return this.useCases.getRepository(id);
  }

  async updateRepository(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateRepositorySchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid repository update data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateRepository(id, parsed.data);
  }

  async deleteRepository(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteRepository(id);
  }

  async archiveRepository(id: string): Promise<Result<unknown>> {
    return this.useCases.archiveRepository(id);
  }

  async activateRepository(id: string): Promise<Result<unknown>> {
    return this.useCases.activateRepository(id);
  }

  // ==================== Resource Operations ====================

  async createResource(repoId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = CreateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid resource data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createResource({
      ...parsed.data,
      repositoryId: repoId,
    });
  }

  async listResources(
    repositoryId: string,
    filters: { folderId?: string; status?: string },
  ): Promise<Result<unknown>> {
    return this.useCases.listResources(repositoryId, filters);
  }

  async getResource(id: string): Promise<Result<unknown>> {
    return this.useCases.getResource(id);
  }

  async updateResource(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid resource update data',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateResource(id, parsed.data);
  }

  async deleteResource(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteResource(id);
  }
}
