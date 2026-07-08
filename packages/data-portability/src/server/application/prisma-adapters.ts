/**
 * Prisma Adapters for Data Portability
 *
 * Direct Prisma queries for modules that don't export repository factories.
 * These implement the dependency interfaces used by the export use case.
 */

import type { PrismaClient } from '@dailyuse/database';
import type {
  FocusSessionRepoPort,
  FocusModeRepoPort,
  RepositoryRepoPort,
  ResourceFolderRepoPort,
  ResourceRepoPort,
  ScheduleRepoPort,
  ScheduleTaskRepoPort,
  EditorWorkspaceRepoPort,
  EditorSessionRepoPort,
  EditorGroupRepoPort,
  EditorTabRepoPort,
  AIConversationRepoPort,
} from './data-portability.dependencies';

export class PrismaFocusSessionAdapter implements FocusSessionRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.focusSession.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaFocusModeAdapter implements FocusModeRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.focusMode.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaRepositoryAdapter implements RepositoryRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.repository.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaFolderAdapter implements ResourceFolderRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByRepositoryId(repositoryId: string): Promise<unknown[]> {
    return this.prisma.folder.findMany({ where: { repositoryId }, orderBy: { path: 'asc' } });
  }
}

export class PrismaResourceAdapter implements ResourceRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.resource.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaScheduleAdapter implements ScheduleRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.schedule.findMany({ where: { identityId } });
  }
}

export class PrismaScheduleTaskAdapter implements ScheduleTaskRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.scheduleTask.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaEditorWorkspaceAdapter implements EditorWorkspaceRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string): Promise<unknown[]> {
    return this.prisma.editorWorkspace.findMany({ where: { identityId, deletedAt: null } });
  }
}

export class PrismaEditorSessionAdapter implements EditorSessionRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByWorkspaceId(workspaceId: string): Promise<unknown[]> {
    return this.prisma.editorWorkspaceSession.findMany({ where: { workspaceId, deletedAt: null } });
  }
}

export class PrismaEditorGroupAdapter implements EditorGroupRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findBySessionId(sessionId: string): Promise<unknown[]> {
    return this.prisma.editorWorkspaceSessionGroup.findMany({ where: { sessionId, deletedAt: null } });
  }
}

export class PrismaEditorTabAdapter implements EditorTabRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByGroupId(groupId: string): Promise<unknown[]> {
    return this.prisma.editorWorkspaceSessionGroupTab.findMany({ where: { groupId, deletedAt: null } });
  }
}

export class PrismaAIConversationAdapter implements AIConversationRepoPort {
  constructor(private readonly prisma: PrismaClient) {}
  async findByIdentityId(identityId: string, options?: { includeChildren?: boolean }): Promise<unknown[]> {
    return this.prisma.aiConversation.findMany({
      where: { identityId, deletedAt: null },
      include: options?.includeChildren ? { messages: { orderBy: { createdAt: 'asc' } } } : undefined,
    });
  }
}
