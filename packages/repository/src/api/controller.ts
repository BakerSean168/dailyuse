/**
 * Repository Controller
 *
 * Encapsulates validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Note: Repository contracts use plain TypeScript interfaces (no Zod schemas),
 * so validation is done with manual type-checking.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { RepositoryRouteHandlers } from './routes';

export class RepositoryController {
  constructor(private readonly handlers: RepositoryRouteHandlers) {}

  // ==================== Repository Operations ====================

  async createRepository(identityId: string, input: unknown): Promise<Result<unknown>> {
    const body = input as Record<string, unknown> | undefined;
    if (!body?.name || typeof body.name !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'name is required' });
    }
    if (!body.type || typeof body.type !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'type is required' });
    }
    const data = await this.handlers.createRepository(identityId, body as any);
    return ok(data);
  }

  async listRepositories(identityId: string, filters: { status?: string; type?: string }): Promise<Result<unknown>> {
    const data = await this.handlers.listRepositories(identityId, filters);
    return ok(data);
  }

  async getRepository(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getRepository(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Repository not found' });
    }
    return ok(data);
  }

  async updateRepository(id: string, input: unknown): Promise<Result<unknown>> {
    const data = await this.handlers.updateRepository(id, input as any);
    return ok(data);
  }

  async deleteRepository(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteRepository(id);
    return ok(null);
  }

  async archiveRepository(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.archiveRepository(id);
    return ok(data);
  }

  async activateRepository(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.activateRepository(id);
    return ok(data);
  }

  // ==================== Resource Operations ====================

  async createResource(repoId: string, input: unknown): Promise<Result<unknown>> {
    const body = input as Record<string, unknown> | undefined;
    if (!body?.name || typeof body.name !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'name is required' });
    }
    if (!body.type || typeof body.type !== 'string') {
      return fail({ code: 'VALIDATION_ERROR', message: 'type is required' });
    }
    const data = await this.handlers.createResource({
      ...(body as any),
      repositoryId: repoId,
    });
    return ok(data);
  }

  async listResources(repositoryId: string, filters: { folderId?: string; status?: string }): Promise<Result<unknown>> {
    const data = await this.handlers.listResources(repositoryId, filters);
    return ok(data);
  }

  async getResource(id: string): Promise<Result<unknown>> {
    const data = await this.handlers.getResource(id);
    if (!data) {
      return fail({ code: 'NOT_FOUND', message: 'Resource not found' });
    }
    return ok(data);
  }

  async updateResource(id: string, input: unknown): Promise<Result<unknown>> {
    const data = await this.handlers.updateResource(id, input as any);
    return ok(data);
  }

  async deleteResource(id: string): Promise<Result<unknown>> {
    await this.handlers.deleteResource(id);
    return ok(null);
  }
}
