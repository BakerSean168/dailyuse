/**
 * NotificationItem Component
 *
 * 通知列表项
 * Story-010: Notification Module
 */

import { memo } from 'react';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

interface NotificationItemProps {
  notification: NotificationClientDTO;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: NotificationClientDTO) => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  // Type icons
  const typeIcons: Record<string, string> = {
    SCHEDULE: '📅',
    TASK: '✅',
    GOAL: '🎯',
    REMINDER: '⏰',
    SYSTEM: '🔔',
    ACHIEVEMENT: '🏆',
    SOCIAL: '👥',
  };

  // Importance colors
  const importanceColors: Record<string, string> = {
    HIGH: 'border-l-red-500',
    MEDIUM: 'border-l-yellow-500',
    LOW: 'border-l-blue-500',
    NONE: 'border-l-gray-300',
  };

  const icon = typeIcons[notification.type] || '🔔';
  const borderColor = importanceColors[notification.importance] || 'border-l-gray-300';

  return (
    <div
      className={`p-4 border-l-4 ${borderColor} ${
        notification.isRead ? 'bg-background' : 'bg-primary/5'
      } hover:bg-muted/50 transition-colors cursor-pointer`}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-medium truncate ${
                notification.isRead ? 'text-muted-foreground' : ''
              }`}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.content}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{notification.typeText || notification.type}</span>
              <span>·</span>
              <span>{notification.timeAgo || notification.formattedCreatedAt}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                  }}
                  className="p-1 hover:bg-muted rounded"
                  title="标记已读"
                >
                  ✓
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1 hover:bg-red-100 text-red-500 rounded"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default NotificationItem;
