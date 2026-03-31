// 测试前端事件监听的调试脚本
console.log('🧪 知行 Memoflow 前端事件调试器启动');

// 检查事件总线是否存在
if (typeof window !== 'undefined' && window.eventBus) {
  console.log('✅ 全局事件总线已加载:', window.eventBus);

  // 监听所有调度相关事件
  const scheduleEvents = [
    'ui:show-popup-reminder',
    'ui:play-reminder-sound',
    'system:show-notification',
    'reminder-triggered',
  ];

  scheduleEvents.forEach((eventName) => {
    window.eventBus.on(eventName, (payload) => {
      console.log(`🔔 接收到事件: ${eventName}`, payload);

      // 显示桌面通知
      if (eventName === 'ui:show-popup-reminder' && Notification.permission === 'granted') {
        new Notification(`📅 ${payload.title || '调度提醒'}`, {
          body: payload.description || payload.message || '您有一个待办事项',
          icon: '/favicon.ico',
          tag: `schedule-${payload.taskId}`,
          requireInteraction: false,
        });
      }
    });
    console.log(`👂 监听事件: ${eventName}`);
  });

  // 检查通知权限
  if (Notification.permission !== 'granted') {
    console.log('⚠️ 通知权限未授权，请点击允许通知');
    Notification.requestPermission().then((permission) => {
      console.log(`🔔 通知权限: ${permission}`);
    });
  } else {
    console.log('✅ 通知权限已授权');
  }
} else {
  console.log('❌ 全局事件总线未找到，请检查应用初始化');

  // 延迟重试
  setTimeout(() => {
    if (window.eventBus) {
      console.log('✅ 延迟检测到事件总线');
      location.reload();
    } else {
      console.log('❌ 事件总线仍未加载，可能存在初始化问题');
    }
  }, 3000);
}

// 测试手动触发通知
window.testNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('🧪 测试通知', {
      body: '这是一个手动触发的测试通知',
      icon: '/favicon.ico',
    });
    console.log('🧪 手动测试通知已发送');
  } else {
    console.log('❌ 通知权限未授权');
  }
};

console.log('💡 在控制台输入 testNotification() 来手动测试通知');

// 监听页面加载事件
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM 加载完成');
});

window.addEventListener('load', () => {
  console.log('🎯 页面完全加载完成');
});
