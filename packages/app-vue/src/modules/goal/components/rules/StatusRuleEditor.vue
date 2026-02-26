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
          <CardTitle>自动状态规则</CardTitle>
        </div>
        <Badge :variant="config.enabled ? 'default' : 'secondary'">
          {{ config.enabled ? '已启用' : '已禁用' }}
        </Badge>
      </div>
      <CardDescription> 根据关键结果的进度、权重和截止日期自动更新目标状态 </CardDescription>
    </CardHeader>

    <CardContent>
      <!-- 全局配置 -->
      <div class="mb-4 space-y-2">
        <div class="flex items-center gap-2">
          <Switch :checked="config.enabled" @update:checked="config.enabled = $event" />
          <Label>启用自动规则</Label>
        </div>
        <div class="flex items-center gap-2">
          <Switch
            :checked="config.allowManualOverride"
            @update:checked="config.allowManualOverride = $event"
          />
          <Label>允许手动覆盖</Label>
          <span class="text-sm text-muted-foreground">关闭后将不会自动应用规则建议</span>
        </div>
        <div class="flex items-center gap-2">
          <Switch
            :checked="config.notifyOnChange"
            @update:checked="config.notifyOnChange = $event"
          />
          <Label>状态变更时通知</Label>
        </div>
      </div>

      <Separator class="my-4" />

      <!-- 规则列表 -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">规则列表</h3>
        <Button variant="ghost" size="sm" @click="openAddDialog">
          <Plus class="mr-1 h-4 w-4" />
          添加规则
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
              <Badge variant="outline" class="text-xs"> 优先级: {{ rule.priority }} </Badge>
              <Badge v-if="rule.id.startsWith('rule-')" variant="secondary" class="text-xs">
                内置
              </Badge>
            </div>

            <p v-if="rule.description" class="mt-1 text-sm text-muted-foreground">
              {{ rule.description }}
            </p>

            <div class="mt-2 text-xs text-muted-foreground">
              <div class="flex items-center">
                <GitBranch class="mr-1 h-3 w-3" />
                条件: {{ getConditionSummary(rule) }}
              </div>
              <div class="mt-1 flex items-center">
                <Zap class="mr-1 h-3 w-3" />
                动作: {{ getActionSummary(rule) }}
              </div>
            </div>
          </div>

          <div class="flex gap-1">
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditDialog(rule)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              v-if="!rule.id.startsWith('rule-')"
              variant="ghost"
              size="icon"
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
        <AlertDescription>暂无规则。点击"添加规则"创建自定义规则。</AlertDescription>
      </Alert>
    </CardContent>

    <!-- 编辑/新建规则对话框 -->
    <Dialog :open="editDialog" @update:open="editDialog = $event">
      <DialogContent class="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{{ editingRule ? '编辑规则' : '新建规则' }}</DialogTitle>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent>
          <!-- 基本信息 -->
          <div class="space-y-2">
            <Label>规则名称 *</Label>
            <Input v-model="form.name" placeholder="规则名称" />
          </div>

          <div class="space-y-2">
            <Label>描述</Label>
            <Textarea v-model="form.description" placeholder="描述" :rows="2" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>优先级 *</Label>
              <Input v-model.number="form.priority" type="number" placeholder="优先级" />
              <p class="text-xs text-muted-foreground">数值越大优先级越高</p>
            </div>
            <div class="space-y-2">
              <Label>条件类型 *</Label>
              <Select v-model="form.conditionType">
                <SelectTrigger>
                  <SelectValue placeholder="条件类型" />
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
              <h4 class="text-sm font-medium">条件设置</h4>
              <Button variant="ghost" size="sm" @click="addCondition">
                <Plus class="mr-1 h-4 w-4" />
                添加条件
              </Button>
            </div>

            <div v-if="form.conditions.length === 0" class="text-center py-4">
              <AlertCircle class="mx-auto h-12 w-12 text-muted-foreground" />
              <p class="text-sm text-muted-foreground mt-2">请至少添加一个条件</p>
            </div>

            <div
              v-for="(condition, index) in form.conditions"
              :key="index"
              class="grid grid-cols-12 gap-2 mb-2"
            >
              <div class="col-span-3">
                <Select v-model="condition.metric">
                  <SelectTrigger>
                    <SelectValue placeholder="指标" />
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
                    <SelectValue placeholder="操作符" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in operatorOptions" :key="opt.value" :value="opt.value">
                      {{ opt.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="col-span-2">
                <Input v-model.number="condition.value" type="number" placeholder="值" />
              </div>
              <div class="col-span-3">
                <Select v-model="condition.scope">
                  <SelectTrigger>
                    <SelectValue placeholder="范围" />
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
            <h4 class="text-sm font-medium mb-3">动作设置</h4>

            <div class="space-y-2 mb-4">
              <Label>目标状态</Label>
              <Select v-model="form.action.status">
                <SelectTrigger>
                  <SelectValue placeholder="留空则不改变状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.title }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground">留空则不改变状态</p>
            </div>

            <div class="flex items-center gap-2 mb-4">
              <Switch :checked="form.action.notify" @update:checked="form.action.notify = $event" />
              <Label>发送通知</Label>
            </div>

            <div v-if="form.action.notify" class="space-y-2">
              <Label>通知消息</Label>
              <Textarea
                v-model="form.action.message"
                :rows="2"
                placeholder="例如：🎉 太棒了！目标进度达到 80%"
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="closeEditDialog">取消</Button>
          <Button @click="saveRule">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutoStatusRules } from '../../application/composables/useAutoStatusRules';
import type { StatusRule, RuleCondition } from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { sortRulesByPriority } from '../../application/rules/BuiltInRules';
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
} from '@dailyuse/ui-vue-shadcn';
import { Bot, Plus, Pencil, Trash2, GitBranch, Zap, AlertCircle } from 'lucide-vue-next';

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
const conditionTypeOptions = [
  { title: '所有条件都满足 (AND)', value: 'all' },
  { title: '任意条件满足 (OR)', value: 'any' },
];

const metricOptions = [
  { title: '进度 (%)', value: 'progress' },
  { title: '权重 (%)', value: 'weight' },
  { title: 'KR 数量', value: 'kr_count' },
  { title: '剩余天数', value: 'deadline' },
];

const operatorOptions = [
  { title: '大于 (>)', value: '>' },
  { title: '小于 (<)', value: '<' },
  { title: '等于 (=)', value: '=' },
  { title: '大于等于 (>=)', value: '>=' },
  { title: '小于等于 (<=)', value: '<=' },
  { title: '不等于 (!=)', value: '!=' },
];

const scopeOptions = [
  { title: '所有 KR', value: 'all' },
  { title: '任意 KR', value: 'any' },
];

const statusOptions = [
  { title: '进行中', value: GoalStatus.Active },
  { title: '已完成', value: GoalStatus.Completed },
  { title: '已归档', value: GoalStatus.Archived },
];

// 计算属性
const sortedRules = computed(() => sortRulesByPriority(rules.value));

// 生成条件摘要
const getConditionSummary = (rule: StatusRule): string => {
  const conditionTexts = rule.conditions.map((c) => {
    const metric = metricOptions.find((m) => m.value === c.metric)?.title || c.metric;
    const operator = operatorOptions.find((o) => o.value === c.operator)?.title || c.operator;
    const scope = scopeOptions.find((s) => s.value === c.scope)?.title || c.scope;
    return `${metric} ${operator} ${c.value} (${scope})`;
  });

  const connector = rule.conditionType === 'all' ? ' 且 ' : ' 或 ';
  return conditionTexts.join(connector);
};

// 生成动作摘要
const getActionSummary = (rule: StatusRule): string => {
  const parts: string[] = [];

  if (rule.action.status) {
    const statusText =
      statusOptions.find((s) => s.value === rule.action.status)?.title || rule.action.status;
    parts.push(`状态 → ${statusText}`);
  }

  if (rule.action.notify) {
    parts.push('发送通知');
  }

  return parts.join(', ') || '无动作';
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
    alert('请输入规则名称');
    return;
  }

  if (form.value.priority <= 0) {
    alert('优先级必须大于 0');
    return;
  }

  if (form.value.conditions.length === 0) {
    alert('请至少添加一个条件');
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
const handleDelete = (ruleId: string) => {
  if (confirm('确定要删除此规则吗？')) {
    ruleEngine.removeRule(ruleId);
    loadRules();
  }
};

// 加载规则
const loadRules = () => {
  rules.value = ruleEngine.getRules();
};

onMounted(() => {
  loadRules();
});
</script>
