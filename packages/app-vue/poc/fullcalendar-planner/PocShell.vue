<template>
  <main :class="['poc-shell', { dark }]">
    <aside class="poc-controls" aria-label="PoC controls">
      <button type="button" @click="dark = !dark">Toggle light/dark</button>
      <button type="button" @click="narrow = !narrow">Toggle narrow panel</button>
      <button type="button" @click="failNext = true">Fail next mutation</button>
      <pre>{{ lastCommand }}</pre>
    </aside>
    <FullCalendarPlannerPoc
      :owner-commands="ownerCommands"
      :narrow="narrow"
      :theme="dark ? 'dark' : 'light'"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FullCalendarPlannerPoc from '../../src/modules/schedule/poc/FullCalendarPlannerPoc.vue';

const dark = ref(false);
const narrow = ref(false);
const failNext = ref(false);
const lastCommand = ref('No owner mutation yet');
const ownerCommands = {
  async execute(command: unknown) {
    lastCommand.value = JSON.stringify(command, null, 2);
    if (failNext.value) {
      failNext.value = false;
      return { ok: false } as const;
    }
    return { ok: true } as const;
  },
};
</script>
