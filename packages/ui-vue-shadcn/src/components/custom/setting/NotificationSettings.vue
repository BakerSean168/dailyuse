<template>
  <Card>
    <CardContent class="p-6">
      <Alert>
        <Info class="h-5 w-5" />
        <AlertTitle class="font-semibold">通知设置功能尚未实现</AlertTitle>
        <AlertDescription class="text-sm mt-2">
          此功能正在开发中，敬请期待。
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '../../ui/card';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Info } from 'lucide-vue-next';

// TODO: Notification settings not yet implemented in backend
// This component is temporarily disabled
</script>
