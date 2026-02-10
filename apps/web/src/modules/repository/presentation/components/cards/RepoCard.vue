<template>
  <v-card class="repo-card mb-4" elevation="2" hover>
    <v-card-text class="pa-6">
      <!-- 仓库标题和状态 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="40" class="mr-3" variant="tonal">
            <v-icon color="primary">mdi-folder</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ repository.name }}</h3>
            <v-chip
              :color="getStatusColor()"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              <v-icon start size="12">{{ getStatusIcon() }}</v-icon>
              {{ getStatusText() }}
            </v-chip>
          </div>
        </div>

        <!-- 操作菜单 -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              v-bind="props"
              class="action-btn"
            />
          </template>
          <v-list>
            <v-list-item @click="openSettings">
              <v-list-item-title>
                <v-icon start>mdi-cog</v-icon>
                设置
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="openInBrowser">
              <v-list-item-title>
                <v-icon start>mdi-open-in-new</v-icon>
                在浏览器中查看
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="editRepository">
              <v-list-item-title>
                <v-icon start>mdi-pencil</v-icon>
                编辑
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteRepository" class="text-error">
              <v-list-item-title>
                <v-icon start>mdi-delete</v-icon>
                删除
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- 仓库描述 -->
      <p v-if="repository.description" class="text-body-2 text-medium-emphasis mb-4">
        {{ repository.description }}
      </p>

      <!-- 仓库元信息 -->
      <div class="repo-meta d-flex align-center flex-wrap gap-2">
        <v-chip size="small" variant="outlined" class="font-weight-medium">
          <v-icon start size="12">mdi-tag</v-icon>
          {{ repository.type }}
        </v-chip>

        <v-spacer class="hidden-sm-and-down" />

        <span class="text-caption text-medium-emphasis">
          更新于 {{ format(repository.updatedAt, 'yyyy-MM-dd HH:mm') }}
        </span>
      </div>
    </v-card-text>

    <!-- 卡片操作 -->
    <v-card-actions class="repo-actions pa-4 pt-0">
      <v-spacer></v-spacer>

      <!-- 查看详情 -->
      <v-btn variant="text" size="small" color="info" @click="goToRepoDetailView">
        <v-icon left size="16">mdi-eye</v-icon>
        查看详情
      </v-btn>

      <!-- 编辑按钮 -->
      <v-btn variant="text" size="small" color="primary" @click="editRepository">
        <v-icon left size="16">mdi-pencil</v-icon>
        编辑
      </v-btn>

      <!-- 删除按钮 -->
      <v-btn variant="text" size="small" color="error" @click="deleteRepository">
        <v-icon left size="16">mdi-delete</v-icon>
        删除
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, defineExpose } from 'vue';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';
import { Repository } from '@dailyuse/repository/domain-client';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

const router = useRouter();

const props = defineProps<{
  repository: Repository;
}>();

// 内部状态控制
const isCardOpen = ref(false);

// ===== 内部业务逻辑方法 =====

/**
 * 编辑仓库
 */
const editRepository = async () => {
  try {
    // TODO: 实现编辑仓库逻辑，可能需要打开对话框或导航到编辑页面
    console.log('编辑仓库', props.repository);
  } catch (error) {
    console.error('Failed to edit repository:', error);
  }
};

/**
 * 删除仓库
 */
const deleteRepository = async () => {
  try {
    if (confirm(`确定要删除仓库 "${props.repository.name}" 吗？此操作不可撤销。`)) {
      // TODO: 实现删除仓库逻辑
      console.log('删除仓库', props.repository.uuid);
    }
  } catch (error) {
    console.error('Failed to delete repository:', error);
  }
};

/**
 * 打开设置
 */
const openSettings = async () => {
  try {
    // TODO: 实现打开设置逻辑
    console.log('打开设置', props.repository);
  } catch (error) {
    console.error('Failed to open settings:', error);
  }
};

/**
 * 在浏览器中查看
 */
const openInBrowser = async () => {
  try {
    // TODO: 实现在浏览器中查看逻辑
    console.log('在浏览器中查看', props.repository);
  } catch (error) {
    console.error('Failed to open in browser:', error);
  }
};

/**
 * 打开卡片详情 - 可供外部调用的方法
 */
const openCard = () => {
  isCardOpen.value = true;
  goToRepoDetailView();
};

/**
 * 关闭卡片
 */
const closeCard = () => {
  isCardOpen.value = false;
};

// 暴露方法给父组件
defineExpose({
  openCard,
  closeCard,
});

// ===== 视图导航方法 =====

const goToRepoDetailView = () => {
  router.push({
    name: 'repository-detail',
    params: { id: props.repository.uuid },
  });
};

// ===== 状态显示方法 =====

const getStatusColor = () => {
  switch (props.repository.status) {
    case RepositoryStatus.ACTIVE:
      return 'success';
    case RepositoryStatus.ARCHIVED:
      return 'warning';
    case RepositoryStatus.DELETED:
      return 'error';
    default:
      return 'primary';
  }
};

const getStatusIcon = () => {
  switch (props.repository.status) {
    case RepositoryStatus.ACTIVE:
      return 'mdi-check-circle';
    case RepositoryStatus.ARCHIVED:
      return 'mdi-archive';
    case RepositoryStatus.DELETED:
      return 'mdi-delete';
    default:
      return 'mdi-circle';
  }
};

const getStatusText = () => {
  switch (props.repository.status) {
    case RepositoryStatus.ACTIVE:
      return '活跃';
    case RepositoryStatus.ARCHIVED:
      return '已归档';
    case RepositoryStatus.DELETED:
      return '已删除';
    default:
      return props.repository.status;
  }
};
</script>

<style scoped>
.repo-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.repo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.action-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 1;
}

.repo-meta {
  min-height: 32px;
}

.repo-actions {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  background: rgba(var(--v-theme-surface-light), 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .repo-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .repo-meta .v-spacer {
    display: none;
  }
}
</style>
