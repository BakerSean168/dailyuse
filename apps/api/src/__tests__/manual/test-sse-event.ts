import { eventBus } from '@dailyuse/utils';

// 模拟发送一个测试提醒事件
const testAccountId = '9897aef0-7fad-4908-a0d1-31e9b22599c1';

console.log('\n🧪 发送测试 SSE 事件...\n');

// 发送弹窗提醒事件
eventBus.emit('ui:show-popup-reminder', {
  identityId: testAccountId,
  notificationId: 'test-notification-' + Date.now(),
  title: '测试提醒',
  content: '这是一条测试消息，用于验证 SSE 推送是否正常工作',
  priority: 'high',
  type: 'schedule_reminder',
  soundVolume: 70,
  popupDuration: 10,
  allowSnooze: true,
  snoozeOptions: [5, 10, 15],
  actions: [],
  metadata: {},
  timestamp: new Date().toISOString(),
});

console.log('✅ 测试事件已发送到 eventBus');
console.log('   事件: ui:show-popup-reminder');
console.log('   用户: ' + testAccountId);
console.log('\n请检查前端是否收到 SSE 事件！\n');

// 等待 2 秒后退出
setTimeout(() => {
  console.log('测试完成，退出程序');
  process.exit(0);
}, 2000);
