export default {
  "title": "通知",
  "loading": "加载中...",
  "empty": "暂无通知",
  "emptyDescription": "目前没有新通知。",
  "allCaughtUp": "已全部处理",
  "item": {
    "priorityVital": "紧急",
    "priorityImportant": "重要"
  },
  "category": {
    "task": "任务", "goal": "目标", "schedule": "日程", "reminder": "提醒",
    "account": "账户", "system": "系统", "other": "通知", "general": "通知"
  },
  "workflow": {
    "accountSecurity": "账户安全",
    "goalReminder": "目标提醒",
    "goalUpdate": "目标更新",
    "reminder": "提醒",
    "routineReminder": "作息提醒",
    "system": "系统更新",
    "taskDeadline": "任务截止提醒",
    "taskReminder": "任务提醒",
    "taskUpdate": "任务更新"
  },
  "entity": { "task": "任务", "goal": "目标", "schedule": "日程", "reminder": "提醒", "routine": "例行事项" },
  "bell": {
    "title": "通知",
    "unreadCount": "{count} 条未读通知"
  },
  "drawer": {
    "title": "通知中心",
    "viewAll": "查看全部通知"
  },
  "filter": {
    "all": "全部",
    "unread": "未读",
    "read": "已读",
    "unreadBadge": "{count}"
  },
  "action": {
    "markAllRead": "全部标为已读",
    "openRelated": "打开相关内容",
    "retry": "重试",
    "enableNotification": "开启通知",
    "dismiss": "知道了"
  },
  "toast": {
    "allMarkedRead": "已全部标为已读",
    "deleted": "通知已删除"
  },
  "permission": {
    "warningTitle": "通知权限提示"
  },
  "error": {
    "fetchFailed": "加载通知列表失败",
    "markReadFailed": "标记已读失败",
    "markAllReadFailed": "全部标记已读失败",
    "deleteFailed": "删除通知失败",
    "refreshStatsFailed": "刷新统计失败"
  },
  "sseMonitor": {
    "title": "SSE 监控",
    "connected": "已连接",
    "disconnected": "未连接",
    "actionConnect": "连接",
    "actionDisconnect": "断开",
    "clearLog": "清空日志",
    "waitingTitle": "等待 SSE 事件",
    "waitingDescription": "连接后，收到的事件将在这里显示",
    "msgConnected": "SSE 连接已建立（模拟）",
    "msgDisconnected": "SSE 连接已断开"
  }
} as const;
