<template>
  <RepoInfoCard 
    :repository="repository" 
    :update-label="t('common.14')"
    @click="navigateToRepo"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { RepoInfoCard } from '@dailyuse/ui-vue-shadcn';
import { Repository } from '@dailyuse/repository/domain-client';
import { useI18n } from 'vue-i18n';

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

