# Architectural Decisions: DailyUse Productivity Platform

**Version**: 1.0  
**Date**: 2026-02-03  
**Status**: Decision Framework  
**Context**: Research-backed architectural recommendations for OKR synchronization, notification channels, and notification service infrastructure.

---

## Table of Contents

1. [OKR Progress Synchronization Strategy](#1-okr-progress-synchronization-strategy)
2. [Notification Channels Architecture](#2-notification-channels-architecture)
3. [Technical Notification Service Architecture](#3-technical-notification-service-architecture)
4. [Implementation Patterns](#4-implementation-patterns)
5. [Database Schema](#5-database-schema)
6. [Configuration Examples](#6-configuration-examples)

---

## 1. OKR Progress Synchronization Strategy

### Decision: Hybrid Approach with User-Configurable Default

**Recommendation**: Implement **manual progress tracking as default with optional automatic aggregation** for completed tasks. This balances control with convenience.

### Analysis

#### Option A: Fully Automatic Synchronization
**How it works**: Task completion automatically updates parent key result progress. System maintains count of completed tasks and calculates KR progress as (completed_tasks / total_linked_tasks) * 100.

**Pros**:
- Minimal user friction; users update task status, KR updates automatically
- Accurate reflection of completed work without manual intervention
- Reduces cognitive load for users juggling multiple tasks
- Real-time progress dashboard requires no manual refresh
- Prevents progress discrepancies from user oversight

**Cons**:
- Assumes all tasks contribute equally (task_count-based calculation); complex tasks and simple tasks weighted the same
- Assumes all linked tasks are equally important for KR progress
- Difficult to achieve 100% KR progress if tasks are added incrementally
- Doesn't account for partial task completion or quality metrics
- Users may complete tasks without meaningful KR progress (e.g., administrative subtasks)

**Industry Practice**: 
- **Jira**: Default task-to-epic rollup is automatic (issue count aggregation), but custom story point weighting is manual
- **Asana**: Portfolio progress can be auto-calculated from task status but requires explicit task linking
- **Monday.com**: Progress fields default to manual but can be auto-populated from item counts
- **Lattice**: OKR progress is primarily manual; auto-updates only for integrated systems (like Jira)

#### Option B: Fully Manual Progress Tracking
**How it works**: Users explicitly set key result progress (0-100%) independently from task status. Task completion doesn't affect KR progress.

**Pros**:
- Maximum user control; can adjust KR progress based on quality, learning, blockers, not just task count
- Supports nuanced progress assessment (e.g., 80% progress due to architectural complexity, even if 5/5 tasks done)
- No assumptions about task-KR relationships
- Clear accountability: users consciously declare progress
- Works well for KRs without linked tasks (pure aspirational goals)

**Cons**:
- Manual overhead; users must maintain two separate progress metrics
- High cognitive load in complex OKR hierarchies (goals with 5+ KRs with multiple tasks each)
- Risk of progress inconsistency (KR claims 100% but tasks incomplete, or vice versa)
- Dashboard and reporting require manual synthesis
- Users may neglect KR updates if focused on task execution
- Discrepancy between task completion and reported progress reduces trust

**Industry Practice**:
- **Google/Lattice**: Standard OKR practice; progress is manual assessment, separate from execution
- **Personal productivity tools** (Notion, Todoist): Mostly manual; no built-in OKR-to-task sync

#### Option C: Hybrid (Recommended)
**How it works**: 
1. **Default behavior**: KR progress shows task completion percentage as reference (auto-calculated, read-only)
2. **User override**: Users can explicitly set KR progress independently if they want to account for quality, blockers, or nuance
3. **Completion awareness**: Task completion rate is visible in KR detail to inform user decisions
4. **Integration option**: Per-user setting: "Use automatic progress calculation" (can be toggled)

**Architecture**:
```
KeyResult {
  progress: number (0-100)  // User-set explicit progress
  auto_progress: number     // Calculated from linked tasks (optional reference)
  auto_enabled: boolean     // User preference: use auto_progress as default
  linked_tasks: Task[]      // Relationship for aggregation
  calculation_method: 'manual' | 'auto' | 'hybrid'
}

// When saving KR:
if (kr.auto_enabled && kr.calculation_method === 'auto') {
  kr.progress = calculateTaskCompletion(kr.linked_tasks)
} else {
  // User manually set progress; preserve it
}
```

**Pros (synthesis of above)**:
- Supports both precise and nuanced progress assessment
- Reduces friction for straightforward cases (auto-aggregate task counts)
- Maintains control for complex scenarios (manual override)
- Transparency: both metrics visible, user chooses which to trust
- Learning path: teams starting with auto mode can graduate to nuanced manual assessment
- Accommodates different KR types (metric-driven vs. qualitative)

**Cons**:
- Slightly more complexity in UI/UX (two progress metrics displayed)
- Potential confusion if auto and manual progress diverge significantly
- Requires clear communication to users about which mode is active

### Recommendation

**Implement Option C: Hybrid with defaults**:

1. **MVP Phase**: 
   - Start with manual-only (simplest implementation)
   - Display task completion count as reference information in KR detail
   - No automatic progress rollup

2. **Phase 2** (post-MVP):
   - Add user preference: "Auto-calculate KR progress from linked tasks"
   - Implement read-only `auto_progress` field showing (completed_tasks / total_tasks) * 100
   - Allow user to accept auto-calculated progress with one click

3. **Phase 3** (future):
   - Task weighting system: tasks can have weight/impact score
   - Auto-progress calculation: (sum of completed_task_weights / sum of all_task_weights) * 100
   - Custom progress formula support for power users

### Implementation Implications

**Database Schema Addition**:
```sql
ALTER TABLE key_results ADD COLUMN (
  auto_progress_enabled BOOLEAN DEFAULT FALSE,
  calculation_method ENUM('manual', 'auto') DEFAULT 'manual'
);

-- View for read-only auto-calculated progress
CREATE VIEW kr_auto_progress AS
SELECT 
  kr.id,
  kr.progress as manual_progress,
  COALESCE(
    ROUND(100 * COUNT(CASE WHEN t.status = 'completed' THEN 1 END) 
      / NULLIF(COUNT(t.id), 0)), 0
  ) as auto_progress
FROM key_results kr
LEFT JOIN tasks t ON t.key_result_id = kr.id
GROUP BY kr.id;
```

**Backend Logic**:
```typescript
// Service: updateKeyResultProgress
async updateKeyResultProgress(
  krId: string, 
  progress: number, 
  userId: string
): Promise<KeyResult> {
  const kr = await this.getKeyResult(krId, userId);
  
  if (kr.auto_progress_enabled) {
    // Validate user is explicitly overriding auto-calculated value
    const autoProgress = await this.calculateAutoProgress(krId);
    if (progress !== autoProgress) {
      // User is overriding; log for analytics
      await this.logProgressOverride(krId, autoProgress, progress);
    }
  }
  
  return await KeyResult.updateOne(
    { _id: krId, userId },
    { progress, updatedAt: new Date() }
  );
}

// Calculate auto-progress for display
async calculateAutoProgress(krId: string): Promise<number> {
  const linkedTasks = await Task.find({ keyResultId: krId });
  const completedCount = linkedTasks.filter(t => t.status === 'completed').length;
  return linkedTasks.length > 0 
    ? Math.round((completedCount / linkedTasks.length) * 100)
    : 0;
}
```

**Frontend Display Logic**:
```typescript
// Component: KeyResultProgress.vue
<template>
  <div class="kr-progress">
    <div class="primary-progress">
      <label>Key Result Progress</label>
      <input v-model.number="kr.progress" type="range" min="0" max="100" />
      <span>{{ kr.progress }}%</span>
    </div>
    
    <!-- Reference info if auto-calculation available -->
    <div v-if="kr.auto_progress_enabled" class="auto-progress-reference">
      <p class="hint">
        Tasks: {{ completedTasksCount }}/{{ totalTasksCount }} completed
        ({{ autoProgress }}% auto-calculated)
      </p>
      <button v-if="autoProgress !== kr.progress" @click="acceptAutoProgress">
        Use Auto-Calculated Progress
      </button>
    </div>
  </div>
</template>

<script setup>
const { kr } = defineProps();
const completedTasksCount = computed(() => kr.linked_tasks?.filter(t => t.status === 'completed').length ?? 0);
const totalTasksCount = computed(() => kr.linked_tasks?.length ?? 0);
const autoProgress = computed(() => 
  totalTasksCount.value > 0 
    ? Math.round((completedTasksCount.value / totalTasksCount.value) * 100)
    : 0
);
</script>
```

---

## 2. Notification Channels Architecture

### Decision: Multi-Channel with User Preference Management

**Recommendation**: Support **4 core channels in MVP** (Browser Push, In-App Toast, Email, Sound) with extensible architecture for future additions (SMS, mobile app, Slack, webhooks).

### Analysis

#### Notification Channels Overview

| Channel | Latency | Reliability | Cost | User Preference | Best For |
|---------|---------|-------------|------|-----------------|----------|
| **Browser Push** | <1s | High (requires browser open/SW) | Free | Required | Immediate alerts (reminders, task due soon) |
| **In-App Toast** | Instant | 100% (if user in app) | Free | Always on | Contextual feedback during active use |
| **Email** | 30-300s | Medium (depends on email provider) | Low ($0.01-0.1/email) | Opt-in | Summary notifications, non-urgent (daily digest) |
| **Sound** | Instant | 100% (if enabled) | Free | Optional | Attention-grabbing for critical reminders |
| **SMS** | 5-60s | High | Medium ($0.05-0.15/SMS) | Opt-in | Critical alerts (payment due, system downtime) |
| **Mobile App** | <1s | High | Infrastructure | N/A (requires app) | Desktop + mobile ecosystem |
| **Slack/Webhook** | 1-5s | High | Free (Slack) | Opt-in | Integration with user's workflow |

#### Notification Event Types & Channel Mapping

```
Reminder Triggered
  ├─ User prefers immediate notification
  ├─ Channels: Browser Push (primary) + Sound (optional) + In-App Toast (secondary)
  └─ Latency requirement: <1 second

Task Due Soon (within 24h)
  ├─ User prefers timely notification
  ├─ Channels: Browser Push (primary) + Email (optional) + In-App Toast
  └─ Latency requirement: 5-30 seconds

Goal Milestone Reached
  ├─ User prefers celebration/reinforcement
  ├─ Channels: In-App Toast (prominent) + Email (optional summary)
  └─ Latency requirement: 1-60 seconds

Daily Digest (optional)
  ├─ User prefers consolidated summary
  ├─ Channels: Email (primary) + In-App notification
  └─ Latency requirement: flexible (typically morning)

Failed Recurring Task (missed deadline)
  ├─ User prefers follow-up reminder
  ├─ Channels: Email (primary) + Browser Push (optional)
  └─ Latency requirement: hours (next batch)
```

### MVP Channel Recommendation

**Tier 1 (MVP, implement immediately)**:
1. **In-App Toast** (instant, no infra cost, always reliable)
2. **Browser Push** (via Service Worker, reaches users outside app)

**Tier 2 (Phase 2, 1-2 weeks)**:
3. **Email** (digest notifications, task summaries)
4. **Sound** (simple audio cue for reminders)

**Tier 3 (Post-MVP)**:
5. SMS (requires phone verification, payment processing)
6. Mobile app notifications (requires native app)
7. Webhook/Slack integration (for power users)

### User Preference Management

**Architecture**:
```
UserNotificationPreference {
  userId: string
  
  // Per-channel enablement
  browser_push_enabled: boolean (default: true)
  in_app_toast_enabled: boolean (default: true)
  email_enabled: boolean (default: false, requires opt-in)
  sound_enabled: boolean (default: false)
  
  // Per-event-type channel selection
  reminder_triggered: {
    channels: ['browser_push', 'sound', 'in_app_toast'],
    quiet_hours_bypass: false
  },
  task_due_soon: {
    channels: ['browser_push', 'email'],
    quiet_hours_bypass: false
  },
  goal_milestone: {
    channels: ['in_app_toast', 'email'],
    quiet_hours_bypass: true  // Celebrate even in quiet hours
  },
  
  // Quiet hours: notifications suppressed or batched
  quiet_hours_enabled: boolean (default: false)
  quiet_hours_start: string (e.g., "22:00")  // 24-hour format
  quiet_hours_end: string (e.g., "08:00")
  quiet_hours_batch_email: boolean  // Collect quiet hour notifications for email digest
  
  // Frequency control
  max_notifications_per_hour: number (default: unlimited)
  duplicate_suppression_window_ms: number (default: 5000)  // Suppress duplicate notifications
  
  // Advanced
  timezone: string (default: browser timezone)
  digest_frequency: 'daily' | 'weekly' | 'never' (default: 'daily')
}
```

**UI Components for User Settings**:
```
Notification Preferences Panel
├─ Channel Enablement
│  ├─ [ ] Browser Push Notifications
│  ├─ [ ] In-App Toasts
│  ├─ [ ] Email Notifications
│  └─ [ ] Sound Notifications
│
├─ Quiet Hours Configuration
│  ├─ [ ] Enable Quiet Hours
│  ├─ From: [HH:MM] To: [HH:MM]
│  └─ [ ] Batch notifications as email digest during quiet hours
│
├─ Per-Event-Type Channels (Advanced)
│  ├─ Reminders Triggered
│  │  └─ [✓] Browser Push [✓] Sound [ ] Email
│  ├─ Task Due Soon
│  │  └─ [✓] Browser Push [ ] Sound [✓] Email
│  └─ Goal Milestone
│      └─ [✓] In-App [ ] Email
│
└─ Frequency Controls
   ├─ Max notifications per hour: [10 ▼]
   └─ Digest frequency: [Daily ▼]
```

### Extensibility Architecture

**Strategy**: Plugin-based notification channel system with standardized interface.

```typescript
// Abstract channel interface
interface NotificationChannel {
  name: string;
  description: string;
  supportsInteractiveActions: boolean;
  
  // Check if channel can be used for this user
  canDeliver(userId: string, eventType: string): Promise<boolean>;
  
  // Deliver notification
  send(notification: Notification, userPreferences: UserNotificationPreference): Promise<DeliveryResult>;
  
  // Mark as read/interacted (optional)
  markAsRead?(notificationId: string, userId: string): Promise<void>;
}

// Concrete implementations
class BrowserPushChannel implements NotificationChannel {
  name = 'browser_push';
  supportsInteractiveActions = true;
  
  async canDeliver(userId: string, eventType: string): Promise<boolean> {
    const prefs = await getUserPreferences(userId);
    return prefs.browser_push_enabled && await this.hasServiceWorker(userId);
  }
  
  async send(notification: Notification, prefs: UserNotificationPreference): Promise<DeliveryResult> {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(notification.title, {
      body: notification.body,
      data: { notificationId: notification.id, resourceId: notification.resourceId },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
    return { success: true, deliveredAt: new Date() };
  }
  
  private async hasServiceWorker(userId: string): Promise<boolean> {
    // Check if user has active Service Worker registration
    const reg = await navigator.serviceWorker?.getRegistration('/');
    return !!reg;
  }
}

class InAppToastChannel implements NotificationChannel {
  name = 'in_app_toast';
  supportsInteractiveActions = false;
  
  async canDeliver(userId: string, eventType: string): Promise<boolean> {
    const prefs = await getUserPreferences(userId);
    return prefs.in_app_toast_enabled;
  }
  
  async send(notification: Notification, prefs: UserNotificationPreference): Promise<DeliveryResult> {
    // Dispatch to Pinia store / EventBus for in-app display
    useNotificationStore().addToast({
      id: notification.id,
      type: this.mapEventTypeToToastLevel(notification.eventType),
      title: notification.title,
      message: notification.body,
      duration: 5000,
      action: notification.action ? { label: 'View', callback: () => navigateTo(notification.resourceUrl) } : undefined
    });
    return { success: true, deliveredAt: new Date() };
  }
  
  private mapEventTypeToToastLevel(eventType: string): 'info' | 'success' | 'warning' | 'error' {
    const mapping: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
      'reminder_triggered': 'info',
      'goal_milestone': 'success',
      'task_due_soon': 'warning',
      'task_overdue': 'error'
    };
    return mapping[eventType] || 'info';
  }
}

class EmailChannel implements NotificationChannel {
  name = 'email';
  supportsInteractiveActions = true;
  
  async canDeliver(userId: string, eventType: string): Promise<boolean> {
    const prefs = await getUserPreferences(userId);
    return prefs.email_enabled && await this.userHasVerifiedEmail(userId);
  }
  
  async send(notification: Notification, prefs: UserNotificationPreference): Promise<DeliveryResult> {
    const emailService = this.getEmailService();
    const result = await emailService.sendTransactional({
      to: (await getUser(notification.userId)).email,
      template: 'notification-' + notification.eventType,
      data: {
        title: notification.title,
        body: notification.body,
        actionUrl: notification.resourceUrl,
        actionLabel: notification.action?.label || 'View'
      }
    });
    return { success: result.messageId ? true : false, deliveredAt: new Date(), messageId: result.messageId };
  }
  
  private getEmailService() {
    // Return configured email service (SendGrid, Mailgun, AWS SES, etc.)
    return emailServiceFactory.create(config.email.provider);
  }
}

class SoundChannel implements NotificationChannel {
  name = 'sound';
  supportsInteractiveActions = false;
  
  async canDeliver(userId: string, eventType: string): Promise<boolean> {
    const prefs = await getUserPreferences(userId);
    return prefs.sound_enabled && !this.isInQuietHours(prefs);
  }
  
  async send(notification: Notification, prefs: UserNotificationPreference): Promise<DeliveryResult> {
    // Client-side: play audio via Web Audio API
    const audio = new Audio('/assets/sounds/notification-' + notification.eventType + '.mp3');
    audio.play().catch(err => console.warn('Could not play notification sound:', err));
    return { success: true, deliveredAt: new Date() };
  }
  
  private isInQuietHours(prefs: UserNotificationPreference): boolean {
    if (!prefs.quiet_hours_enabled) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    
    return startTime <= endTime
      ? currentTime >= startTime && currentTime < endTime
      : currentTime >= startTime || currentTime < endTime;  // Wrap-around midnight
  }
}

// Channel registry
class NotificationChannelRegistry {
  private channels = new Map<string, NotificationChannel>();
  
  register(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }
  
  async send(notification: Notification, userPreferences: UserNotificationPreference): Promise<void> {
    const channels = userPreferences[notification.eventType]?.channels || [];
    const deliveryResults = [];
    
    for (const channelName of channels) {
      const channel = this.channels.get(channelName);
      if (!channel) {
        console.warn(`Unknown channel: ${channelName}`);
        continue;
      }
      
      if (!(await channel.canDeliver(notification.userId, notification.eventType))) {
        continue;
      }
      
      try {
        const result = await channel.send(notification, userPreferences);
        deliveryResults.push({ channel: channelName, ...result });
      } catch (error) {
        console.error(`Failed to deliver via ${channelName}:`, error);
        deliveryResults.push({ channel: channelName, success: false, error });
      }
    }
    
    // Log delivery attempt for analytics
    await logNotificationDelivery(notification.id, deliveryResults);
  }
}
```

---

## 3. Technical Notification Service Architecture

### Decision: Queue-Based with Dual Dispatch Strategy

**Recommendation**: Implement **hybrid queue + direct dispatch** for notifications:
- **Direct dispatch** for immediate notifications (reminders, task due soon)
- **Queue-based** (Bull/Redis) for batch/digest notifications and guaranteed delivery with retries

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event Sources                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Task Service │ Reminder Svc │ Goal Service │ Scheduler (cron)  │
└──────────────┴──────────────┴──────────────┴────────────────────┘
              │         │              │             │
              └─────────┴──────────────┴─────────────┘
                        │
                ┌───────▼──────────┐
                │ Event Dispatcher │  (Broadcasts events)
                └───────┬──────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
   │   Direct    │ │ Queue-Based  │ │   Database   │
   │  Dispatch   │ │  (Bull/Redis)│ │  Logging     │
   │             │ │              │ │              │
   │ Immediate   │ │ Batch/Digest │ │ Audit Trail  │
   │ Reminders   │ │ Email Digest │ │              │
   │ In-App      │ │ Retries      │ │ Analytics    │
   │ Browser Push│ │ Scheduling   │ │              │
   └──────┬──────┘ └──────┬───────┘ └──────┬───────┘
          │               │               │
          └───────────────┼───────────────┘
                  │
          ┌───────▼──────────────────┐
          │  Notification Channels   │
          │ ┌──────────────────────┐ │
          │ │ BrowserPush Channel  │ │
          │ ├──────────────────────┤ │
          │ │ InAppToast Channel   │ │
          │ ├──────────────────────┤ │
          │ │ Email Channel        │ │
          │ ├──────────────────────┤ │
          │ │ Sound Channel        │ │
          │ └──────────────────────┘ │
          └──────────────────────────┘
                  │
          ┌───────▼──────────────────┐
          │   User Devices/Services  │
          │ ├─ Browser SW Store      │
          │ ├─ Email Provider        │
          │ ├─ User Browser (in-app) │
          │ └─ Audio Output          │
          └──────────────────────────┘
```

### Notification Service Implementation

```typescript
// Core notification service
class NotificationService {
  private eventBus: EventEmitter;
  private channelRegistry: NotificationChannelRegistry;
  private notificationRepository: NotificationRepository;
  private queueService: QueueService;
  
  constructor(
    eventBus: EventEmitter,
    channelRegistry: NotificationChannelRegistry,
    notificationRepository: NotificationRepository,
    queueService: QueueService
  ) {
    this.eventBus = eventBus;
    this.channelRegistry = channelRegistry;
    this.notificationRepository = notificationRepository;
    this.queueService = queueService;
    
    // Subscribe to domain events
    this.subscribeToDomainEvents();
  }
  
  // ===== DIRECT DISPATCH (Immediate) =====
  
  async notifyImmediately(notification: Notification): Promise<void> {
    const userPreferences = await this.getUserPreferences(notification.userId);
    
    // Check quiet hours and deduplication BEFORE sending
    if (this.isInQuietHours(userPreferences) && !notification.bypassQuietHours) {
      // Defer to queue for batching in quiet hours
      await this.queueService.addDeferredNotification(notification);
      return;
    }
    
    if (await this.isDuplicateWithinWindow(notification)) {
      console.log(`Suppressed duplicate notification: ${notification.id}`);
      return;
    }
    
    // Persist notification to DB
    const saved = await this.notificationRepository.save(notification);
    
    // Send via all configured channels
    await this.channelRegistry.send(saved, userPreferences);
  }
  
  // ===== QUEUE-BASED DISPATCH (Batch/Delayed) =====
  
  async queueNotification(notification: Notification, options: QueueOptions = {}): Promise<void> {
    const job = await this.queueService.addNotification({
      notificationId: notification.id,
      eventData: notification.toJSON(),
      priority: this.mapEventTypeToPriority(notification.eventType),
      delay: options.delay || 0,
      retries: options.retries || 3,
      backoff: options.backoff || { type: 'exponential', delay: 2000 }
    });
    
    console.log(`Queued notification: ${notification.id} with job ID: ${job.id}`);
  }
  
  // Process queued notifications (Bull worker)
  async processQueuedNotification(jobData: QueueJobData): Promise<void> {
    const notification = Notification.fromJSON(jobData.eventData);
    const userPreferences = await this.getUserPreferences(notification.userId);
    
    // Check if user still has preferences (hasn't deleted account, etc.)
    if (!userPreferences) {
      console.log(`Skipping notification for deleted/inactive user: ${notification.userId}`);
      return;
    }
    
    // Final deduplication check before processing
    if (await this.isDuplicateWithinWindow(notification)) {
      console.log(`Suppressed duplicate in queue: ${notification.id}`);
      return;
    }
    
    // Send via all configured channels
    await this.channelRegistry.send(notification, userPreferences);
  }
  
  // ===== DIGEST/BATCH NOTIFICATIONS =====
  
  async scheduleDigestNotifications(): Promise<void> {
    // This runs via cron (e.g., 8 AM daily)
    const allUsers = await this.getAllUsersWithEmailEnabled();
    
    for (const user of allUsers) {
      const preferences = await this.getUserPreferences(user.id);
      
      if (preferences.digest_frequency !== 'daily') {
        continue; // Skip if not opted into daily digest
      }
      
      // Collect notifications from last 24 hours
      const notifications = await this.notificationRepository.findByUserAndDateRange(
        user.id,
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );
      
      if (notifications.length === 0) {
        continue; // No notifications to digest
      }
      
      // Create digest notification
      const digestNotification = new Notification({
        id: generateId(),
        userId: user.id,
        eventType: 'daily_digest',
        title: `Your Daily Summary - ${notifications.length} updates`,
        body: this.renderDigestTemplate(notifications),
        resourceType: 'digest',
        metadata: { notificationIds: notifications.map(n => n.id) }
      });
      
      // Queue for email delivery
      await this.queueService.addNotification({
        notificationId: digestNotification.id,
        eventData: digestNotification.toJSON(),
        priority: 'low',
        delay: 0,
        retries: 5
      });
    }
  }
  
  // ===== HELPER METHODS =====
  
  private isInQuietHours(prefs: UserNotificationPreference): boolean {
    if (!prefs.quiet_hours_enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    
    return startTime <= endTime
      ? currentTime >= startTime && currentTime < endTime
      : currentTime >= startTime || currentTime < endTime;
  }
  
  private async isDuplicateWithinWindow(notification: Notification): Promise<boolean> {
    const DEDUP_WINDOW_MS = 5000; // 5 second window
    
    const recent = await this.notificationRepository.findRecent(
      notification.userId,
      notification.eventType,
      notification.resourceId,
      DEDUP_WINDOW_MS
    );
    
    return recent.length > 0;
  }
  
  private mapEventTypeToPriority(eventType: string): 'high' | 'normal' | 'low' {
    const mapping: Record<string, 'high' | 'normal' | 'low'> = {
      'reminder_triggered': 'high',
      'task_due_soon': 'normal',
      'task_overdue': 'high',
      'goal_milestone': 'normal',
      'daily_digest': 'low',
      'weekly_digest': 'low'
    };
    return mapping[eventType] || 'normal';
  }
  
  private renderDigestTemplate(notifications: Notification[]): string {
    // Group by type
    const grouped = notifications.reduce((acc, n) => {
      acc[n.eventType] = (acc[n.eventType] || []).concat(n);
      return acc;
    }, {} as Record<string, Notification[]>);
    
    let html = '<h2>Your Daily Summary</h2><ul>';
    for (const [type, items] of Object.entries(grouped)) {
      html += `<li><strong>${type}</strong>: ${items.length} updates</li>`;
    }
    html += '</ul>';
    
    return html;
  }
  
  // ===== EVENT SUBSCRIPTIONS =====
  
  private subscribeToDomainEvents(): void {
    // Task completion -> check for milestone
    this.eventBus.on('task.completed', async (event: TaskCompletedEvent) => {
      await this.onTaskCompleted(event);
    });
    
    // Reminder scheduled time reached -> immediate notification
    this.eventBus.on('reminder.scheduled_time_reached', async (event: ReminderTimeReachedEvent) => {
      const notification = new Notification({
        id: generateId(),
        userId: event.userId,
        eventType: 'reminder_triggered',
        title: event.reminder.name,
        body: `Time for: ${event.reminder.name}`,
        resourceType: 'reminder',
        resourceId: event.reminder.id,
        resourceUrl: `/reminders/${event.reminder.id}`,
        bypassQuietHours: true
      });
      await this.notifyImmediately(notification);
    });
    
    // Task deadline approaching -> queue with timing
    this.eventBus.on('task.deadline_approaching', async (event: TaskDeadlineApproachingEvent) => {
      const notification = new Notification({
        id: generateId(),
        userId: event.task.userId,
        eventType: 'task_due_soon',
        title: `Task due soon: ${event.task.title}`,
        body: `Due: ${event.task.dueDate.toLocaleDateString()}`,
        resourceType: 'task',
        resourceId: event.task.id,
        resourceUrl: `/tasks/${event.task.id}`,
        action: { type: 'view', label: 'View Task' }
      });
      
      // Queue with delay until 24 hours before deadline
      const hoursUntilDeadline = this.calculateHoursUntil(event.task.dueDate);
      const delayMs = Math.max(0, (hoursUntilDeadline - 24) * 60 * 60 * 1000);
      
      await this.queueNotification(notification, { delay: delayMs });
    });
  }
  
  private calculateHoursUntil(date: Date): number {
    return (date.getTime() - Date.now()) / (60 * 60 * 1000);
  }
  
  private async onTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    // Check if task completes a milestone
    const milestone = await this.checkForMilestone(event.task);
    if (milestone) {
      const notification = new Notification({
        id: generateId(),
        userId: event.task.userId,
        eventType: 'goal_milestone',
        title: `🎉 Milestone: ${milestone.name}`,
        body: `You've completed ${milestone.progress}% of your goal!`,
        resourceType: 'goal',
        resourceId: milestone.goalId,
        resourceUrl: `/goals/${milestone.goalId}`,
        bypassQuietHours: true
      });
      await this.notifyImmediately(notification);
    }
  }
  
  private async checkForMilestone(task: Task): Promise<MilestoneInfo | null> {
    // Check if completing this task reaches a milestone (e.g., 50%, 100% of KR)
    if (!task.keyResultId) return null;
    
    const kr = await this.keyResultRepository.findById(task.keyResultId);
    const linkedTasks = await this.taskRepository.findByKeyResultId(kr.id);
    const completedCount = linkedTasks.filter(t => t.status === 'completed').length;
    const progressPercent = (completedCount / linkedTasks.length) * 100;
    
    if (progressPercent >= 100 || progressPercent === 75 || progressPercent === 50) {
      return { goalId: kr.goalId, progress: progressPercent, name: kr.title };
    }
    
    return null;
  }
}
```

### Queue Configuration (Bull with Redis)

```typescript
// queue.service.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { createClient } from 'redis';

class QueueService {
  private notificationQueue: Queue;
  private digestQueue: Queue;
  private redisClient: ReturnType<typeof createClient>;
  
  constructor(redisUrl: string) {
    this.redisClient = createClient({ url: redisUrl });
    
    // Notification queue: immediate and delayed deliveries
    this.notificationQueue = new Queue('notifications', {
      connection: this.redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    
    // Digest queue: batch/scheduled notifications
    this.digestQueue = new Queue('digests', {
      connection: this.redisClient,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });
    
    // Add QueueScheduler for delayed jobs
    new QueueScheduler('notifications', { connection: this.redisClient });
    new QueueScheduler('digests', { connection: this.redisClient });
    
    this.setupWorkers();
  }
  
  async addNotification(jobData: QueueJobData): Promise<Job> {
    return this.notificationQueue.add(
      'deliver',
      jobData,
      {
        priority: this.mapPriorityToNumber(jobData.priority),
        delay: jobData.delay,
        attempts: jobData.retries,
        backoff: jobData.backoff
      }
    );
  }
  
  async addDeferredNotification(notification: Notification): Promise<void> {
    const userPreferences = await this.getUserPreferences(notification.userId);
    const batchingTime = 60 * 60 * 1000; // Batch for 1 hour during quiet hours
    
    await this.notificationQueue.add(
      'deliver',
      { notificationId: notification.id, eventData: notification.toJSON() },
      {
        delay: batchingTime,
        priority: 'low'
      }
    );
  }
  
  private setupWorkers(): void {
    // Worker for notification delivery
    new Worker(
      'notifications',
      async (job) => {
        console.log(`Processing job ${job.id}:`, job.data);
        
        const notification = Notification.fromJSON(job.data.eventData);
        const userPreferences = await this.getUserPreferences(notification.userId);
        
        if (!userPreferences) {
          throw new Error(`User preferences not found: ${notification.userId}`);
        }
        
        await this.notificationService.send(notification, userPreferences);
        
        return { delivered: true, timestamp: new Date() };
      },
      {
        connection: this.redisClient,
        concurrency: 10, // Process 10 notifications in parallel
        maxStalledCount: 2
      }
    );
    
    // Worker for digest notifications
    new Worker(
      'digests',
      async (job) => {
        console.log(`Processing digest job ${job.id}`);
        await this.notificationService.scheduleDigestNotifications();
        return { processed: true };
      },
      {
        connection: this.redisClient,
        concurrency: 2
      }
    );
  }
  
  private mapPriorityToNumber(priority: string): number {
    const mapping: Record<string, number> = {
      'high': 1,
      'normal': 5,
      'low': 10
    };
    return mapping[priority] || 5;
  }
}
```

### Retry & Failure Handling

```typescript
// Retry policies per channel
const RETRY_POLICIES = {
  browser_push: {
    maxRetries: 3,
    backoffMs: [1000, 5000, 15000],
    failureAction: 'log' // If browser push fails, don't retry via other channels
  },
  email: {
    maxRetries: 5,
    backoffMs: [2000, 5000, 30000, 60000, 300000],
    failureAction: 'queue_for_manual_review' // Email failure needs manual intervention
  },
  in_app_toast: {
    maxRetries: 0, // No retries; if user not in app, notification is lost
    failureAction: 'ignore'
  },
  sound: {
    maxRetries: 0, // No retries
    failureAction: 'ignore'
  }
};

// Enhanced queue job error handling
queueWorker.on('failed', async (job, error) => {
  const notification = Notification.fromJSON(job.data.eventData);
  
  console.error(`Job ${job.id} failed:`, error.message);
  
  // Log failure for analytics
  await notificationRepository.logDeliveryFailure({
    notificationId: notification.id,
    userId: notification.userId,
    eventType: notification.eventType,
    error: error.message,
    attemptNumber: job.attemptsMade,
    timestamp: new Date()
  });
  
  // If max retries exceeded, trigger fallback
  if (job.attemptsMade >= job.opts.attempts) {
    await this.handleNotificationExhaustion(notification);
  }
});

async function handleNotificationExhaustion(notification: Notification): Promise<void> {
  // For critical notifications (reminders), queue for email as fallback
  if (notification.eventType === 'reminder_triggered') {
    await emailService.sendDirectEmail({
      to: user.email,
      subject: notification.title,
      body: notification.body
    });
  }
  
  // Log for ops team review
  await opsAuditLog.log({
    type: 'notification_delivery_failed',
    notificationId: notification.id,
    userId: notification.userId,
    action: 'requires_manual_review'
  });
}
```

---

## 4. Implementation Patterns

### Pattern 1: Reminder Notification (Immediate)

```typescript
// Trigger: Reminder scheduled time reached (via cron or time-based service)

async function deliverReminderNotification(reminderId: string, userId: string): Promise<void> {
  const reminder = await reminderRepository.findById(reminderId);
  
  if (!reminder) {
    console.error(`Reminder not found: ${reminderId}`);
    return;
  }
  
  const notification = new Notification({
    id: generateId(),
    userId,
    eventType: 'reminder_triggered',
    title: reminder.name,
    body: `Time for your habit: ${reminder.name}`,
    resourceType: 'reminder',
    resourceId: reminderId,
    resourceUrl: `/reminders/${reminderId}`,
    action: { type: 'complete', label: 'Mark Complete' },
    bypassQuietHours: true // Reminders bypass quiet hours
  });
  
  // Immediate delivery (not queued)
  await notificationService.notifyImmediately(notification);
}
```

**Resulting Behavior**:
- User sees immediate in-app toast
- Browser push sent (if enabled and user has SW)
- Sound played (if enabled)
- Email NOT sent (not configured for reminders in event-type mapping)

---

### Pattern 2: Task Due Soon (Queue-Based with Timing)

```typescript
// Trigger: Task lifecycle event → 24 hours before due date

async function onTaskCreatedOrUpdated(task: Task): Promise<void> {
  if (!task.dueDate || task.status === 'completed') {
    return;
  }
  
  const hoursUntilDue = (task.dueDate.getTime() - Date.now()) / (60 * 60 * 1000);
  
  if (hoursUntilDue > 24 && hoursUntilDue < 48) {
    // Schedule notification for exactly 24 hours before due
    const delayMs = (hoursUntilDue - 24) * 60 * 60 * 1000;
    
    const notification = new Notification({
      id: generateId(),
      userId: task.userId,
      eventType: 'task_due_soon',
      title: `Task Due Soon: ${task.title}`,
      body: `Your task "${task.title}" is due on ${task.dueDate.toLocaleDateString()}`,
      resourceType: 'task',
      resourceId: task.id,
      resourceUrl: `/tasks/${task.id}`,
      action: { type: 'view', label: 'View Task' }
    });
    
    await notificationService.queueNotification(notification, {
      delay: delayMs,
      retries: 3
    });
    
    console.log(`Queued task deadline notification: ${notification.id}, sending in ${delayMs}ms`);
  }
}
```

**Resulting Behavior**:
- Notification created and persisted to DB
- Queued in Bull with delay until 24 hours before deadline
- When delay expires: browser push sent, email sent (if user has email notifications enabled)
- If delivery fails: retried up to 3 times with exponential backoff

---

### Pattern 3: Daily Digest (Scheduled/Batched)

```typescript
// Trigger: Cron job at 08:00 AM daily

async function sendDailyDigests(): Promise<void> {
  const users = await userRepository.findAllWithDigestEnabled('daily');
  
  const results = [];
  
  for (const user of users) {
    const preferences = await userPreferencesRepository.findByUserId(user.id);
    
    // Collect notifications from last 24 hours
    const notifications = await notificationRepository.findByUserAndDateRange(
      user.id,
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date(),
      { sentStatus: 'sent' }  // Include only actually sent notifications
    );
    
    if (notifications.length === 0) {
      continue;
    }
    
    // Group by type
    const grouped = notifications.reduce((acc, n) => {
      const type = n.eventType;
      acc[type] = (acc[type] || []).concat(n);
      return acc;
    }, {} as Record<string, Notification[]>);
    
    // Create digest notification
    const digestNotification = new Notification({
      id: generateId(),
      userId: user.id,
      eventType: 'daily_digest',
      title: `Daily Summary - ${new Date().toLocaleDateString()}`,
      body: renderDigestTemplate(grouped, user),
      resourceType: 'digest',
      metadata: {
        notificationIds: notifications.map(n => n.id),
        summary: Object.keys(grouped).map(type => `${type}: ${grouped[type].length}`)
      }
    });
    
    // Queue for email delivery (primary channel for digests)
    await notificationService.queueNotification(digestNotification, {
      priority: 'low',
      retries: 5
    });
    
    results.push({ userId: user.id, notificationCount: notifications.length });
  }
  
  console.log(`Daily digest sent to ${results.length} users`);
  return results;
}

function renderDigestTemplate(
  grouped: Record<string, Notification[]>,
  user: User
): string {
  const date = new Date();
  const html = `
    <html>
      <head><style>body { font-family: Arial; }</style></head>
      <body>
        <h2>Your Daily Summary - ${date.toLocaleDateString()}</h2>
        <p>Hello ${user.name},</p>
        
        <p>Here's what happened in your DailyUse workspace:</p>
        
        <ul>
          ${Object.entries(grouped).map(([type, items]) => `
            <li><strong>${formatEventType(type)}</strong>: ${items.length} update${items.length !== 1 ? 's' : ''}</li>
          `).join('')}
        </ul>
        
        <a href="${process.env.APP_URL}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
          View Your Dashboard
        </a>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          You can manage your notification preferences in your account settings.
        </p>
      </body>
    </html>
  `;
  
  return html;
}
```

**Resulting Behavior**:
- Cron triggers at 8 AM in user's timezone
- All notifications from past 24 hours aggregated
- Digest email queued for delivery
- If user is in quiet hours, deferral logic prevents immediate delivery

---

## 5. Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  
  resource_type VARCHAR(50) NOT NULL,  -- 'task', 'reminder', 'goal', 'digest'
  resource_id VARCHAR(36),              -- Reference to task/reminder/goal/etc
  resource_url VARCHAR(500),            -- Direct link for quick action
  
  action_type VARCHAR(50),              -- 'view', 'complete', 'mark_read'
  action_label VARCHAR(100),
  
  metadata JSON,                        -- Extensible for event-specific data
  
  status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Track delivery per channel
CREATE TABLE notification_deliveries (
  id VARCHAR(36) PRIMARY KEY,
  notification_id VARCHAR(36) NOT NULL,
  channel_name VARCHAR(50) NOT NULL,  -- 'browser_push', 'email', 'in_app_toast', 'sound'
  
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  error_message TEXT,
  error_code VARCHAR(50),
  
  attempt_count INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  message_id VARCHAR(255),            -- For email: SendGrid message ID
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_delivery (notification_id, channel_name),
  INDEX idx_status (status)
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- Channel enablement
  browser_push_enabled BOOLEAN DEFAULT TRUE,
  in_app_toast_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT FALSE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,              -- HH:MM format, e.g., 22:00
  quiet_hours_end TIME,                -- HH:MM format, e.g., 08:00
  quiet_hours_batch_email BOOLEAN DEFAULT TRUE,
  
  -- Frequency control
  max_notifications_per_hour INT DEFAULT 0,  -- 0 = unlimited
  duplicate_suppression_window_ms INT DEFAULT 5000,
  
  -- Digest preferences
  digest_frequency ENUM('daily', 'weekly', 'never') DEFAULT 'never',
  digest_time TIME DEFAULT '08:00',    -- When to send digest
  
  -- Timezone
  timezone VARCHAR(50),                -- e.g., 'America/New_York', defaults to browser TZ
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Per-event-type channel routing (new in Phase 2)
CREATE TABLE notification_event_routing (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,  -- 'reminder_triggered', 'task_due_soon', etc.
  
  channels JSON NOT NULL,           -- ['browser_push', 'sound'] serialized array
  bypass_quiet_hours BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_routing (user_id, event_type)
);

-- Audit log for delivery failures/analytics
CREATE TABLE notification_delivery_logs (
  id VARCHAR(36) PRIMARY KEY,
  notification_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  
  channels_attempted JSON,            -- Which channels were attempted
  delivery_results JSON,              -- Results per channel
  
  total_duration_ms INT,              -- How long from trigger to completion
  
  log_level ENUM('info', 'warning', 'error') DEFAULT 'info',
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (notification_id) REFERENCES notifications(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);
```

### OKR Progress Tracking Schema

```sql
ALTER TABLE key_results ADD COLUMN (
  auto_progress_enabled BOOLEAN DEFAULT FALSE,
  calculation_method ENUM('manual', 'auto') DEFAULT 'manual',
  last_auto_calculation_at TIMESTAMP
);

-- View for dashboard display
CREATE VIEW key_result_progress_analysis AS
SELECT 
  kr.id,
  kr.goal_id,
  kr.title,
  kr.progress as manual_progress,
  kr.auto_progress_enabled,
  COALESCE(
    ROUND(100 * COUNT(CASE WHEN t.status = 'completed' THEN 1 END) 
      / NULLIF(COUNT(t.id), 0)), 0
  ) as auto_progress,
  COUNT(t.id) as total_linked_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  kr.updated_at
FROM key_results kr
LEFT JOIN tasks t ON t.key_result_id = kr.id
GROUP BY kr.id;
```

---

## 6. Configuration Examples

### Environment Variables

```bash
# Notification Service Configuration
NOTIFICATION_SERVICE_ENABLED=true
NOTIFICATION_QUEUE_PROVIDER=bull  # Options: bull, rabbitmq, kafka
NOTIFICATION_QUEUE_REDIS_URL=redis://localhost:6379

# Channel Configuration
NOTIFICATION_BROWSER_PUSH_ENABLED=true
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_PROVIDER=sendgrid  # Options: sendgrid, mailgun, aws-ses, smtp
NOTIFICATION_EMAIL_FROM=noreply@dailyuse.app

# Email Provider Credentials
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@dailyuse.app
SENDGRID_FROM_NAME=DailyUse

# Retry & Delivery Settings
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_BACKOFF_INITIAL_MS=1000
NOTIFICATION_RETRY_BACKOFF_MULTIPLIER=2
NOTIFICATION_DEDUP_WINDOW_MS=5000

# Digest Settings
NOTIFICATION_DAILY_DIGEST_ENABLED=true
NOTIFICATION_DAILY_DIGEST_HOUR=8  # 8 AM
NOTIFICATION_DIGEST_TIMEZONE=America/New_York

# Monitoring
NOTIFICATION_ERROR_LOGGING_ENABLED=true
NOTIFICATION_PERFORMANCE_TRACKING_ENABLED=true
```

### Application Configuration (TypeScript)

```typescript
// src/config/notification.config.ts

interface NotificationConfig {
  service: {
    enabled: boolean;
    defaultTimeout: number;  // ms
    maxConcurrentDeliveries: number;
  };
  
  channels: {
    browserPush: { enabled: boolean; };
    inAppToast: { enabled: boolean; };
    email: {
      enabled: boolean;
      provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'smtp';
      retries: number;
      timeout: number;  // ms
    };
    sound: { enabled: boolean; };
  };
  
  queue: {
    provider: 'bull' | 'rabbitmq' | 'kafka';
    redis?: { url: string; };
    defaultJobOptions: {
      attempts: number;
      backoff: { type: 'exponential'; delay: number; };
      removeOnComplete: boolean;
    };
  };
  
  deduplication: {
    enabled: boolean;
    windowMs: number;
  };
  
  digest: {
    enabled: boolean;
    scheduleHour: number;  // 0-23
    maxNotificationsPerDigest: number;
  };
  
  monitoring: {
    errorLogging: boolean;
    performanceTracking: boolean;
    auditLogging: boolean;
  };
}

export const notificationConfig: NotificationConfig = {
  service: {
    enabled: env.NOTIFICATION_SERVICE_ENABLED === 'true',
    defaultTimeout: 30000,
    maxConcurrentDeliveries: 10
  },
  
  channels: {
    browserPush: {
      enabled: env.NOTIFICATION_BROWSER_PUSH_ENABLED === 'true'
    },
    inAppToast: {
      enabled: true  // Always enabled as fallback
    },
    email: {
      enabled: env.NOTIFICATION_EMAIL_ENABLED === 'true',
      provider: env.NOTIFICATION_EMAIL_PROVIDER as any,
      retries: parseInt(env.NOTIFICATION_MAX_RETRIES) || 3,
      timeout: 30000
    },
    sound: {
      enabled: env.NOTIFICATION_SOUND_ENABLED === 'true'
    }
  },
  
  queue: {
    provider: (env.NOTIFICATION_QUEUE_PROVIDER || 'bull') as any,
    redis: env.NOTIFICATION_QUEUE_REDIS_URL
      ? { url: env.NOTIFICATION_QUEUE_REDIS_URL }
      : undefined,
    defaultJobOptions: {
      attempts: parseInt(env.NOTIFICATION_MAX_RETRIES) || 3,
      backoff: {
        type: 'exponential',
        delay: parseInt(env.NOTIFICATION_RETRY_BACKOFF_INITIAL_MS) || 1000
      },
      removeOnComplete: true
    }
  },
  
  deduplication: {
    enabled: true,
    windowMs: parseInt(env.NOTIFICATION_DEDUP_WINDOW_MS) || 5000
  },
  
  digest: {
    enabled: env.NOTIFICATION_DAILY_DIGEST_ENABLED === 'true',
    scheduleHour: parseInt(env.NOTIFICATION_DAILY_DIGEST_HOUR) || 8,
    maxNotificationsPerDigest: 50
  },
  
  monitoring: {
    errorLogging: env.NOTIFICATION_ERROR_LOGGING_ENABLED === 'true',
    performanceTracking: env.NOTIFICATION_PERFORMANCE_TRACKING_ENABLED === 'true',
    auditLogging: true
  }
};
```

### Dependency Injection Setup

```typescript
// src/infrastructure/notification/notification.module.ts

import { Container } from 'awilix';
import { NotificationService } from './notification.service';
import { NotificationChannelRegistry } from './channels/registry';
import { BrowserPushChannel } from './channels/browser-push.channel';
import { InAppToastChannel } from './channels/in-app-toast.channel';
import { EmailChannel } from './channels/email.channel';
import { SoundChannel } from './channels/sound.channel';
import { QueueService } from './queue/queue.service';
import { NotificationRepository } from './repositories/notification.repository';

export function setupNotificationModule(container: Container): void {
  // Register channels
  container.register({
    browserPushChannel: asClass(BrowserPushChannel).singleton(),
    inAppToastChannel: asClass(InAppToastChannel).singleton(),
    emailChannel: asClass(EmailChannel).singleton(),
    soundChannel: asClass(SoundChannel).singleton(),
    
    // Registry
    channelRegistry: asClass(NotificationChannelRegistry).singleton().inject({
      channels: (c) => [
        c.resolve('browserPushChannel'),
        c.resolve('inAppToastChannel'),
        c.resolve('emailChannel'),
        c.resolve('soundChannel')
      ]
    }),
    
    // Queue
    queueService: asClass(QueueService).singleton().inject({
      config: asValue(notificationConfig.queue)
    }),
    
    // Repository
    notificationRepository: asClass(NotificationRepository).singleton(),
    
    // Main service
    notificationService: asClass(NotificationService).singleton()
  });
}
```

### HTTP Routes (Express)

```typescript
// src/infrastructure/notification/routes/notification.routes.ts

import express from 'express';
import { NotificationController } from '../controllers/notification.controller';

export function createNotificationRoutes(
  notificationController: NotificationController
): express.Router {
  const router = express.Router();
  
  // Get user's notifications
  router.get(
    '/notifications',
    authenticate,
    notificationController.getNotifications
  );
  
  // Mark notification as read
  router.put(
    '/notifications/:id/read',
    authenticate,
    notificationController.markAsRead
  );
  
  // Get user preferences
  router.get(
    '/notifications/preferences',
    authenticate,
    notificationController.getPreferences
  );
  
  // Update user preferences
  router.put(
    '/notifications/preferences',
    authenticate,
    validate(UpdateNotificationPreferencesSchema),
    notificationController.updatePreferences
  );
  
  // Test notification (for development)
  router.post(
    '/notifications/test',
    authenticate,
    notificationController.sendTestNotification
  );
  
  // Subscribe to SSE notifications
  router.get(
    '/notifications/stream',
    authenticate,
    notificationController.subscribeToNotifications
  );
  
  return router;
}
```

### Service Worker Registration (Client)

```typescript
// src/services/notification/notification-service.ts

export class NotificationService {
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }
    
    if (!('PushManager' in window)) {
      console.warn('Push Notifications not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration);
      
      // Subscribe to push (if not already subscribed)
      await this.subscribeToPush(registration);
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  private async subscribeToPush(registration: ServiceWorkerRegistration): Promise<void> {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Already subscribed to push');
      return;
    }
    
    // Request permission and subscribe
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }
    
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        process.env.VUE_APP_VAPID_PUBLIC_KEY!
      )
    });
    
    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSubscription.toJSON())
    });
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Initialize on app startup
export const notificationService = new NotificationService();
notificationService.initialize();
```

---

## Summary of Recommendations

| Area | Recommendation | MVP Phase | Post-MVP |
|------|---|---|---|
| **OKR Sync** | Hybrid manual + auto-optional | Manual only | Auto aggregation |
| **Notification Channels** | 4 channels (browser push, in-app, email, sound) | In-app + browser push | Email + sound |
| **Queue Implementation** | Bull + Redis | Direct dispatch first | Queue-based with Bull |
| **Retry Strategy** | Exponential backoff, 3 attempts | Basic | Advanced per-channel policies |
| **Digest Notifications** | Email digest scheduled daily | Optional/Phase 2 | Customizable frequency |
| **User Preferences** | Basic on/off per channel | On/off only | Per-event routing, quiet hours |
| **Extensibility** | Plugin-based channel system | Foundation only | Full implementation |

---

**Document Version**: 1.0  
**Status**: Ready for Implementation  
**Next Steps**: Create implementation task tickets, establish code review process, set up testing framework for notification delivery
