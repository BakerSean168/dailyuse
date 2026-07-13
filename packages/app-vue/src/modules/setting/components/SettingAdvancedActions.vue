<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="flex items-center">
        <Settings2 class="h-5 w-5 mr-2" />
        {{ t('setting.advanced.title') }}
      </CardTitle>
    </CardHeader>

    <Separator />

    <CardContent class="p-4 space-y-6">
      <!-- Export/Import Settings -->
      <div class="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-full">
              <Download class="h-4 w-4 mr-2" />
              {{ t('setting.advanced.exportSettings') }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('exportJSON')">
              <FileJson class="h-4 w-4 mr-2" />
              {{ t('setting.advanced.exportJSON') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('exportCSV')">
              <FileText class="h-4 w-4 mr-2" />
              {{ t('setting.advanced.exportCSV') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" class="w-full" @click="emit('import')">
          <Upload class="h-4 w-4 mr-2" />
          {{ t('setting.advanced.importSettings') }}
        </Button>
      </div>

      <!-- Export/Import All User Data -->
      <div v-if="dataPortabilityAvailable" class="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-2">
        <Button variant="outline" class="w-full" :disabled="exportingData" @click="emit('exportAllData')">
          <Download class="h-4 w-4 mr-2" />
          {{ exportingData ? 'Exporting...' : 'Export All Data' }}
        </Button>

        <Button variant="outline" class="w-full" :disabled="importingData" @click="emit('importAllData')">
          <Upload class="h-4 w-4 mr-2" />
          {{ importingData ? 'Importing...' : 'Import All Data' }}
        </Button>
      </div>

      <p v-if="dataPortabilityResult" class="text-xs text-muted-foreground">{{ dataPortabilityResult }}</p>

      <!-- Backup & Restore -->
      <div class="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-2">
        <Button variant="outline" class="w-full" @click="emit('createBackup')">
          <Save class="h-4 w-4 mr-2" />
          {{ t('setting.advanced.createBackup') }}
        </Button>

        <DropdownMenu v-if="backups && backups.length > 0">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-full">
              <RotateCcw class="h-4 w-4 mr-2" />
              {{ t('setting.advanced.restoreBackup') }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              v-for="backup in backups"
              :key="backup.key"
              @click="emit('restoreBackup', backup.key)"
            >
              <div class="flex flex-col">
                <span>{{ backup.label }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTime(backup.time) }}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button v-else variant="outline" class="w-full" disabled>
          <RotateCcw class="h-4 w-4 mr-2" />
          {{ t('setting.advanced.restoreBackupNoBackups') }}
        </Button>
      </div>

      <Separator />

      <!-- Cloud Sync -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium flex items-center">
          <Cloud class="h-4 w-4 mr-2" />
          {{ t('setting.advanced.cloudSync') }}
        </h3>

        <div class="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-2">
          <Button variant="outline" class="w-full" :disabled="syncing" @click="emit('cloudSync')">
            <CloudUpload class="h-4 w-4 mr-2" />
            {{ syncing ? t('setting.advanced.syncing') : t('setting.advanced.syncAllDevices') }}
          </Button>

          <Button variant="outline" class="w-full" @click="emit('showVersionHistory')">
            <History class="h-4 w-4 mr-2" />
            {{ t('setting.advanced.viewVersionHistory') }}
          </Button>
        </div>

        <!-- Sync Status -->
        <Card v-if="syncStatus" variant="outline">
          <CardContent class="pt-6">
            <div class="space-y-2">
              <div class="text-xs text-muted-foreground">
                {{ t('setting.advanced.lastSynced') }}
              </div>
              <div class="text-sm">{{ formatTime(syncStatus.lastSyncedAt) }}</div>
              <Progress :value="(syncStatus.versionCount / 20) * 100" class="h-2" />
              <div class="text-xs">
                {{ t('setting.advanced.version') }}: {{ syncStatus.versionCount }}/20
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Progress } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import {
  Settings2,
  Download,
  Upload,
  Save,
  RotateCcw,
  Cloud,
  CloudUpload,
  History,
  FileJson,
  FileText,
} from 'lucide-vue-next';

const { t } = useI18n();

interface SyncStatus {
  lastSyncedAt: number;
  versionCount: number;
  hasConflicts: boolean;
}

interface Backup {
  key: string;
  label: string;
  time: number;
}

interface Props {
  backups?: Backup[];
  syncStatus?: SyncStatus | null;
  syncing?: boolean;
  exportingData?: boolean;
  importingData?: boolean;
  dataPortabilityAvailable?: boolean;
  dataPortabilityResult?: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  exportJSON: [];
  exportCSV: [];
  import: [];
  exportAllData: [];
  importAllData: [];
  createBackup: [];
  restoreBackup: [key: string];
  cloudSync: [];
  showVersionHistory: [];
}>();

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('setting.time.justNow');
  if (minutes < 60) return t('setting.time.minutesAgo', { n: minutes });
  if (hours < 24) return t('setting.time.hoursAgo', { n: hours });
  if (days < 7) return t('setting.time.daysAgo', { n: days });

  return date.toLocaleString();
}
</script>
