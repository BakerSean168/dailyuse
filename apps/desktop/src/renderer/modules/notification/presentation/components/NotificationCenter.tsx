/**
 * NotificationCenter Component
 *
 * 通知中心 - 显示所有通知的弹出面�?
 * Story 11-6: Auxiliary Modules
 */

import { useState, useMemo, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, Settings, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
  Badge,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from '@dailyuse/ui-react-shadcn';

import { NotificationItem } from './NotificationItem';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

interface NotificationCenterProps {
  notifications: NotificationClientDTO[];
  unreadCount: number;
  loading?: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onClick?: (notification: NotificationClientDTO) => void;
  onSettingsClick?: () => void;
}

type NotificationFilter = 'all' | 'unread' | 'SCHEDULE' | 'TASK' | 'GOAL' | 'REMINDER' | 'SYSTEM';

export function NotificationCenter({
  notifications,
  unreadCount,
  loading = false,
  onRead,
  onReadAll,
  onDelete,
  onDeleteAll,
  onClick,
  onSettingsClick,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationFilter>('all');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Apply type filter
    if (typeFilter !== 'all' && typeFilter !== 'unread') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    return filtered;
  }, [notifications, activeTab, typeFilter]);

  // Type labels
  const typeLabels: Record<string, string> = {
    SCHEDULE: '日程',
    TASK: '任务',
    GOAL: '目标',
    REMINDER: '提醒',
    SYSTEM: '系统',
  };

  // Handle mark all as read
  const handleReadAll = useCallback(() => {
    onReadAll();
  }, [onReadAll]);

  // Handle delete all
  const handleDeleteAll = useCallback(() => {
    onDeleteAll();
  }, [onDeleteAll]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知中心
            </SheetTitle>
            <div className="flex items-center gap-1">
              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                    全部类型
                    {typeFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {Object.entries(typeLabels).map(([type, label]) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setTypeFilter(type as NotificationFilter)}
                    >
                      {label}
                      {typeFilter === type && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReadAll}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    全部标为已读
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteAll}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    清除所有通知
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSettingsClick}>
                    <Settings className="mr-2 h-4 w-4" />
                    通知设置
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <SheetDescription>
            {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知'}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="flex-1 flex flex-col"
        >
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">
              未读
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 px-4">
              {loading ? (
                // Loading skeletons
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">暂无通知</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'unread'
                      ? '所有通知都已'
                      : '您还没有收到任何通知'}
                  </p>
                </div>
              ) : (
                // Notification list
                <div className="divide-y py-2">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="group relative">
                      <NotificationItem
                        notification={notification}
                        onRead={onRead}
                        onDelete={onDelete}
                        onClick={onClick}
                      />
                      {/* Hover actions */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRead(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationCenter;
