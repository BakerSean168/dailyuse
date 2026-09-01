import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  ConfirmedLocalVaultWriteReq,
  ConfirmedLocalVaultWriteRes,
  KnowledgeRepositoryContentState,
  LocalVaultBindingClientDTO,
  LocalVaultNoteDTO,
  LocalVaultNoteSummaryDTO,
  OpenLocalVaultInObsidianReq,
  ReadLocalVaultNoteReq,
  ScanLocalVaultRes,
  SearchLocalVaultReq,
  SearchLocalVaultRes,
  SelectLocalVaultReq,
} from '@memoflow/contracts/repository';
// Residual 957: isMissing/isTemporaryFile duals retired — sole vault-fs-guards.
import { isMissing, isTemporaryFile } from './vault-fs-guards';

const MAX_NOTE_BYTES = 2 * 1024 * 1024;
const MAX_WRITE_BYTES = 1024 * 1024;
const MAX_SCAN_NOTES = 10_000;
const MAX_SEARCH_RESULTS = 200;
const IGNORED_DIRECTORIES = new Set(['.git', '.obsidian', '.trash', '.Trash', 'node_modules']);
const SYNC_IGNORED_DIRECTORIES = new Set([...IGNORED_DIRECTORIES, '.memory-flow']);

interface StoredBinding extends LocalVaultBindingClientDTO {
  schemaVersion: 1;
}

interface WriteLedgerEntry {
  requestId: string;
  proposalId: string;
  proposalRevision: number;
  relativePath: string;
  createdAt: number;
}

interface WriteLedger {
  schemaVersion: 1;
  entries: WriteLedgerEntry[];
}

export interface LocalVaultPlatform {
  selectDirectory(options: { suggestedPath?: string }): Promise<string | null>;
  openExternal(uri: string): Promise<void>;
}

export interface LocalVaultRuntimeOptions {
  bindingFilePath: string;
  writeLedgerFilePath: string;
  platform?: LocalVaultPlatform;
  now?: () => number;
}

export class LocalVaultRuntimeError extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'FORBIDDEN' | 'INTERNAL_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'LocalVaultRuntimeError';
  }
}

export interface LocalVaultElectronPort {
  getBinding(identityId: string): Promise<LocalVaultBindingClientDTO | null>;
  selectVault(
    identityId: string,
    request?: SelectLocalVaultReq,
  ): Promise<LocalVaultBindingClientDTO | null>;
  detachVault(identityId: string): Promise<void>;
  scanVault(identityId: string): Promise<ScanLocalVaultRes>;
  readNote(identityId: string, request: ReadLocalVaultNoteReq): Promise<LocalVaultNoteDTO>;
  searchVault(identityId: string, request: SearchLocalVaultReq): Promise<SearchLocalVaultRes>;
  openInObsidian(identityId: string, request: OpenLocalVaultInObsidianReq): Promise<void>;
  writeConfirmedNote(
    identityId: string,
    request: ConfirmedLocalVaultWriteReq,
  ): Promise<ConfirmedLocalVaultWriteRes>;
  inspectSyncContent(identityId: string): Promise<KnowledgeRepositoryContentState>;
}

/**
 * Default external-URI opener. Used only when no capability port is injected;
 * the desktop composition root injects a registry-backed `ExternalEditorPort`
 * so consumers never reach this Electron `shell` call directly.
 */
async function defaultOpenExternal(uri: string): Promise<void> {
  const { shell } = await import('electron');
  await shell.openExternal(uri);
}

/**
 * Builds the Electron-backed Local Vault platform.
 *
 * `selectDirectory` always uses Electron's native directory dialog (vault
 * selection is host-specific and not part of the external-editor capability).
 * `openExternal` defaults to Electron's `shell.openExternal` but can be
 * overridden — the desktop composition root injects the registry-owned
 * `ExternalEditorPort.openExternal` here, so `openInObsidian` routes through the
 * single capability registry instead of constructing a second Electron shell
 * provider.
 */
export function createElectronLocalVaultPlatform(
  override?: Partial<Pick<LocalVaultPlatform, 'openExternal'>>,
): LocalVaultPlatform {
  return {
    async selectDirectory({ suggestedPath }) {
      const { dialog } = await import('electron');
      const result = await dialog.showOpenDialog({
        title: 'Select Obsidian vault',
        defaultPath: suggestedPath,
        properties: ['openDirectory', 'createDirectory'],
      });
      return result.canceled ? null : (result.filePaths[0] ?? null);
    },
    async openExternal(uri) {
      await (override?.openExternal ?? defaultOpenExternal)(uri);
    },
  };
}

function toPortablePath(value: string): string {
  return value.split(path.sep).join('/');
}


function normalizeRelativeMarkdownPath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').trim().replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
    throw new LocalVaultRuntimeError('VALIDATION_ERROR', 'Vault note path must be relative');
  }

  const segments = normalized.split('/');
  if (
    segments.some(
      (segment) =>
        !segment || segment === '.' || segment === '..' || /[\u0000<>:"|?*]/.test(segment),
    )
  ) {
    throw new LocalVaultRuntimeError('VALIDATION_ERROR', 'Vault note path is invalid');
  }
  if (!/\.md$/i.test(normalized)) {
    throw new LocalVaultRuntimeError('VALIDATION_ERROR', 'Vault notes must use the .md extension');
  }
  return segments.join('/');
}

function assertContained(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new LocalVaultRuntimeError('FORBIDDEN', 'Path escapes the selected Vault');
  }
}

function extractOutgoingLinks(markdown: string): string[] {
  const links = new Set<string>();
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const match of withoutCode.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const target = match[1]?.split('|', 1)[0]?.split('#', 1)[0]?.trim();
    if (target) links.add(target);
  }
  return [...links];
}

function extractTitle(
  relativePath: string,
  markdownBody: string,
  frontmatter: Record<string, unknown>,
) {
  if (typeof frontmatter['title'] === 'string' && frontmatter['title'].trim()) {
    return frontmatter['title'].trim();
  }
  const heading = markdownBody.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || path.basename(relativePath, path.extname(relativePath));
}

function extractTags(frontmatter: Record<string, unknown>): string[] {
  const value = frontmatter['tags'];
  const tags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [
    ...new Set(
      tags
        .filter((item): item is string => typeof item === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function buildExcerpt(markdownBody: string): string {
  return markdownBody
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}


async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.promises.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await fs.promises.rename(temporaryPath, filePath);
}

export class LocalVaultRuntime implements LocalVaultElectronPort {
  private readonly platform: LocalVaultPlatform;
  private readonly now: () => number;

  constructor(private readonly options: LocalVaultRuntimeOptions) {
    this.platform = options.platform ?? createElectronLocalVaultPlatform();
    this.now = options.now ?? Date.now;
  }

  async getBinding(identityId: string): Promise<LocalVaultBindingClientDTO | null> {
    const binding = await this.loadBinding();
    if (!binding) return null;

    let status = binding.status;
    if (status !== 'Detached') {
      try {
        const stat = await fs.promises.stat(binding.rootPath);
        status = stat.isDirectory() ? 'Active' : 'Unreadable';
        await fs.promises.access(binding.rootPath, fs.constants.R_OK);
      } catch (error) {
        status = isMissing(error) ? 'Missing' : 'Unreadable';
      }
    }

    const next: StoredBinding = {
      ...binding,
      identityId: identityId as LocalVaultBindingClientDTO['identityId'],
      status,
      updatedAt: this.now() as LocalVaultBindingClientDTO['updatedAt'],
    };
    if (next.identityId !== binding.identityId || next.status !== binding.status) {
      await this.saveBinding(next);
    }
    return next;
  }

  async selectVault(
    identityId: string,
    request: SelectLocalVaultReq = {},
  ): Promise<LocalVaultBindingClientDTO | null> {
    const selectedPath = await this.platform.selectDirectory({
      suggestedPath: request.suggestedPath,
    });
    if (!selectedPath) return this.getBinding(identityId);

    const canonicalRoot = await fs.promises.realpath(selectedPath);
    const stat = await fs.promises.stat(canonicalRoot);
    if (!stat.isDirectory()) {
      throw new LocalVaultRuntimeError('VALIDATION_ERROR', 'Selected Vault must be a directory');
    }

    const existing = await this.loadBinding();
    const timestamp = this.now();
    const binding: StoredBinding = {
      schemaVersion: 1,
      id: existing?.id ?? `local-vault-${randomUUID()}`,
      identityId: identityId as LocalVaultBindingClientDTO['identityId'],
      rootPath: canonicalRoot,
      displayName: path.basename(canonicalRoot),
      status: 'Active',
      obsidianVaultId: null,
      lastScannedAt: null,
      createdAt: existing?.createdAt ?? (timestamp as LocalVaultBindingClientDTO['createdAt']),
      updatedAt: timestamp as LocalVaultBindingClientDTO['updatedAt'],
    };
    await this.saveBinding(binding);
    return binding;
  }

  async detachVault(identityId: string): Promise<void> {
    const binding = await this.getBinding(identityId);
    if (!binding) return;
    await this.saveBinding({
      ...binding,
      schemaVersion: 1,
      status: 'Detached',
      updatedAt: this.now() as LocalVaultBindingClientDTO['updatedAt'],
    });
  }

  async scanVault(identityId: string): Promise<ScanLocalVaultRes> {
    const binding = await this.requireActiveBinding(identityId);
    const root = await fs.promises.realpath(binding.rootPath);
    const notes: LocalVaultNoteSummaryDTO[] = [];

    const walk = async (directory: string): Promise<void> => {
      if (notes.length >= MAX_SCAN_NOTES) return;
      const entries = await fs.promises.readdir(directory, { withFileTypes: true });
      entries.sort((left, right) => left.name.localeCompare(right.name));

      for (const entry of entries) {
        if (notes.length >= MAX_SCAN_NOTES || entry.isSymbolicLink()) continue;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (!IGNORED_DIRECTORIES.has(entry.name)) await walk(absolutePath);
          continue;
        }
        if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue;

        const relativePath = toPortablePath(path.relative(root, absolutePath));
        try {
          const note = await this.readNoteFromBinding(binding, { relativePath });
          notes.push(this.toSummary(note));
        } catch (error) {
          if (!(error instanceof LocalVaultRuntimeError)) throw error;
        }
      }
    };

    await walk(root);
    const scannedAt = this.now();
    const updatedBinding: StoredBinding = {
      ...binding,
      schemaVersion: 1,
      lastScannedAt: scannedAt as LocalVaultBindingClientDTO['lastScannedAt'],
      updatedAt: scannedAt as LocalVaultBindingClientDTO['updatedAt'],
    };
    await this.saveBinding(updatedBinding);
    return {
      binding: updatedBinding,
      notes,
      scannedAt: scannedAt as ScanLocalVaultRes['scannedAt'],
    };
  }

  async readNote(identityId: string, request: ReadLocalVaultNoteReq): Promise<LocalVaultNoteDTO> {
    return this.readNoteFromBinding(await this.requireActiveBinding(identityId), request);
  }

  async searchVault(
    identityId: string,
    request: SearchLocalVaultReq,
  ): Promise<SearchLocalVaultRes> {
    const query = request.query.trim();
    if (!query) return { query, results: [] };
    const limit = Math.min(Math.max(request.limit ?? 50, 1), MAX_SEARCH_RESULTS);
    const scanned = await this.scanVault(identityId);
    const normalizedQuery = query.toLocaleLowerCase();
    const results: SearchLocalVaultRes['results'] = [];

    for (const summary of scanned.notes) {
      if (results.length >= limit) break;
      const note = await this.readNote(identityId, { relativePath: summary.relativePath });
      const matches: SearchLocalVaultRes['results'][number]['matches'] = [];
      for (const [index, line] of note.contentMarkdown.split(/\r?\n/).entries()) {
        const startIndex = line.toLocaleLowerCase().indexOf(normalizedQuery);
        if (startIndex >= 0) {
          matches.push({
            lineNumber: index + 1,
            lineContent: line.slice(0, 500),
            startIndex,
            endIndex: startIndex + query.length,
          });
        }
        if (matches.length >= 5) break;
      }
      if (
        matches.length ||
        summary.title.toLocaleLowerCase().includes(normalizedQuery) ||
        summary.relativePath.toLocaleLowerCase().includes(normalizedQuery)
      ) {
        results.push({ note: summary, matches });
      }
    }
    return { query, results };
  }

  async openInObsidian(identityId: string, request: OpenLocalVaultInObsidianReq): Promise<void> {
    const binding = await this.requireActiveBinding(identityId);
    const targetPath = request.relativePath
      ? await this.resolveExistingNotePath(binding, request.relativePath)
      : await fs.promises.realpath(binding.rootPath);
    const search = new URLSearchParams({ path: targetPath });
    await this.platform.openExternal(`obsidian://open?${search.toString()}`);
  }

  async writeConfirmedNote(
    identityId: string,
    request: ConfirmedLocalVaultWriteReq,
  ): Promise<ConfirmedLocalVaultWriteRes> {
    if (!request.proposalId.trim() || !request.requestId.trim() || request.proposalRevision < 1) {
      throw new LocalVaultRuntimeError(
        'VALIDATION_ERROR',
        'Confirmed proposal metadata is required',
      );
    }
    const contentBytes = Buffer.byteLength(request.contentMarkdown, 'utf8');
    if (contentBytes === 0 || contentBytes > MAX_WRITE_BYTES) {
      throw new LocalVaultRuntimeError('VALIDATION_ERROR', 'Vault note content size is invalid');
    }

    const relativePath = normalizeRelativeMarkdownPath(request.relativePath);
    const binding = await this.requireActiveBinding(identityId);
    const ledger = await this.loadLedger();
    const replay = ledger.entries.find((entry) => entry.requestId === request.requestId);
    if (replay) {
      if (
        replay.proposalId !== request.proposalId ||
        replay.proposalRevision !== request.proposalRevision ||
        replay.relativePath !== relativePath
      ) {
        throw new LocalVaultRuntimeError(
          'CONFLICT',
          'Write request ID was reused for another proposal',
        );
      }
      return {
        note: await this.readNoteFromBinding(binding, { relativePath }),
        created: false,
      };
    }

    const root = await fs.promises.realpath(binding.rootPath);
    const candidate = path.resolve(root, relativePath);
    assertContained(root, candidate);
    await this.ensureSafeParent(root, path.dirname(candidate));

    let handle: fs.promises.FileHandle | null = null;
    try {
      handle = await fs.promises.open(candidate, 'wx', 0o600);
      await handle.writeFile(request.contentMarkdown, 'utf8');
      await handle.sync();
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'EEXIST'
      ) {
        throw new LocalVaultRuntimeError('CONFLICT', 'A Vault note already exists at this path');
      }
      throw error;
    } finally {
      await handle?.close();
    }

    ledger.entries.push({
      requestId: request.requestId,
      proposalId: request.proposalId,
      proposalRevision: request.proposalRevision,
      relativePath,
      createdAt: this.now(),
    });
    ledger.entries = ledger.entries.slice(-1000);
    await writeJsonAtomically(this.options.writeLedgerFilePath, ledger);
    return {
      note: await this.readNoteFromBinding(binding, { relativePath }),
      created: true,
    };
  }

  async inspectSyncContent(identityId: string): Promise<KnowledgeRepositoryContentState> {
    const binding = await this.requireActiveBinding(identityId);
    const root = await fs.promises.realpath(binding.rootPath);

    const containsUserContent = async (directory: string): Promise<boolean> => {
      const entries = await fs.promises.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (SYNC_IGNORED_DIRECTORIES.has(entry.name)) continue;
          if (await containsUserContent(absolutePath)) return true;
          continue;
        }
        if (!entry.isFile() || isTemporaryFile(entry.name)) continue;
        return true;
      }
      return false;
    };

    return (await containsUserContent(root)) ? 'NonEmpty' : 'Empty';
  }

  private async requireActiveBinding(identityId: string): Promise<LocalVaultBindingClientDTO> {
    const binding = await this.getBinding(identityId);
    if (!binding || binding.status === 'Detached') {
      throw new LocalVaultRuntimeError('NOT_FOUND', 'No local Vault is selected');
    }
    if (binding.status !== 'Active') {
      throw new LocalVaultRuntimeError(
        'NOT_FOUND',
        `Local Vault is ${binding.status.toLowerCase()}`,
      );
    }
    return binding;
  }

  private async resolveExistingNotePath(
    binding: LocalVaultBindingClientDTO,
    relativePathValue: string,
  ): Promise<string> {
    const relativePath = normalizeRelativeMarkdownPath(relativePathValue);
    const root = await fs.promises.realpath(binding.rootPath);
    const candidate = path.resolve(root, relativePath);
    assertContained(root, candidate);
    let canonicalPath: string;
    try {
      canonicalPath = await fs.promises.realpath(candidate);
    } catch (error) {
      if (isMissing(error)) {
        throw new LocalVaultRuntimeError('NOT_FOUND', 'Vault note was not found');
      }
      throw error;
    }
    assertContained(root, canonicalPath);
    return canonicalPath;
  }

  private async readNoteFromBinding(
    binding: LocalVaultBindingClientDTO,
    request: ReadLocalVaultNoteReq,
  ): Promise<LocalVaultNoteDTO> {
    const relativePath = normalizeRelativeMarkdownPath(request.relativePath);
    const absolutePath = await this.resolveExistingNotePath(binding, relativePath);
    const stat = await fs.promises.stat(absolutePath);
    if (!stat.isFile() || stat.size > MAX_NOTE_BYTES) {
      throw new LocalVaultRuntimeError(
        'VALIDATION_ERROR',
        'Vault note is not a readable Markdown file',
      );
    }
    const contentMarkdown = await fs.promises.readFile(absolutePath, 'utf8');
    const parsed = matter(contentMarkdown);
    const frontmatter = parsed.data as Record<string, unknown>;
    return {
      relativePath,
      title: extractTitle(relativePath, parsed.content, frontmatter),
      excerpt: buildExcerpt(parsed.content),
      tags: extractTags(frontmatter),
      outgoingLinks: extractOutgoingLinks(parsed.content),
      size: stat.size,
      updatedAt: stat.mtimeMs as LocalVaultNoteDTO['updatedAt'],
      contentMarkdown,
      frontmatter,
    };
  }

  private toSummary(note: LocalVaultNoteDTO): LocalVaultNoteSummaryDTO {
    const { contentMarkdown: _contentMarkdown, frontmatter: _frontmatter, ...summary } = note;
    return summary;
  }

  private async ensureSafeParent(root: string, parent: string): Promise<void> {
    assertContained(root, parent);
    const relative = path.relative(root, parent);
    let current = root;
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      try {
        const stat = await fs.promises.lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) {
          throw new LocalVaultRuntimeError('FORBIDDEN', 'Vault write path contains an unsafe link');
        }
      } catch (error) {
        if (!isMissing(error)) throw error;
        await fs.promises.mkdir(current, { mode: 0o700 });
      }
    }
  }

  private async loadBinding(): Promise<StoredBinding | null> {
    try {
      const parsed = JSON.parse(
        await fs.promises.readFile(this.options.bindingFilePath, 'utf8'),
      ) as StoredBinding;
      if (parsed.schemaVersion !== 1 || typeof parsed.rootPath !== 'string') {
        throw new LocalVaultRuntimeError(
          'INTERNAL_ERROR',
          'Local Vault binding metadata is invalid',
        );
      }
      return parsed;
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }

  private async saveBinding(binding: StoredBinding): Promise<void> {
    await writeJsonAtomically(this.options.bindingFilePath, binding);
  }

  private async loadLedger(): Promise<WriteLedger> {
    try {
      const parsed = JSON.parse(
        await fs.promises.readFile(this.options.writeLedgerFilePath, 'utf8'),
      ) as WriteLedger;
      return parsed.schemaVersion === 1 && Array.isArray(parsed.entries)
        ? parsed
        : { schemaVersion: 1, entries: [] };
    } catch (error) {
      if (isMissing(error)) return { schemaVersion: 1, entries: [] };
      throw error;
    }
  }
}

export function createLocalVaultRuntime(options: LocalVaultRuntimeOptions): LocalVaultRuntime {
  return new LocalVaultRuntime(options);
}
