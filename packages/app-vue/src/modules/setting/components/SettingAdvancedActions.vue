<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="flex items-center">
        <Settings2 class="h-5 w-5 mr-2" />
        高级操作
      </CardTitle>
    </CardHeader>
    
    <Separator />
    
    <CardContent class="p-4 space-y-6">
      <!-- Export/Import Settings -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-full">
              <Download class="h-4 w-4 mr-2" />
              导出设置
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('exportJSON')">
              <FileJson class="h-4 w-4 mr-2" />
              导出为 JSON
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('exportCSV')">
              <FileText class="h-4 w-4 mr-2" />
              导出为 CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" class="w-full" @click="emit('import')">
          <Upload class="h-4 w-4 mr-2" />
          导入设置
        </Button>
      </div>
      
      <!-- Backup & Restore -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" class="w-full" @click="emit('createBackup')">
          <Save class="h-4 w-4 mr-2" />
          创建本地备份
        </Button>
        
        <DropdownMenu v-if="backups && backups.length > 0">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-full">
              <RotateCcw class="h-4 w-4 mr-2" />
              恢复备份
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
          恢复备份（无可用备份）
        </Button>
      </div>
      
      <Separator />
      
      <!-- Cloud Sync -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium flex items-center">
          <Cloud class="h-4 w-4 mr-2" />
          云同步
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            class="w-full"
            :disabled="syncing"
            @click="emit('cloudSync')"
          >
            <CloudUpload class="h-4 w-4 mr-2" />
            {{ syncing ? '同步中...' : '同步所有设备' }}
          </Button>
          
          <Button
            variant="outline"
            class="w-full"
            @click="emit('showVersionHistory')"
          >
            <History class="h-4 w-4 mr-2" />
            查看版本历史
          </Button>
        </div>
        
        <!-- Sync Status -->
        <Card v-if="syncStatus" variant="outline">
          <CardContent class="pt-6">
            <div class="space-y-2">
              <div class="text-xs text-muted-foreground">最后同步</div>
              <div class="text-sm">{{ formatTime(syncStatus.lastSyncedAt) }}</div>
              <Progress :value="(syncStatus.versionCount / 20) * 100" class="h-2" />
              <div class="text-xs">版本: {{ syncStatus.versionCount }}/20</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
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
}

defineProps<Props>();

const emit = defineEmits<{
  'exportJSON': [];
  'exportCSV': [];
  'import': [];
  'createBackup': [];
  'restoreBackup': [key: string];
  'cloudSync': [];
  'showVersionHistory': [];
}>();

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleString('zh-CN');
}
</script>
