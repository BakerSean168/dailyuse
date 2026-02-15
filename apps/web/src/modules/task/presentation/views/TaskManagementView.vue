<template>
  <div id="task-management">
    <!-- 头部区域 -->
    <header class="task-header">
      <div class="header-content">
        <!-- 标签页导航 -->
        <v-btn-toggle v-model="activeTab" mandatory variant="outlined" divided class="tab-group">
          <v-btn
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            class="tab-button"
            size="large"
          >
            <v-icon :icon="tab.icon" start />
            {{ tab.label }}
          </v-btn>
        </v-btn-toggle>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="task-main">
      <v-fade-transition mode="out-in">
        <!-- 每日任务页面 -->
        <div v-if="activeTab === 'daily'" class="task-content" key="daily">
          <TaskInstanceManagement />
        </div>

        <!-- 任务管理页面 -->
        <div v-else class="task-content" key="management">
          <TaskTemplateManagement />
        </div>
      </v-fade-transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TaskTemplateManagement, TaskInstanceManagement } from '@dailyuse/ui-vue';

const activeTab = ref('daily');
const tabs = [
  {
    label: '每日任务',
    value: 'daily',
    icon: 'mdi-calendar-today',
  },
  {
    label: '任务管理',
    value: 'management',
    icon: 'mdi-format-list-checks',
  },
];
</script>

<style scoped>
#task-management {
  height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface), 0.8),
    rgba(var(--v-theme-background), 0.95)
  );
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.task-header {
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 标签页样式 */
.tab-group {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-button {
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.tab-button:hover {
  transform: translateY(-1px);
}

/* 主要内容区域 */
.task-main {
  flex: 1;
  min-height: 0;
}

.task-content {
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  #task-management {
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 768px) {
  #task-management {
    padding: 1rem;
  }

  .tab-group {
    width: 100%;
  }

  .tab-button {
    flex: 1;
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .tab-button {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
}
</style>
