<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="$router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">SSE 监控</h1>
        <Badge :variant="connected ? 'default' : 'destructive'" class="text-xs">
          {{ connected ? '已连接' : '未连接' }}
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-8" @click="clearMessages">
          清空日志
        </Button>
        <Button size="sm" class="h-8" :variant="connected ? 'destructive' : 'default'" @click="toggleConnection">
          {{ connected ? '断开' : '连接' }}
        </Button>
      </div>
    </header>

    <!-- Content -->
    <ScrollArea class="flex-1 p-6">
      <div class="mx-auto max-w-4xl space-y-2">
        <div
          v-if="messages.length === 0"
          class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
        >
          <Radio class="mb-4 h-12 w-12 opacity-50" />
          <h3 class="mb-1 text-lg font-medium text-foreground">等待 SSE 事件</h3>
          <p class="text-sm">连接后，收到的事件将在这里显示</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="rounded-lg border bg-card p-3 font-mono text-sm"
        >
          <div class="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{{ msg.time }}</span>
            <Badge variant="outline" class="text-xs">{{ msg.type }}</Badge>
          </div>
          <pre class="whitespace-pre-wrap text-foreground">{{ msg.data }}</pre>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeft, Radio } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Separator } from '@dailyuse/ui-vue-shadcn';

interface SSEMessage {
  time: string;
  type: string;
  data: string;
}

const connected = ref(false);
const messages = ref<SSEMessage[]>([]);

function toggleConnection() {
  connected.value = !connected.value;
  if (connected.value) {
    messages.value.push({
      time: new Date().toLocaleTimeString(),
      type: 'system',
      data: 'SSE 连接已建立（模拟）',
    });
  } else {
    messages.value.push({
      time: new Date().toLocaleTimeString(),
      type: 'system',
      data: 'SSE 连接已断开',
    });
  }
}

function clearMessages() {
  messages.value = [];
}
</script>
