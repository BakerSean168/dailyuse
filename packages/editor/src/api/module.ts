/**
 * Editor API Module Definition
 *
 * Composition root for the Editor module:
 * 1. Creates repositories with PrismaClient
 * 2. Wires handlers directly to repository methods
 * 3. Registers routes and initialization tasks
 */

import type { Router, Express, RequestHandler } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import type { IdentityId, EditorWorkspaceId } from '@dailyuse/contracts/primitives';
import type { WorkspaceLayoutServerDTO, WorkspaceSettingsServerDTO, DocumentMetadataServerDTO } from '@dailyuse/contracts/editor';
import {
  EditorWorkspacePrismaRepository,
  DocumentPrismaRepository,
} from '../infrastructure-server';
import { EditorContainer } from '../infrastructure-server/di/editor-container';
import { EditorWorkspace } from '../domain-server';
import { Document } from '../domain-server';
import { registerEditorRoutes } from './routes';
import type { EditorRouteHandlers } from './routes';
import { registerEditorInitializationTasks } from './initialization';

export interface EditorApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
}

export interface EditorApiModuleDef {
  readonly name: string;
  register(context: EditorApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const EditorApiModule: EditorApiModuleDef = {
  name: 'Editor',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Create repositories
    const prismaClient = db as PrismaClient;
    const workspaceRepo = new EditorWorkspacePrismaRepository(prismaClient);
    const documentRepo = new DocumentPrismaRepository(prismaClient);

    // 2. Wire handlers directly to repository methods
    const handlers: EditorRouteHandlers = {
      createWorkspace: async (identityId, data) => {
        const workspace = EditorWorkspace.create({
          identityId: identityId as IdentityId,
          name: data.name,
          description: data.description ?? undefined,
          projectPath: data.projectPath,
          projectType: data.projectType,
          layout: (data.layout as WorkspaceLayoutServerDTO) ?? undefined,
          settings: (data.settings as WorkspaceSettingsServerDTO) ?? undefined,
        });
        await workspaceRepo.save(workspace);
        return workspace.toServerDTO();
      },

      listWorkspaces: async (identityId) => {
        const workspaces = await workspaceRepo.findByIdentityId(identityId);
        return {
          workspaces: workspaces.map((w) => w.toServerDTO()),
          total: workspaces.length,
        };
      },

      getWorkspace: async (id) => {
        const workspace = await workspaceRepo.findById(id);
        return workspace?.toServerDTO() ?? null;
      },

      updateWorkspace: async (id, data) => {
        const workspace = await workspaceRepo.findById(id);
        if (!workspace) return null;
        if (data.name !== undefined) workspace.updateName(data.name);
        if (data.description !== undefined) workspace.updateDescription(data.description ?? null);
        if (data.layout != null) workspace.updateLayout(data.layout);
        if (data.settings != null) workspace.updateSettings(data.settings);
        await workspaceRepo.save(workspace);
        return workspace.toServerDTO();
      },

      deleteWorkspace: async (id) => {
        await workspaceRepo.delete(id);
      },

      createDocument: async (identityId, data) => {
        const doc = Document.create({
          workspaceId: data.workspaceId as unknown as EditorWorkspaceId,
          identityId: identityId as IdentityId,
          path: data.path,
          name: data.name,
          language: data.language,
          content: data.content,
          metadata: (data.metadata as DocumentMetadataServerDTO) ?? undefined,
        });
        await documentRepo.save(doc);
        return doc.toServerDTO();
      },

      listDocuments: async ({ workspaceId, identityId }) => {
        const documents = workspaceId
          ? await documentRepo.findByWorkspaceId(workspaceId)
          : await documentRepo.findByIdentityId(identityId);
        return {
          documents: documents.map((d) => d.toServerDTO()),
          total: documents.length,
        };
      },

      getDocument: async (id) => {
        const doc = await documentRepo.findById(id);
        return doc?.toServerDTO() ?? null;
      },

      updateDocument: async (id, data) => {
        const doc = await documentRepo.findById(id);
        if (!doc) return null;
        if (data.content !== undefined) doc.updateContent(data.content);
        if (data.metadata != null) {
          const merged = { ...doc.metadata, ...data.metadata } as DocumentMetadataServerDTO;
          doc.updateMetadata(merged);
        }
        await documentRepo.save(doc);
        return doc.toServerDTO();
      },

      deleteDocument: async (id) => {
        await documentRepo.delete(id);
      },
    };

    // 3. Register routes
    const editorRoutes = registerEditorRoutes(handlers, middleware);
    router.use('/editor', editorRoutes);

    // 4. Register initialization tasks
    registerEditorInitializationTasks();
  },

  destroy() {
    EditorContainer.getInstance().reset();
  },
};