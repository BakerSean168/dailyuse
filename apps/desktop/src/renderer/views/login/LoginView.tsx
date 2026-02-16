/**
 * Login View - 登录页面
 *
 * Steam-like 登录窗口，支持：
 * - 邮箱/密码登录
 * - 快速登录（已保存的账号�?
 * - 扫码登录入口
 * - 离线模式入口
 * - 自动登录选项
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  QrCode, 
  Wifi, 
  WifiOff,
  X,
  Minus,
  Check
} from 'lucide-react';
import { cn } from '@dailyuse/ui-react-shadcn';
import { RegisterView } from './RegisterView';

// ============ Types ============

interface QuickLoginAccount {
  uuid: string;
  username: string;
  email: string;
  avatarUrl?: string;
  lastLoginAt?: number;
  hasValidSession?: boolean;
}

interface LoginViewProps {
  /** 快速登录账号列�?*/
  quickLoginAccounts?: QuickLoginAccount[];
  /** 初始显示的视�?*/
  initialView?: 'login' | 'quick' | 'qrcode';
}

type ViewMode = 'login' | 'quick' | 'qrcode' | 'register' | 'forgot';

// ============ Components ============

/**
 * 自定义标题栏（无边框窗口�?
 */
function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.invoke('window:minimize-login');
  };

  const handleClose = () => {
    window.electronAPI?.invoke('window:close-login');
  };

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-transparent select-none" 
         style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <span className="text-sm font-medium text-white/80">DailyUse</span>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4 text-white/70" />
        </button>
        <button 
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/80 transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  );
}

/**
 * 账号头像
 */
function Avatar({ account, size = 'md' }: { account: QuickLoginAccount; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  if (account.avatarUrl) {
    return (
      <img 
        src={account.avatarUrl} 
        alt={account.username}
        className={cn('rounded-full object-cover', sizeClasses[size])}
      />
    );
  }

  // 默认头像：首字母
  const initial = (account.username || account.email || 'U')[0].toUpperCase();
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium',
      sizeClasses[size]
    )}>
      {initial}
    </div>
  );
}

/**
 * 快速登录账号卡�?
 */
function QuickLoginCard({ 
  account, 
  onSelect, 
  onRemove,
  isSelected 
}: { 
  account: QuickLoginAccount;
  onSelect: () => void;
  onRemove: () => void;
  isSelected: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative p-3 rounded-xl cursor-pointer transition-all group',
        'border border-white/10 hover:border-white/20',
        isSelected ? 'bg-white/15 border-blue-500/50' : 'bg-white/5 hover:bg-white/10'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <Avatar account={account} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{account.username}</div>
          <div className="text-xs text-white/50 truncate">{account.email}</div>
        </div>
        {account.hasValidSession && (
          <div className="w-2 h-2 rounded-full bg-green-500" title="Session 有效" />
        )}
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
      </div>
      
      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white 
                   opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/**
 * 输入框组�?
 */
function Input({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  rightElement,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border transition-colors',
        error ? 'border-red-500/50' : 'border-white/10 focus-within:border-blue-500/50'
      )}>
        <Icon className="w-5 h-5 text-white/40" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none"
        />
        {rightElement}
      </div>
      {error && <p className="text-xs text-red-400 px-1">{error}</p>}
    </div>
  );
}

/**
 * 主按�?
 */
function PrimaryButton({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full py-3 px-4 rounded-xl font-medium transition-all',
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        'text-white shadow-lg shadow-blue-500/25',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>登录中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * 登录表单
 */
function LoginForm({ 
  onLogin, 
  onSwitchToRegister, 
  onSwitchToForgot,
  loading,
  error
}: {
  onLogin: (email: string, password: string, autoLogin: boolean) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  loading?: boolean;
  error?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const handleSubmit = () => {
    onLogin(email, password, autoLogin);
  };

  return (
    <div className="space-y-4">
      <Input
        icon={Mail}
        type="email"
        placeholder="邮箱地址"
        value={email}
        onChange={setEmail}
      />
      
      <Input
        icon={Lock}
        type={showPassword ? 'text' : 'password'}
        placeholder="密码"
        value={password}
        onChange={setPassword}
        rightElement={
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      {/* 选项�?*/}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white/80">
          <div 
            className={cn(
              'w-4 h-4 rounded border transition-colors flex items-center justify-center',
              autoLogin ? 'bg-blue-500 border-blue-500' : 'border-white/30'
            )}
            onClick={() => setAutoLogin(!autoLogin)}
          >
            {autoLogin && <Check className="w-3 h-3 text-white" />}
          </div>
          <span>自动登录</span>
        </label>
        <button 
          onClick={onSwitchToForgot}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          忘记密码?
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <PrimaryButton onClick={handleSubmit} loading={loading}>
        �?�?
      </PrimaryButton>

      <div className="text-center text-sm text-white/50">
        还没有账号？{' '}
        <button onClick={onSwitchToRegister} className="text-blue-400 hover:text-blue-300">
          立即注册
        </button>
      </div>
    </div>
  );
}

/**
 * 快速登录视�?
 */
function QuickLoginView({
  accounts,
  onSelectAccount,
  onRemoveAccount,
  onSwitchToLogin,
}: {
  accounts: QuickLoginAccount[];
  onSelectAccount: (account: QuickLoginAccount) => void;
  onRemoveAccount: (uuid: string) => void;
  onSwitchToLogin: () => void;
}) {
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white text-center">选择账号登录</h3>
      
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        <AnimatePresence>
          {accounts.map((account) => (
            <QuickLoginCard
              key={account.uuid}
              account={account}
              isSelected={selectedUuid === account.uuid}
              onSelect={() => {
                setSelectedUuid(account.uuid);
                onSelectAccount(account);
              }}
              onRemove={() => onRemoveAccount(account.uuid)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-2 border-t border-white/10">
        <button
          onClick={onSwitchToLogin}
          className="w-full py-2 text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          使用其他账号登录
        </button>
      </div>
    </div>
  );
}

/**
 * 扫码登录视图
 */
function QRCodeView({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-medium text-white">扫码登录</h3>
      
      <div className="w-48 h-48 mx-auto bg-white rounded-xl p-3 flex items-center justify-center">
        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
          <QrCode className="w-12 h-12" />
        </div>
      </div>
      
      <p className="text-sm text-white/50">
        使用 DailyUse 手机 App 扫描二维码登�?
      </p>

      <button
        onClick={onSwitchToLogin}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        使用密码登录
      </button>
    </div>
  );
}

// ============ Main Component ============

export function LoginView({ quickLoginAccounts = [], initialView = 'login' }: LoginViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    quickLoginAccounts.length > 0 ? 'quick' : initialView
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 登录处理
  const handleLogin = useCallback(async (email: string, password: string, autoLogin: boolean) => {
    setLoading(true);
    setError(null);

    try {
      // 统一�?IpcResult 格式: { ok: boolean; data?: T; error?: { code, message } }
      const result = await window.electronAPI?.invoke<{
        ok: boolean;
        data?: { accountUuid: string; sessionUuid: string };
        error?: { code: string; message: string };
      }>('auth:login', {
        email,
        password,
        rememberMe: autoLogin,
      });

      if (result?.ok) {
        // 登录成功，切换到主窗�?
        await window.electronAPI?.invoke('window:transition-to-main');
      } else {
        // 显示错误信息
        const errorMessage = result?.error?.message || '登录失败，请检查邮箱和密码';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 快速登录处�?
  const handleQuickLogin = useCallback(async (account: QuickLoginAccount) => {
    if (account.hasValidSession) {
      // 有有�?Session，直接进�?
      setLoading(true);
      try {
        // 更新最后登录时�?
        await window.electronAPI?.invoke('auth:update-last-login', account.uuid);
        await window.electronAPI?.invoke('window:transition-to-main');
      } finally {
        setLoading(false);
      }
    } else {
      // 需要输入密�?
      // TODO: 显示密码输入�?
      setViewMode('login');
    }
  }, []);

  // 移除账号
  const handleRemoveAccount = useCallback(async (uuid: string) => {
    await window.electronAPI?.invoke('auth:remove-saved-account', uuid);
    // TODO: 刷新账号列表
  }, []);

  // 离线模式
  const handleOfflineMode = useCallback(async () => {
    try {
      // 统一�?IpcResult 格式: { ok: boolean; data?: T; error?: { code, message } }
      const result = await window.electronAPI?.invoke<{
        ok: boolean;
        data?: { accountUuid: string; mode: string; message: string };
        error?: { code: string; message: string };
      }>('auth:enter-offline-mode');
      
      if (result?.ok) {
        // 成功后跳转到主窗�?
        await window.electronAPI?.invoke('window:transition-to-main');
      } else {
        console.error('Error entering offline mode:', result?.error?.message);
        setError(result?.error?.message || '进入离线模式失败');
      }
    } catch (error) {
      console.error('Error entering offline mode:', error);
      setError('进入离线模式时发生错');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 标题�?*/}
      <TitleBar />

      {/* 主内�?*/}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 
                          flex items-center justify-center shadow-xl shadow-purple-500/30">
            <span className="text-3xl font-bold text-white">D</span>
          </div>
        </div>

        {/* 内容�?*/}
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {viewMode === 'quick' && quickLoginAccounts.length > 0 && (
              <motion.div
                key="quick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QuickLoginView
                  accounts={quickLoginAccounts}
                  onSelectAccount={handleQuickLogin}
                  onRemoveAccount={handleRemoveAccount}
                  onSwitchToLogin={() => setViewMode('login')}
                />
              </motion.div>
            )}

            {viewMode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LoginForm
                  onLogin={handleLogin}
                  onSwitchToRegister={() => setViewMode('register')}
                  onSwitchToForgot={() => setViewMode('forgot')}
                  loading={loading}
                  error={error ?? undefined}
                />
              </motion.div>
            )}

            {viewMode === 'qrcode' && (
              <motion.div
                key="qrcode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QRCodeView onSwitchToLogin={() => setViewMode('login')} />
              </motion.div>
            )}

            {viewMode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="fixed inset-0 z-50"
              >
                <RegisterView 
                  onSwitchToLogin={() => setViewMode('login')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 底部选项 */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            {viewMode !== 'qrcode' && (
              <button
                onClick={() => setViewMode('qrcode')}
                className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>扫码登录</span>
              </button>
            )}
            <button
              onClick={handleOfflineMode}
              className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors"
            >
              <WifiOff className="w-4 h-4" />
              <span>离线模式</span>
            </button>
          </div>
        </div>
      </div>

      {/* 版本信息 */}
      <div className="pb-4 text-center text-xs text-white/30">
        DailyUse Desktop v1.0.0
      </div>
    </div>
  );
}

export default LoginView;
