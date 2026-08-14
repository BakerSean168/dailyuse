/**
 * AgentCheckpoint Prisma Adapter
 *
 * Prisma implementation of IAgentCheckpointPort (API / Prisma lane only).
 * Owns the agentRunCheckpoint table; the API transport consumes it through
 * the application seam, never directly.
 *
 * AgentCheckpoint Prisma 适配器
 *
 * IAgentCheckpointPort 的 Prisma 实现（仅 API / Prisma lane）。
 * 持有 agentRunCheckpoint 表；API transport 通过应用 seam 消费，绝不直接使用。
 */

/**
 * Residual 979: toPrismaJson sole import (./to-prisma-json.ts).
 */
import type { PrismaClient } from '@memoflow/database';
import type { AgentRun, AgentRunResult } from '@memoflow/contracts/ai';
import { AgentRunSchema, AgentRunResultSchema, AgentStateSchema } from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@memoflow/database/prisma';
import { toPrismaJson } from './to-prisma-json';
import { ResultErrorException, toResultErrorException } from '@memoflow/contracts/result';
import type {
  AgentCheckpointDeleteInput,
  AgentCheckpointGetInput,
  AgentCheckpointListInput,
  AgentCheckpointUpsertInput,
  IAgentCheckpointPort,
} from '../../../application/ports';

const logger = createLogger('AgentCheckpointPrismaAdapter');


function toNullablePrismaJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value == null ? Prisma.NullableJsonNullValueInput.DbNull : toPrismaJson(value);
}

/**
 * @internal Concrete Prisma implementation — consumers should use IAgentCheckpointPort.
 * @internal Prisma 具体实现 —— 消费方应使用 IAgentCheckpointPort 接口。
 */
export class AgentCheckpointPrismaAdapter implements IAgentCheckpointPort {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: AgentCheckpointUpsertInput): Promise<void> {
    const { identityId, run, state, threadId, events, interrupts } = input;

    // Reject spoofed run.identityId and foreign-owned runId overwrite (residual 105).
    if (run.identityId !== identityId) {
      throw toResultErrorException(
        {
          code: 'FORBIDDEN',
          message: 'Agent checkpoint run identity does not match the authenticated identity.',
        },
        403,
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.agentRunCheckpoint.findUnique({
          where: { runId: run.runId },
          select: { identityId: true },
        });

        if (existing && existing.identityId !== identityId) {
          throw toResultErrorException(
            {
              code: 'FORBIDDEN',
              message: 'Agent checkpoint is not owned by the current identity.',
            },
            403,
          );
        }

        if (existing) {
          await tx.agentRunCheckpoint.update({
            where: { runId: run.runId },
            data: {
              conversationId: run.conversationId ?? null,
              threadId: threadId ?? run.threadId,
              agentType: run.agentType,
              status: run.status,
              runMetadata: toPrismaJson(run),
              stateSnapshot: toNullablePrismaJson(state),
              events: events ? toPrismaJson(events) : undefined,
              interrupts: interrupts ? toPrismaJson(interrupts) : undefined,
              deletedAt: null,
              updatedAt: new Date(),
            },
          });
          return;
        }

        await tx.agentRunCheckpoint.create({
          data: {
            id: randomUUID(),
            runId: run.runId,
            identityId,
            conversationId: run.conversationId ?? null,
            threadId: threadId ?? run.threadId,
            agentType: run.agentType,
            status: run.status,
            runMetadata: toPrismaJson(run),
            stateSnapshot: toNullablePrismaJson(state),
            events: toPrismaJson(events ?? []),
            interrupts: toPrismaJson(interrupts ?? []),
          },
        });
      });

      logger.debug('Agent checkpoint upserted', {
        runId: run.runId,
        identityId,
        status: run.status,
      });
    } catch (error) {
      if (error instanceof ResultErrorException) {
        throw error;
      }
      logger.error('Failed to upsert agent checkpoint', error, {
        runId: run.runId,
        identityId,
      });
      throw error;
    }
  }

  async get(input: AgentCheckpointGetInput): Promise<AgentRunResult | null> {
    const { identityId, runId } = input;

    try {
      const checkpoint = await this.prisma.agentRunCheckpoint.findFirst({
        where: {
          runId,
          identityId,
          deletedAt: null,
        },
      });

      if (!checkpoint) {
        return null;
      }

      const run = AgentRunSchema.parse(checkpoint.runMetadata);
      // Defense-in-depth: refuse metadata that spoofs another identity (residual 107).
      if (run.identityId !== identityId) {
        logger.warn('Agent checkpoint metadata identity mismatch; treating as not found', {
          runId,
          identityId,
          metadataIdentityId: run.identityId,
        });
        return null;
      }
      const state = checkpoint.stateSnapshot
        ? AgentStateSchema.parse(checkpoint.stateSnapshot)
        : undefined;
      const events = Array.isArray(checkpoint.events) ? checkpoint.events : [];
      const interrupts = Array.isArray(checkpoint.interrupts) ? checkpoint.interrupts : [];

      return AgentRunResultSchema.parse({
        run,
        state,
        events,
        interrupts,
      });
    } catch (error) {
      logger.error('Failed to get agent checkpoint', error, {
        runId,
        identityId,
      });
      throw error;
    }
  }

  async list(input: AgentCheckpointListInput): Promise<AgentRun[]> {
    const { identityId, agentType, conversationId, statuses, activeOnly, limit } = input;

    try {
      const where = {
        identityId,
        ...(agentType ? { agentType } : {}),
        deletedAt: null,
        ...(conversationId ? { conversationId } : {}),
        ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
        ...(activeOnly
          ? {
              status: {
                in: [
                  'pending',
                  'running',
                  'waiting_clarification',
                  'waiting_approval',
                  'waiting_execution',
                ],
              },
            }
          : {}),
      };

      const checkpoints = await this.prisma.agentRunCheckpoint.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit ?? undefined,
      });

      // Defense-in-depth: drop rows whose run metadata spoofs another identity (residual 107).
      return checkpoints
        .map((checkpoint) => AgentRunSchema.parse(checkpoint.runMetadata))
        .filter((run) => run.identityId === identityId);
    } catch (error) {
      logger.error('Failed to list agent checkpoints', error, {
        identityId,
        conversationId,
      });
      throw error;
    }
  }

  async delete(input: AgentCheckpointDeleteInput): Promise<void> {
    const { identityId, runId } = input;

    try {
      await this.prisma.agentRunCheckpoint.updateMany({
        where: {
          runId,
          identityId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.debug('Agent checkpoint deleted', {
        runId,
        identityId,
      });
    } catch (error) {
      logger.error('Failed to delete agent checkpoint', error, {
        runId,
        identityId,
      });
      throw error;
    }
  }

  async getThreadIndex(
    identityId: string,
    agentType?: string,
  ): Promise<Record<string, string>> {
    try {
      const checkpoints = await this.prisma.agentRunCheckpoint.findMany({
        where: {
          identityId,
          ...(agentType ? { agentType } : {}),
          deletedAt: null,
        },
        select: {
          runId: true,
          threadId: true,
        },
      });

      const index: Record<string, string> = {};
      for (const checkpoint of checkpoints) {
        index[checkpoint.runId] = checkpoint.threadId;
      }

      return index;
    } catch (error) {
      logger.error('Failed to get thread index', error, {
        identityId,
      });
      throw error;
    }
  }
}
