<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <router-link :to="{ name: 'governance-list' }" class="hover:text-foreground transition-colors">
        治理规则
      </router-link>
      <ChevronRight :size="14" />
      <span class="text-foreground">{{ isEdit ? '编辑规则' : '新建规则' }}</span>
    </nav>

    <h1 class="text-2xl font-bold mb-4">
      {{ isEdit ? '编辑规则' : '新建规则' }}
    </h1>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <!-- Left column: Main Info -->
        <div class="space-y-6">
          <!-- Basic Info Card -->
          <div class="border rounded-lg">
            <div class="px-4 py-3 border-b bg-muted/30">
              <h2 class="text-sm font-medium">基本信息</h2>
            </div>
            <div class="p-4 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1.5">
                    规则代码 <span class="text-destructive">*</span>
                  </label>
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="GOV-001"
                    :disabled="isEdit"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    pattern="^[A-Z]+-[0-9]+$"
                  />
                  <p class="text-[11px] text-muted-foreground mt-1">格式: 大写字母-数字 (如 GOV-001)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5">
                    标题 <span class="text-destructive">*</span>
                  </label>
                  <input
                    v-model="form.title"
                    type="text"
                    placeholder="规则标题"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                    minlength="3"
                    maxlength="100"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1.5">
                  描述 <span class="text-destructive">*</span>
                </label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
                  required
                  minlength="10"
                  maxlength="5000"
                  placeholder="规则描述..."
                ></textarea>
                <p class="text-[11px] text-muted-foreground mt-1 text-right">
                  {{ form.description.length }} / 5000
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1.5">
                    严重级别 <span class="text-destructive">*</span>
                  </label>
                  <select
                    v-model="form.severity"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5">实际引用位置 (可选)</label>
                  <input
                    v-model="form.liveReferenceLocation"
                    type="text"
                    placeholder="packages/governance/src/..."
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <TagInput
                :tags="form.tags"
                :suggestions="allTags"
                @update:tags="form.tags = $event"
              />
            </div>
          </div>

          <!-- Good Examples Card -->
          <div class="border rounded-lg">
            <div class="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
              <h2 class="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle :size="14" class="text-green-500" />
                正确示例
              </h2>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs hover:bg-muted transition-colors"
                @click="addExample('good')"
              >
                <Plus :size="14" />
                添加
              </button>
            </div>
            <div class="p-4">
              <p v-if="form.goodExamples.length === 0" class="text-sm text-muted-foreground">
                至少需要一个正确示例
              </p>

              <div
                v-for="(example, index) in form.goodExamples"
                :key="`good-${index}`"
                class="mb-4 last:mb-0"
              >
                <div class="flex items-center gap-2 mb-2">
                  <select
                    v-model="example.language"
                    class="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-[140px]"
                  >
                    <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
                      {{ lang.label }}
                    </option>
                  </select>
                  <input
                    v-model="example.caption"
                    type="text"
                    placeholder="说明 (可选)"
                    class="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    class="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    @click="removeExample('good', index)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
                <textarea
                  v-model="example.content"
                  rows="6"
                  placeholder="// 代码..."
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Bad Examples Card -->
          <div class="border rounded-lg">
            <div class="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
              <h2 class="text-sm font-medium flex items-center gap-1.5">
                <XCircle :size="14" class="text-destructive" />
                错误示例
              </h2>
              <button
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs hover:bg-muted transition-colors"
                @click="addExample('bad')"
              >
                <Plus :size="14" />
                添加
              </button>
            </div>
            <div class="p-4">
              <p v-if="form.badExamples.length === 0" class="text-sm text-muted-foreground">
                至少需要一个错误示例
              </p>

              <div
                v-for="(example, index) in form.badExamples"
                :key="`bad-${index}`"
                class="mb-4 last:mb-0"
              >
                <div class="flex items-center gap-2 mb-2">
                  <select
                    v-model="example.language"
                    class="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-[140px]"
                  >
                    <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
                      {{ lang.label }}
                    </option>
                  </select>
                  <input
                    v-model="example.caption"
                    type="text"
                    placeholder="说明 (可选)"
                    class="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    class="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    @click="removeExample('bad', index)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
                <textarea
                  v-model="example.content"
                  rows="6"
                  placeholder="// 代码..."
                  class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column: Actions Sidebar -->
        <div>
          <div class="border rounded-lg sticky top-20">
            <div class="px-4 py-3 border-b bg-muted/30">
              <h2 class="text-sm font-medium">操作</h2>
            </div>
            <div class="p-4 space-y-2">
              <button
                type="submit"
                class="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSaving"
              >
                {{ isSaving ? '保存中...' : isEdit ? '保存更改' : '创建规则' }}
              </button>

              <router-link
                :to="{ name: 'governance-list' }"
                class="block w-full px-4 py-2 rounded-md border text-sm text-center hover:bg-muted transition-colors"
              >
                取消
              </router-link>
            </div>

            <div class="border-t px-4 py-3">
              <div class="text-xs text-muted-foreground space-y-1">
                <div>标签: {{ form.tags.length }}</div>
                <div>正确示例: {{ form.goodExamples.length }}</div>
                <div>错误示例: {{ form.badExamples.length }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-vue-next';
import { useGovernance } from '../composables/useGovernance';
import TagInput from '../components/TagInput.vue';
import type { CreateRuleReq, UpdateRuleReq, RuleSeverity } from '../../types';

const props = defineProps<{
  id?: string;
}>();

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
  { label: '强制 (Mandatory)', value: 'Mandatory' },
  { label: '推荐 (Recommended)', value: 'Recommended' },
];

const languageOptions = [
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'JSON', value: 'JSON' },
  { label: 'YAML', value: 'YAML' },
  { label: 'Prisma', value: 'Prisma' },
];

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
    addExample('good');
    addExample('bad');
  }
});
</script>
