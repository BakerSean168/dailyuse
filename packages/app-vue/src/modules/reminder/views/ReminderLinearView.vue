<template>
  <div class="flex h-full overflow-hidden bg-background">
    <!-- Sidebar: Groups -->
    <aside class="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <BellRing class="h-5 w-5 text-primary" />
          <span>提醒</span>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="space-y-1 p-2">
          <div
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="!selectedGroupId ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectedGroupId = null"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>全部提醒</span>
            <Badge variant="secondary" class="ml-auto text-xs">{{ templates.length }}</Badge>
          </div>

          <div
            v-for="group in groups"
            :key="group.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="selectedGroupId === group.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectedGroupId = group.id"
          >
            <Folder class="h-4 w-4" />
            <span class="truncate">{{ group.name }}</span>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t p-4">
        <Button variant="ghost" size="sm" class="w-full justify-start" @click="showGroupDialog = true">
          <FolderPlus class="mr-2 h-4 w-4" /> 新建分组
        </Button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm">
        <h1 class="text-lg font-medium text-foreground">提醒模板</h1>
        <div class="flex items-center gap-2">
          <div class="relative hidden w-64 lg:block">
            <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="搜索提醒..."
              class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
            />
          </div>
          <Button size="sm" class="h-8 gap-2" @click="showTemplateDialog = true">
            <Plus class="h-4 w-4" />
            新建提醒
          </Button>
        </div>
      </header>

      <ScrollArea class="flex-1 p-6">
        <div class="mx-auto max-w-5xl">
          <div
            v-if="isLoading"
            class="flex h-[50vh] items-center justify-center text-muted-foreground"
          >
            加载中...
          </div>

          <div v-else-if="filteredTemplates.length === 0" class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <BellRing class="h-6 w-6 opacity-50" />
            </div>
            <h3 class="mb-1 text-lg font-medium text-foreground">暂无提醒模板</h3>
            <p class="mb-6 text-sm">创建一个新的提醒来管理你的事务</p>
            <Button @click="showTemplateDialog = true">
              <Plus class="mr-2 h-4 w-4" /> 新建提醒
            </Button>
          </div>

          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <GridTemplateItem
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              :item="tpl"
              @click="handleTemplateClick"
              @edit="handleEditTemplate"
              @delete="handleDeleteTemplate"
              @toggle-enabled="handleToggleEnabled"
            />
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Template Detail Card -->
    <TemplateDesktopCard
      ref="templateCardRef"
      :template="selectedTemplate"
      @edit-template="handleEditTemplate"
      @status-changed="handleStatusChanged"
    />

    <!-- Dialogs -->
    <TemplateDialog
      ref="templateDialogRef"
      :template="editingTemplate"
      :group-options="groups"
      @save="handleSaveTemplate"
      @update="handleUpdateTemplate"
    />

    <GroupDialog
      ref="groupDialogRef"
      @save="handleSaveGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { BellRing, LayoutGrid, Folder, FolderPlus, Plus, Search } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Input } from '@dailyuse/ui-vue-shadcn';
import GridTemplateItem from '../components/GridTemplateItem.vue';
import TemplateDesktopCard from '../components/TemplateDesktopCard.vue';
import TemplateDialog from '../components/TemplateDialog.vue';
import GroupDialog from '../components/GroupDialog.vue';
import { useReminder } from '../composables/useReminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

const {
  templates,
  groups,
  isLoading,
  fetchTemplates,
  fetchGroups,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createGroup,
} = useReminder();

const selectedGroupId = ref<string | null>(null);
const searchQuery = ref('');
const showGroupDialog = ref(false);
const showTemplateDialog = ref(false);
const selectedTemplate = ref<ReminderTemplateClientDTO | null>(null);
const editingTemplate = ref<ReminderTemplateClientDTO | null>(null);
const templateCardRef = ref<InstanceType<typeof TemplateDesktopCard> | null>(null);
const templateDialogRef = ref<InstanceType<typeof TemplateDialog> | null>(null);
const groupDialogRef = ref<InstanceType<typeof GroupDialog> | null>(null);

const filteredTemplates = computed(() => {
  let result = templates.value;
  if (selectedGroupId.value) {
    result = result.filter((t) => t.groupId === selectedGroupId.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
    );
  }
  return result;
});

function handleTemplateClick(tpl: ReminderTemplateClientDTO) {
  selectedTemplate.value = tpl;
  templateCardRef.value?.open();
}

function handleEditTemplate(tpl: ReminderTemplateClientDTO) {
  editingTemplate.value = tpl;
  showTemplateDialog.value = true;
  templateDialogRef.value?.open?.();
}

async function handleDeleteTemplate(tpl: ReminderTemplateClientDTO) {
  if (!window.confirm(`确认删除提醒「${tpl.name}」？`)) return;
  const ok = await deleteTemplate(tpl.id);
  if (ok) toast.success('提醒已删除');
}

function handleToggleEnabled(tpl: ReminderTemplateClientDTO) {
  updateTemplate(tpl.id, { enabled: !tpl.enabled });
}

function handleStatusChanged(tpl: ReminderTemplateClientDTO, enabled: boolean) {
  updateTemplate(tpl.id, { enabled });
}

async function handleSaveTemplate(data: Record<string, unknown>) {
  const result = await createTemplate(data as any);
  if (result) toast.success('提醒已创建');
}

async function handleUpdateTemplate(id: string, data: Record<string, unknown>) {
  const result = await updateTemplate(id, data as any);
  if (result) toast.success('提醒已更新');
}

async function handleSaveGroup(data: Record<string, unknown>) {
  const result = await createGroup(data as any);
  if (result) {
    showGroupDialog.value = false;
    toast.success('分组已创建');
  }
}

onMounted(async () => {
  await Promise.all([fetchTemplates(), fetchGroups()]);
});
</script>
