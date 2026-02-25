import { createWebHistory } from 'vue-router';
import { createAppRouter, useAuthenticationStore } from '@dailyuse/app-vue';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

const router = createAppRouter({
  history: createWebHistory(),
  isAuthenticated: () => useAuthenticationStore().isAuthenticated,
});
router.beforeEach(() => {
  progressStart();
});

router.afterEach((to) => {
  progressDone();
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} - DailyUse` : 'DailyUse';
});

export default router;
