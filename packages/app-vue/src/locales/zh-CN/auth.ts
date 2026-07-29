export default {
  "page": {
    "description": "登录你的账户以继续使用工作区",
    "emailPlaceholder": "name{'@'}example.com",
    "or": "或者",
    "guestMode": "访客模式",
    "guestLoading": "进入访客模式...",
    "legalNoticePrefix": "继续即表示您同意",
    "legalNoticeMid": "与",
    "legalNoticeSuffix": "。",
    "termsOfService": "服务条款",
    "privacyPolicy": "隐私政策",
    "legalNotice": "继续即表示您同意服务条款与隐私政策。",
    "locales": {
      "zhCN": "中文",
      "enUS": "EN"
    },
    "themes": {
      "auto": "系统",
      "light": "浅色",
      "dark": "深色"
    },
    "languageSelector": "界面语言",
    "codePlaceholder": "6 位验证码"
  },
  "desktop": {
    "title": "知行 Memoflow",
    "description": "账号由你选择，自动登录只会在你主动开启后生效。",
    "tabs": {
      "login": "登录",
      "register": "注册",
      "quickLogin": "快速登录"
    },
    "rememberPassword": "记住密码",
    "autoLogin": "自动登录",
    "autoLoginHint": "只有你明确勾选“自动登录”，下次启动才会直接尝试恢复会话；否则始终先显示登录窗口。",
    "createAccount": "创建账号",
    "quickLoginDescription": "保留这台设备上登录过的账号，像 QQ / Steam 一样快速切换。",
    "noRememberedAccounts": "本机还没有保存过登录账号。",
    "nicknamePolicy": "个人中心里的展示名统一使用 nickname，不再额外区分 display name。"
  },
  "login": {
    "title": "登录",
    "description": "登录您的账户以继续",
    "tab": {
      "email": "邮箱登录",
      "phone": "手机登录"
    },
    "rememberMe": "记住我",
    "forgotPassword": "忘记密码？",
    "submitting": "登录中...",
    "submit": "登录",
    "noAccount": "还没有账户？",
    "registerLink": "立即注册",
    "heading": "登录{app}",
    "forgotLink": "忘记密码？",
    "github": "github"
  },
  "register": {
    "title": "注册",
    "description": "创建一个新账户",
    "tab": {
      "email": "邮箱注册",
      "phone": "手机注册"
    },
    "passwordPlaceholder": "请输入密码",
    "confirmPasswordPlaceholder": "请确认密码",
    "submitting": "注册中...",
    "submit": "注册",
    "hasAccount": "已有账户？",
    "loginLink": "返回登录",
    "passwordStrength": {
      "weak": "弱",
      "medium": "中",
      "strong": "强"
    },
    "heading": "创建{app}账号"
  },
  "field": {
    "email": "邮箱",
    "password": "密码",
    "confirmPassword": "确认密码",
    "phone": "手机号",
    "smsCode": "验证码",
    "nicknameOptional": "昵称（选填）",
    "code": "验证码",
    "newPassword": "新密码"
  },
  "placeholder": {
    "password": "请输入密码",
    "phone": "请输入手机号",
    "smsCode": "请输入验证码",
    "nickname": "请输入昵称"
  },
  "validation": {
    "emailInvalid": "请输入有效的邮箱地址",
    "passwordLength": "密码长度至少为 8 位",
    "loginCredentialsRequired": "请填写邮箱和密码",
    "registerFieldsRequired": "请填写所有字段",
    "passwordMismatch": "两次输入的密码不一致，请重新确认",
    "guestModeUnavailable": "访客模式仅在桌面端可用",
    "emailRequired": "请输入邮箱地址",
    "passwordRequired": "请输入密码",
    "passwordMinLength": "密码至少需要 8 位",
    "passwordMaxLength": "密码不能超过 100 位",
    "passwordComplexity": "密码需包含大写字母、小写字母、数字或特殊字符中的至少两类",
    "confirmPasswordRequired": "请再次输入密码",
    "codeRequired": "请输入验证码",
    "codeInvalid": "验证码须为 6 位数字"
  },
  "errors": {
    "USER_ALREADY_EXISTS": "该邮箱已注册，请直接登录",
    "AUTH_FAILED": "邮箱或密码错误",
    "BAD_REQUEST": "请求参数错误，请检查后重试",
    "CONFLICT": "该邮箱已注册，请直接登录",
    "FORBIDDEN": "当前账号无权执行此认证操作",
    "NOT_FOUND": "认证资源不存在，请稍后再试",
    "OFFLINE": "当前网络不可用，请检查连接后重试",
    "REMOTE_UNREACHABLE": "无法连接到认证服务，请确认服务已部署并可访问",
    "CONFIG_ERROR": "桌面端未配置认证服务地址，请检查桌面运行时配置",
    "LOGIN_FAILED": "登录失败，请稍后再试",
    "AUTH_ALREADY_ACTIVE_LOCALLY": "该账号已经在本地桌面端打开",
    "REGISTER_FAILED": "注册失败，请稍后再试",
    "REGISTER_ERROR": "注册失败，请稍后再试",
    "UNAUTHORIZED": "邮箱或密码错误",
    "VALIDATION_ERROR": "提交信息不合法，请检查后重试",
    "RATE_LIMITED": "尝试次数过多，请稍后再试",
    "SERVICE_UNAVAILABLE": "认证服务暂不可用，请稍后再试",
    "INTERNAL_ERROR": "认证服务异常，请稍后再试",
    "TIMEOUT": "认证请求超时，请稍后再试",
    "UNKNOWN": "认证失败，请稍后再试",
    "NETWORK_ERROR": "网络连接失败，请检查网络后重试",
    "EMAIL_VERIFICATION_REQUIRED": "请先完成邮箱验证后再继续",
    "INVALID_OR_EXPIRED_CODE": "验证码无效或已过期，请重新获取",
    "CHALLENGE_COOLDOWN": "发送过于频繁，请稍后再试",
    "CHALLENGE_RATE_LIMITED": "今日验证码次数已达上限，请明天再试",
    "ACCOUNT_LINK_REQUIRED": "该 GitHub 邮箱已有关联账号，请先使用原方式登录后再绑定 GitHub",
    "OAUTH_EMAIL_REQUIRED": "GitHub 未提供已验证邮箱，请先在 GitHub 中验证邮箱后重试"
  },
  "smsCode": {
    "countdown": "{n}秒后重发",
    "sending": "发送中...",
    "send": "发送验证码"
  },
  "toast": {
    "loginSuccess": "登录成功",
    "welcomeBack": "欢迎回来",
    "loginFailed": "登录失败",
    "registerSuccess": "注册成功",
    "welcomeJoin": "欢迎加入",
    "registerFailed": "注册失败",
    "smsCodeSent": "验证码已发送",
    "checkSms": "请查看短信",
    "smsCodeFailed": "验证码发送失败",
    "sendFailed": "发送失败",
    "loggedOut": "已退出登录",
    "guestModeEntered": "已进入访客模式",
    "guestModeLocalOnly": "访客数据仅保存在本地设备",
    "guestModeFailed": "访客模式失败",
    "loadSessionsFailed": "加载会话列表失败",
    "loadFailed": "加载失败",
    "sessionRevoked": "会话已撤销",
    "revokeSessionFailed": "撤销会话失败",
    "operationFailed": "操作失败",
    "pleaseLogin": "请先登录",
    "passwordChanged": "密码已修改",
    "reloginWithNew": "请使用新密码重新登录",
    "changePasswordFailed": "修改密码失败",
    "resetEmailSent": "重置邮件已发送",
    "checkResetEmail": "请查看邮件",
    "sendResetEmailFailed": "发送重置邮件失败",
    "passwordReset": "密码已重置",
    "loginWithNew": "请使用新密码登录",
    "resetPasswordFailed": "重置密码失败",
    "removeRememberedAccountFailed": "移除记住的账号失败"
  },
  "forgot": {
    "heading": "找回密码",
    "description": "输入注册邮箱，我们将发送验证码",
    "submitting": "发送中...",
    "submit": "发送验证码",
    "next": "我已收到验证码",
    "backToLogin": "返回登录",
    "sent": "如果该邮箱已注册，验证码将很快送达。请查收邮件。"
  },
  "reset": {
    "heading": "设置新密码",
    "description": "输入邮箱验证码并设置新密码",
    "submitting": "重置中...",
    "submit": "重置密码",
    "backToForgot": "重新发送验证码",
    "backToLogin": "返回登录",
    "success": "密码已重置，请使用新密码登录"
  },
  "verify": {
    "heading": "验证邮箱",
    "description": "我们已向 {email} 发送验证码，请输入完成验证",
    "descriptionGeneric": "请输入邮箱收到的 6 位验证码以完成验证",
    "resendIn": "{seconds}s 后可重新发送",
    "submitting": "验证中...",
    "submit": "验证邮箱",
    "resend": "重新发送验证码",
    "backToLogin": "返回登录",
    "sent": "验证码已发送，请查收邮件",
    "success": "邮箱验证成功",
    "skipLater": "稍后再说"
  },
  "common": {
    "loading": "加载中...",
    "operationFailed": "操作失败"
  }
} as const;
