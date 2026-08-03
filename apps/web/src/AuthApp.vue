<script setup lang="ts">
import { computed } from 'vue';
import DeviceAuthorizationView from './auth/DeviceAuthorizationView.vue';
import WebAuthView from './auth/WebAuthView.vue';

const isDeviceAuthorization = computed(() => window.location.pathname === '/auth/device');
</script>

<template>
  <DeviceAuthorizationView v-if="isDeviceAuthorization" />
  <WebAuthView v-else />
</template>
