/**
 * Breadcrumb Component
 *
 * 面包屑导航
 * Story-011: Repository Module UI
 */

import { memo } from 'react';

interface BreadcrumbItem {
  id: string;
  name: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onGoHome: () => void;
}

export const Breadcrumb = memo(function Breadcrumb({
  items,
  onNavigate,
  onGoHome,
}: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-600 overflow-x-auto">
      {/* 首页 */}
      <button
        onClick={onGoHome}
        className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
        title="返回首页"
      >
        🏠
      </button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1 min-w-0">
          {/* 分隔符 */}
          <span className="text-gray-400 flex-shrink-0">/</span>

          {/* 链接或文本 */}
          {index === items.length - 1 ? (
            <span className="font-medium text-gray-900 truncate">
              {item.name}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(item.id)}
              className="hover:text-blue-600 hover:underline truncate max-w-[150px]"
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
});

export default Breadcrumb;
