import { defineConfig, devices } from '@playwright/test';
import { createApiServer, createWebServer } from './playwright.server';

/**
 * Playwright 配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 默认 E2E 只覆盖纯 Web 流程；desktop-web 同步回归单独放到 sync 配置里，
  // 避免日常回归被跨进程准备成本拖慢。
  testDir: './e2e',
  // 默认入口进一步收口成 AI 可依赖的核心业务回归集合。
  testMatch: [
    '**/ai/goal-workflow.spec.ts',
    '**/authentication/auth-flow.spec.ts',
    '**/authentication/auth-login.spec.ts',
    '**/dashboard/dashboard-overview.spec.ts',
    '**/goal/goal-crud.spec.ts',
    '**/notification/notification-center.spec.ts',
    '**/reminder/reminder-template-crud.spec.ts',
    '**/task/task-template-crud.spec.ts',
    '**/user-settings/notifications.spec.ts',
    '**/user-settings/persistence.spec.ts',
  ],
  testIgnore: [
    'sync/**',
    'desktop-screenshots/**',
    'performance/**',
    'debug/**',
    '**/debug*.spec.ts',
    '**/*-debug.spec.ts',
    '**/explore*.spec.ts',
    '**/check-route.spec.ts',
  ],

  // 单个测试最大执行时间 (5分钟，因为需要等待 Reminder 触发)
  timeout: 5 * 60 * 1000,

  // 全局设置超时
  expect: {
    timeout: 10 * 1000, // 断言超时 10 秒
  },

  // 主流程用例会共享账号与后端状态，保持串行比追求并发更稳定。
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,

  // 单 worker 可以避免数据污染，也让失败更容易复现。
  workers: 1,

  // 报告配置
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'always' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
        ['github'], // GitHub Actions 集成
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }],
      ],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: 'http://127.0.0.1:5173',

    // 追踪配置
    trace: 'on',

    // 截图配置
    screenshot: 'on',

    // 视频录制 - 始终录制
    video: 'on',

    // 浏览器上下文选项
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15 * 1000, // 操作超时 15 秒
  },

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 默认业务回归依赖真实登录和 CRUD，必须同时托管 API + Web。
  webServer: [createApiServer(), createWebServer()],
});
