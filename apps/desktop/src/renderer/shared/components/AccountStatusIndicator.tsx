/**
 * Account Status Indicator Component
 *
 * 显示当前账户状态，包括：
 * - 用户头像和用户名
 * - 在线/离线状态
 * - 快速操作入口（账户设置、登出等）
 *
 * Part of EPIC-004: Desktop Authentication - Sprint 3.2
 *
 * @module renderer/shared/components/AccountStatusIndicator
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-shadcn';

// ============ Types ============

interface UserInfo {
  uuid: string;
  username?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthStatusResponse {
  authenticated: boolean;
  mode: 'ONLINE' | 'OFFLINE' | 'LOCAL';
  user: UserInfo | null;
  session: unknown;
  tokenStatus: unknown;
}

interface AccountStatusIndicatorProps {
  /** 附加的 CSS 类名 */
  className?: string;
  /** 是否折叠模式（只显示头像） */
  collapsed?: boolean;
}

// ============ Hooks ============

/**
 * 获取账户状态的 Hook
 */
function useAccountStatus() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'ONLINE' | 'OFFLINE' | 'LOCAL'>('LOCAL');
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await window.electronAPI?.invoke<AuthStatusResponse>('auth:get-status');

      if (status) {
        setIsAuthenticated(status.authenticated);
        setAuthMode(status.mode);
        setUser(status.user);
      }
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // 监听网络状态变化
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期刷新状态 (每 30 秒)
    const intervalId = setInterval(fetchStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [fetchStatus]);

  return { user, isOnline, isAuthenticated, authMode, loading, refresh: fetchStatus };
}

// ============ Components ============

/**
 * 用户头像组件
 */
function Avatar({ 
  user, 
  size = 'md',
  isOnline,
}: { 
  user: UserInfo | null; 
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5 border-[1.5px]',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
  };

  const indicatorPositions = {
    sm: 'right-0 bottom-0',
    md: 'right-0 bottom-0',
    lg: 'right-0.5 bottom-0.5',
  };

  const displayName = user?.displayName ?? user?.username ?? '?';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {user?.avatarUrl ? (
        <img 
          src={user.avatarUrl}
          alt={displayName}
          className={cn(
            sizeClasses[size],
            'rounded-full object-cover ring-2 ring-white/10'
          )}
        />
      ) : (
        <div className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-to-br from-blue-500 to-purple-600',
          'flex items-center justify-center font-medium text-white',
          'ring-2 ring-white/10'
        )}>
          {user ? initials : <User className="w-1/2 h-1/2" />}
        </div>
      )}
      
      {/* 在线状态指示器 */}
      {isOnline !== undefined && (
        <div className={cn(
          'absolute rounded-full border-background',
          indicatorSizes[size],
          indicatorPositions[size],
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        )} />
      )}
    </div>
  );
}

/**
 * 下拉菜单项
 */
function MenuItem({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
        variant === 'danger' 
          ? 'text-red-400 hover:bg-red-500/10' 
          : 'text-foreground hover:bg-muted'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ============ Main Component ============

export function AccountStatusIndicator({ 
  className,
  collapsed = false,
}: AccountStatusIndicatorProps) {
  const { user, isOnline, isAuthenticated, authMode, loading, refresh } = useAccountStatus();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await window.electronAPI?.invoke('auth:logout');
      // 刷新状态
      setTimeout(refresh, 100);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettings = () => {
    setShowMenu(false);
    // 导航到账户设置页面
    window.location.hash = '#/account';
  };

  const handleSecurity = () => {
    setShowMenu(false);
    // 导航到安全设置页面
    window.location.hash = '#/account/security';
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="w-10 h-10 rounded-full bg-muted" />
      </div>
    );
  }

  // 未登录状态 or 本地模式
  const displayName = user?.displayName ?? user?.username ?? (authMode === 'LOCAL' ? '本地账户' : '未登录');
  const displayEmail = user?.email ?? (authMode === 'LOCAL' ? '离线模式' : '');

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-colors w-full',
          'hover:bg-muted',
          showMenu && 'bg-muted'
        )}
      >
        <Avatar user={user} size="md" isOnline={isOnline && authMode === 'ONLINE'} />
        
        {!collapsed && (
          <>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {authMode === 'ONLINE' ? (
                  isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span>在线</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-gray-400" />
                      <span>离线</span>
                    </>
                  )
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-blue-400" />
                    <span>本地模式</span>
                  </>
                )}
              </p>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              showMenu && 'rotate-180'
            )} />
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* 点击外部关闭 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 mb-2 bottom-full w-56 rounded-lg border bg-popover shadow-lg',
                collapsed ? 'left-0' : 'left-0'
              )}
            >
              {/* 用户信息 */}
              <div className="p-3 border-b">
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
                {authMode === 'LOCAL' && (
                  <p className="text-xs text-blue-400 mt-1">💡 登录云账户可同步数据</p>
                )}
              </div>

              {/* 菜单项 */}
              <div className="p-1">
                <MenuItem 
                  icon={Settings} 
                  label="账户设置" 
                  onClick={handleSettings}
                />
                {authMode === 'ONLINE' && (
                  <MenuItem 
                    icon={Shield} 
                    label="安全中心" 
                    onClick={handleSecurity}
                  />
                )}
                <MenuItem 
                  icon={RefreshCw} 
                  label="刷新状态" 
                  onClick={refresh}
                />
              </div>

              {/* 登出 */}
              {isAuthenticated && authMode === 'ONLINE' && (
                <div className="p-1 border-t">
                  <MenuItem 
                    icon={LogOut} 
                    label="退出登录" 
                    onClick={handleLogout}
                    variant="danger"
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccountStatusIndicator;
