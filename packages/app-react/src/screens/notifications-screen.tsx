import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { NotificationCard } from '../components/notification-card';
import { useAppSession } from '../hooks/use-app-session';
import { useNotifications } from '../hooks/use-notifications';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

type ReadFilter = 'all' | 'unread' | 'read';

export function NotificationsScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { error, isLoading, isRemoteAuthenticated, markAllAsRead, markAsRead, notifications, refresh, unreadCount } = useNotifications();
  const [isMutating, setIsMutating] = useState(false);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [keyword, setKeyword] = useState('');

  const filteredNotifications = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return notifications.filter((notification) => {
      if (readFilter === 'read' && !notification.isRead) {
        return false;
      }

      if (readFilter === 'unread' && notification.isRead) {
        return false;
      }

      if (normalizedKeyword.length === 0) {
        return true;
      }

      const haystack = [notification.title, notification.content, notification.category, notification.type].join(' ').toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [keyword, notifications, readFilter]);

  async function handleMarkAllAsRead() {
    setIsMutating(true);
    await markAllAsRead();
    setIsMutating(false);
  }

  async function handleMarkAsRead(id: string) {
    setIsMutating(true);
    await markAsRead(id);
    setIsMutating(false);
  }

  return (
    <PageShell
      eyebrow="More"
      title="Notifications"
      subtitle="通知模块现在支持筛选、详情下钻和批量已读，不再只是只读消息流。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title="Navigation" description="More 栈下用独立 screen 承接通知列表和详情。">
        <PrimaryButton label="Back to More" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="通知模块依赖远程认证会话。">
          <ThemedText type="small" themeColor="textSecondary">
            先退出当前 shell，然后用邮箱登录进入移动端，再回来查看通知流。
          </ThemedText>
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Overview" description="支持未读统计、筛选和详情下钻。">
            <View style={styles.pillRow}>
              <StatusPill label={`${notifications.length} notifications`} tone="tint" />
              <StatusPill label={`${unreadCount} unread`} tone={unreadCount > 0 ? 'warning' : 'success'} />
              <StatusPill label={`${filteredNotifications.length} visible`} tone="textSecondary" />
            </View>
            <PrimaryButton
              label={isMutating ? 'Updating…' : 'Mark all as read'}
              onPress={handleMarkAllAsRead}
              disabled={isMutating || unreadCount === 0}
              variant="secondary"
            />
          </SectionCard>

          <SectionCard title="Filters" description="先保留最小可用的已读筛选和关键词搜索。">
            <PrimaryTextField value={keyword} onChangeText={setKeyword} placeholder="Search notifications" />
            <View style={styles.actionRow}>
              <PrimaryButton label="All" onPress={() => setReadFilter('all')} variant={readFilter === 'all' ? 'solid' : 'ghost'} />
              <PrimaryButton label="Unread" onPress={() => setReadFilter('unread')} variant={readFilter === 'unread' ? 'solid' : 'ghost'} />
              <PrimaryButton label="Read" onPress={() => setReadFilter('read')} variant={readFilter === 'read' ? 'solid' : 'ghost'} />
            </View>
          </SectionCard>

          {error ? (
            <SectionCard title="Notification load failed" description="后端返回错误时先直接展示。">
              <ThemedText type="small" themeColor="warning">{error}</ThemedText>
            </SectionCard>
          ) : null}

          {!isLoading && filteredNotifications.length === 0 ? (
            <SectionCard title="No notifications matched" description="当前筛选条件下没有通知。">
              <ThemedText type="small" themeColor="textSecondary">调整关键词或已读筛选后再试。</ThemedText>
            </SectionCard>
          ) : null}

          <View style={styles.listColumn}>
            {filteredNotifications.map((notification) => (
              <View key={notification.id} style={styles.listColumn}>
                <NotificationCard
                  notification={notification}
                  onMarkAsRead={!notification.isRead ? () => handleMarkAsRead(notification.id) : undefined}
                />
                <View style={styles.actionRow}>
                  <PrimaryButton
                    label="Open detail"
                    onPress={() => router.push(`./notification-detail?id=${notification.id}`)}
                    variant="ghost"
                  />
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
});
