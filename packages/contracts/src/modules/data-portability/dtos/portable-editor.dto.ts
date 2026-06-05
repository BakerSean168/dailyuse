/**
 * Portable Editor DTOs
 */

import { z } from 'zod';
import { PortableRefSchema, IsoDateString } from './portable-common.dto';

export const PortableEditorTabSchema = z
  .object({
    _ref: PortableRefSchema,
    resourceRef: PortableRefSchema.nullable().optional(),
    tabIndex: z.number(),
    tabType: z.string(),
    name: z.string(),
    viewState: z.unknown(),
    isPinned: z.boolean(),
    isActive: z.boolean(),
    isDirty: z.boolean(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
  })
  .strict();

export type PortableEditorTab = z.infer<typeof PortableEditorTabSchema>;

export const PortableEditorGroupSchema = z
  .object({
    _ref: PortableRefSchema,
    groupIndex: z.number(),
    activeTabIndex: z.number(),
    name: z.string().nullable().optional(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    tabs: z.array(PortableEditorTabSchema),
  })
  .strict();

export type PortableEditorGroup = z.infer<typeof PortableEditorGroupSchema>;

export const PortableEditorSessionSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    layout: z.unknown(),
    isActive: z.boolean(),
    activeGroupIndex: z.number(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    groups: z.array(PortableEditorGroupSchema),
  })
  .strict();

export type PortableEditorSession = z.infer<typeof PortableEditorSessionSchema>;

export const PortableEditorWorkspaceSchema = z
  .object({
    _ref: PortableRefSchema,
    name: z.string(),
    description: z.string().nullable().optional(),
    projectPath: z.string(),
    projectType: z.string(),
    layout: z.unknown(),
    settings: z.unknown(),
    isActive: z.boolean(),
    createdAt: IsoDateString.optional(),
    updatedAt: IsoDateString.optional(),
    sessions: z.array(PortableEditorSessionSchema),
  })
  .strict();

export type PortableEditorWorkspace = z.infer<typeof PortableEditorWorkspaceSchema>;

export const PortableEditorDataSchema = z
  .object({
    workspaces: z.array(PortableEditorWorkspaceSchema),
  })
  .strict();

export type PortableEditorData = z.infer<typeof PortableEditorDataSchema>;
