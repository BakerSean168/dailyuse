<template>
  <v-dialog v-model="visible" max-width="800px" height="600px" persistent>
    <v-card class="d-flex flex-column" style="height: 600px">
      <!-- 固定头部：取消 - 标题 - 完成 -->
      <v-card-title class="d-flex justify-space-between align-center pa-4 flex-shrink-0">
        <v-btn
          data-testid="reminder-dialog-close-button"
          variant="elevated"
          color="red-darken-3"
          @click="close"
        >
          取消
        </v-btn>
        <span class="text-h5">{{ isEditMode ? '编辑提醒模板' : '创建提醒模板' }}</span>
        <v-btn
          data-testid="reminder-dialog-save-button"
          color="primary"
          variant="elevated"
          :disabled="!formValid || saving"
          :loading="saving"
          @click="handleSave"
        >
          完成
        </v-btn>
      </v-card-title>

      <!-- 可滚动内容区域 -->
      <v-card-text class="flex-grow-1 overflow-y-auto pa-4">
        <v-form ref="formRef" v-model="formValid">
          <!-- 基础信息 -->
          <div class="mb-6">
            <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-information</v-icon>
              基础信息
            </div>
            <v-divider class="mb-4" />
            
            <v-row dense>
              <v-col cols="11">
                <v-text-field
                  v-model="formData.title"
                  label="标题 *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  placeholder="例如：每日喝水提醒"
                />
              </v-col>
              <v-col cols="1" class="d-flex align-center justify-center">
                <ColorPicker
                  v-model="formData.color"
                  size="large"
                />
              </v-col>
            </v-row>

            <v-textarea
              v-model="formData.description"
              label="描述"
              variant="outlined"
              density="comfortable"
              rows="2"
              placeholder="描述这个提醒的目的和注意事项"
              class="mt-2"
            />

            <v-row dense class="mt-2">
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.groupUuid"
                  label="所属分组"
                  :items="groupOptions"
                  item-title="name"
                  item-value="uuid"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  prepend-inner-icon="mdi-folder"
                  hint="可选：将模板添加到分组"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.importanceLevel"
                  label="重要程度"
                  :items="importanceLevels"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-flag"
                />
              </v-col>
            </v-row>
          </div>

          <!-- 时间配置 -->
          <div class="mb-6">
            <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-clock</v-icon>
              时间配置
            </div>
            <v-divider class="mb-4" />
            
            <v-select
              v-model="formData.triggerType"
              label="触发类型 *"
              :items="triggerTypes"
              item-title="label"
              item-value="value"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-bell-ring"
            />
            
            <!-- 固定时间触发器 -->
            <v-text-field
              v-if="formData.triggerType === 'FIXED_TIME'"
              v-model="formData.fixedTime"
              label="固定时间 (HH:MM)"
              placeholder="09:00"
              :rules="[rules.timeFormat]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-clock-time-four"
              hint="格式: 小时:分钟 (例如: 09:00, 14:30)"
              persistent-hint
              class="mt-2"
            />
            
            <!-- 间隔触发器 -->
            <v-text-field
              v-if="formData.triggerType === 'INTERVAL'"
              v-model.number="formData.intervalMinutes"
              label="间隔时间（分钟）"
              type="number"
              :rules="[rules.positiveNumber]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-timer"
              hint="每隔多少分钟触发一次"
              persistent-hint
              class="mt-2"
            />
          </div>

          <!-- 外观配置 -->
          <div class="mb-6">
            <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-palette</v-icon>
              外观配置
            </div>
            <v-divider class="mb-4" />
            
            <div class="d-flex align-center mb-4">
              <IconPicker
                v-model="formData.icon"
                class="mr-3"
              />
              <div>
                <div class="text-body-2 font-weight-medium">选择图标</div>
                <div class="text-caption text-grey">当前: {{ formData.icon || 'mdi-bell' }}</div>
              </div>
            </div>

            <v-combobox
              v-model="formData.tags"
              label="标签"
              multiple
              chips
              closable-chips
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-tag-multiple"
              hint="添加标签以便筛选和管理（可选）"
              persistent-hint
            />
          </div>

          <!-- 高级设置 - 通知配置（折叠面板） -->
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon class="mr-2">mdi-cog</v-icon>
                  <span class="font-weight-medium">高级通知设置</span>
                  <v-chip size="small" class="ml-2" color="info" variant="tonal">可选</v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-caption text-grey mb-3">
                  自定义通知文案。留空则使用模板的标题和描述。
                </div>
                <v-text-field
                  v-model="formData.notificationTitle"
                  label="通知标题"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-format-title"
                  hint="留空则使用模板标题"
                  persistent-hint
                  class="mb-2"
                />
                <v-textarea
                  v-model="formData.notificationBody"
                  label="通知内容"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-text"
                  rows="2"
                  hint="留空则使用模板描述"
                  persistent-hint
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ReminderTemplate } from '@dailyuse/reminder/domain-client';
import { TriggerType, ReminderType, NotificationChannel } from '@dailyuse/contracts/reminder';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, CreateReminderTemplateRequest, UpdateReminderTemplateRequest, TriggerConfigServerDTO, ActiveTimeConfigServerDTO, NotificationConfigServerDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ColorPicker, IconPicker } from '@dailyuse/ui-vuetify';
import { useReminder } from '../../composables/useReminder';
import { useReminderGroup } from '../../composables/useReminderGroup';
import { useMessage } from '@dailyuse/ui-vuetify';



const visible = ref(false);
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);
const currentTemplate = ref<ReminderTemplate | null>(null);
const isEditMode = computed(() => !!currentTemplate.value?.uuid);

const { createReminderTemplate, updateTemplate, refreshAll } = useReminder();
const { groups } = useReminderGroup();
const message = useMessage();

// 分组选项
const groupOptions = computed(() => groups.value || []);

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  importanceLevel: ImportanceLevel.Moderate,
  triggerType: TriggerType.FIXED_TIME,
  fixedTime: '09:00',
  intervalMinutes: 60,
  notificationTitle: '',
  notificationBody: '',
  color: '#2196F3',
  icon: 'mdi-bell',
  tags: [] as string[],
  groupUuid: undefined as string | undefined,
});

// 选项列表 - 移除了单次提醒类型
const importanceLevels = [
  { label: '极其重要', value: ImportanceLevel.Vital },
  { label: '非常重要', value: ImportanceLevel.Important },
  { label: '普通', value: ImportanceLevel.Moderate },
  { label: '不太重要', value: ImportanceLevel.Minor },
  { label: '无关紧要', value: ImportanceLevel.Trivial },
];

const triggerTypes = [
  { label: '固定时间', value: TriggerType.FIXED_TIME },
  { label: '间隔触发', value: TriggerType.INTERVAL },
];

// 验证规则
const rules = {
  required: (v: any) => !!v || '此字段为必填项',
  positiveNumber: (v: any) => (v && v > 0) || '请输入大于0的数字',
  timeFormat: (v: string) => {
    if (!v) return true;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(v) || '请输入正确的时间格式 (HH:MM)';
  },
};

const open = () => {
  visible.value = true;
};

const openForCreate = () => {
  resetForm();
  currentTemplate.value = null;
  visible.value = true;
};

const openForEdit = (template: ReminderTemplate) => {
  currentTemplate.value = template;
  loadTemplateData(template);
  visible.value = true;
};

const close = () => {
  visible.value = false;
  resetForm();
  currentTemplate.value = null;
};

const resetForm = () => {
  formData.title = '';
  formData.description = '';
  formData.importanceLevel = ImportanceLevel.Moderate;
  formData.triggerType = TriggerType.FIXED_TIME;
  formData.fixedTime = '09:00';
  formData.intervalMinutes = 60;
  formData.notificationTitle = '';
  formData.notificationBody = '';
  formData.color = '#2196F3';
  formData.icon = 'mdi-bell';
  formData.tags = [];
  formData.groupUuid = undefined;
  formRef.value?.resetValidation();
};

const loadTemplateData = (template: ReminderTemplate) => {
  formData.title = template.title;
  formData.description = template.description || '';
  formData.importanceLevel = template.importanceLevel;
  
  // 解析触发器配置
  if (template.trigger) {
    formData.triggerType = template.trigger.type;
    
    if (template.trigger.type === TriggerType.FIXED_TIME) {
      // 解析固定时间
      if (template.trigger.fixedTime?.time) {
        formData.fixedTime = template.trigger.fixedTime.time;
      } else {
        console.warn('⚠️ 固定时间触发器缺少 time 配置', template.uuid);
        formData.fixedTime = ''; // 不使用默认值，让用户知道数据缺失
      }
    } else if (template.trigger.type === TriggerType.INTERVAL) {
      // 解析间隔时间
      if (template.trigger.interval?.minutes) {
        formData.intervalMinutes = template.trigger.interval.minutes;
      } else {
        console.warn('⚠️ 间隔触发器缺少 minutes 配置', template.uuid);
        formData.intervalMinutes = 0; // 不使用默认值，让表单验证失败
      }
    }
  } else {
    console.error('❌ 提醒模板缺少触发器配置！', template.uuid);
    // 不设置默认值，让问题暴露出来
  }
  
  formData.notificationTitle = template.notificationConfig?.title || '';
  formData.notificationBody = template.notificationConfig?.body || '';
  formData.color = template.color || '#2196F3';
  formData.icon = template.icon || 'mdi-bell';
  formData.tags = template.tags || [];
  formData.groupUuid = template.groupUuid || undefined;
};

const handleSave = async () => {
  if (!formRef.value) return;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    saving.value = true;

    if (isEditMode.value && currentTemplate.value) {
      // 更新模式 - 包含完整的更新数据
      const updateRequest: UpdateReminderTemplateRequest = {
        title: formData.title,
        description: formData.description || undefined,
        trigger: buildTriggerConfig(),
        activeTime: buildActiveTimeConfig(),
        notificationConfig: buildNotificationConfig(),
        importanceLevel: formData.importanceLevel,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        color: formData.color || undefined,
        icon: formData.icon || undefined,
        groupUuid: formData.groupUuid,
      };
      
      await updateTemplate(currentTemplate.value.uuid, updateRequest);
      message.success('提醒模板已更新');
    } else {
      // 创建模式 - 固定使用 RECURRING 类型
      const createRequest: CreateReminderTemplateRequest = {
        title: formData.title,
        description: formData.description || undefined,
        type: ReminderType.RECURRING,
        trigger: buildTriggerConfig(),
        activeTime: buildActiveTimeConfig(),
        notificationConfig: buildNotificationConfig(),
        importanceLevel: formData.importanceLevel,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        color: formData.color || undefined,
        icon: formData.icon || undefined,
        groupUuid: formData.groupUuid,
      };
      
      await createReminderTemplate(createRequest);
      message.success('提醒模板已创建');
    }

    // 保存后自动刷新数据
    await refreshAll();
    close();
  } catch (error) {
    console.error('保存提醒模板失败:', error);
    message.error(isEditMode.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const buildTriggerConfig = (): TriggerConfigServerDTO => {
  if (formData.triggerType === TriggerType.FIXED_TIME) {
    return {
      type: TriggerType.FIXED_TIME,
      fixedTime: {
        time: formData.fixedTime,
        timezone: null,
      },
      interval: null,
    };
  } else {
    return {
      type: TriggerType.INTERVAL,
      fixedTime: null,
      interval: {
        minutes: formData.intervalMinutes,
        startTime: null,
      },
    };
  }
};

const buildActiveTimeConfig = (): ActiveTimeConfigServerDTO => {
  // 重构后：只需要 activatedAt（当前时间）
  return {
    activatedAt: Date.now(),
  };
};

const buildNotificationConfig = (): NotificationConfigServerDTO => {
  return {
    channels: [
      NotificationChannel.PUSH,
      NotificationChannel.IN_APP,
    ],
    title: formData.notificationTitle || formData.title,
    body: formData.notificationBody || formData.description || '提醒',
    sound: {
      enabled: true,
      soundName: 'default',
    },
    vibration: {
      enabled: true,
      pattern: null,
    },
    actions: null,
  };
};

defineExpose({
  open,
  openForCreate,
  openForEdit,
  close,
});
</script>

