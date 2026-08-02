<template>
  <div class="modal-overlay" v-if="props.visible">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ t('task.infoCard.title') }}</h2>
        <button type="button" class="btn btn-secondary" @click="handleClose">
          {{ t('task.infoCard.close') }}
        </button>
      </div>

      <div class="modal-content">
        <div class="task-info">
          <h3>{{ task.instanceDateFormatted }}</h3>
          <p v-if="task.note">{{ task.note }}</p>

          <div class="task-meta">
            <div class="due-date">
              <Calendar class="h-4 w-4" />
              <span>{{ t('task.infoCard.dateLabel') }}</span>
            </div>

            <div class="task-status">
              <component :is="task.isCompleted ? CheckCircle : Clock" class="h-4 w-4" />
              <span>{{ task.statusText }}</span>
            </div>

            <div class="task-time">
              <Clock class="h-4 w-4" />
              <span>{{ t('task.infoCard.timeLabel') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, CheckCircle, Clock } from '@lucide/vue';
import type { TaskInstanceViewModel } from '../types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps<{
  visible: boolean;
  task: TaskInstanceViewModel;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: rgb(41, 41, 41);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content {
  padding: 1rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.weekday-selector {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.weekday-selector button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: transparent;
  color: #ccc;
  cursor: pointer;
}

.weekday-selector button.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.key-result-link {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.invalid {
  border-color: #ff4444;
}

.error-message {
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
</style>
