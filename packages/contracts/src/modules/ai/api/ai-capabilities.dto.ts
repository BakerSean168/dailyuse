import { z } from 'zod';

export const AIRuntimeModeSchema = z.enum(['direct-provider', 'remote-ai-service']);
export type AIRuntimeMode = z.infer<typeof AIRuntimeModeSchema>;

export const AIKnowledgeIndexDiagnosticsSchema = z.object({
  persistenceBackend: z.enum([
    'legacy-resource-metadata',
    'powersync-resource-metadata',
    'prisma-index-table',
  ]),
  persistenceStatus: z.enum(['enabled', 'fallback']),
  persistenceReason: z.string().optional(),
  vectorRecallBackend: z.enum(['none', 'local-js-hybrid', 'pgvector-ivfflat']),
  vectorRecallStatus: z.enum(['enabled', 'fallback', 'unknown']),
  vectorRecallReason: z.string().optional(),
});
export type AIKnowledgeIndexDiagnostics = z.infer<typeof AIKnowledgeIndexDiagnosticsSchema>;

export const AICapabilitiesSchema = z.object({
  runtimeMode: AIRuntimeModeSchema,
  supportsChat: z.boolean(),
  supportsGoalGeneration: z.boolean(),
  supportsKnowledgeNotes: z.boolean(),
  supportsKnowledgeQuery: z.boolean(),
  supportsKnowledgeReindex: z.boolean(),
  supportsAnalyticsQuery: z.boolean(),
  supportsGoalAutomation: z.boolean(),
  supportsEvaluationReports: z.boolean(),
  advancedFeaturesReason: z.string().optional(),
  knowledgeIndexDiagnostics: AIKnowledgeIndexDiagnosticsSchema.optional(),
});

export type AICapabilities = z.infer<typeof AICapabilitiesSchema>;
