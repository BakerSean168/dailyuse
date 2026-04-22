import { z } from 'zod';
import { brandedId, openApiJsonValue } from '../../../primitives';
import type { EditorGroupId, EditorSessionId, EditorTabId, EditorWorkspaceId } from '../../../primitives';
import { TabType } from '../value-objects/tab-type';

const JsonRecordSchema = z.record(z.string(), openApiJsonValue);

export const CreateEditorSessionSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  layout: JsonRecordSchema.optional().nullable(),
});

export type CreateEditorSessionReq = z.infer<typeof CreateEditorSessionSchema>;

export const UpdateEditorSessionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  layout: JsonRecordSchema.optional().nullable(),
  activeGroupIndex: z.number().int().min(0).optional(),
});

export type UpdateEditorSessionReq = z.infer<typeof UpdateEditorSessionSchema>;

export const CreateEditorGroupSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  groupIndex: z.number().int().min(0),
  name: z.string().max(200).optional().nullable(),
});

export type CreateEditorGroupReq = z.infer<typeof CreateEditorGroupSchema>;

export const UpdateEditorGroupSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  name: z.string().max(200).optional().nullable(),
  activeTabIndex: z.number().int().min(0).optional(),
});

export type UpdateEditorGroupReq = z.infer<typeof UpdateEditorGroupSchema>;

export const CreateEditorTabSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  groupId: brandedId<EditorGroupId>(),
  resourceId: z.string().optional().nullable(),
  tabIndex: z.number().int().min(0),
  tabType: z.enum(TabType),
  title: z.string().min(1).max(500),
  viewState: JsonRecordSchema.optional().nullable(),
});

export type CreateEditorTabReq = z.infer<typeof CreateEditorTabSchema>;

export const UpdateEditorTabSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  groupId: brandedId<EditorGroupId>(),
  title: z.string().min(1).max(500).optional(),
  viewState: JsonRecordSchema.optional().nullable(),
  isPinned: z.boolean().optional(),
  isDirty: z.boolean().optional(),
});

export type UpdateEditorTabReq = z.infer<typeof UpdateEditorTabSchema>;

export const SaveEditorContentSchema = z.object({
  content: z.string(),
});

export type SaveEditorContentReq = z.infer<typeof SaveEditorContentSchema>;

export const ActivateEditorSessionParamsSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
});

export const DeleteEditorGroupParamsSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  groupId: brandedId<EditorGroupId>(),
});

export const ActivateEditorTabParamsSchema = z.object({
  workspaceId: brandedId<EditorWorkspaceId>(),
  sessionId: brandedId<EditorSessionId>(),
  groupId: brandedId<EditorGroupId>(),
  tabId: brandedId<EditorTabId>(),
});

export const DeleteEditorTabParamsSchema = ActivateEditorTabParamsSchema;
