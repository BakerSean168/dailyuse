<template>
  <v-card class="repo-info-card" variant="elevated" elevation="3" hover @click="navigateToRepo">
    <v-card-text class="pa-4">
      <div class="card-content">
        <div class="card-header">
          <v-icon color="primary" size="28" class="mr-2">mdi-folder</v-icon>
          <div class="repo-name">{{ repository.name }}</div>
        </div>

        <div v-if="repository.description" class="repo-description">
          {{ repository.description }}
        </div>

        <div class="card-footer">
          <div v-if="repository.updatedAt" class="visit-info">
            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
            <span class="text-caption"
              >{{ t('common.14') }}: {{ format(repository.updatedAt, 'yyyy-MM-dd') }}</span
            >
          </div>

          <v-btn icon="mdi-arrow-right" variant="text" size="small" class="nav-btn" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Repository } from '@dailyuse/repository/domain-client';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';

const { t } = useI18n();

interface Props {
  repository: Repository;
}
const { repository } = defineProps<Props>();
const router = useRouter();

const navigateToRepo = () => {
  router.push(`/repository/${repository.name}`);
};
</script>

<style scoped>
.repo-info-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
  height: 100%;
}

.repo-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
}

.repo-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-description {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
}

.visit-info {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.nav-btn {
  opacity: 0.6;
  transition: all 0.2s ease;
}

.repo-info-card:hover .nav-btn {
  opacity: 1;
  transform: translateX(2px);
}
</style>
