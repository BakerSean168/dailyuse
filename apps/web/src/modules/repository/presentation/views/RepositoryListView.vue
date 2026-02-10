<template>
  <v-container fluid class="pa-0 h-100">
    <!-- 页面头部 -->
    <v-card class="repo-header flex-shrink-0" elevation="1" rounded="0">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
              <v-icon size="24">mdi-folder-multiple</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h4 font-weight-bold text-primary mb-1">仓库管理</h1>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">管理您的知识库和项目文档</p>
            </div>
          </div>

          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            variant="elevated"
            @click="repoDialogRef?.openDialog()"
          >
            新建仓库
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 主体内容 -->
    <div class="main-content flex-grow-1 pa-6 overflow-hidden">
      <div class="content-wrapper h-100">
        <v-row no-gutters class="h-100">
          <!-- 仓库列表区域 -->
          <v-col cols="12" class="h-100">
            <v-card class="repo-main h-100 d-flex flex-column" elevation="2">
              <!-- 状态过滤器 -->
              <v-card-title class="pa-4 flex-shrink-0">
                <div class="d-flex align-center justify-space-between w-100">
                  <h2 class="text-h6 font-weight-medium">仓库列表</h2>

                  <!-- 状态标签 -->
                  <v-chip-group
                    v-model="selectedStatusIndex"
                    selected-class="text-primary"
                    mandatory
                    class="status-tabs"
                  >
                    <v-chip
                      v-for="(tab, index) in statusTabs"
                      :key="tab.value"
                      :value="index"
                      variant="outlined"
                      filter
                      class="status-chip"
                    >
                      {{ tab.label }}
                      <v-badge
                        :content="getRepoCountByStatus(tab.value)"
                        :color="selectedStatusIndex === index ? 'primary' : 'surface-bright'"
                        inline
                        class="ml-2"
                      />
                    </v-chip>
                  </v-chip-group>
                </div>
              </v-card-title>

              <v-divider class="flex-shrink-0" />

              <!-- 仓库列表内容 -->
              <v-card-text class="repo-list-content pa-4 flex-grow-1 overflow-y-auto">
                <!-- 加载状态 -->
                <div v-if="isLoading" class="d-flex justify-center align-center h-100">
                  <v-progress-circular indeterminate color="primary" size="64" />
                </div>

                <!-- 错误状态 -->
                <div v-else-if="error" class="d-flex justify-center align-center h-100">
                  <v-alert type="error" variant="tonal" class="ma-4">
                    {{ error }}
                    <template v-slot:append>
                      <v-btn variant="text" color="error" @click="refresh"> 重试 </v-btn>
                    </template>
                  </v-alert>
                </div>

                <!-- 有仓库时显示 -->
                <div v-else-if="filteredRepositories?.length">
                  <v-row>
                    <v-col
                      v-for="repo in filteredRepositories"
                      :key="repo.uuid"
                      cols="12"
                      lg="6"
                      xl="4"
                    >
                      <RepoCard :repository="repo as Repository" />
                    </v-col>
                  </v-row>
                </div>

                <!-- 空状态 -->
                <div v-else class="d-flex align-center justify-center h-100">
                  <v-empty-state
                    icon="mdi-folder-multiple-outline"
                    title="暂无仓库"
                    text="创建您的第一个仓库，开始知识管理之旅"
                  >
                    <template v-slot:actions>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        prepend-icon="mdi-plus"
                        @click="repoDialogRef?.openDialog()"
                      >
                        创建第一个仓库
                      </v-btn>
                    </template>
                  </v-empty-state>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
    <repo-dialog ref="repoDialogRef" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
// utils
import { format } from 'date-fns';
// components
import RepoCard from '../components/cards/RepoCard.vue';
import RepoDialog from '../components/dialogs/RepoDialog.vue';
// composables
import { useRepository } from '../composables/useRepository';
// types
import { Repository } from '@dailyuse/repository/domain-client';
import { RepositoryStatus, RepositoryType, type RepositoryClientDTO, type ResourceClientDTO, type FolderClientDTO } from '@dailyuse/contracts/repository';

// component refs
const repoDialogRef = ref<InstanceType<typeof RepoDialog> | null>(null);

// ===== Repository 服务 =====
const { repositories, isLoading, error, fetchRepositories, initialize, clearError } =
  useRepository();

// ===== 本地状态 =====

// 过滤状态
const selectedStatusIndex = ref(0);

// 状态标签配置
const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '活跃', value: RepositoryStatus.ACTIVE },
  { label: '归档', value: RepositoryStatus.ARCHIVED },
  { label: '已删除', value: RepositoryStatus.DELETED },
];

// ===== 计算属性 =====

/**
 * 过滤后的仓库列表
 */
const filteredRepositories = computed(() => {
  let result = repositories.value || [];

  // 按状态过滤
  const currentStatus = statusTabs[selectedStatusIndex.value]?.value;
  if (currentStatus && currentStatus !== 'all') {
    result = result.filter((repo) => repo.status === currentStatus);
  }

  return result;
});

/**
 * 根据状态获取仓库数量的计算属性
 */
const repoCountByStatus = computed(() => {
  const repos = repositories.value || [];
  return {
    all: repos.length,
    active: repos.filter((repo) => repo.status === RepositoryStatus.ACTIVE)
      .length,
    archived: repos.filter((repo) => repo.status === RepositoryStatus.ARCHIVED)
      .length,
    deleted: repos.filter((repo) => repo.status === RepositoryStatus.DELETED)
      .length,
  };
});

/**
 * 根据状态获取仓库数量
 */
const getRepoCountByStatus = (status: string) => {
  return repoCountByStatus.value[status as keyof typeof repoCountByStatus.value] || 0;
};

// ===== 方法 =====

/**
 * 加载仓库数据
 */
const loadRepositories = async () => {
  try {
    console.log('开始加载仓库数据...');
    await fetchRepositories({ limit: 100 });
    console.log('✅ 仓库数据加载完成，总数:', repositories.value?.length || 0);
  } catch (err) {
    console.error('❌ 加载仓库数据失败:', err);
  }
};

/**
 * 刷新数据
 */
const refresh = async () => {
  await loadRepositories();
};

/**
 * 处理对话框成功创建/更新
 */
const handleRepoDialogSuccess = async () => {
  console.log('🔄 仓库对话框操作成功，刷新数据...');
  await refresh();
};

/**
 * 获取目标标题
 */
const getGoalTitle = (goalUuid: string) => {
  // TODO: 根据goalUuid获取目标标题
  return `目标-${goalUuid.slice(0, 8)}`;
};

// ===== 生命周期 =====

onMounted(() => {
  loadRepositories();
});
</script>

<style scoped>
.main-content {
  height: calc(100vh - 120px);
}

.content-wrapper {
  max-height: 100%;
}

.repo-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05),
    rgba(var(--v-theme-surface), 1)
  );
}

.repo-main {
  border-radius: 12px;
}

.repo-list-content {
  min-height: 400px;
}

.status-tabs {
  gap: 8px;
}

.status-chip {
  transition: all 0.2s ease;
}

.status-chip:hover {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>

