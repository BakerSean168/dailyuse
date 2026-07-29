<!--
  Status Rule Editor Component (STORY-021)
  状态规则编辑器组件
-->
<template>
  <Card class="rule-editor">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Bot :size="24" />
          <CardTitle>{{ t('goal.statusRule.title') }}</CardTitle>
        </div>
        <Badge :variant="config.enabled ? 'default' : 'secondary'">
          {{ config.enabled ? t('goal.statusRule.enabled') : t('goal.statusRule.disabled') }}
        </Badge>
      </div>
      <CardDescription> {{ t('goal.statusRule.description') }} </CardDescription>
    </CardHeader>

    <CardContent>
      <!-- 全局配置 -->
      <div class="mb-4 space-y-2">
        <div class="flex items-center gap-2">
          <Switch :checked="config.enabled" @update:checked="config.enabled = $event" />
          <Label>{{ t('goal.statusRule.enableAutoRules') }}</Label>
        </div>
        <div class="flex items-center gap-2">
          <Switch
            :checked="config.allowManualOverride"
            @update:checked="config.allowManualOverride = $event"
          />
          <Label>{{ t('goal.statusRule.allowManualOverride') }}</Label>
          <span class="text-sm text-muted-foreground">{{ t('goal.statusRule.disableNote') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Switch
            :checked="config.notifyOnChange"
            @update:checked="config.notifyOnChange = $event"
          />
          <Label>{{ t('goal.statusRule.notifyOnChange') }}</Label>
        </div>
      </div>

      <Separator class="my-4" />

      <!-- 规则列表 -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">{{ t('goal.statusRule.ruleList') }}</h3>
        <Button variant="ghost" size="sm" @click="openAddDialog">
          <Plus class="mr-1 h-4 w-4" />
          {{ t('goal.statusRule.addRule') }}
        </Button>
      </div>

      <div v-if="rules.length > 0" class="space-y-2">
        <div
          v-for="rule in sortedRules"
          :key="rule.id"
          class="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          :class="{ 'opacity-60': !rule.enabled }"
        >
          <Switch
            :checked="rule.enabled"
            @update:checked="
              (val: boolean) => {
                rule.enabled = val;
                handleRuleToggle(rule);
              }
            "
          />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ rule.name }}</span>
              <Badge variant="outline" class="text-xs">
                {{ t('goal.statusRule.priority') }} {{ rule.priority }}
              </Badge>
              <Badge v-if="rule.id.startsWith('rule-')" variant="secondary" class="text-xs">
                {{ t('goal.statusRule.builtIn') }}
              </Badge>
            </div>

            <p v-if="rule.description" class="mt-1 text-sm text-muted-foreground">
              {{ rule.description }}
            </p>

            <div class="mt-2 text-xs text-muted-foreground">
              <div class="flex items-center">
                <GitBranch class="mr-1 h-3 w-3" />
                {{ t('goal.statusRule.condition') }} {{ getConditionSummary(rule) }}
              </div>
              <div class="mt-1 flex items-center">
                <Zap class="mr-1 h-3 w-3" />
                {{ t('goal.statusRule.action') }} {{ getActionSummary(rule) }}
              </div>
            </div>
          </div>

          <div class="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :aria-label="t('common.edit')"
              @click="openEditDialog(rule)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              v-if="!rule.id.startsWith('rule-')"
              variant="ghost"
              size="icon"
              :aria-label="t('common.delete')"
              class="h-8 w-8 text-destructive hover:text-destructive"
              @click="handleDelete(rule.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Alert v-else class="mt-4">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{{ t('goal.statusRule.atLeastOneCondition') }}</AlertDescription>
      </Alert>
    </CardContent>

    <!-- 编辑/新建规则对话框 -->
    <Dialog :open="editDialog" @update:open="editDialog = $event">
      <DialogContent class="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{{
            editingRule ? t('goal.statusRule.editRule') : t('goal.statusRule.newRule')
          }}</DialogTitle>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent>
          <!-- 基本信息 -->
          <div class="space-y-2">
            <Label>{{ t('goal.statusRule.ruleName') }}</Label>
            <Input v-model="form.name" :placeholder="t('goal.statusRule.ruleName')" />
          </div>

          <div class="space-y-2">
            <Label>{{ t('goal.statusRule.ruleDesc') }}</Label>
            <Textarea
              v-model="form.description"
              :placeholder="t('goal.statusRule.ruleDesc')"
              :rows="2"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>{{ t('goal.statusRule.rulePriority') }}</Label>
              <Input
                v-model.number="form.priority"
                type="number"
                :placeholder="t('goal.statusRule.rulePriority')"
              />
              <p class="text-xs text-muted-foreground">{{ t('goal.statusRule.priorityHint') }}</p>
            </div>
            <div class="space-y-2">
              <Label>{{ t('goal.statusRule.conditionType') }}</Label>
              <Select v-model="form.conditionType">
                <SelectTrigger>
                  <SelectValue :placeholder="t('goal.statusRule.conditionType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in conditionTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator class="my-4" />

          <!-- 条件构建器 -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium">{{ t('goal.statusRule.conditionSettings') }}</h4>
              <Button variant="ghost" size="sm" @click="addCondition">
                <Plus class="mr-1 h-4 w-4" />
                {{ t('goal.statusRule.addCondition') }}
              </Button>
            </div>

            <div v-if="form.conditions.length === 0" class="text-center py-4">
              <AlertCircle class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-sm text-muted-foreground mt-2">
                {{ t('goal.statusRule.atLeastOneCondition') }}
              </p>
            </div>

            <div
              v-for="(condition, index) in form.conditions"
              :key="index"
              class="grid grid-cols-12 gap-2 mb-2"
            >
              <div class="col-span-3">
                <Select v-model="condition.metric">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('goal.statusRule.metricPlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in metricOptions" :key="opt.value" :value="opt.value">
                      {{ opt.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="col-span-2">
                <Select v-model="condition.operator">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('goal.statusRule.operatorPlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in operatorOptions" :key="opt.value" :value="opt.value">
                      {{ opt.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="col-span-2">
                <Input
                  v-model.number="condition.value"
                  type="number"
                  :placeholder="t('goal.statusRule.valuePlaceholder')"
                />
              </div>
              <div class="col-span-3">
                <Select v-model="condition.scope">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('goal.statusRule.scopePlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
                      {{ opt.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="col-span-2 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  :aria-label="t('common.delete')"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="removeCondition(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator class="my-4" />

          <!-- 动作设置 -->
          <div>
            <h4 class="text-sm font-medium mb-3">{{ t('goal.statusRule.actionSettings') }}</h4>

            <div class="space-y-2 mb-4">
              <Label>{{ t('goal.statusRule.targetStatus') }}</Label>
              <Select v-model="form.action.status">
                <SelectTrigger>
                  <SelectValue :placeholder="t('goal.statusRule.targetStatusHint')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">
                {{ t('goal.statusRule.targetStatusHint') }}
              </p>
            </div>

            <div class="flex items-center gap-2 mb-4">
              <Switch :checked="form.action.notify" @update:checked="form.action.notify = $event" />
              <Label>{{ t('goal.statusRule.sendNotification') }}</Label>
            </div>

            <div v-if="form.action.notify" class="space-y-2">
              <Label>{{ t('goal.statusRule.notificationMessage') }}</Label>
              <Textarea
                v-model="form.action.message"
                :rows="2"
                :placeholder="t('goal.statusRule.messagePlaceholder')"
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="closeEditDialog">{{
            t('goal.statusRule.cancel')
          }}</Button>
          <Button @click="saveRule">{{ t('goal.statusRule.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoStatusRules } from '../../composables/useAutoStatusRules';

const { t } = useI18n();
import type { StatusRule, RuleCondition } from '@memoflow/contracts/goal';
import { GoalStatus } from '@memoflow/contracts/goal';
import { sortRulesByPriority } from '@memoflow/goal/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Switch,
  Label,
  Separator,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Alert,
  AlertDescription,
  useConfirm,
} from '@memoflow/ui-vue-shadcn';
import { Bot, Plus, Pencil, Trash2, GitBranch, Zap, AlertCircle } from '@lucide/vue';

const { config, getRuleEngine } = useAutoStatusRules();

const ruleEngine = getRuleEngine();
const rules = ref<StatusRule[]>([]);
const editDialog = ref(false);
const editingRule = ref<StatusRule | null>(null);

interface RuleForm {
  name: string;
  description: string;
  priority: number;
  conditionType: 'all' | 'any';
  conditions: RuleCondition[];
  action: {
    status: GoalStatus | undefined;
    notify: boolean;
    message?: string;
  };
}

const form = ref<RuleForm>({
  name: '',
  description: '',
  priority: 10,
  conditionType: 'all',
  conditions: [],
  action: {
    status: undefined,
    notify: false,
    message: '',
  },
});

// 选项
const conditionTypeOptions = computed(() => [
  { title: t('goal.statusRule.conditionTypeProgress'), value: 'all' },
  { title: t('goal.statusRule.conditionTypeTime'), value: 'any' },
]);

const metricOptions = computed(() => [
  { title: t('goal.statusRule.metricProgress'), value: 'progress' },
  { title: t('goal.statusRule.metricKRCompletion'), value: 'weight' },
  { title: t('goal.statusRule.metricTimeElapsed'), value: 'kr_count' },
  { title: t('goal.statusRule.conditionTypeManual'), value: 'deadline' },
]);

const operatorOptions = computed(() => [
  { title: t('goal.statusRule.operatorGt') + ' (>)', value: '>' },
  { title: t('goal.statusRule.operatorLt') + ' (<)', value: '<' },
  { title: t('goal.statusRule.operatorEq') + ' (=)', value: '=' },
  { title: t('goal.statusRule.operatorGte') + ' (>=)', value: '>=' },
  { title: t('goal.statusRule.operatorLte') + ' (<=)', value: '<=' },
  { title: '!= (!=)', value: '!=' },
]);

const scopeOptions = computed(() => [
  { title: t('goal.statusRule.scopeAll'), value: 'all' },
  { title: t('goal.statusRule.scopeAny'), value: 'any' },
]);

const statusOptions = computed(() => [
  { title: t('goal.statusRule.statusActive'), value: GoalStatus.Active },
  { title: t('goal.statusRule.statusCompleted'), value: GoalStatus.Completed },
  { title: t('goal.statusRule.statusArchived'), value: GoalStatus.Archived },
]);

// 计算属性
const sortedRules = computed(() => sortRulesByPriority(rules.value));

// 生成条件摘要
const getConditionSummary = (rule: StatusRule): string => {
  const conditionTexts = rule.conditions.map((c) => {
    const metric = metricOptions.value.find((m) => m.value === c.metric)?.title || c.metric;
    const operator = operatorOptions.value.find((o) => o.value === c.operator)?.title || c.operator;
    const scope = scopeOptions.value.find((s) => s.value === c.scope)?.title || c.scope;
    return `${metric} ${operator} ${c.value} (${scope})`;
  });

  const connector =
    rule.conditionType === 'all'
      ? ` ${t('goal.statusRule.connectorAnd')} `
      : ` ${t('goal.statusRule.connectorOr')} `;
  return conditionTexts.join(connector);
};

// 生成动作摘要
const getActionSummary = (rule: StatusRule): string => {
  const parts: string[] = [];

  if (rule.action.status) {
    const statusText =
      statusOptions.value.find((s) => s.value === rule.action.status)?.title || rule.action.status;
    parts.push(`${t('goal.statusRule.setStatusTo')} ${statusText}`);
  }

  if (rule.action.notify) {
    parts.push(t('goal.statusRule.andNotify'));
  }

  return parts.join(', ') || t('goal.statusRule.save');
};

// 打开新建对话框
const openAddDialog = () => {
  editingRule.value = null;
  form.value = {
    name: '',
    description: '',
    priority: 10,
    conditionType: 'all',
    conditions: [],
    action: {
      status: undefined,
      notify: false,
      message: '',
    },
  };
  editDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (rule: StatusRule) => {
  editingRule.value = rule;
  form.value = {
    name: rule.name,
    description: rule.description || '',
    priority: rule.priority,
    conditionType: rule.conditionType,
    conditions: [...rule.conditions],
    action: { ...rule.action },
  };
  editDialog.value = true;
};

// 关闭对话框
const closeEditDialog = () => {
  editDialog.value = false;
  editingRule.value = null;
};

// 保存规则
const saveRule = async () => {
  if (!form.value.name) {
    alert(t('goal.statusRule.ruleName'));
    return;
  }

  if (form.value.priority <= 0) {
    alert(t('goal.statusRule.priorityHint'));
    return;
  }

  if (form.value.conditions.length === 0) {
    alert(t('goal.statusRule.atLeastOneCondition'));
    return;
  }

  const ruleData: StatusRule = {
    id: editingRule.value?.id || `custom-${Date.now()}`,
    name: form.value.name,
    description: form.value.description,
    enabled: true,
    priority: form.value.priority,
    conditionType: form.value.conditionType,
    conditions: form.value.conditions,
    action: {
      status: form.value.action.status!,
      notify: form.value.action.notify,
      message: form.value.action.message,
    },
    createdAt: editingRule.value?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  if (editingRule.value) {
    ruleEngine.updateRule(editingRule.value.id, ruleData);
  } else {
    ruleEngine.addRule(ruleData);
  }

  loadRules();
  closeEditDialog();
};

// 添加条件
const addCondition = () => {
  form.value.conditions.push({
    metric: 'progress',
    operator: '>=',
    value: 80,
    scope: 'all',
  });
};

// 删除条件
const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1);
};

// 切换规则启用状态
const handleRuleToggle = (rule: StatusRule) => {
  ruleEngine.updateRule(rule.id, { enabled: rule.enabled });
  loadRules();
};

// 删除规则
const handleDelete = async (ruleId: string) => {
  const confirmed = await useConfirm({
    title: t('goal.statusRule.alertDeleteTitle'),
    description: t('goal.statusRule.alertDeleteConfirm'),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  ruleEngine.removeRule(ruleId);
  loadRules();
};

// 加载规则
const loadRules = () => {
  rules.value = ruleEngine.getRules();
};

onMounted(() => {
  loadRules();
});
</script>
