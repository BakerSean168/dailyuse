import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { StoredResourceHydrationService } from '../services/stored-resource-hydration.service';
import { createTestFsStorage } from '../../../testing';

describe('StoredResourceHydrationService', () => {
  it('returns the resource as-is when content is already present', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-content-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const service = new StoredResourceHydrationService({ storagePort: storage });

      const resource = {
        repositoryId: 'repo-1',
        path: '/note.md',
        content: '# Existing',
        mimeType: 'text/markdown',
      };

      const result = await service.hydrateContent(resource);
      expect(result).toBe(resource);
      expect(result?.content).toBe('# Existing');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns null when resource is null', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-null-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const service = new StoredResourceHydrationService({ storagePort: storage });

      const result = await service.hydrateContent(null);
      expect(result).toBeNull();
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('hydrates text content as utf8', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-text-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const repoId = 'repo-1';

      await storage.write({
        repositoryId: repoId,
        path: '/note.md',
        content: '# Hello World',
        isFolder: false,
      });

      const service = new StoredResourceHydrationService({ storagePort: storage });

      const resource = {
        repositoryId: repoId,
        path: '/note.md',
        content: null,
        mimeType: 'text/markdown',
      };

      const result = await service.hydrateContent(resource);
      expect(result?.content).toBe('# Hello World');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('hydrates binary content as base64', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-binary-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const repoId = 'repo-1';

      const binaryBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
      await storage.write({
        repositoryId: repoId,
        path: '/image.png',
        content: binaryBytes,
        isFolder: false,
      });

      const service = new StoredResourceHydrationService({ storagePort: storage });

      const resource = {
        repositoryId: repoId,
        path: '/image.png',
        content: null,
        mimeType: 'image/png',
      };

      const result = await service.hydrateContent(resource);
      expect(result?.content).toBe(Buffer.from(binaryBytes).toString('base64'));
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('hydrates application/json content as utf8', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-json-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const repoId = 'repo-1';

      await storage.write({
        repositoryId: repoId,
        path: '/data.json',
        content: '{"key": "value"}',
        isFolder: false,
      });

      const service = new StoredResourceHydrationService({ storagePort: storage });

      const resource = {
        repositoryId: repoId,
        path: '/data.json',
        content: null,
        mimeType: 'application/json',
      };

      const result = await service.hydrateContent(resource);
      expect(result?.content).toBe('{"key": "value"}');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns the original resource when storage has no content', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hydration-empty-'));
    try {
      const storage = createTestFsStorage(tempDir);
      const service = new StoredResourceHydrationService({ storagePort: storage });

      const resource = {
        repositoryId: 'repo-1',
        path: '/missing.md',
        content: null,
        mimeType: 'text/markdown',
      };

      const result = await service.hydrateContent(resource);
      expect(result).toBe(resource);
      expect(result?.content).toBeNull();
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
