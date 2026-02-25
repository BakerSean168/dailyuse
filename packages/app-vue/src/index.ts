// ── DI ──
export * from './di/keys';
export * from './di/types';
export * from './di/navigation';

// ── Router & Layouts ──
export * from './router';
export { default as MainLayout } from './layouts/MainLayout.vue';
export { default as AuthLayout } from './layouts/AuthLayout.vue';

// ── Shared ──
export * from './shared/utils/result-helpers';
export * from './shared/components';

// ── Modules ──
export * from './modules/account';
export * from './modules/authentication';
export * from './modules/goal';
export * from './modules/governance';
export * from './modules/task';
export * from './modules/schedule';
export * from './modules/reminder';
export * from './modules/repository';
export * from './modules/notification';
export * from './modules/setting';
export * from './modules/editor';
