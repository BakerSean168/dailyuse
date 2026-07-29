export default {
  "oauth": {
    "title": "Sign-in methods",
    "description": "Linking GitHub is for identity login only and never requests repository Contents permission. Connect a knowledge vault separately when you need sync.",
    "githubLinked": "GitHub login is linked",
    "githubNotLinked": "GitHub login is not linked",
    "bindGithub": "Link GitHub",
    "unbindGithub": "Unlink GitHub",
    "bindSuccess": "GitHub linked",
    "unbindSuccess": "GitHub unlinked",
    "bindFailed": "Failed to link GitHub",
    "unbindFailed": "Failed to unlink GitHub",
    "githubUnavailable": "GitHub login is not configured",
    "serviceUnavailable": "Authentication service is unavailable",
    "alreadyLinked": "This GitHub account is already linked to another MemoFlow identity. Silent merge is not allowed — sign in with that GitHub account instead.",
    "lastLoginPath": "This is the last login path for this account and cannot be removed. Add a password first.",
    "invalidState": "OAuth state is invalid or expired. Please try linking again.",
    "unbindConfirmTitle": "Unlink GitHub?",
    "unbindConfirmDescription": "You will no longer be able to sign in to this MemoFlow identity with that GitHub account.",
    "unbindConfirmText": "Unlink",
    "repoScopeHint": "Login linking is separate from knowledge-repository authorization (ADR-034)."
  },
  "sessions": {
    "title": "Devices & sessions",
    "description": "Review active sessions for this account. Revoke any device you do not recognize.",
    "loading": "Loading sessions…",
    "empty": "No active sessions",
    "current": "This device",
    "lastActive": "Last active",
    "revoke": "Revoke",
    "refresh": "Refresh",
    "unknownDevice": "Unknown device",
    "cannotRevokeCurrent": "You cannot revoke the current session. Sign out instead.",
    "revokeConfirmTitle": "Revoke this session?",
    "revokeConfirmDescription": "That device will need to sign in again.",
    "revokeConfirmText": "Revoke session"
  },
  "title": "Account",
  "center": "Account Center",
  "description": "Your nickname is the primary display name and will be saved to the current account.",
  "guestLabel": "Local guest",
  "logoutHandlerUnavailable": "The logout handler is currently unavailable",
  "actions": {
    "logout": "Log out",
    "saveProfile": "Save Profile"
  },
  "profile": {
    "editTitle": "Edit Profile",
    "changeAvatar": "Change Avatar",
    "avatarRecommendation": "Recommended: 200x200 pixels",
    "avatarUrl": "Avatar URL",
    "nickname": "Nickname",
    "realName": "Real Name",
    "bio": "Bio",
    "gender": "Gender",
    "birthday": "Birthday",
    "editProfile": "Edit Profile"
  },
  "placeholder": {
    "nickname": "Enter nickname",
    "avatarUrl": "https://... ",
    "realNameOptional": "Real name (optional)",
    "bio": "Tell people a little about yourself",
    "gender": "Select gender",
    "selectDate": "Select date"
  },
  "status": {
    "loading": "Loading account profile..."
  },
  "gender": {
    "male": "Male",
    "female": "Female",
    "other": "Other",
    "unspecified": "Unspecified",
    "notSet": "Not set"
  },
  "toast": {
    "loadProfileFailed": "Failed to load profile",
    "loadFailed": "Load failed",
    "profileUpdated": "Profile updated",
    "updateProfileFailed": "Failed to update profile",
    "updateFailed": "Update failed",
    "checkAvailabilityFailed": "Failed to check availability",
    "checkFailed": "Check failed",
    "settingsUpdated": "Settings updated",
    "accountClosed": "Account closed",
    "closeAccountFailed": "Failed to close account",
    "closeFailed": "Close failed",
    "guestProfileUpdateUnavailable": "Guest mode cannot update profile data",
    "guestSettingsUpdateUnavailable": "Guest mode cannot update account settings",
    "guestCloseAccountUnavailable": "Guest mode cannot close the account"
  },
  "logoutHint": "You can safely sign out here and return to the login page right away.",
  "logoutConfirm": {
    "title": "Log out of your account?",
    "description": "You will need to sign in again to continue.",
    "confirmText": "Log out",
    "cancelText": "Cancel"
  }
} as const;
