/**
 * useDataPortability — composable for full user data export/import.
 *
 * Uses DataPortabilityClientService via DI to export/import all user data
 * (not just settings). Handles file save/open via platform-specific IPC.
 */

import { ref, inject } from 'vue';
import { SystemChannels } from '@dailyuse/contracts/electron';
import { DATA_PORTABILITY_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';

export function useDataPortability() {
  const service = inject(DATA_PORTABILITY_SERVICE_KEY, undefined);
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);

  const isAvailable = ref(service !== undefined);
  const isExporting = ref(false);
  const isImporting = ref(false);
  const lastResult = ref<string | null>(null);

  async function exportAllData(): Promise<void> {
    if (!service) {
      lastResult.value = 'Data export is not available in this runtime';
      return;
    }

    isExporting.value = true;
    lastResult.value = null;
    try {
      const result = await service.exportUserData({});
      if (!result.ok) {
        lastResult.value = `Export failed: ${result.error.message}`;
        return;
      }

      const { fileName, content, summary } = result.data;
      const warnings = summary.warnings.length > 0
        ? `\nWarnings: ${summary.warnings.join(', ')}`
        : '';

      // Save file via platform
      if (desktopApi?.invoke) {
        await desktopApi.invoke(SystemChannels.USER_FILES_SAVE_TEXT, {
          subdirectory: 'exports',
          defaultFileName: fileName,
          content,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      } else {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }

      const counts = Object.entries(summary.entityCounts)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      lastResult.value = `Exported ${counts}${warnings}`;
    } catch (err) {
      lastResult.value = `Export error: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      isExporting.value = false;
    }
  }

  async function importAllData(): Promise<void> {
    if (!service) {
      lastResult.value = 'Data import is not available in this runtime';
      return;
    }

    isImporting.value = true;
    lastResult.value = null;
    try {
      let content: string | null = null;

      if (desktopApi?.invoke) {
        const result = (await desktopApi.invoke(SystemChannels.USER_FILES_OPEN_TEXT, {
          subdirectory: 'exports',
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })) as { canceled: boolean; content: string | null };
        if (result.canceled || !result.content) {
          isImporting.value = false;
          return;
        }
        content = result.content;
      } else {
        // Web: use file input
        content = await new Promise<string | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string ?? null);
            reader.readAsText(file);
          };
          input.click();
        });
      }

      if (!content) {
        isImporting.value = false;
        return;
      }

      const result = await service.importUserData({ content, dryRun: false });
      if (!result.ok) {
        lastResult.value = `Import failed: ${result.error.message}`;
        return;
      }

      const { created, updatedSingletons, warnings } = result.data;
      const createdCounts = Object.entries(created)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const updatedCounts = Object.entries(updatedSingletons)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const parts = [];
      if (createdCounts) parts.push(`Created: ${createdCounts}`);
      if (updatedCounts) parts.push(`Updated: ${updatedCounts}`);
      if (warnings.length > 0) parts.push(`Warnings: ${warnings.join(', ')}`);
      lastResult.value = parts.join(' | ') || 'Import completed (no data)';
    } catch (err) {
      lastResult.value = `Import error: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      isImporting.value = false;
    }
  }

  return {
    isAvailable,
    isExporting,
    isImporting,
    lastResult,
    exportAllData,
    importAllData,
  };
}
