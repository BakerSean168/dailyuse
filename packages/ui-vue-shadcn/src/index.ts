/**
 * @dailyuse/ui-vue-shadcn
 * 
 * shadcn-vue 样式的 Vue 3 组件库
 * 
 * 此包包含两类组件：
 * 1. `components/ui/*` - 通过 shadcn-vue CLI 生成的官方组件（不可修改）
 * 2. `components/custom/*` - 自定义业务组件
 * 
 * 使用方式：
 *   建议从 @dailyuse/ui-vue 统一导入（聚合层）
 *   直接导入：import { Button } from '@dailyuse/ui-vue-shadcn'
 * 
 * 添加新组件：
 *   pnpm dlx shadcn-vue@latest add button
 *   pnpm dlx shadcn-vue@latest add card
 */

// Re-export utility functions
export * from './lib/utils';

// ==========================================
// Official shadcn-vue components
// ==========================================
// 通过 CLI 生成后，在此处导出
export * from './components/ui/accordion';
export * from './components/ui/alert';
export * from './components/ui/alert-dialog';
export * from './components/ui/aspect-ratio';
export * from './components/ui/avatar';
export * from './components/ui/badge';
export * from './components/ui/breadcrumb';
export * from './components/ui/button';
export * from './components/ui/button-group';
export * from './components/ui/calendar';
export * from './components/ui/card';
export * from './components/ui/carousel';
export * from './components/ui/checkbox';
export * from './components/ui/collapsible';
export * from './components/ui/command';
export * from './components/ui/context-menu';
export * from './components/ui/dialog';
export * from './components/ui/drawer';
export * from './components/ui/dropdown-menu';
export * from './components/ui/form';
export * from './components/ui/hover-card';
export * from './components/ui/input';
export * from './components/ui/label';
export * from './components/ui/menubar';
export * from './components/ui/navigation-menu';
export * from './components/ui/pagination';
export * from './components/ui/pin-input';
export * from './components/ui/popover';
export * from './components/ui/progress';
export * from './components/ui/radio-group';
export * from './components/ui/resizable';
export * from './components/ui/scroll-area';
export * from './components/ui/select';
export * from './components/ui/separator';
export * from './components/ui/sheet';
export * from './components/ui/skeleton';
export * from './components/ui/slider';
export * from './components/ui/sonner';
export * from './components/ui/switch';
export * from './components/ui/table';
export * from './components/ui/tabs';
export * from './components/ui/tags-input';
export * from './components/ui/textarea';
export * from './components/ui/toggle';
export * from './components/ui/toggle-group';
export * from './components/ui/tooltip';
// Note: toast is not available, use sonner instead
// export * from './components/ui/toast';

// ==========================================
// Custom components
// ==========================================
// 自定义组件在此处导出：
// export * from './components/custom/ColorPicker';
// export * from './components/custom/DataTable';
