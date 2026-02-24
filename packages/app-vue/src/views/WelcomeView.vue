<script setup lang="ts">
import { inject } from 'vue';
import { USER_NAME_KEY } from '../di/keys';

const userName = inject(USER_NAME_KEY, '用户');
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-8">
    <div class="text-center space-y-3">
      <h1 class="text-3xl font-bold">欢迎回来</h1>
      <p class="text-muted-foreground">你好，{{ userName }}</p>
    </div>
  </div>
</template>
