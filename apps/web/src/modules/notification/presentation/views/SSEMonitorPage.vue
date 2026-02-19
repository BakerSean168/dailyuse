<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">SSE 事件监控</h2>
        <p class="text-sm text-muted-foreground">实时服务端推送事件调试面板</p>
      </div>
      <div class="flex items-center gap-2">
        <Badge :variant="connected ? 'default' : 'destructive'">
          {{ connected ? '已连接' : '未连接' }}
        </Badge>
        <Button
          v-if="!connected"
          size="sm"
          @click="connect"
        >
          <Wifi class="mr-1 h-4 w-4" /> 连接
        </Button>
        <Button
          v-else
          variant="outline"
          size="sm"
          @click="disconnect"
        >
          <WifiOff class="mr-1 h-4 w-4" /> 断开
        </Button>
        <Button variant="ghost" size="sm" @click="events = []">
          <Trash2 class="mr-1 h-4 w-4" /> 清空
        </Button>
      </div>
    </div>

    <Card class="flex-1">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2">
            <Radio class="h-4 w-4" /> 事件流
          </CardTitle>
          <span class="text-sm text-muted-foreground">{{ events.length }} 条事件</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea class="h-[calc(100vh-280px)]">
          <div v-if="events.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            等待事件...
          </div>
          <div v-else class="space-y-2 font-mono text-xs">
            <div
              v-for="(event, idx) in reversedEvents"
              :key="idx"
              class="rounded border p-3"
            >
              <div class="mb-1 flex items-center justify-between">
                <Badge variant="outline" class="font-mono text-xs">{{ event.type }}</Badge>
                <span class="text-muted-foreground">{{ event.time }}</span>
              </div>
              <pre class="whitespace-pre-wrap text-muted-foreground">{{ event.data }}</pre>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { Wifi, WifiOff, Trash2, Radio } from 'lucide-vue-next';
import {
  Button, Badge, Card, CardHeader, CardTitle, CardContent, ScrollArea,
} from '@dailyuse/ui-vue-shadcn';

interface SSEvent {
  type: string;
  data: string;
  time: string;
}

const events = ref<SSEvent[]>([]);
const connected = ref(false);
let eventSource: EventSource | null = null;

const reversedEvents = computed(() => [...events.value].reverse());

function getTimestamp(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function connect() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  eventSource = new EventSource(`${baseUrl}/notifications/sse`);
  connected.value = true;

  eventSource.onopen = () => {
    events.value.push({ type: 'SYSTEM', data: 'SSE 连接已建立', time: getTimestamp() });
  };

  eventSource.onmessage = (e) => {
    events.value.push({ type: 'message', data: e.data, time: getTimestamp() });
  };

  eventSource.addEventListener('notification', (e: MessageEvent) => {
    events.value.push({ type: 'notification', data: e.data, time: getTimestamp() });
  });

  eventSource.addEventListener('heartbeat', (e: MessageEvent) => {
    events.value.push({ type: 'heartbeat', data: e.data, time: getTimestamp() });
  });

  eventSource.onerror = () => {
    events.value.push({ type: 'ERROR', data: '连接异常', time: getTimestamp() });
    connected.value = false;
  };
}

function disconnect() {
  eventSource?.close();
  eventSource = null;
  connected.value = false;
  events.value.push({ type: 'SYSTEM', data: 'SSE 连接已断开', time: getTimestamp() });
}

onUnmounted(() => {
  disconnect();
});
</script>
