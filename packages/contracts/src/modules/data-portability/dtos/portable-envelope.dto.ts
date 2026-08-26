/** User Data Export Envelope V2 — Core vNext business backup. */
import { z } from 'zod';
import { PortableUserDataV2Schema } from './portable-user-data.dto';

const PortableEnvelopeScopeSchema = z.object({
  includesBinaryResources: z.literal(false),
  importMode: z.literal('append-create-like'),
}).strict();

export const UserDataExportEnvelopeV2Schema = z.object({
  kind: z.literal('memoflow.user-data-export'),
  schemaVersion: z.literal(2),
  exportedAt: z.string(),
  exportedBy: z.object({
    appName: z.literal('MemoFlow'),
    appVersion: z.string().optional(),
  }).strict().optional(),
  scope: PortableEnvelopeScopeSchema,
  data: PortableUserDataV2Schema,
}).strict();
export type UserDataExportEnvelopeV2 = z.infer<typeof UserDataExportEnvelopeV2Schema>;
