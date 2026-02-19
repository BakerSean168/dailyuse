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
import type { RepositoryRouteHandlers } from './routes';
import { registerRepositoryInitializationTasks } from './initialization';

export interface RepositoryApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
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
    const handlers: RepositoryRouteHandlers = {
      // Repository CRUD
      createRepository: async (identityId, data) => {
        const result = await createRepository.execute({
          identityId,
          name: data.name,
          type: data.type as any,
          path: data.path ?? data.name,
          description: data.description,
          config: data.config as any,
        });
        return result.repository;
      },
      listRepositories: async (identityId, filters) => {
        const result = await listRepositories.execute({
          identityId,
          status: filters.status as any,
        });
        return result.repositories;
      },
      getRepository: async (id) => {
        const result = await getRepository.execute({ id });
        return result.repository;
      },
      updateRepository: async (id, data) => {
        const result = await updateRepositoryConfig.execute({
          id,
          config: data.config ?? {},
        });
        return result.repository;
      },
      deleteRepository: async (id) => {
        await deleteRepository.execute({ id });
      },
      archiveRepository: async (id) => {
        const result = await archiveRepository.execute({ id });
        return result.repository;
      },
      activateRepository: async (id) => {
        const result = await activateRepository.execute({ id });
        return result.repository;
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
        return result.resources;
      },
      getResource: async (id) => {
        const result = await getResource.execute({ id });
        return result.resource;
      },
      updateResource: async (id) => {
        // TODO: Wire UpdateResourceContent use case when IStoragePort adapter is available
        const result = await getResource.execute({ id });
        if (!result.resource) throw new Error(`Resource not found: ${id}`);
        return result.resource;
      },
      deleteResource: async (id) => {
        const resource = await repositoryModule.resourceRepository.findById(id);
        if (!resource) throw new Error(`Resource not found: ${id}`);
        resource.delete();
        await repositoryModule.resourceRepository.save(resource);
      },
    };

    // 4. Register routes
    const repositoryRoutes = registerRepositoryRoutes(handlers, middleware);
    const resourceRoutes = registerResourceRoutes(handlers, middleware);

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