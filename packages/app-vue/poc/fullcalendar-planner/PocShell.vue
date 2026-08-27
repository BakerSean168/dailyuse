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
import type {
  PlannerMutationOutcome,
  PlannerMutationRequest,
  PlannerOwnerCommandRouter,
} from '../../src/modules/schedule/planner';

const dark = ref(false);
const narrow = ref(false);
const failNext = ref(false);
const lastCommand = ref('No owner mutation yet');
const ownerCommands: PlannerOwnerCommandRouter = {
  async route(command: PlannerMutationRequest): Promise<PlannerMutationOutcome> {
    lastCommand.value = JSON.stringify(command, null, 2);
    if (failNext.value) {
      failNext.value = false;
      return { status: 'failed', code: 'POC_FAILURE', message: 'PoC forced owner failure' };
    }
    return { status: 'applied', ownerType: command.projection.ownerCommandTarget.ownerType };
  },
};
</script>
