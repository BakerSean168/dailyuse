import { createWebHistory } from 'vue-router';
import { useAuthenticationStore } from '@/modules/authentication/presentation/stores/authenticationStore';
import { accountRoutes, createAppRouter, goalRoutes } from '@dailyuse/app-vue';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';
import { governanceRoutes } from '@/modules/governance/presentation/router';
const router = createAppRouter({
  history: createWebHistory(),
  authView: () => import('@/modules/authentication/presentation/views/AuthView.vue'),
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
