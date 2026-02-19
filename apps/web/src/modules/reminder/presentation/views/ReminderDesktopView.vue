<template>
  <div class="flex h-full flex-col">
    <!-- 头部 -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">提醒管理</h2>
        <Badge variant="secondary">{{ templates.length }} 个提醒</Badge>
        <Badge variant="secondary">{{ groups.length }} 个分组</Badge>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="showGroupDialog = true">
          <FolderPlus class="mr-1 h-4 w-4" /> 新建分组
        </Button>
        <Button size="sm" @click="showTemplateDialog = true">
          <Plus class="mr-1 h-4 w-4" /> 新建提醒
        </Button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧: 分组列表 -->
      <div class="w-64 shrink-0 border-r">
        <div class="p-4">
          <div
            class="mb-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="!selectedGroupId ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectedGroupId = null"
          >
            <LayoutGrid class="h-4 w-4" />
            <span>全部提醒</span>
            <Badge variant="secondary" class="ml-auto text-xs">{{ templates.length }}</Badge>
          </div>

          <Separator class="my-2" />

          <ScrollArea class="h-[calc(100vh-220px)]">
            <div class="space-y-1">
              <GroupDesktopCard
                v-for="group in groups"
                :key="group.id"
                :group="group"
                :active="selectedGroupId === group.id"
                @click="selectedGroupId = group.id"
                @edit="handleEditGroup(group)"
                @delete="handleDeleteGroup(group.id)"
              />
            </div>

            <div v-if="groups.length === 0" class="py-4 text-center text-xs text-muted-foreground">
              暂无分组
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- 右侧: 提醒卡片网格 -->
      <div class="flex-1 overflow-auto p-6">
        <div v-if="isLoading" class="flex h-full items-center justify-center">
          <div class="text-muted-foreground">加载中...</div>
        </div>

        <div v-else-if="filteredTemplates.length === 0" class="flex h-full items-center justify-center">
          <div class="text-center space-y-2">
            <Bell class="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p class="text-muted-foreground">
              {{ selectedGroupId ? '该分组下暂无提醒' : '暂无提醒，创建你的第一个提醒吧' }}
            </p>
            <Button size="sm" @click="showTemplateDialog = true">
              <Plus class="mr-1 h-4 w-4" /> 新建提醒
            </Button>
          </div>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TemplateDesktopCard
            v-for="t in filteredTemplates"
            :key="t.id"
            :template="t"
            @click="handleSelectTemplate(t)"
            @edit="handleEditTemplate(t)"
            @delete="handleDeleteTemplate(t.id)"
            @toggle="handleToggleTemplate(t)"
            @move="handleMoveTemplate(t)"
          />

          <!-- 添加空白卡片 -->
          <GridBlankItem @click="showTemplateDialog = true" />
        </div>
      </div>

      <!-- 右侧侧边栏: 选中提醒详情 -->
      <ReminderInstanceSidebar
        v-if="selectedTemplate"
        :template="selectedTemplate"
        class="w-80 shrink-0 border-l"
        @close="selectedTemplate = null"
        @edit="handleEditTemplate(selectedTemplate!)"
      />
    </div>

    <!-- 分组对话框 -->
    <GroupDialog
      v-model:open="showGroupDialog"
      :group="editingGroup"
      @save="handleSaveGroup"
    />

    <!-- 提醒模板对话框 -->
    <TemplateDialog
      v-model:open="showTemplateDialog"
      :template="editingTemplate"
      :groups="groups"
      @save="handleSaveTemplate"
    />

    <!-- 移动到分组对话框 -->
    <TemplateMoveDialog
      v-model:open="showMoveDialog"
      :template="movingTemplate"
      :groups="groups"
      @move="handleConfirmMove"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { Plus, FolderPlus, LayoutGrid, Bell } from 'lucide-vue-next';
import {
  Button, Badge, Separator, ScrollArea,
  GroupDesktopCard, TemplateDesktopCard, GridBlankItem,
  GroupDialog, TemplateDialog, TemplateMoveDialog,
  ReminderInstanceSidebar,
} from '@dailyuse/ui-vue-shadcn';
import { useReminder } from '../composables/useReminder';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';

const {
  templates, groups, isLoading, isSaving,
  fetchTemplates, fetchGroups, createTemplate, updateTemplate, deleteTemplate,
  createGroup, updateGroup, deleteGroup,
} = useReminder();

const selectedGroupId = ref<string | null>(null);
const selectedTemplate = ref<ReminderTemplateClientDTO | null>(null);

const showGroupDialog = ref(false);
const editingGroup = ref<ReminderGroupClientDTO | null>(null);

const showTemplateDialog = ref(false);
const editingTemplate = ref<ReminderTemplateClientDTO | null>(null);

const showMoveDialog = ref(false);
const movingTemplate = ref<ReminderTemplateClientDTO | null>(null);

const filteredTemplates = computed(() => {
  if (!selectedGroupId.value) return templates.value;
  return templates.value.filter((t) => t.groupId === selectedGroupId.value);
});

function handleSelectTemplate(t: ReminderTemplateClientDTO) {
  selectedTemplate.value = t;
}

// ── Group operations ──
function handleEditGroup(group: ReminderGroupClientDTO) {
  editingGroup.value = group;
  showGroupDialog.value = true;
}

async function handleDeleteGroup(id: string) {
  if (!window.confirm('确认删除此分组？')) return;
  const ok = await deleteGroup(id);
  if (ok) {
    toast.success('分组已删除');
    if (selectedGroupId.value === id) selectedGroupId.value = null;
  }
}

async function handleSaveGroup(data: Record<string, unknown>) {
  if (editingGroup.value) {
    const result = await updateGroup(editingGroup.value.id, data);
    if (result) toast.success('分组已更新');
  } else {
    const result = await createGroup(data);
    if (result) toast.success('分组已创建');
  }
  editingGroup.value = null;
  showGroupDialog.value = false;
}

// ── Template operations ──
function handleEditTemplate(t: ReminderTemplateClientDTO) {
  editingTemplate.value = t;
  showTemplateDialog.value = true;
}

async function handleDeleteTemplate(id: string) {
  if (!window.confirm('确认删除此提醒？')) return;
  const ok = await deleteTemplate(id);
  if (ok) {
    toast.success('提醒已删除');
    if (selectedTemplate.value?.id === id) selectedTemplate.value = null;
  }
}

async function handleToggleTemplate(t: ReminderTemplateClientDTO) {
  const result = await updateTemplate(t.id, { selfEnabled: !t.selfEnabled });
  if (result) toast.success(t.selfEnabled ? '提醒已禁用' : '提醒已启用');
}

function handleMoveTemplate(t: ReminderTemplateClientDTO) {
  movingTemplate.value = t;
  showMoveDialog.value = true;
}

async function handleConfirmMove(targetGroupId: string | null) {
  if (!movingTemplate.value) return;
  const result = await updateTemplate(movingTemplate.value.id, { groupId: targetGroupId });
  if (result) toast.success('提醒已移动');
  movingTemplate.value = null;
  showMoveDialog.value = false;
}

async function handleSaveTemplate(data: Record<string, unknown>) {
  if (editingTemplate.value) {
    const result = await updateTemplate(editingTemplate.value.id, data);
    if (result) toast.success('提醒已更新');
  } else {
    const result = await createTemplate(data);
    if (result) toast.success('提醒已创建');
  }
  editingTemplate.value = null;
  showTemplateDialog.value = false;
}

onMounted(async () => {
  await Promise.all([fetchTemplates(), fetchGroups()]);
});
</script>
