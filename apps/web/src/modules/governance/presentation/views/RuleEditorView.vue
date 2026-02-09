<template>
  <v-container fluid class="rule-editor-view">
    <!-- Breadcrumb -->
    <v-breadcrumbs density="compact" class="pa-0 mb-4">
      <v-breadcrumbs-item :to="{ name: 'governance-list' }">
        治理规则
      </v-breadcrumbs-item>
      <v-breadcrumbs-divider />
      <v-breadcrumbs-item>
        {{ isEdit ? '编辑规则' : '新建规则' }}
      </v-breadcrumbs-item>
    </v-breadcrumbs>

    <h1 class="text-h5 font-weight-bold mb-4">
      {{ isEdit ? '编辑规则' : '新建规则' }}
    </h1>

    <!-- Loading -->
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Error -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
      <v-row>
        <!-- Left column: Main Info -->
        <v-col cols="12" md="8">
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1">基本信息</v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.code"
                    label="规则代码"
                    placeholder="GOV-001"
                    :rules="[rules.required, rules.codeFormat]"
                    :disabled="isEdit"
                    hint="格式: 大写字母-数字 (如 GOV-001)"
                    persistent-hint
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="form.title"
                    label="标题"
                    :rules="[rules.required, rules.minLen(3), rules.maxLen(100)]"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>

              <v-textarea
                v-model="form.description"
                label="描述"
                :rules="[rules.required, rules.minLen(10), rules.maxLen(5000)]"
                variant="outlined"
                density="compact"
                rows="4"
                auto-grow
                counter="5000"
                class="mt-2"
              />

              <v-row dense class="mt-2">
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.severity"
                    label="严重级别"
                    :items="severityOptions"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.liveReferenceLocation"
                    label="实际引用位置 (可选)"
                    placeholder="packages/governance/src/domain-server/aggregates/rule.ts"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>

              <TagInput
                :tags="form.tags"
                :suggestions="allTags"
                class="mt-2"
                @update:tags="form.tags = $event"
              />
            </v-card-text>
          </v-card>

          <!-- Good Examples -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1">
                <v-icon size="small" icon="mdi-check-circle" color="success" class="mr-1" />
                正确示例
              </span>
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addExample('good')"
              >
                添加
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="form.goodExamples.length === 0" class="text-body-2 text-medium-emphasis">
                至少需要一个正确示例
              </div>

              <div
                v-for="(example, index) in form.goodExamples"
                :key="`good-${index}`"
                class="snippet-editor mb-3"
              >
                <div class="d-flex align-center ga-2 mb-1">
                  <v-select
                    v-model="example.language"
                    :items="languageOptions"
                    label="语言"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 160px"
                  />
                  <v-text-field
                    v-model="example.caption"
                    label="说明 (可选)"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeExample('good', index)"
                  />
                </div>
                <v-textarea
                  v-model="example.content"
                  label="代码"
                  variant="outlined"
                  density="compact"
                  rows="6"
                  auto-grow
                  monospace
                  class="code-textarea"
                />
              </div>
            </v-card-text>
          </v-card>

          <!-- Bad Examples -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1">
                <v-icon size="small" icon="mdi-close-circle" color="error" class="mr-1" />
                错误示例
              </span>
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addExample('bad')"
              >
                添加
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="form.badExamples.length === 0" class="text-body-2 text-medium-emphasis">
                至少需要一个错误示例
              </div>

              <div
                v-for="(example, index) in form.badExamples"
                :key="`bad-${index}`"
                class="snippet-editor mb-3"
              >
                <div class="d-flex align-center ga-2 mb-1">
                  <v-select
                    v-model="example.language"
                    :items="languageOptions"
                    label="语言"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 160px"
                  />
                  <v-text-field
                    v-model="example.caption"
                    label="说明 (可选)"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeExample('bad', index)"
                  />
                </div>
                <v-textarea
                  v-model="example.content"
                  label="代码"
                  variant="outlined"
                  density="compact"
                  rows="6"
                  auto-grow
                  monospace
                  class="code-textarea"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column: Actions & Preview -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="mb-4 sticky-card">
            <v-card-title class="text-subtitle-1">操作</v-card-title>
            <v-card-text>
              <v-btn
                type="submit"
                color="primary"
                block
                :loading="isSaving"
                :disabled="!formValid"
                class="mb-2"
              >
                {{ isEdit ? '保存更改' : '创建规则' }}
              </v-btn>

              <v-btn
                variant="outlined"
                block
                :to="{ name: 'governance-list' }"
              >
                取消
              </v-btn>
            </v-card-text>

            <v-divider />

            <v-card-text>
              <div class="text-caption text-medium-emphasis">
                <div class="mb-1">
                  标签: {{ form.tags.length }}
                </div>
                <div class="mb-1">
                  正确示例: {{ form.goodExamples.length }}
                </div>
                <div>
                  错误示例: {{ form.badExamples.length }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGovernance } from '../composables/useGovernance';
import TagInput from '../components/TagInput.vue';
import type { CreateRuleReq, UpdateRuleReq, RuleSeverity } from '../../types';

const props = defineProps<{
  id?: string;
}>();

const route = useRoute();
const router = useRouter();
const {
  currentRule,
  isLoading,
  isSaving,
  error,
  allTags,
  fetchRule,
  createRule,
  updateRule,
} = useGovernance();

const formRef = ref();
const formValid = ref(false);
const isEdit = computed(() => !!props.id);

interface SnippetForm {
  language: string;
  content: string;
  caption: string;
}

const form = reactive({
  code: '',
  title: '',
  description: '',
  severity: 'Recommended' as RuleSeverity,
  tags: [] as string[],
  liveReferenceLocation: '',
  goodExamples: [] as SnippetForm[],
  badExamples: [] as SnippetForm[],
});

const severityOptions = [
  { title: '强制 (Mandatory)', value: 'Mandatory' },
  { title: '推荐 (Recommended)', value: 'Recommended' },
];

const languageOptions = [
  { title: 'TypeScript', value: 'TypeScript' },
  { title: 'JSON', value: 'JSON' },
  { title: 'YAML', value: 'YAML' },
  { title: 'Prisma', value: 'Prisma' },
];

// Validation rules
const rules = {
  required: (v: unknown) => !!v || '此字段为必填',
  codeFormat: (v: string) => /^[A-Z]+-[0-9]+$/.test(v) || '格式应为 大写-数字 (如 GOV-001)',
  minLen: (min: number) => (v: string) =>
    (v && v.length >= min) || `至少 ${min} 个字符`,
  maxLen: (max: number) => (v: string) =>
    (!v || v.length <= max) || `最多 ${max} 个字符`,
};

function addExample(type: 'good' | 'bad') {
  const example: SnippetForm = { language: 'TypeScript', content: '', caption: '' };
  if (type === 'good') {
    form.goodExamples.push(example);
  } else {
    form.badExamples.push(example);
  }
}

function removeExample(type: 'good' | 'bad', index: number) {
  if (type === 'good') {
    form.goodExamples.splice(index, 1);
  } else {
    form.badExamples.splice(index, 1);
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) return;

  if (isEdit.value && props.id) {
    const req: UpdateRuleReq = {
      title: form.title,
      description: form.description,
      tags: form.tags,
      liveReferenceLocation: form.liveReferenceLocation || null,
    };
    const result = await updateRule(props.id, req);
    if (result) {
      router.push({ name: 'governance-detail', params: { id: result.id } });
    }
  } else {
    const req: CreateRuleReq = {
      code: form.code,
      title: form.title,
      description: form.description,
      severity: form.severity,
      tags: form.tags,
      goodExamples: form.goodExamples
        .filter((e) => e.content.trim())
        .map((e) => ({
          language: e.language,
          content: e.content,
          caption: e.caption || undefined,
        })),
      badExamples: form.badExamples
        .filter((e) => e.content.trim())
        .map((e) => ({
          language: e.language,
          content: e.content,
          caption: e.caption || undefined,
        })),
      liveReferenceLocation: form.liveReferenceLocation || undefined,
    };
    const result = await createRule(req);
    if (result) {
      router.push({ name: 'governance-detail', params: { id: result.id } });
    }
  }
}

async function loadEditData() {
  if (props.id) {
    const rule = await fetchRule(props.id);
    if (rule) {
      form.code = rule.code;
      form.title = rule.title;
      form.description = rule.description;
      form.severity = rule.severity;
      form.tags = [...rule.tags];
      form.liveReferenceLocation = rule.liveReferenceLocation ?? '';
      form.goodExamples = rule.goodExamples.map((e) => ({
        language: e.language,
        content: e.content,
        caption: e.caption ?? '',
      }));
      form.badExamples = rule.badExamples.map((e) => ({
        language: e.language,
        content: e.content,
        caption: e.caption ?? '',
      }));
    }
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadEditData();
  } else {
    // Default: add one empty good + bad example
    addExample('good');
    addExample('bad');
  }
});
</script>

<style scoped>
.rule-editor-view {
  max-width: 1100px;
}

.sticky-card {
  position: sticky;
  top: 80px;
}

.code-textarea :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
}
</style>
