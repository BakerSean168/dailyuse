<script setup lang="ts">
/**
 * Web main-shell auth entry.
 *
 * The web host boots a dedicated AuthApp for `/auth` paths. If the main SPA
 * ever lands on this route (for example via a programmatic router push), force
 * a full-page navigation so AuthApp/WebAuthView owns password + GitHub login
 * and the legacy in-shell guest surface cannot appear.
 *
 * Desktop Profile Access uses a separate renderer bootstrap and never uses
 * this Web identity fallback.
 */
import { onMounted } from 'vue';

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }
  const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target || '/auth');
});
</script>

<template>
  <div
    class="flex min-h-full items-center justify-center bg-[#0b0b10] text-sm text-white/60"
    data-testid="auth-platform-entry"
    role="status"
  >
    Redirecting to sign in…
  </div>
</template>
