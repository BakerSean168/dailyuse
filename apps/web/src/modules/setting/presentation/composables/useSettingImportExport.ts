/**
 * @deprecated Use useUserSetting() instead. This is a backward compatibility shim.
 */
import { useUserSetting } from './useUserSetting';

export function useSettingImportExport() {
  const setting = useUserSetting();

  async function exportAsCSV() {
    const data = await setting.exportSettings();
    if (!data) return null;
    // Convert to CSV format
    const entries = Object.entries(data as Record<string, unknown>);
    const csv = entries.map(([k, v]) => `${k},${JSON.stringify(v)}`).join('\n');
    return csv;
  }

  async function createLocalBackup() {
    const data = await setting.exportSettings();
    if (!data) return;
    const key = `setting-backup-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
    return key;
  }

  async function restoreFromLocalBackup(key: string) {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    await setting.importSettings(data);
  }

  function getLocalBackups(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('setting-backup-')) keys.push(k);
    }
    return keys.sort().reverse();
  }

  return {
    exportSettings: setting.exportSettings,
    importSettings: setting.importSettings,
    exportAsCSV,
    createLocalBackup,
    restoreFromLocalBackup,
    getLocalBackups,
  };
}
