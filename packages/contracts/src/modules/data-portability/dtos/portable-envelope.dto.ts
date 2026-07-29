/**
 * User Data Export Envelope V1 — the outermost structure of an export file
 */

import { z } from 'zod';
import { PortableUserDataV1Schema } from './portable-user-data.dto';

const PortableEnvelopeScopeSchema = z
  .object({
    includesBinaryResources: z.literal(false),
    importMode: z.literal('append-create-like'),
  })
  .strict();

export const UserDataExportEnvelopeV1Schema = z
  .object({
    kind: z.literal('memoflow.user-data-export'),
    schemaVersion: z.literal(1),
    exportedAt: z.string(),
    exportedBy: z
      .object({
        appName: z.literal('MemoFlow'),
        appVersion: z.string().optional(),
      })
      .strict()
      .optional(),
    scope: PortableEnvelopeScopeSchema,
    data: PortableUserDataV1Schema,
  })
  .strict();

export type UserDataExportEnvelopeV1 = z.infer<typeof UserDataExportEnvelopeV1Schema>;
