<template>
  <div class="flex h-full flex-col items-center justify-center p-6">
    <div class="text-center space-y-4">
      <Focus class="mx-auto h-16 w-16 text-muted-foreground/30" />
      <h2 class="text-xl font-semibold">专注周期</h2>
      <p class="text-sm text-muted-foreground">
        专注模式功能正在开发中，敬请期待
      </p>
      <Button variant="outline" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> 返回
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Focus, ArrowLeft } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
</script>
