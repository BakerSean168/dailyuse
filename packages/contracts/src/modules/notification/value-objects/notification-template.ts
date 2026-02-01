export interface NotificationTemplateDTO {
  templateCode: string; // 唯一标识，如 "GOAL_DEADLINE_REMINDER"
  
  // 支持多语言的文案配置
  // Key: 语言代码 (zh/en); Value: 渠道文案映射
  locales: Record<string, {
    title: string;       // "目标截止提醒"
    body: string;        // "您的目标 {{goalName}} 即将到期"
    
    // 针对特定渠道的特殊文案 (可选)
    sms?: string;        // 短信通常更短
    emailHtml?: string;  // 邮件支持 HTML
  }>;

  // 定义该模板需要的变量列表，用于校验
  requiredVariables: string[]; // ["goalName", "timeLeft"]
}