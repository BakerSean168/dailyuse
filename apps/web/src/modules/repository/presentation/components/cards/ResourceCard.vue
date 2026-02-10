<template>
  <v-card class="resource-card mb-4" elevation="2" hover>
    <v-card-text class="pa-6">
      <!-- 资源标题和类型 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar :color="getResourceTypeColor()" size="40" class="mr-3" variant="tonal">
            <v-icon :color="getResourceTypeColor()">{{ getResourceTypeIcon() }}</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ resource.name }}</h3>
            <v-chip
              :color="getResourceTypeColor()"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              <v-icon start size="12">{{ getResourceTypeIcon() }}</v-icon>
              {{ resource.type }}
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
            <v-list-item @click="viewResource">
              <v-list-item-title>
                <v-icon start>mdi-eye</v-icon>
                查看
              </v-list-item-title>
            </v-list-item>
            <!-- <v-list-item @click="downloadResource" v-if="resource.downloadUrl">
                            <v-list-item-title>
                                <v-icon start>mdi-download</v-icon>
                                下载
                            </v-list-item-title>
                        </v-list-item> -->
            <v-list-item @click="editResource">
              <v-list-item-title>
                <v-icon start>mdi-pencil</v-icon>
                编辑
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteResource" class="text-error">
              <v-list-item-title>
                <v-icon start>mdi-delete</v-icon>
                删除
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- 资源元信息 -->
      <div class="resource-meta d-flex align-center flex-wrap gap-2">
        <v-chip size="small" variant="outlined" class="font-weight-medium" v-if="resource.size">
          <v-icon start size="12">mdi-file</v-icon>
          {{ formatFileSize(resource.size) }}
        </v-chip>

        <!-- <v-chip size="small" variant="outlined" class="font-weight-medium" v-if="resource.format">
                    <v-icon start size="12">mdi-format-text</v-icon>
                    {{ resource.format.toUpperCase() }}
                </v-chip> -->

        <v-spacer class="hidden-sm-and-down" />

        <span class="text-caption text-medium-emphasis">
          创建于 {{ format(resource.createdAt, 'yyyy-MM-dd HH:mm') }}
        </span>
      </div>
    </v-card-text>

    <!-- 卡片操作 -->
    <v-card-actions class="resource-actions pa-4 pt-0">
      <v-spacer></v-spacer>

      <!-- 查看资源 -->
      <v-btn variant="text" size="small" color="info" @click="viewResource">
        <v-icon left size="16">mdi-eye</v-icon>
        查看
      </v-btn>

      <!-- 下载按钮 -->
      <!-- <v-btn variant="text" size="small" color="success" @click="downloadResource" v-if="resource.downloadUrl">
                <v-icon left size="16">mdi-download</v-icon>
                下载
            </v-btn> -->

      <!-- 编辑按钮 -->
      <v-btn variant="text" size="small" color="primary" @click="editResource">
        <v-icon left size="16">mdi-pencil</v-icon>
        编辑
      </v-btn>

      <!-- 删除按钮 -->
      <v-btn variant="text" size="small" color="error" @click="deleteResource">
        <v-icon left size="16">mdi-delete</v-icon>
        删除
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, defineExpose } from 'vue';
import { format } from 'date-fns';

import { Resource } from '@dailyuse/repository/domain-client';
import { ResourceType } from '@dailyuse/contracts/repository';

const props = defineProps<{
  resource: Resource;
}>();

// 内部状态控制
const isCardOpen = ref(false);

// ===== 内部业务逻辑方法 =====

/**
 * 查看资源
 */
const viewResource = async () => {
  try {
    if (props.resource) {
      window.open(props.resource.path, '_blank');
    } else {
      // TODO: 实现查看资源逻辑
      console.log('查看资源', props.resource);
    }
  } catch (error) {
    console.error('Failed to view resource:', error);
  }
};

/**
 * 下载资源
 */
// const downloadResource = async () => {
//     try {
//         if (props.resource.downloadUrl) {
//             const link = document.createElement('a')
//             link.href = props.resource.downloadUrl
//             link.download = props.resource.name
//             document.body.appendChild(link)
//             link.click()
//             document.body.removeChild(link)
//         } else {
//             console.log('下载资源', props.resource)
//         }
//     } catch (error) {
//         console.error('Failed to download resource:', error)
//     }
// }

/**
 * 编辑资源
 */
const editResource = async () => {
  try {
    // TODO: 实现编辑资源逻辑，可能需要打开对话框
    console.log('编辑资源', props.resource);
  } catch (error) {
    console.error('Failed to edit resource:', error);
  }
};

/**
 * 删除资源
 */
const deleteResource = async () => {
  try {
    if (confirm(`确定要删除资源 "${props.resource.name}" 吗？此操作不可撤销。`)) {
      // TODO: 实现删除资源逻辑
      console.log('删除资源', props.resource.uuid);
    }
  } catch (error) {
    console.error('Failed to delete resource:', error);
  }
};

/**
 * 打开卡片详情 - 可供外部调用的方法
 */
const openCard = () => {
  isCardOpen.value = true;
  viewResource();
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

// ===== 工具方法 =====

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 获取资源类型颜色
 */
const getResourceTypeColor = () => {
  switch (props.resource.type) {
    case ResourceType.IMAGE:
      return 'green';
    case ResourceType.VIDEO:
      return 'red';
    case ResourceType.AUDIO:
      return 'purple';
    case ResourceType.CODE:
      return 'orange';
    case ResourceType.LINK:
      return 'cyan';
    default:
      return 'grey';
  }
};

/**
 * 获取资源类型图标
 */
const getResourceTypeIcon = () => {
  switch (props.resource.type) {
    case ResourceType.IMAGE:
      return 'mdi-image';
    case ResourceType.VIDEO:
      return 'mdi-video';
    case ResourceType.AUDIO:
      return 'mdi-music';
    case ResourceType.CODE:
      return 'mdi-code-tags';
    case ResourceType.LINK:
      return 'mdi-link';
    default:
      return 'mdi-file';
  }
};
</script>

<style scoped>
.resource-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.resource-card:hover {
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

.resource-meta {
  min-height: 32px;
}

.resource-actions {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  background: rgba(var(--v-theme-surface-light), 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .resource-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .resource-meta .v-spacer {
    display: none;
  }
}
</style>
