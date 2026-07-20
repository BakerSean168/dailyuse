<template>
  <LocalVaultWorkspaceView v-if="desktopBridge" />
  <KnowledgeProjectionWorkspaceView v-else />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { DESKTOP_BRIDGE_KEY } from '../../../di/keys';
import LocalVaultWorkspaceView from './LocalVaultWorkspaceView.vue';
import KnowledgeProjectionWorkspaceView from './KnowledgeProjectionWorkspaceView.vue';

const desktopBridge = inject(DESKTOP_BRIDGE_KEY, undefined);
</script>
