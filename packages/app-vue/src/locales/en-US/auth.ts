export default {
  "page": {
    "description": "Sign in to continue into your workspace",
    "emailPlaceholder": "name{'@'}example.com",
    "or": "or",
    "guestMode": "Guest Mode",
    "guestLoading": "Starting guest mode...",
    "legalNoticePrefix": "By continuing, you agree to the ",
    "legalNoticeMid": " and ",
    "legalNoticeSuffix": ".",
    "termsOfService": "Terms of Service",
    "privacyPolicy": "Privacy Policy",
    "legalNotice": "By continuing, you agree to the Terms of Service and Privacy Policy.",
    "locales": {
      "zhCN": "中文",
      "enUS": "EN"
    },
    "themes": {
      "auto": "System",
      "light": "Light",
      "dark": "Dark"
    },
    "languageSelector": "Interface language",
    "codePlaceholder": "6-digit code"
  },
  "desktop": {
    "title": "Memoflow Desktop",
    "description": "You choose the account. Auto-login only runs when you explicitly enable it.",
    "tabs": {
      "login": "Login",
      "register": "Register",
      "quickLogin": "Quick Login"
    },
    "rememberPassword": "Remember password",
    "autoLogin": "Auto-login",
    "autoLoginHint": "The app only restores the session automatically when auto-login is enabled. Otherwise the sign-in window is always shown first.",
    "createAccount": "Create account",
    "quickLoginDescription": "Keep previously used accounts on this device so you can switch quickly, similar to QQ or Steam.",
    "noRememberedAccounts": "No remembered accounts are stored on this device yet.",
    "nicknamePolicy": "The account center now uses nickname as the single display name instead of a separate display name field."
  },
  "login": {
    "title": "Login",
    "description": "Sign in to your account to continue",
    "tab": {
      "email": "Email",
      "phone": "Phone"
    },
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot password?",
    "submitting": "Signing in...",
    "submit": "Sign In",
    "noAccount": "Don't have an account?",
    "registerLink": "Sign up",
    "heading": "Sign in to {app}",
    "forgotLink": "Forgot password?",
    "github": "Github"
  },
  "register": {
    "title": "Register",
    "description": "Create a new account",
    "tab": {
      "email": "Email",
      "phone": "Phone"
    },
    "passwordPlaceholder": "Enter password",
    "confirmPasswordPlaceholder": "Confirm password",
    "submitting": "Signing up...",
    "submit": "Sign Up",
    "hasAccount": "Already have an account?",
    "loginLink": "Back to sign in",
    "passwordStrength": {
      "weak": "Weak",
      "medium": "Medium",
      "strong": "Strong"
    },
    "heading": "Create your {app} account"
  },
  "field": {
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "phone": "Phone Number",
    "smsCode": "Verification Code",
    "nicknameOptional": "Nickname (optional)",
    "code": "Verification code",
    "newPassword": "New password"
  },
  "placeholder": {
    "password": "Enter password",
    "phone": "Enter phone number",
    "smsCode": "Enter verification code",
    "nickname": "Enter nickname"
  },
  "validation": {
    "emailInvalid": "Enter a valid email address",
    "passwordLength": "Password must be at least 8 characters",
    "loginCredentialsRequired": "Please enter your email and password",
    "registerFieldsRequired": "Please complete all required fields",
    "passwordMismatch": "Passwords do not match. Check them and try again",
    "guestModeUnavailable": "Guest mode is only available on desktop",
    "emailRequired": "Enter your email address",
    "passwordRequired": "Enter your password",
    "passwordMinLength": "Password must be at least 8 characters",
    "passwordMaxLength": "Password must not exceed 100 characters",
    "passwordComplexity": "Use at least two of uppercase letters, lowercase letters, numbers, or special characters",
    "confirmPasswordRequired": "Enter your password again",
    "codeRequired": "Enter the verification code",
    "codeInvalid": "Code must be 6 digits"
  },
  "errors": {
    "USER_ALREADY_EXISTS": "This email is already registered. Sign in instead",
    "AUTH_FAILED": "Incorrect email or password",
    "BAD_REQUEST": "The authentication request is invalid. Please review and try again.",
    "CONFLICT": "This email is already registered. Sign in instead.",
    "FORBIDDEN": "This account cannot perform the requested authentication action.",
    "NOT_FOUND": "The authentication resource was not found. Please try again later.",
    "OFFLINE": "No network connection is available. Please try again after reconnecting.",
    "REMOTE_UNREACHABLE": "The authentication service could not be reached. Please verify the deployed service is accessible.",
    "CONFIG_ERROR": "The desktop app is missing its authentication service URL. Please check the desktop runtime configuration.",
    "LOGIN_FAILED": "Login failed. Please try again.",
    "AUTH_ALREADY_ACTIVE_LOCALLY": "This account is already open in the desktop app.",
    "REGISTER_FAILED": "Registration failed. Please try again.",
    "REGISTER_ERROR": "Registration failed. Please try again.",
    "UNAUTHORIZED": "Incorrect email or password",
    "VALIDATION_ERROR": "Some fields are invalid. Please review your input.",
    "RATE_LIMITED": "Too many attempts. Please try again later.",
    "SERVICE_UNAVAILABLE": "Authentication is temporarily unavailable. Please try again later.",
    "INTERNAL_ERROR": "The authentication service encountered an error. Please try again later.",
    "TIMEOUT": "The authentication request timed out. Please try again.",
    "UNKNOWN": "Authentication failed. Please try again.",
    "NETWORK_ERROR": "Network connection failed. Check your connection and try again.",
    "EMAIL_VERIFICATION_REQUIRED": "Verify your email before continuing.",
    "INVALID_OR_EXPIRED_CODE": "Invalid or expired code. Request a new one.",
    "CHALLENGE_COOLDOWN": "Please wait before requesting another code.",
    "CHALLENGE_RATE_LIMITED": "Daily code limit reached. Try again tomorrow.",
    "ACCOUNT_LINK_REQUIRED": "An account already uses this GitHub email. Sign in to that account, then link GitHub.",
    "OAUTH_EMAIL_REQUIRED": "GitHub did not provide a verified email. Verify an email on GitHub and try again."
  },
  "smsCode": {
    "countdown": "Resend in {n}s",
    "sending": "Sending...",
    "send": "Send Code"
  },
  "toast": {
    "loginSuccess": "Login successful",
    "welcomeBack": "Welcome back",
    "loginFailed": "Login failed",
    "registerSuccess": "Registration successful",
    "welcomeJoin": "Welcome aboard",
    "registerFailed": "Registration failed",
    "smsCodeSent": "Verification code sent",
    "checkSms": "Please check your messages",
    "smsCodeFailed": "Failed to send verification code",
    "sendFailed": "Send failed",
    "loggedOut": "Logged out",
    "guestModeEntered": "Guest mode started",
    "guestModeLocalOnly": "Guest data stays only on this device",
    "guestModeFailed": "Failed to start guest mode",
    "loadSessionsFailed": "Failed to load sessions",
    "loadFailed": "Load failed",
    "sessionRevoked": "Session revoked",
    "revokeSessionFailed": "Failed to revoke session",
    "operationFailed": "Operation failed",
    "pleaseLogin": "Please sign in first",
    "passwordChanged": "Password changed",
    "reloginWithNew": "Please sign in with your new password",
    "changePasswordFailed": "Failed to change password",
    "resetEmailSent": "Reset email sent",
    "checkResetEmail": "Please check your email",
    "sendResetEmailFailed": "Failed to send reset email",
    "passwordReset": "Password reset",
    "loginWithNew": "Please sign in with your new password",
    "resetPasswordFailed": "Failed to reset password",
    "removeRememberedAccountFailed": "Failed to remove remembered account"
  },
  "forgot": {
    "heading": "Reset your password",
    "description": "Enter your email and we will send a verification code",
    "submitting": "Sending...",
    "submit": "Send code",
    "next": "I have the code",
    "backToLogin": "Back to sign in",
    "sent": "If an account exists for that email, a code will arrive shortly."
  },
  "reset": {
    "heading": "Choose a new password",
    "description": "Enter the email code and your new password",
    "submitting": "Resetting...",
    "submit": "Reset password",
    "backToForgot": "Resend code",
    "backToLogin": "Back to sign in",
    "success": "Password updated. Sign in with your new password."
  },
  "verify": {
    "heading": "Verify your email",
    "description": "We sent a code to {email}. Enter it to finish setup.",
    "descriptionGeneric": "Enter the 6-digit code from your email to finish verification",
    "resendIn": "Resend in {seconds}s",
    "submitting": "Verifying...",
    "submit": "Verify email",
    "resend": "Resend code",
    "backToLogin": "Back to sign in",
    "sent": "Verification code sent. Check your inbox.",
    "success": "Email verified",
    "skipLater": "Later"
  },
  "common": {
    "loading": "Loading...",
    "operationFailed": "Operation failed"
  }
} as const;
