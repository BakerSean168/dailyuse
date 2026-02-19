<!--
  Status Rule Editor Component (STORY-021)
  状态规则编辑器组件
-->
<template>
  <v-card class="rule-editor">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-robot" size="24" />
        <span>自动状态规则</span>
      </div>
      <v-chip :color="config.enabled ? 'success' : 'default'" variant="flat" size="small">
        {{ config.enabled ? '已启用' : '已禁用' }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle> 根据关键结果的进度、权重和截止日期自动更新目标状态 </v-card-subtitle>

    <v-card-text>
      <!-- 全局配置 -->
      <div class="mb-4">
        <v-switch v-model="config.enabled" color="primary" label="启用自动规则" hide-details />
        <v-switch
          v-model="config.allowManualOverride"
          color="primary"
          label="允许手动覆盖"
          hint="关闭后将不会自动应用规则建议"
          class="mt-2"
        />
        <v-switch
          v-model="config.notifyOnChange"
          color="primary"
          label="状态变更时通知"
          class="mt-2"
          hide-details
        />
      </div>

      <v-divider class="my-4" />

      <!-- 规则列表 -->
      <div class="d-flex align-center justify-space-between mb-3">
        <h3 class="text-subtitle-1 font-weight-medium">规则列表</h3>
        <v-btn
          prepend-icon="mdi-plus"
          color="primary"
          variant="text"
          size="small"
          @click="openAddDialog"
        >
          添加规则
        </v-btn>
      </div>

      <v-list v-if="rules.length > 0" class="pa-0">
        <v-list-item
          v-for="rule in sortedRules"
          :key="rule.id"
          class="px-0 mb-2"
          :class="{ 'opacity-60': !rule.enabled }"
        >
          <template #prepend>
            <v-switch
              v-model="rule.enabled"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="handleRuleToggle(rule)"
            />
          </template>

          <v-list-item-title class="d-flex align-center ga-2">
            <span>{{ rule.name }}</span>
            <v-chip size="x-small" variant="tonal"> 优先级: {{ rule.priority }} </v-chip>
            <v-chip v-if="rule.id.startsWith('rule-')" size="x-small" color="info" variant="flat">
              内置
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle v-if="rule.description" class="mt-1">
            {{ rule.description }}
          </v-list-item-subtitle>

          <v-list-item-subtitle class="mt-2 text-caption">
            <div>
              <v-icon icon="mdi-arrow-decision" size="12" class="mr-1" />
              条件: {{ getConditionSummary(rule) }}
            </div>
            <div class="mt-1">
              <v-icon icon="mdi-lightning-bolt" size="12" class="mr-1" />
              动作: {{ getActionSummary(rule) }}
            </div>
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex ga-1">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEditDialog(rule)" />
              <v-btn
                v-if="!rule.id.startsWith('rule-')"
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="handleDelete(rule.id)"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-else type="info" variant="tonal" class="mt-4">
        暂无规则。点击"添加规则"创建自定义规则。
      </v-alert>
    </v-card-text>

    <!-- 编辑/新建规则对话框 -->
    <v-dialog v-model="editDialog" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ editingRule ? '编辑规则' : '新建规则' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef">
            <!-- 基本信息 -->
            <v-text-field
              v-model="form.name"
              label="规则名称 *"
              variant="outlined"
              density="comfortable"
              :rules="[(v: any) => !!v || '请输入规则名称']"
              class="mb-4"
            />

            <v-textarea
              v-model="form.description"
              label="描述"
              variant="outlined"
              density="comfortable"
              rows="2"
              class="mb-4"
            />

            <v-row class="mb-4">
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.priority"
                  label="优先级 *"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  hint="数值越大优先级越高"
                  :rules="[(v: any) => v > 0 || '优先级必须大于 0']"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="form.conditionType"
                  label="条件类型 *"
                  variant="outlined"
                  density="comfortable"
                  :items="conditionTypeOptions"
                  item-title="title"
                  item-value="value"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- 条件构建器 -->
            <div class="mb-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h4 class="text-subtitle-2">条件设置</h4>
                <v-btn prepend-icon="mdi-plus" variant="text" size="small" @click="addCondition">
                  添加条件
                </v-btn>
              </div>

              <div v-if="form.conditions.length === 0" class="text-center py-4">
                <v-icon icon="mdi-alert-circle-outline" size="48" color="grey" />
                <p class="text-body-2 text-grey mt-2">请至少添加一个条件</p>
              </div>

              <v-row v-for="(condition, index) in form.conditions" :key="index" class="mb-2">
                <v-col cols="3">
                  <v-select
                    v-model="condition.metric"
                    label="指标"
                    variant="outlined"
                    density="compact"
                    :items="metricOptions"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
                <v-col cols="2">
                  <v-select
                    v-model="condition.operator"
                    label="操作符"
                    variant="outlined"
                    density="compact"
                    :items="operatorOptions"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
                <v-col cols="2">
                  <v-text-field
                    v-model.number="condition.value"
                    label="值"
                    variant="outlined"
                    density="compact"
                    type="number"
                  />
                </v-col>
                <v-col cols="3">
                  <v-select
                    v-model="condition.scope"
                    label="范围"
                    variant="outlined"
                    density="compact"
                    :items="scopeOptions"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
                <v-col cols="2" class="d-flex align-center">
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeCondition(index)"
                  />
                </v-col>
              </v-row>
            </div>

            <v-divider class="my-4" />

            <!-- 动作设置 -->
            <div class="mb-4">
              <h4 class="text-subtitle-2 mb-3">动作设置</h4>

              <v-select
                v-model="form.action.status"
                label="目标状态"
                variant="outlined"
                density="comfortable"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                clearable
                hint="留空则不改变状态"
                persistent-hint
                class="mb-4"
              />

              <v-switch
                v-model="form.action.notify"
                color="primary"
                label="发送通知"
                hide-details
                class="mb-4"
              />

              <v-textarea
                v-if="form.action.notify"
                v-model="form.action.message"
                label="通知消息"
                variant="outlined"
                density="comfortable"
                rows="2"
                placeholder="例如：🎉 太棒了！目标进度达到 80%"
              />
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeEditDialog">取消</v-btn>
          <v-btn color="primary" @click="saveRule">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAutoStatusRules } from '../../../application/composables/useAutoStatusRules';
import type {
  StatusRule,
  RuleCondition,
} from '@dailyuse/contracts/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { sortRulesByPriority } from '../../../application/rules/BuiltInRules';

const { config, getRuleEngine } = useAutoStatusRules();

const ruleEngine = getRuleEngine();
const rules = ref<StatusRule[]>([]);
const editDialog = ref(false);
const editingRule = ref<StatusRule | null>(null);
const formRef = ref<any>(null);

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
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

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

<style scoped lang="scss">
.rule-editor {
  :deep(.v-list-item) {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }

  :deep(.v-list-item-subtitle) {
    opacity: 0.7;
  }
}
</style>
