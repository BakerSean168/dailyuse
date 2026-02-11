/**
 * Custom Components
 * 
 * 此目录用于存放基于 shadcn/ui 官方组件封装的业务组件。
 * 
 * 规则：
 * 1. 永远不要直接修改 ../ui/ 目录下的官方组件
 * 2. 如需定制，在此目录创建新组件，导入并包装官方组件
 * 3. 命名规范：使用业务相关的名称，如 GoalCard、TaskListItem 等
 * 
 * 示例：
 * ```tsx
 * // custom/PageHeader.tsx
 * import { Card, CardHeader, CardTitle } from '@/components/ui/card';
 * 
 * export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
 *   return (
 *     <Card className="mb-4">
 *       <CardHeader>
 *         <CardTitle>{title}</CardTitle>
 *         {children}
 *       </CardHeader>
 *     </Card>
 *   );
 * }
 * ```
 */

// 当前暂无自定义组件，随项目开发逐步添加
export {};
