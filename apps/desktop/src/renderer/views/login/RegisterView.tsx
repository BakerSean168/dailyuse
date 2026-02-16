/**
 * Register View - 注册页面
 *
 * 用户注册界面，支持：
 * - 邮箱注册
 * - 密码强度验证
 * - 用户名设�?
 * - 服务条款确认
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Check,
  X,
  Minus,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-react-shadcn';

// ============ Types ============

interface RegisterViewProps {
  /** 切换到登录页�?*/
  onSwitchToLogin: () => void;
  /** 注册成功回调 */
  onRegisterSuccess?: () => void;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

// ============ Utils ============

/**
 * 计算密码强度
 */
function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const strengthMap: Record<number, { label: string; color: string }> = {
    0: { label: '非常', color: 'bg-red-500' },
    1: { label: '', color: 'bg-orange-500' },
    2: { label: '一', color: 'bg-yellow-500' },
    3: { label: '', color: 'bg-green-500' },
    4: { label: '非常', color: 'bg-emerald-500' },
  };

  const strength = strengthMap[Math.min(score, 4)];
  return { score: Math.min(score, 4), ...strength };
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============ Components ============

/**
 * 自定义标题栏（无边框窗口�?
 */
function TitleBar({ onBack }: { onBack: () => void }) {
  const handleMinimize = () => {
    window.electronAPI?.invoke('window:minimize-login');
  };

  const handleClose = () => {
    window.electronAPI?.invoke('window:close-login');
  };

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-transparent select-none" 
         style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <span className="text-sm font-medium text-white/80">注册账号</span>
      </div>
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
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rightElement?: React.ReactNode;
  hint?: string;
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
      {error && <p className="text-xs text-red-400 px-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="text-xs text-white/40 px-1">{hint}</p>}
    </div>
  );
}

/**
 * 密码强度指示�?
 */
function PasswordStrengthIndicator({ strength }: { strength: PasswordStrength }) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div 
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= strength.score ? strength.color : 'bg-white/10'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs', strength.score >= 3 ? 'text-green-400' : 'text-white/40')}>
        密码强度：{strength.label}
      </p>
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
          <span>注册中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// ============ Main Component ============

export function RegisterView({ onSwitchToLogin, onRegisterSuccess }: RegisterViewProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表单验证状�?
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const passwordStrength = calculatePasswordStrength(password);

  // 验证
  const usernameError = touched.username && username.length > 0 && username.length < 3 
    ? '用户名至少3个字符' : undefined;
  const emailError = touched.email && email.length > 0 && !isValidEmail(email) 
    ? '请输入有效的邮箱地址' : undefined;
  // 密码验证：服务器要求至少8位，包含大写字母和特殊字�?
  const getPasswordError = () => {
    if (!touched.password || password.length === 0) return undefined;
    if (password.length < 8) return '密码至少 8 个字';
    if (!/[A-Z]/.test(password)) return '密码需包含至少一个大写字';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return '密码需包含至少一个特殊字';
    return undefined;
  };
  const passwordError = getPasswordError();
  const confirmPasswordError = touched.confirmPassword && confirmPassword.length > 0 && confirmPassword !== password 
    ? '两次输入的密码不一' : undefined;

  // 密码是否满足服务器要�?
  const isPasswordValid = 
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isFormValid = 
    username.length >= 3 &&
    isValidEmail(email) &&
    isPasswordValid &&
    password === confirmPassword &&
    agreeTerms;

  const handleRegister = useCallback(async () => {
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      // 统一�?IpcResult 格式: { ok: boolean; data?: T; error?: { code, message } }
      const result = await window.electronAPI?.invoke<{
        ok: boolean;
        data?: { accountUuid: string; message: string };
        error?: { code: string; message: string };
      }>('auth:register', {
        username,
        email,
        password,
      });

      if (result?.ok) {
        // 注册成功，切换到主窗�?
        onRegisterSuccess?.();
        await window.electronAPI?.invoke('window:transition-to-main');
      } else {
        // 显示错误信息
        const errorMessage = result?.error?.message || '注册失败，请稍后重试';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('注册请求失败，请检查网络连');
    } finally {
      setLoading(false);
    }
  }, [username, email, password, isFormValid, onRegisterSuccess]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 标题�?*/}
      <TitleBar onBack={onSwitchToLogin} />

      {/* 主内�?*/}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Logo */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 
                          flex items-center justify-center shadow-xl shadow-purple-500/30">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
        </motion.div>

        <motion.h2 
          className="text-xl font-semibold text-white mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          创建您的账号
        </motion.h2>

        {/* 表单 */}
        <motion.div 
          className="w-full max-w-sm space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Input
            icon={User}
            type="text"
            placeholder="用户"
            value={username}
            onChange={(v) => { setUsername(v); setTouched(t => ({ ...t, username: true })); }}
            error={usernameError}
            hint="3-20 个字符，字母、数字或下划"
          />

          <Input
            icon={Mail}
            type="email"
            placeholder="邮箱地址"
            value={email}
            onChange={(v) => { setEmail(v); setTouched(t => ({ ...t, email: true })); }}
            error={emailError}
          />
          
          <div className="space-y-2">
            <Input
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(v) => { setPassword(v); setTouched(t => ({ ...t, password: true })); }}
              error={passwordError}
              hint="至少8位，包含大写字母和特殊字"
              rightElement={
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
            {password.length > 0 && <PasswordStrengthIndicator strength={passwordStrength} />}
          </div>

          <Input
            icon={Lock}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setTouched(t => ({ ...t, confirmPassword: true })); }}
            error={confirmPasswordError}
            rightElement={
              <button 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
          />

          {/* 服务条款 */}
          <label className="flex items-start gap-3 cursor-pointer text-sm">
            <div 
              className={cn(
                'mt-0.5 w-4 h-4 rounded border transition-colors flex items-center justify-center flex-shrink-0',
                agreeTerms ? 'bg-blue-500 border-blue-500' : 'border-white/30'
              )}
              onClick={() => setAgreeTerms(!agreeTerms)}
            >
              {agreeTerms && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-white/60">
              我已阅读并同意{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">服务条款</a>
              {' '}和{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">隐私政策</a>
            </span>
          </label>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <PrimaryButton 
            onClick={handleRegister} 
            loading={loading}
            disabled={!isFormValid}
          >
            �?�?
          </PrimaryButton>

          <div className="text-center text-sm text-white/50">
            已有账号？{' '}
            <button onClick={onSwitchToLogin} className="text-blue-400 hover:text-blue-300">
              立即登录
            </button>
          </div>
        </motion.div>
      </div>

      {/* 版本信息 */}
      <div className="pb-4 text-center text-xs text-white/30">
        DailyUse Desktop v1.0.0
      </div>
    </div>
  );
}

export default RegisterView;
