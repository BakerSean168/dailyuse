import { createWebHistory } from 'vue-router';
import {
  accountRoutes,
  createAppRouter,
  goalRoutes,
  useAuthenticationStore,
} from '@dailyuse/app-vue';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';
import { governanceRoutes } from '@/modules/governance/presentation/router';
const router = createAppRouter({
  history: createWebHistory(),
  isAuthenticated: () => useAuthenticationStore().isAuthenticated,
  additionalRoutes: [...accountRoutes, ...governanceRoutes, ...goalRoutes],
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
