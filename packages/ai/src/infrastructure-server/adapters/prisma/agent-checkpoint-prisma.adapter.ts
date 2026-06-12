import type { PrismaClient } from '@dailyuse/database';
import type { AgentRun, AgentRunResult, AgentState } from '@dailyuse/contracts/ai';
import { AgentRunSchema, AgentRunResultSchema, AgentStateSchema } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils/logger';
import { randomUUID } from 'node:crypto';
import type {
  AgentCheckpointDeleteInput,
  AgentCheckpointGetInput,
  AgentCheckpointListInput,
  AgentCheckpointUpsertInput,
  IAgentCheckpointPort,
} from '../../../application-server/ports';

const logger = createLogger('AgentCheckpointPrismaAdapter');

export class AgentCheckpointPrismaAdapter implements IAgentCheckpointPort {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: AgentCheckpointUpsertInput): Promise<void> {
    const { identityId, run, state, threadId } = input;

    try {
      await this.prisma.agentRunCheckpoint.upsert({
        where: { runId: run.runId },
        create: {
          id: randomUUID(),
          runId: run.runId,
          identityId,
          conversationId: run.conversationId ?? null,
          threadId: threadId ?? run.threadId,
          agentType: run.agentType,
          status: run.status,
          runMetadata: run as any,
          stateSnapshot: state ? (state as any) : null,
          events: [],
          interrupts: [],
        },
        update: {
          status: run.status,
          runMetadata: run as any,
          stateSnapshot: state ? (state as any) : null,
          updatedAt: new Date(),
        },
      });

      logger.debug('Agent checkpoint upserted', {
        runId: run.runId,
        identityId,
        status: run.status,
      });
    } catch (error) {
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
    const { identityId, conversationId, statuses, activeOnly, limit } = input;

    try {
      const where = {
        identityId,
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

      return checkpoints.map((checkpoint) => {
        const metadata = checkpoint.runMetadata as unknown as Record<string, unknown>;
        return AgentRunSchema.parse(metadata);
      });
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

  async getThreadIndex(identityId: string): Promise<Record<string, string>> {
    try {
      const checkpoints = await this.prisma.agentRunCheckpoint.findMany({
        where: {
          identityId,
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
