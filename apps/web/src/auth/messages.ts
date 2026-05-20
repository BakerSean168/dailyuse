export const zhCNAuthMessages = {
  common: {
    loading: '加载中...',
    operationFailed: '操作失败',
  },
  auth: {
    page: {
      description: '登录你的账户以继续使用工作区',
      emailPlaceholder: "name{'@'}example.com",
      or: '或者',
      guestMode: '访客模式',
      guestLoading: '进入访客模式...',
      legalNotice: '继续即表示您同意服务条款与隐私政策。',
      locales: {
        zhCN: '中文',
        enUS: 'EN',
      },
      themes: {
        auto: '系统',
        light: '浅色',
        dark: '深色',
      },
    },
    login: {
      forgotPassword: '忘记密码？',
      submitting: '登录中...',
      submit: '登录',
      registerLink: '立即注册',
    },
    register: {
      description: '创建一个新账户',
      submitting: '注册中...',
      submit: '注册',
      loginLink: '返回登录',
    },
    field: {
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
    },
    validation: {
      loginCredentialsRequired: '请填写邮箱和密码',
      registerFieldsRequired: '请填写所有字段',
      passwordMismatch: '两次输入的密码不一致',
      guestModeUnavailable: '访客模式仅在桌面端可用',
    },
    errors: {
      USER_ALREADY_EXISTS: '该邮箱已被注册',
      CONFLICT: '当前操作与现有数据冲突，请稍后再试',
      UNAUTHORIZED: '邮箱或密码错误',
      VALIDATION_ERROR: '提交信息不合法，请检查后重试',
      SERVICE_UNAVAILABLE: '认证服务暂不可用，请稍后再试',
      INTERNAL_ERROR: '认证服务异常，请稍后再试',
      UNKNOWN: '认证失败，请稍后再试',
    },
    toast: {
      loginSuccess: '登录成功',
      welcomeBack: '欢迎回来',
      loginFailed: '登录失败',
      registerSuccess: '注册成功',
      welcomeJoin: '欢迎加入',
      registerFailed: '注册失败',
      guestModeFailed: '访客模式失败',
    },
  },
} as const;

export const enUSAuthMessages = {
  common: {
    loading: 'Loading...',
    operationFailed: 'Operation failed',
  },
  auth: {
    page: {
      description: 'Sign in to continue into your workspace',
      emailPlaceholder: "name{'@'}example.com",
      or: 'or',
      guestMode: 'Guest Mode',
      guestLoading: 'Starting guest mode...',
      legalNotice: 'By continuing, you agree to the Terms of Service and Privacy Policy.',
      locales: {
        zhCN: '中文',
        enUS: 'EN',
      },
      themes: {
        auto: 'System',
        light: 'Light',
        dark: 'Dark',
      },
    },
    login: {
      forgotPassword: 'Forgot password?',
      submitting: 'Signing in...',
      submit: 'Sign In',
      registerLink: 'Sign up',
    },
    register: {
      description: 'Create a new account',
      submitting: 'Signing up...',
      submit: 'Sign Up',
      loginLink: 'Back to sign in',
    },
    field: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    },
    validation: {
      loginCredentialsRequired: 'Please enter your email and password',
      registerFieldsRequired: 'Please complete all required fields',
      passwordMismatch: 'Passwords do not match',
      guestModeUnavailable: 'Guest mode is only available on desktop',
    },
    errors: {
      USER_ALREADY_EXISTS: 'An account with this email already exists',
      CONFLICT: 'This request conflicts with existing data. Please try again.',
      UNAUTHORIZED: 'Incorrect email or password',
      VALIDATION_ERROR: 'Some fields are invalid. Please review your input.',
      SERVICE_UNAVAILABLE: 'Authentication is temporarily unavailable. Please try again later.',
      INTERNAL_ERROR: 'The authentication service encountered an error. Please try again later.',
      UNKNOWN: 'Authentication failed. Please try again.',
    },
    toast: {
      loginSuccess: 'Login successful',
      welcomeBack: 'Welcome back',
      loginFailed: 'Login failed',
      registerSuccess: 'Registration successful',
      welcomeJoin: 'Welcome aboard',
      registerFailed: 'Registration failed',
      guestModeFailed: 'Failed to start guest mode',
    },
  },
} as const;
