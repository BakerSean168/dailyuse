import 'temporal-polyfill/global';
import { createApp } from 'vue';
import PocShell from './PocShell.vue';

const pocBootStartedAt = performance.now();
createApp(PocShell).mount('#app');
requestAnimationFrame(() => {
  document.documentElement.dataset.plannerPocStartupMs = String(
    Math.round((performance.now() - pocBootStartedAt) * 10) / 10,
  );
});
