<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <header
      class="z-10 flex h-14 shrink-0 items-center border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <Button variant="ghost" size="icon" class="mr-3 h-8 w-8" @click="$router.back()">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-medium text-foreground">{{ t('task.depValidationDemo.title') }}</h1>
    </header>

    <div class="flex-1 overflow-auto p-6">
      <div class="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.depValidationDemo.subtitle') }}</CardTitle>
            <p class="text-sm text-muted-foreground">
              {{ t('task.depValidationDemo.description') }}
            </p>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">{{ t('task.depValidationDemo.devInProgress') }}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from '@lucide/vue';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn';

const { t } = useI18n();
</script>
