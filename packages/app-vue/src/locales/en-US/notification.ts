export default {
  "title": "Notifications",
  "loading": "Loading...",
  "empty": "No notifications",
  "emptyDescription": "You are all caught up.",
  "allCaughtUp": "All caught up",
  "item": {
    "priorityVital": "Urgent",
    "priorityImportant": "Important"
  },
  "category": {
    "task": "Tasks", "goal": "Goals", "schedule": "Schedule", "reminder": "Reminders",
    "account": "Account", "system": "System", "other": "Notifications", "general": "Notifications"
  },
  "workflow": {
    "accountSecurity": "Account security",
    "goalReminder": "Goal reminder",
    "goalUpdate": "Goal update",
    "reminder": "Reminder",
    "routineReminder": "Routine reminder",
    "system": "System update",
    "taskDeadline": "Task deadline",
    "taskReminder": "Task reminder",
    "taskUpdate": "Task update"
  },
  "entity": { "task": "Task", "goal": "Goal", "schedule": "Schedule", "reminder": "Reminder", "routine": "Routine" },
  "bell": {
    "title": "Notifications",
    "unreadCount": "{count} unread notifications"
  },
  "drawer": {
    "title": "Notification Center",
    "viewAll": "View all notifications"
  },
  "filter": {
    "all": "All",
    "unread": "Unread",
    "read": "Read",
    "unreadBadge": "{count}"
  },
  "action": {
    "markAllRead": "Mark all as read",
    "openRelated": "Open related item",
    "retry": "Try again",
    "enableNotification": "Enable notifications",
    "dismiss": "Got it"
  },
  "toast": {
    "allMarkedRead": "All notifications marked as read",
    "deleted": "Notification deleted"
  },
  "permission": {
    "warningTitle": "Notification Permission"
  },
  "error": {
    "fetchFailed": "Failed to load notifications",
    "markReadFailed": "Failed to mark as read",
    "markAllReadFailed": "Failed to mark all as read",
    "deleteFailed": "Failed to delete notification",
    "refreshStatsFailed": "Failed to refresh stats"
  },
  "sseMonitor": {
    "title": "SSE Monitor",
    "connected": "Connected",
    "disconnected": "Disconnected",
    "actionConnect": "Connect",
    "actionDisconnect": "Disconnect",
    "clearLog": "Clear Log",
    "waitingTitle": "Waiting for SSE events",
    "waitingDescription": "Events will appear here once connected",
    "msgConnected": "SSE connection established (simulated)",
    "msgDisconnected": "SSE connection closed"
  }
} as const;
