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
import { ok } from '@dailyuse/contracts/result';
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
import type { EditorUseCases } from '../controllers/editor.controller';
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
    const handlers: EditorUseCases = {
      createWorkspace: async (data, ctx) => {
        const workspace = EditorWorkspace.create({
          identityId: ctx.identityId as IdentityId,
          name: data.name,
          description: data.description ?? undefined,
          projectPath: data.projectPath,
          projectType: data.projectType as any,
          layout: (data.layout as unknown as WorkspaceLayoutServerDTO) ?? undefined,
          settings: (data.settings as unknown as WorkspaceSettingsServerDTO) ?? undefined,
        });
        await workspaceRepo.save(workspace);
        return ok(workspace.toServerDTO());
      },

      listWorkspaces: async (ctx) => {
        const workspaces = await workspaceRepo.findByIdentityId(ctx.identityId);
        return ok({
          workspaces: workspaces.map((w) => w.toServerDTO()),
          total: workspaces.length,
        });
      },

      getWorkspace: async (id) => {
        const workspace = await workspaceRepo.findById(id);
        return ok(workspace?.toServerDTO() ?? null);
      },

      updateWorkspace: async (id, data) => {
        const workspace = await workspaceRepo.findById(id);
        if (!workspace) return ok(null);
        if (data.name !== undefined) workspace.updateName(data.name);
        if (data.description !== undefined) workspace.updateDescription(data.description ?? null);
        if (data.layout != null) workspace.updateLayout(data.layout);
        if (data.settings != null) workspace.updateSettings(data.settings);
        await workspaceRepo.save(workspace);
        return ok(workspace.toServerDTO());
      },

      deleteWorkspace: async (id) => {
        await workspaceRepo.delete(id);
        return ok(undefined);
      },

      createDocument: async (data, ctx) => {
        const doc = Document.create({
          workspaceId: data.workspaceId as unknown as EditorWorkspaceId,
          identityId: ctx.identityId as IdentityId,
          path: data.path,
          name: data.name,
          language: data.language as any,
          content: data.content,
          metadata: (data.metadata as unknown as DocumentMetadataServerDTO) ?? undefined,
        });
        await documentRepo.save(doc);
        return ok(doc.toServerDTO());
      },

      listDocuments: async (params, ctx) => {
        const documents = params.workspaceId
          ? await documentRepo.findByWorkspaceId(params.workspaceId)
          : await documentRepo.findByIdentityId(ctx.identityId);
        return ok({
          documents: documents.map((d) => d.toServerDTO()),
          total: documents.length,
        });
      },

      getDocument: async (id) => {
        const doc = await documentRepo.findById(id);
        return ok(doc?.toServerDTO() ?? null);
      },

      updateDocument: async (id, data) => {
        const doc = await documentRepo.findById(id);
        if (!doc) return ok(null);
        if (data.content !== undefined) doc.updateContent(data.content);
        if (data.metadata != null) {
          const merged = { ...doc.metadata, ...data.metadata } as DocumentMetadataServerDTO;
          doc.updateMetadata(merged);
        }
        await documentRepo.save(doc);
        return ok(doc.toServerDTO());
      },

      deleteDocument: async (id) => {
        await documentRepo.delete(id);
        return ok(undefined);
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