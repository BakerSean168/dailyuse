/**
 * Repository API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (RepositoryModule → Repositories → Use Cases → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ok } from '@dailyuse/contracts/result';
import { RepositoryModule } from '../infrastructure-server';
import { RepositoryContainer } from '../infrastructure-server/di/repository-container-v2';
import {
  CreateRepository,
  GetRepository,
  ListRepositories,
  UpdateRepositoryConfig,
  DeleteRepository,
  ArchiveRepository,
  ActivateRepository,
  GetResource,
  ListResources,
} from '../application-server';
import {
  registerRepositoryRoutes,
  registerResourceRoutes,
} from './routes';
import type { RepositoryUseCases } from '../controllers/repository.controller';
import { registerRepositoryInitializationTasks } from './initialization';

export interface RepositoryApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface RepositoryApiModuleDef {
  readonly name: string;
  register(context: RepositoryApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const RepositoryApiModule: RepositoryApiModuleDef = {
  name: 'Repository',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — RepositoryModule assembles repositories and configures container
    const repositoryModule = new RepositoryModule('prisma', db as PrismaClient);

    // 2. Instantiate use cases with repository dependencies
    const createRepository = new CreateRepository(repositoryModule.repositoryRepository);
    const getRepository = new GetRepository(repositoryModule.repositoryRepository);
    const listRepositories = new ListRepositories(repositoryModule.repositoryRepository);
    const updateRepositoryConfig = new UpdateRepositoryConfig(repositoryModule.repositoryRepository);
    const deleteRepository = new DeleteRepository(repositoryModule.repositoryRepository);
    const archiveRepository = new ArchiveRepository(repositoryModule.repositoryRepository);
    const activateRepository = new ActivateRepository(repositoryModule.repositoryRepository);
    const getResource = new GetResource(repositoryModule.resourceRepository);
    const listResources = new ListResources(repositoryModule.resourceRepository);

    // 3. Wire route handlers to use cases
    const handlers: RepositoryUseCases = {
      // Repository CRUD
      createRepository: async (data, ctx) => {
        const result = await createRepository.execute({
          identityId: ctx.identityId,
          name: data.name,
          type: data.type as any,
          path: data.path ?? data.name,
          description: data.description,
          config: data.config as any,
        });
        return ok(result.repository);
      },
      listRepositories: async (filters, ctx) => {
        const result = await listRepositories.execute({
          identityId: ctx.identityId,
          status: filters.status as any,
        });
        return ok(result.repositories);
      },
      getRepository: async (id) => {
        const result = await getRepository.execute({ id });
        return ok(result.repository);
      },
      updateRepository: async (id, data) => {
        const result = await updateRepositoryConfig.execute({
          id,
          config: data.config ?? {},
        });
        return ok(result.repository);
      },
      deleteRepository: async (id) => {
        await deleteRepository.execute({ id });
        return ok(undefined);
      },
      archiveRepository: async (id) => {
        const result = await archiveRepository.execute({ id });
        return ok(result.repository);
      },
      activateRepository: async (id) => {
        const result = await activateRepository.execute({ id });
        return ok(result.repository);
      },

      // Resource CRUD — direct repository access (resource use cases require IStoragePort)
      createResource: async (data) => {
        const repository = await repositoryModule.repositoryRepository.findById(data.repositoryId);
        if (!repository) throw new Error(`Repository not found: ${data.repositoryId}`);
        // TODO: Wire CreateResource use case when IStoragePort adapter is available
        throw new Error('Resource creation requires storage port configuration');
      },
      listResources: async (repositoryId) => {
        const result = await listResources.execute({ repositoryId });
        return ok(result.resources);
      },
      getResource: async (id) => {
        const result = await getResource.execute({ id });
        return ok(result.resource);
      },
      updateResource: async (id) => {
        // TODO: Wire UpdateResourceContent use case when IStoragePort adapter is available
        const result = await getResource.execute({ id });
        if (!result.resource) throw new Error(`Resource not found: ${id}`);
        return ok(result.resource);
      },
      deleteResource: async (id) => {
        const resource = await repositoryModule.resourceRepository.findById(id);
        if (!resource) throw new Error(`Resource not found: ${id}`);
        resource.delete();
        await repositoryModule.resourceRepository.save(resource);
        return ok(undefined);
      },
    };

    // 4. Register routes
    const repositoryRoutes = registerRepositoryRoutes(handlers, middleware, context.openApiRegistry);
    const resourceRoutes = registerResourceRoutes(handlers, middleware, context.openApiRegistry);

    // 5. Mount sub-API routes
    router.use('/repositories', repositoryRoutes);
    router.use('/resources', resourceRoutes);

    // 6. Register initialization tasks
    registerRepositoryInitializationTasks();
  },

  destroy() {
    RepositoryContainer.getInstance().reset();
  },
};