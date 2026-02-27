/**
 * Centralized menu label constants — i18n-ready.
 *
 * All ActionableWrapper consumers should import labels from here
 * so that a future vue-i18n migration only needs to update this file.
 *
 * Default locale: zh-CN (matches majority of app UI).
 */

export type SupportedLocale = 'zh-CN' | 'en-US';

/** Menu label key → per-locale text */
const messages: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    // ── Common actions ───────────────────────────
    edit: '编辑',
    delete: '删除',
    view: '查看',
    viewDetails: '查看详情',
    settings: '设置',
    rename: '重命名',
    move: '移动',
    moveToGroup: '移至分组',
    open: '打开',
    openInNewTab: '在新标签页打开',
    addBookmark: '添加到书签',
    removeBookmark: '已添加书签',
    bookmark: '书签',
    copyLink: '复制链接',
    fileInfo: '文件信息',

    // ── CRUD / lifecycle ─────────────────────────
    create: '新建',
    duplicate: '复制',
    archive: '归档',
    restore: '恢复',

    // ── Folder / tree ────────────────────────────
    editFolder: '编辑文件夹',
    deleteFolder: '删除文件夹',
    createSubfolder: '新建子文件夹',

    // ── Reminder / template ──────────────────────
    editTemplate: '编辑模板',
    deleteTemplate: '删除模板',
    editGroup: '编辑分组',
    deleteGroup: '删除分组',

    // ── Key Results ──────────────────────────────
    addRecord: '添加记录',

    // ── Schedule / tasks ─────────────────────────
    pause: '暂停',
    resume: '恢复',
    activate: '激活',

    // ── Ordering ─────────────────────────────────
    moveUp: '上移',
    moveDown: '下移',

    // ── Notifications ────────────────────────────
    markRead: '标记已读',
  },
  'en-US': {
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    viewDetails: 'View Details',
    settings: 'Settings',
    rename: 'Rename',
    move: 'Move',
    moveToGroup: 'Move to Group',
    open: 'Open',
    openInNewTab: 'Open in New Tab',
    addBookmark: 'Add Bookmark',
    removeBookmark: 'Bookmarked',
    bookmark: 'Bookmark',
    copyLink: 'Copy Link',
    fileInfo: 'File Info',

    create: 'Create',
    duplicate: 'Duplicate',
    archive: 'Archive',
    restore: 'Restore',

    editFolder: 'Edit Folder',
    deleteFolder: 'Delete Folder',
    createSubfolder: 'New Subfolder',

    editTemplate: 'Edit Template',
    deleteTemplate: 'Delete Template',
    editGroup: 'Edit Group',
    deleteGroup: 'Delete Group',

    addRecord: 'Add Record',

    pause: 'Pause',
    resume: 'Resume',
    activate: 'Activate',

    moveUp: 'Move Up',
    moveDown: 'Move Down',

    markRead: 'Mark as Read',
  },
};

/**
 * Current locale — defaults to zh-CN.
 *
 * In a future vue-i18n integration this will read from the i18n instance.
 * For now consumers can call `setMenuLocale()` or it can be wired to the
 * settings store's `locale.language` value.
 */
let currentLocale: SupportedLocale = 'zh-CN';

export function setMenuLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

export function getMenuLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Resolve a menu label key to the localised string.
 *
 * ```ts
 * import { menuLabel } from '../../components/shared/menu-labels';
 * const label = menuLabel('edit'); // '编辑' (or 'Edit' when locale is en-US)
 * ```
 */
export function menuLabel(key: string): string {
  return messages[currentLocale]?.[key] ?? messages['zh-CN']?.[key] ?? key;
}
