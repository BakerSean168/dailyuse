<template>
  <div class="flex items-center justify-center h-full text-muted-foreground">
    {{ t('editor.viewTitle') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
