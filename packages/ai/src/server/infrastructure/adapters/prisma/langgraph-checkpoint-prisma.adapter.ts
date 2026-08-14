/**
 * LangGraphCheckpoint Prisma Adapter
 *
 * Prisma implementation of ILangGraphCheckpointPort (API / Prisma lane only).
 * Owns the LangGraph checkpoint tables; the API transport consumes it through
 * the application seam, never directly.
 *
 * LangGraphCheckpoint Prisma 适配器
 *
 * ILangGraphCheckpointPort 的 Prisma 实现（仅 API / Prisma lane）。
 * 持有 LangGraph checkpoint 表；API transport 通过应用 seam 消费，绝不直接使用。
 */
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@memoflow/database';
import { Prisma } from '@memoflow/database/prisma';
import { createLogger } from '@memoflow/utils/logger';
import type {
  ILangGraphCheckpointPort,
  LangGraphCheckpointDeleteThreadInput,
  LangGraphCheckpointGetInput,
  LangGraphCheckpointListInput,
  LangGraphCheckpointPutInput,
  LangGraphCheckpointPutWritesInput,
  LangGraphCheckpointTupleRecord,
  LangGraphCheckpointWriteRecord,
} from '../../../application/ports';

const logger = createLogger('LangGraphCheckpointPrismaAdapter');

type LangGraphCheckpointRow = {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs: string;
  checkpointId: string;
  parentCheckpointId: string | null;
  checkpointType: string;
  checkpointData: Buffer | Uint8Array;
  metadataType: string;
  metadataData: Buffer | Uint8Array;
  createdAt: Date;
};

type LangGraphCheckpointWriteRow = {
  taskId: string;
  taskPath: string;
  idx: number;
  channel: string;
  valueType: string;
  valueData: Buffer | Uint8Array;
  createdAt: Date;
};

function toBuffer(value: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

function encodeBinary(value: Buffer | Uint8Array): string {
  return toBuffer(value).toString('base64');
}

function rowToPendingWrite(row: LangGraphCheckpointWriteRow): LangGraphCheckpointWriteRecord {
  return {
    taskId: row.taskId,
    taskPath: row.taskPath,
    idx: row.idx,
    channel: row.channel,
    value: {
      type: row.valueType,
      data: encodeBinary(row.valueData),
    },
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * @internal Concrete Prisma implementation — consumers should use ILangGraphCheckpointPort.
 * @internal Prisma 具体实现 —— 消费方应使用 ILangGraphCheckpointPort 接口。
 */
export class LangGraphCheckpointPrismaAdapter implements ILangGraphCheckpointPort {
  constructor(private readonly prisma: PrismaClient) {}

  async putCheckpoint(input: LangGraphCheckpointPutInput): Promise<void> {
    const checkpointNs = input.checkpointNs ?? '';
    const checkpointBlob = Buffer.from(input.checkpoint.data, 'base64');
    const metadataBlob = Buffer.from(input.metadata.data, 'base64');

    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "langgraph_checkpoints" (
          "id",
          "identity_id",
          "agent_type",
          "thread_id",
          "checkpoint_ns",
          "checkpoint_id",
          "parent_checkpoint_id",
          "checkpoint_type",
          "checkpoint_blob",
          "metadata_type",
          "metadata_blob"
        ) VALUES (
          ${randomUUID()},
          ${input.identityId},
          ${input.agentType},
          ${input.threadId},
          ${checkpointNs},
          ${input.checkpointId},
          ${input.parentCheckpointId ?? null},
          ${input.checkpoint.type},
          ${checkpointBlob},
          ${input.metadata.type},
          ${metadataBlob}
        )
        ON CONFLICT ("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id")
        DO UPDATE SET
          "parent_checkpoint_id" = EXCLUDED."parent_checkpoint_id",
          "checkpoint_type" = EXCLUDED."checkpoint_type",
          "checkpoint_blob" = EXCLUDED."checkpoint_blob",
          "metadata_type" = EXCLUDED."metadata_type",
          "metadata_blob" = EXCLUDED."metadata_blob"
      `,
    );

    logger.debug('LangGraph checkpoint upserted', {
      identityId: input.identityId,
      agentType: input.agentType,
      threadId: input.threadId,
      checkpointId: input.checkpointId,
    });
  }

  async getCheckpoint(
    input: LangGraphCheckpointGetInput,
  ): Promise<LangGraphCheckpointTupleRecord | null> {
    const rows = await this.prisma.$queryRaw<LangGraphCheckpointRow[]>(
      input.checkpointId
        ? Prisma.sql`
            SELECT
              "identity_id" AS "identityId",
              "agent_type" AS "agentType",
              "thread_id" AS "threadId",
              "checkpoint_ns" AS "checkpointNs",
              "checkpoint_id" AS "checkpointId",
              "parent_checkpoint_id" AS "parentCheckpointId",
              "checkpoint_type" AS "checkpointType",
              "checkpoint_blob" AS "checkpointData",
              "metadata_type" AS "metadataType",
              "metadata_blob" AS "metadataData",
              "created_at" AS "createdAt"
            FROM "langgraph_checkpoints"
            WHERE "identity_id" = ${input.identityId}
              AND "agent_type" = ${input.agentType}
              AND "thread_id" = ${input.threadId}
              AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
              AND "checkpoint_id" = ${input.checkpointId}
            LIMIT 1
          `
        : Prisma.sql`
            SELECT
              "identity_id" AS "identityId",
              "agent_type" AS "agentType",
              "thread_id" AS "threadId",
              "checkpoint_ns" AS "checkpointNs",
              "checkpoint_id" AS "checkpointId",
              "parent_checkpoint_id" AS "parentCheckpointId",
              "checkpoint_type" AS "checkpointType",
              "checkpoint_blob" AS "checkpointData",
              "metadata_type" AS "metadataType",
              "metadata_blob" AS "metadataData",
              "created_at" AS "createdAt"
            FROM "langgraph_checkpoints"
            WHERE "identity_id" = ${input.identityId}
              AND "agent_type" = ${input.agentType}
              AND "thread_id" = ${input.threadId}
              AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
            ORDER BY "checkpoint_id" DESC
            LIMIT 1
          `,
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    const pendingWrites = await this.listPendingWrites(row);

    return {
      identityId: row.identityId,
      agentType: row.agentType,
      threadId: row.threadId,
      checkpointNs: row.checkpointNs,
      checkpointId: row.checkpointId,
      parentCheckpointId: row.parentCheckpointId,
      checkpoint: {
        type: row.checkpointType,
        data: encodeBinary(row.checkpointData),
      },
      metadata: {
        type: row.metadataType,
        data: encodeBinary(row.metadataData),
      },
      createdAt: row.createdAt.toISOString(),
      pendingWrites,
    };
  }

  async listCheckpoints(
    input: LangGraphCheckpointListInput,
  ): Promise<LangGraphCheckpointTupleRecord[]> {
    const rows = await this.prisma.$queryRaw<LangGraphCheckpointRow[]>(
      input.beforeCheckpointId
        ? Prisma.sql`
            SELECT
              "identity_id" AS "identityId",
              "agent_type" AS "agentType",
              "thread_id" AS "threadId",
              "checkpoint_ns" AS "checkpointNs",
              "checkpoint_id" AS "checkpointId",
              "parent_checkpoint_id" AS "parentCheckpointId",
              "checkpoint_type" AS "checkpointType",
              "checkpoint_blob" AS "checkpointData",
              "metadata_type" AS "metadataType",
              "metadata_blob" AS "metadataData",
              "created_at" AS "createdAt"
            FROM "langgraph_checkpoints"
            WHERE "identity_id" = ${input.identityId}
              AND "agent_type" = ${input.agentType}
              AND "thread_id" = ${input.threadId}
              AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
              AND "checkpoint_id" < ${input.beforeCheckpointId}
            ORDER BY "checkpoint_id" DESC
            LIMIT ${input.limit ?? 50}
          `
        : Prisma.sql`
            SELECT
              "identity_id" AS "identityId",
              "agent_type" AS "agentType",
              "thread_id" AS "threadId",
              "checkpoint_ns" AS "checkpointNs",
              "checkpoint_id" AS "checkpointId",
              "parent_checkpoint_id" AS "parentCheckpointId",
              "checkpoint_type" AS "checkpointType",
              "checkpoint_blob" AS "checkpointData",
              "metadata_type" AS "metadataType",
              "metadata_blob" AS "metadataData",
              "created_at" AS "createdAt"
            FROM "langgraph_checkpoints"
            WHERE "identity_id" = ${input.identityId}
              AND "agent_type" = ${input.agentType}
              AND "thread_id" = ${input.threadId}
              AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
            ORDER BY "checkpoint_id" DESC
            LIMIT ${input.limit ?? 50}
          `,
    );

    return Promise.all(
      rows.map(async (row) => ({
        identityId: row.identityId,
        agentType: row.agentType,
        threadId: row.threadId,
        checkpointNs: row.checkpointNs,
        checkpointId: row.checkpointId,
        parentCheckpointId: row.parentCheckpointId,
        checkpoint: {
          type: row.checkpointType,
          data: encodeBinary(row.checkpointData),
        },
        metadata: {
          type: row.metadataType,
          data: encodeBinary(row.metadataData),
        },
        createdAt: row.createdAt.toISOString(),
        pendingWrites: await this.listPendingWrites(row),
      })),
    );
  }

  async putWrites(input: LangGraphCheckpointPutWritesInput): Promise<void> {
    for (const write of input.writes) {
      await this.prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO "langgraph_checkpoint_writes" (
            "id",
            "identity_id",
            "agent_type",
            "thread_id",
            "checkpoint_ns",
            "checkpoint_id",
            "task_id",
            "task_path",
            "idx",
            "channel",
            "value_type",
            "value_blob"
          ) VALUES (
            ${randomUUID()},
            ${input.identityId},
            ${input.agentType},
            ${input.threadId},
            ${input.checkpointNs ?? ''},
            ${input.checkpointId},
            ${input.taskId},
            ${input.taskPath ?? ''},
            ${write.idx},
            ${write.channel},
            ${write.value.type},
            ${Buffer.from(write.value.data, 'base64')}
          )
          ON CONFLICT ("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx")
          DO UPDATE SET
            "task_path" = EXCLUDED."task_path",
            "channel" = EXCLUDED."channel",
            "value_type" = EXCLUDED."value_type",
            "value_blob" = EXCLUDED."value_blob"
        `,
      );
    }
  }

  async deleteThread(input: LangGraphCheckpointDeleteThreadInput): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.$executeRaw(
        Prisma.sql`
          DELETE FROM "langgraph_checkpoint_writes"
          WHERE "identity_id" = ${input.identityId}
            AND "agent_type" = ${input.agentType}
            AND "thread_id" = ${input.threadId}
            AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
        `,
      ),
      this.prisma.$executeRaw(
        Prisma.sql`
          DELETE FROM "langgraph_checkpoints"
          WHERE "identity_id" = ${input.identityId}
            AND "agent_type" = ${input.agentType}
            AND "thread_id" = ${input.threadId}
            AND "checkpoint_ns" = ${input.checkpointNs ?? ''}
        `,
      ),
    ]);
  }

  private async listPendingWrites(row: {
    identityId: string;
    agentType: string;
    threadId: string;
    checkpointNs: string;
    checkpointId: string;
  }): Promise<LangGraphCheckpointWriteRecord[]> {
    const writes = await this.prisma.$queryRaw<LangGraphCheckpointWriteRow[]>(
      Prisma.sql`
        SELECT
          "task_id" AS "taskId",
          "task_path" AS "taskPath",
          "idx",
          "channel",
          "value_type" AS "valueType",
          "value_blob" AS "valueData",
          "created_at" AS "createdAt"
        FROM "langgraph_checkpoint_writes"
        WHERE "identity_id" = ${row.identityId}
          AND "agent_type" = ${row.agentType}
          AND "thread_id" = ${row.threadId}
          AND "checkpoint_ns" = ${row.checkpointNs}
          AND "checkpoint_id" = ${row.checkpointId}
        ORDER BY "task_id" ASC, "idx" ASC, "created_at" ASC
      `,
    );

    return writes.map(rowToPendingWrite);
  }
}
