import { createHash, randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  CreateConfirmedKnowledgeNoteSchema,
  type CreateConfirmedKnowledgeNoteReq,
  type CreateConfirmedKnowledgeNoteResponse,
  type GitHubInstallationRepositoryDTO,
  RepositoryResourceMutationType,
} from '@dailyuse/contracts/repository';
import type { IdentityId, RepositoryId, ResourceId } from '@dailyuse/contracts/primitives';
import { createLogger } from '@dailyuse/utils/logger';
import type { GitHubFileCommitResult, IGitHubAppClient } from '../ports/github-app-client.port';
import type { IKnowledgeRepositoryConnectionRepository } from '../ports/knowledge-repository-connection.repository';
import type { IKnowledgeRepositoryLeaseRepository } from '../ports/knowledge-repository-lease.repository';
import type {
  IKnowledgeNoteProjectionRepository,
  IKnowledgeWriteRequestRepository,
  KnowledgeNoteProjectionUpsert,
  KnowledgeWriteRequestRecord,
} from '../ports/knowledge-note-projection.repository';
import {
  publishRepositoryResourceMutation,
  type RepositoryResourceMutationPayload,
} from './repository-resource-mutation.publisher';
import {
  KnowledgeRepositoryLeaseCoordinator,
  KnowledgeRepositoryLeaseLostError,
  knowledgeRepositoryConnectionLeaseKey,
  type KnowledgeRepositoryLeaseGuard,
} from './knowledge-repository-lease-coordinator';

const logger = createLogger('KnowledgeNoteCommitService');

export interface KnowledgeNoteCommitServiceOptions {
  connectionRepository: IKnowledgeRepositoryConnectionRepository;
  projectionRepository: IKnowledgeNoteProjectionRepository;
  writeRequestRepository: IKnowledgeWriteRequestRepository;
  githubAppClient: IGitHubAppClient;
  now?: () => number;
  publishMutation?: (event: RepositoryResourceMutationPayload) => void;
  leaseRepository?: IKnowledgeRepositoryLeaseRepository;
  leaseTtlMs?: number;
  leaseRenewalIntervalMs?: number;
}

/**
 * Creates only new Markdown files through the GitHub App. Existing paths are
 * rejected by the GitHub Data API and request IDs are persisted before the
 * remote mutation, so one confirmed proposal cannot create a second file.
 */
export class KnowledgeNoteCommitService {
  private readonly now: () => number;
  private readonly publishMutation: (event: RepositoryResourceMutationPayload) => void;
  private readonly inFlight = new Map<
    string,
    {
      requestHash: string;
      operation: Promise<Result<CreateConfirmedKnowledgeNoteResponse>>;
    }
  >();
  private readonly connectionQueues = new Map<string, Promise<void>>();
  private readonly leaseCoordinator: KnowledgeRepositoryLeaseCoordinator;

  constructor(private readonly options: KnowledgeNoteCommitServiceOptions) {
    this.now = options.now ?? Date.now;
    this.publishMutation = options.publishMutation ?? publishRepositoryResourceMutation;
    this.leaseCoordinator = new KnowledgeRepositoryLeaseCoordinator(options.leaseRepository, {
      now: this.now,
      ttlMs: options.leaseTtlMs,
      renewalIntervalMs: options.leaseRenewalIntervalMs,
    });
  }

  async create(
    identityId: string,
    input: CreateConfirmedKnowledgeNoteReq,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>> {
    const parsed = CreateConfirmedKnowledgeNoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Invalid confirmed knowledge note request',
      });
    }
    const request = parsed.data;
    const requestHash = this.hashRequest(request);
    const key = `${identityId}:${request.requestId}`;
    const active = this.inFlight.get(key);
    if (active) {
      return active.requestHash === requestHash
        ? active.operation
        : fail({
            code: 'CONFLICT',
            message: 'requestId is already committing a different knowledge note proposal',
          });
    }
    const operation = this.queueConnectionRequest(request.connectionId, async () => {
      try {
        const claimed = await this.leaseCoordinator.execute(
          knowledgeRepositoryConnectionLeaseKey(request.connectionId),
          async (guard) => this.createInternal(identityId, request, requestHash, guard),
        );
        return claimed.acquired
          ? claimed.value!
          : fail({
              code: 'CONFLICT',
              message: 'Knowledge repository is processing another write or projection',
            });
      } catch (error) {
        if (error instanceof KnowledgeRepositoryLeaseLostError) {
          return fail({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Knowledge note commit ownership expired; retry the same request',
          });
        }
        throw error;
      }
    }).finally(() => {
      if (this.inFlight.get(key)?.operation === operation) this.inFlight.delete(key);
    });
    this.inFlight.set(key, { requestHash, operation });
    return operation;
  }

  private async createInternal(
    identityId: string,
    request: CreateConfirmedKnowledgeNoteReq,
    requestHash: string,
    guard: KnowledgeRepositoryLeaseGuard,
  ): Promise<Result<CreateConfirmedKnowledgeNoteResponse>> {
    const existing = await this.options.writeRequestRepository.findByIdentityAndRequestId(
      identityId,
      request.requestId,
    );
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return fail({
          code: 'CONFLICT',
          message: 'requestId has already been used for a different knowledge note proposal',
        });
      }
      if (existing.status === 'Committed' && existing.commitSha) {
        return ok({
          requestId: request.requestId,
          relativePath: existing.relativePath,
          commitSha: existing.commitSha,
          status: 'Committed',
        });
      }
    }

    const connection = await this.options.connectionRepository.findById(request.connectionId);
    if (
      !connection ||
      connection.identityId !== identityId ||
      connection.status !== 'Active' ||
      connection.deletedAt !== null
    ) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Active knowledge repository connection was not found',
      });
    }
    const inventory = await this.options.githubAppClient.getInstallationInventory(
      connection.installationId,
    );
    const repository = inventory.repositories.find(
      (candidate) => candidate.id === connection.githubRepositoryId,
    );
    if (!repository || !this.canWrite(inventory.contentsPermission, repository)) {
      return fail({ code: 'FORBIDDEN', message: 'Knowledge repository is not writable' });
    }
    if (repository.defaultBranch !== connection.defaultBranch) {
      return fail({
        code: 'CONFLICT',
        message: 'Knowledge repository default branch changed; reconnect before creating notes',
      });
    }

    const now = this.now();
    let record: KnowledgeWriteRequestRecord;
    if (existing?.status === 'Pending') {
      record = existing;
    } else if (existing?.status === 'Failed') {
      await guard.ensureHeld();
      if (!(await this.options.writeRequestRepository.retryFailed(existing.id, now))) {
        return fail({ code: 'CONFLICT', message: 'Knowledge note commit is already in progress' });
      }
      record = {
        ...existing,
        status: 'Pending',
        commitSha: null,
        errorCode: null,
        errorMessage: null,
        updatedAt: now,
        completedAt: null,
      };
    } else {
      record = {
        id: `knowledge-write-${randomUUID()}`,
        identityId,
        connectionId: connection.id,
        requestId: request.requestId,
        requestHash,
        relativePath: request.proposedPath,
        status: 'Pending',
        commitSha: null,
        errorCode: null,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
    }
    await guard.ensureHeld();
    if (!existing && !(await this.options.writeRequestRepository.create(record))) {
      const raced = await this.options.writeRequestRepository.findByIdentityAndRequestId(
        identityId,
        request.requestId,
      );
      if (raced?.status === 'Committed' && raced.commitSha) {
        return ok({
          requestId: request.requestId,
          relativePath: raced.relativePath,
          commitSha: raced.commitSha,
          status: 'Committed',
        });
      }
      return fail({ code: 'CONFLICT', message: 'Knowledge note commit is already in progress' });
    }

    const frontmatter = { ...request.frontmatter, title: request.title };
    const markdownContent = matter.stringify(request.content, frontmatter);
    let committed: GitHubFileCommitResult;
    try {
      await guard.ensureHeld();
      committed = await this.options.githubAppClient.createFileCommit(connection.installationId, {
        repository,
        path: request.proposedPath,
        branch: connection.defaultBranch,
        content: markdownContent,
        message: `Create knowledge note: ${request.title}`,
        requestId: request.requestId,
      });
    } catch (error) {
      if (error instanceof KnowledgeRepositoryLeaseLostError) throw error;
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status: unknown }).status)
          : null;
      const code = status === 409 || status === 422 ? 'CONFLICT' : 'SERVICE_UNAVAILABLE';
      const message = error instanceof Error ? error.message : 'Knowledge note commit failed';
      await guard.ensureHeld();
      await this.options.writeRequestRepository.markFailed(record.id, code, message);
      return fail({ code, message });
    }

    await guard.ensureHeld();
    await this.options.writeRequestRepository.markCommitted(record.id, committed.commitSha);
    const projection: KnowledgeNoteProjectionUpsert = {
      id: `knowledge-note-${createHash('sha256').update(`${connection.id}:${request.proposedPath}`).digest('hex')}`,
      connectionId: connection.id,
      relativePath: request.proposedPath,
      commitSha: committed.commitSha,
      blobSha: committed.blobSha,
      contentHash: createHash('sha256').update(markdownContent).digest('hex'),
      frontmatter,
      markdownContent,
      indexStatus: 'pending',
    };
    try {
      await guard.ensureHeld();
      await this.options.projectionRepository.applyChanges(
        connection.id,
        committed.commitSha,
        [projection],
        [],
      );
      this.publishMutation({
        identityId: connection.identityId as IdentityId,
        repositoryId: connection.id as RepositoryId,
        resourceId: projection.id as ResourceId,
        resourcePath: projection.relativePath,
        mutation: RepositoryResourceMutationType.Created,
      });
    } catch (error) {
      logger.warn('Knowledge note committed but immediate projection update failed', {
        error,
        identityId,
        connectionId: connection.id,
        requestId: request.requestId,
        commitSha: committed.commitSha,
      });
    }
    return ok({
      requestId: request.requestId,
      relativePath: request.proposedPath,
      commitSha: committed.commitSha,
      status: 'Committed',
    });
  }

  private queueConnectionRequest<T>(connectionId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.connectionQueues.get(connectionId) ?? Promise.resolve();
    const operation = previous.then(task, task);
    const tail = operation.then(
      () => undefined,
      () => undefined,
    );
    this.connectionQueues.set(connectionId, tail);
    void tail.then(() => {
      if (this.connectionQueues.get(connectionId) === tail) {
        this.connectionQueues.delete(connectionId);
      }
    });
    return operation;
  }

  private canWrite(
    contentsPermission: 'read' | 'write' | 'none',
    repository: GitHubInstallationRepositoryDTO,
  ): boolean {
    return (
      contentsPermission === 'write' &&
      repository.private &&
      !repository.archived &&
      !repository.disabled &&
      repository.permissions.admin
    );
  }

  private hashRequest(request: CreateConfirmedKnowledgeNoteReq): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          connectionId: request.connectionId,
          proposalId: request.proposalId,
          revision: request.revision,
          requestId: request.requestId,
          proposedPath: request.proposedPath,
          title: request.title,
          frontmatter: request.frontmatter,
          content: request.content,
          reason: request.reason,
        }),
      )
      .digest('hex');
  }
}
