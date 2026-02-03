# Architecture Diagrams: DailyUse Notification & OKR System

## 1. OKR Progress Synchronization - Hybrid Model

```
┌─────────────────────────────────────────────────────────────┐
│                    User Updates Task Status                 │
│                     (Task → Completed)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  TaskService Event  │
        │   task.completed    │
        └────────┬────────────┘
                 │
        ┌────────▼──────────┐
        │ KeyResultService  │
        │  onTaskCompleted  │
        └────────┬──────────┘
                 │
        ┌────────▼──────────────────────┐
        │  Check KR Sync Settings:      │
        │  - auto_enabled?              │
        │  - calculation_method?        │
        └─────┬──────────────┬──────────┘
              │              │
     ┌────────▼────┐  ┌──────▼────────┐
     │ MANUAL MODE │  │   AUTO MODE   │
     │ (Default)   │  │  (Optional)   │
     └────┬────────┘  └───┬───────────┘
          │               │
     ┌────▼────────┐  ┌───▼──────────┐
     │ Preserve    │  │ Calculate:   │
     │ User's      │  │ completed/   │
     │ Explicit    │  │ total × 100  │
     │ Progress    │  │              │
     │ Value       │  │ = auto_prog  │
     └────┬────────┘  └───┬──────────┘
          │               │
     ┌────▼────────────────▼────────────┐
     │   Save KeyResult:                │
     │   - progress (user-set value)    │
     │   - auto_progress (calculated)   │
     │   - updated_at timestamp         │
     └────┬─────────────────────────────┘
          │
          ▼
    ┌─────────────────┐
    │ Dashboard View  │
    │ Shows Both      │
    │ Metrics:        │
    │ ✓ Manual: 75%   │
    │ ✓ Auto: 80%     │
    │ (linked tasks)  │
    └─────────────────┘
```

### Decision Flow: Task → KR Progress Update

```
                    ┌─────────────────────────────┐
                    │  Task Completed Event       │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │ Has parent KR linked?   │
                    └──┬─────────────────┬────┘
                   YES │                 │ NO
                       │                 └────────┐
                       ▼                          │
           ┌─────────────────────────┐           │
           │ Load KR config:         │           │
           │ auto_progress_enabled?  │           │
           └──┬─────────────────┬────┘           │
            T │                 │ F              │
              ▼                 ▼                ▼
        ┌──────────────┐  ┌──────────────┐  (no action)
        │ Recalculate  │  │ Keep manual  │
        │ auto_progress│  │ progress as- │
        │ from all     │  │ is, user can │
        │ linked tasks │  │ edit anytime │
        └──┬───────────┘  └──────┬───────┘
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ Notify Dashboard:    │
           │ KR progress updated  │
           │ Goal agg recalc      │
           └──────────────────────┘
```

---

## 2. Notification Delivery Architecture

### Complete Flow: From Event to User

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              NOTIFICATION LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                EVENT TRIGGER LAYER
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│ │ Task Service   │  │ Reminder Svc   │  │ Goal Service   │  │ Cron Scheduler   │  │
│ │  - task due    │  │  - time        │  │  - milestone   │  │  - digest timer  │  │
│ │  - complete    │  │    reached     │  │  - achieved    │  │                  │  │
│ └────────┬───────┘  └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘  │
│          │                   │                   │                   │            │
└──────────┼───────────────────┼───────────────────┼───────────────────┼────────────┘
           │                   │                   │                   │
           └───────────────────┼───────────────────┼───────────────────┘
                               │
                        ┌──────▼──────────┐
                        │ Domain Events   │
                        │ (EventEmitter)  │
                        └──────┬──────────┘
                               │

                        NOTIFICATION SERVICE LAYER
┌──────────────────────────────────────────────────────────────────────────────────────┐
│              ┌─────────────────────────────────────────────────┐                    │
│              │  NotificationService.handle(event)             │                    │
│              └──────────────┬────────────────────────────────┘                    │
│                             │                                                      │
│              ┌──────────────▼──────────────┐                                      │
│              │ Create Notification object  │                                      │
│              │ - id, userId, eventType    │                                      │
│              │ - title, body              │                                      │
│              │ - resourceId, resourceUrl  │                                      │
│              │ - action, metadata         │                                      │
│              └──────────────┬──────────────┘                                      │
│                             │                                                      │
│              ┌──────────────▼──────────────────────────┐                         │
│              │ Get UserNotificationPreferences         │                         │
│              │ - enabled channels                      │                         │
│              │ - quiet hours config                    │                         │
│              │ - frequency limits                      │                         │
│              └──────────────┬───────────────┬──────────┘                         │
│                             │               │                                    │
│        ┌────────────────────┼───────────────┘                                    │
│        │                    │                                                    │
│        │ DISPATCH DECISION  │                                                    │
│        │                    │                                                    │
│        └────────┬───────────┴───────────────┐                                   │
│                 │                           │                                   │
│  ┌──────────────▼──────────────┐  ┌─────────▼──────────────────┐               │
│  │ Immediate Delivery?         │  │ Defer to Queue?            │               │
│  │ - reminder_triggered        │  │ - quiet hours enabled      │               │
│  │ - bypassQuietHours=true     │  │ - frequency limits         │               │
│  │ - in-app & browser push     │  │ - batch digest             │               │
│  └──────────────┬──────────────┘  └─────────┬──────────────────┘               │
│                 │                            │                                 │
└─────────────────┼────────────────────────────┼─────────────────────────────────┘
                  │                            │
                  │                            ▼
                  │                  ┌──────────────────┐
                  │                  │  Queue Service   │
                  │                  │  (Bull + Redis)  │
                  │                  └────────┬─────────┘
                  │                           │
                  │                ┌──────────▼────────────┐
                  │                │ Add Job to Queue      │
                  │                │ - delay (if needed)   │
                  │                │ - priority            │
                  │                │ - retries config      │
                  │                └──────────┬────────────┘
                  │                           │
                  ▼                           ▼
      ┌───────────────────────┐   ┌─────────────────────┐
      │  PERSISTENCE LAYER    │   │  QUEUE PROCESSOR    │
      │                       │   │  (Bull Worker)      │
      │ Save to:              │   │                     │
      │ - notifications       │   │ When job triggers:  │
      │ - notification_del    │   │ - Get notification  │
      │   iveries            │   │ - Load preferences  │
      │ - delivery_logs       │   │ - Route to channels │
      │                       │   │ - Log delivery      │
      └───────┬───────────────┘   └────────┬────────────┘
              │                            │
              └────────────────┬───────────┘
                               │
                        CHANNEL ROUTING LAYER
        ┌──────────────────────▼──────────────────────┐
        │ Channel Registry decides delivery           │
        │ Based on event_type → configured channels  │
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                              │
        ▼                                              ▼
    ┌─────────────────────────┐                ┌──────────────────────┐
    │   IMMEDIATE CHANNELS    │                │  ASYNC CHANNELS      │
    │ (In-process)            │                │ (External services)  │
    │                         │                │                      │
    │ ┌───────────────────┐   │                │ ┌──────────────────┐ │
    │ │ InAppToast        │   │                │ │ Email            │ │
    │ │ - Dispatch to     │   │                │ │ - SendGrid API   │ │
    │ │   Pinia store     │   │                │ │ - Mailgun API    │ │
    │ │ - Toast shows     │   │                │ │ - AWS SES        │ │
    │ │   in browser      │   │                │ │ - SMTP           │ │
    │ │ Duration: 5s      │   │                │ │ - Retries: 5x    │ │
    │ │                   │   │                │ └──────────────────┘ │
    │ ├───────────────────┤   │                │                      │
    │ │ BrowserPush       │   │                │ ┌──────────────────┐ │
    │ │ - Via Service     │   │                │ │ Sound            │ │
    │ │   Worker          │   │                │ │ - Web Audio API  │ │
    │ │ - Push Mgr API    │   │                │ │ - Client-side    │ │
    │ │ - Retries: 3x     │   │                │ │ - No retry       │ │
    │ │                   │   │                │ └──────────────────┘ │
    │ ├───────────────────┤   │                │                      │
    │ │ Sound             │   │                │ ┌──────────────────┐ │
    │ │ - Audio playback  │   │                │ │ SMS (Future)     │ │
    │ │ - Quiet hours OK  │   │                │ │ - Twilio API     │ │
    │ │ - No retry        │   │                │ │ - Retries: 3x    │ │
    │ └───────────────────┘   │                │ └──────────────────┘ │
    │                         │                │                      │
    └────────┬────────────────┘                └──────────┬───────────┘
             │                                            │
             └─────────────────────┬──────────────────────┘
                                   │

                        DELIVERY & TRACKING LAYER
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │ For each channel attempt:                                                    │   │
│  │ 1. Try to deliver (call channel.send())                                     │   │
│  │ 2. Log result (success, error, timestamp)                                   │   │
│  │ 3. Update notification_deliveries table                                     │   │
│  │ 4. If failure: Trigger retry logic (exponential backoff)                    │   │
│  │ 5. If exhausted: Log to ops_audit_log, mark failed                         │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  Database Updates:                                                                 │
│  - notifications table: status = 'sent' | 'delivered' | 'failed'                   │
│  - notification_deliveries: per-channel status, message IDs, error codes           │
│  - notification_delivery_logs: full audit trail for analytics                      │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Queue Architecture: Bull + Redis

```
                        ┌───────────────────────┐
                        │  Notification Events  │
                        │  (Various Sources)    │
                        └───────────┬───────────┘
                                    │
                          ┌─────────▼──────────┐
                          │ Enqueue Decision   │
                          │ - Immediate? Queue?│
                          └──────┬──────┬──────┘
                          YES    │      │ NO
                                 │      └──────────────────┐
                                 ▼                         │
                    ┌────────────────────────┐            │
                    │ Bull Queue             │            │
                    │ (notifications-queue)  │            │
                    │                        │            │
                    │ Configuration:         │            │
                    │ - Concurrency: 10      │            │
                    │ - Attempts: 3-5        │            │
                    │ - Backoff: exponential │            │
                    │ - Timeout: 30s         │            │
                    └────────┬────────────────┘            │
                             │                             │
                 ┌───────────┼───────────┐                │
                 │           │           │                │
            ┌────▼────┐  ┌────▼────┐  ┌─▼──────┐        │
            │ PENDING  │  │ ACTIVE  │  │ FAILED │        │
            │ (awaiting│  │(process)│  │(retry) │        │
            │ concurr) │  │         │  │ (3x)   │        │
            └────┬─────┘  └────┬────┘  └───┬────┘        │
                 │             │            │             │
                 ▼             ▼            ▼             │
            ┌────────────────────────────────────────┐   │
            │   Bull Worker Processing               │   │
            │  (async/await, error handling)         │   │
            │                                        │   │
            │  1. Fetch job from queue               │   │
            │  2. Load notification & preferences    │   │
            │  3. Route to channels                  │   │
            │  4. Collect results                    │   │
            │  5. Log delivery                       │   │
            │  6. Mark job complete or retry         │   │
            └────────────┬─────────────────────────┘   │
                         │                              │
                    ┌────▼────────────────────────┐    │
                    │ Success?                    │    │
                    └────┬────────────┬───────────┘    │
                      YES│            │NO               │
                         │            │                │
                ┌────────▼─┐  ┌───────▼──────┐        │
                │ Complete │  │ Retry count? │        │
                │ Job      │  └───┬──────┬───┘        │
                │ Mark as  │  Max │      │ Keep      │
                │ 'sent'   │      │      │ retrying  │
                └────┬─────┘  ┌───▼──┐  │            │
                     │        │ Reque│  │            │
                     │        │ue w/ │  │            │
                     │        │delay │  │            │
                     │        └──┬───┘  │            │
                     │           │      │            │
                     └───────────┬──────┴────────────┘
                                 │
                      ┌──────────▼─────────┐
                      │ Persistence       │
                      │ (Database Logs)   │
                      │ - Save result     │
                      │ - Update status   │
                      │ - Log analytics   │
                      └───────────────────┘

REDIS STORAGE:
┌────────────────────────────────────────────────────┐
│ notifications-queue:   (Sorted set of pending jobs)│
│ notifications-queue:active                         │
│ notifications-queue:failed                         │
│ notifications-queue:completed                      │
│                                                    │
│ job:<job-id>:data     (Job details)               │
│ job:<job-id>:state    (current state)             │
│ job:<job-id>:progress (if tracked)                │
└────────────────────────────────────────────────────┘
```

---

## 3. User Preference Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│           User Notification Settings Page                   │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴────────────────────┐
        │                                        │
        ▼                                        ▼
    ┌─────────────────┐              ┌───────────────────┐
    │ Channel Toggle  │              │ Quiet Hours Setup │
    │ Section         │              │ Section           │
    ├─────────────────┤              ├───────────────────┤
    │ ☑ Browser Push  │              │ ☑ Enable Quiet H  │
    │ ☑ In-App Toast  │              │   From: [22:00]   │
    │ ☐ Email         │              │   To:   [08:00]   │
    │ ☐ Sound         │              │ ☑ Batch emails    │
    └────┬────────────┘              └─────┬─────────────┘
         │                                  │
         └──────────────────┬───────────────┘
                            │
                  ┌─────────▼──────────┐
                  │ Per-Event Routing  │
                  │ (Advanced Tab)     │
                  ├────────────────────┤
                  │ Reminder Triggered │
                  │ ☑ Browser Push     │
                  │ ☑ Sound            │
                  │ ☐ Email            │
                  │ □ Bypass Quiet H   │
                  ├────────────────────┤
                  │ Task Due Soon      │
                  │ ☑ Browser Push     │
                  │ ☐ Sound            │
                  │ ☑ Email            │
                  │ □ Bypass Quiet H   │
                  ├────────────────────┤
                  │ Goal Milestone     │
                  │ ☑ In-App Toast     │
                  │ ☑ Email            │
                  │ ☐ Sound            │
                  │ ☑ Bypass Quiet H   │
                  └────────┬───────────┘
                           │
                 ┌─────────▼──────────┐
                 │ Frequency Control  │
                 ├────────────────────┤
                 │ Max per hour: [10▼]│
                 │ Digest: [Daily   ▼]│
                 │ Digest time: [8:00]│
                 └────────┬───────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ [Save Preferences]│
                 │ [Test Notification]
                 └────┬─────────────┘
                      │
            ┌─────────▼──────────┐
            │ Update API Call    │
            │ PUT /preferences   │
            │ {                  │
            │   browser_push...  │
            │   quiet_hours...   │
            │   event_routing... │
            │ }                  │
            └─────────┬──────────┘
                      │
            ┌─────────▼──────────┐
            │ Database Update    │
            │ - preferences      │
            │ - event_routing    │
            └─────────┬──────────┘
                      │
            ┌─────────▼──────────┐
            │ Cache Invalidation │
            │ (Redis, if used)   │
            └──────────────────┘
```

---

## 4. Quiet Hours & Deferred Delivery

```
                        ┌──────────────────┐
                        │ Notification     │
                        │ Event Triggered  │
                        └────────┬─────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │ Check Quiet Hours Config │
                    │ enabled = true?          │
                    └──┬────────────┬──────────┘
                      Y│            │N
                       │            │
                  ┌────▼────┐  ┌───▼────────────┐
                  │ Current  │  │ Send           │
                  │ time in  │  │ immediately    │
                  │ quiet?   │  │ (all channels) │
                  └───┬──────┘  └────────────────┘
                      │
                    ┌─┴──┐
                   Y│    │N
                    │    └──────────────┐
                    │                   │ (not in quiet hours)
                    ▼                   │ Send now
           ┌────────────────┐          │
           │ Event Type     │          │
           │ bypass_quiet?  │          │
           └────┬───────────┘          │
               Y│    N                 │
                │    │                 │
            ┌───▼─┐┌─▼────────────────────┐
            │Send ││ Queue for later:     │
            │now  ││ - Store in queue DB  │
            │     ││ - Set delay = time   │
            │     ││   until quiet ends   │
            │     ││ + batch window       │
            │     ││                      │
            │     ││ Example: 22:00-08:00 │
            │     ││ Event at 23:30       │
            │     ││ Quiet ends at 08:00  │
            │     ││ Batch until 08:05    │
            │     ││ (5min window)        │
            └─────┘└────────┬─────────────┘
                            │
                   ┌────────▼──────────┐
                   │ At Quiet Hours End│
                   │ Time Reached      │
                   └────────┬──────────┘
                            │
                   ┌────────▼──────────┐
                   │ Collect all       │
                   │ queued notif from │
                   │ quiet period      │
                   └────────┬──────────┘
                            │
                   ┌────────▼──────────┐
                   │ Option 1: Send    │
                   │ individually      │
                   │ (restore on batch)│
                   │                   │
                   │ Option 2: Create  │
                   │ digest email of   │
                   │ all events        │
                   │ (batch delivery)  │
                   └────────┬──────────┘
                            │
                   ┌────────▼──────────┐
                   │ Deliver per       │
                   │ user channel pref │
                   │ (browser push,    │
                   │  email, etc)      │
                   └──────────────────┘
```

---

## 5. Event Type to Channel Mapping Matrix

```
┌──────────────────────┬──────────┬──────────┬────────┬────────┬─────────────────────┐
│ Event Type           │ Browser  │ In-App   │ Email  │ Sound  │ Bypass Quiet Hours? │
│                      │ Push     │ Toast    │        │        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ reminder_triggered   │ PRIMARY  │ SECONDARY│ NONE   │ OPT-IN │ YES (imminent)      │
│ (time reached)       │ < 1s     │ instant  │        │        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ task_due_soon        │ PRIMARY  │ SECONDARY│ OPT-IN │ NONE   │ NO (24h ahead)      │
│ (24h before)         │ < 5s     │ instant  │        │        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ task_overdue         │ PRIMARY  │ SECONDARY│ OPT-IN │ NONE   │ NO (escalation)     │
│ (past deadline)      │ < 5s     │ instant  │        │        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ goal_milestone       │ SECONDARY│ PRIMARY  │ OPT-IN │ NONE   │ YES (celebrate!)    │
│ (50%, 75%, 100%)     │ optional │ prominent│        │        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ daily_digest         │ NONE     │ OPTIONAL │ PRIMARY│ NONE   │ NO (morning only)   │
│ (summary 8 AM)       │          │          │ default│        │                     │
├──────────────────────┼──────────┼──────────┼────────┼────────┼─────────────────────┤
│ weekly_digest        │ NONE     │ OPTIONAL │ PRIMARY│ NONE   │ NO (weekend)        │
│ (summary)            │          │          │ default│        │                     │
└──────────────────────┴──────────┴──────────┴────────┴────────┴─────────────────────┘

LEGEND:
- PRIMARY: Default/recommended channel for this event
- SECONDARY: Alternate channel if primary unavailable
- OPT-IN: User must explicitly enable this channel for this event type
- NONE: Not applicable for this event type
- Bypass Quiet Hours: YES = notify even during quiet hours; NO = respect quiet hours
```

---

## 6. Database Schema Relationship Diagram

```
                    ┌─────────────────┐
                    │     Users       │
                    │─────────────────│
                    │ id (PK)         │
                    │ email           │
                    │ name            │
                    │ timezone        │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌──────────┐  ┌──────────────────┐  ┌────────────────┐
    │Reminders │  │NotificationPrefs │  │Notifications   │
    └────┬─────┘  └────────┬─────────┘  └────────┬───────┘
         │ 1:N              │ 1:1                 │ 1:N
         │                  │                     │
    ┌────▼──────────────────▼─────────────────────▼───┐
    │   NotificationChannelRegistry                   │
    │   (in-memory)                                   │
    │                                                 │
    │  browserPush.send()                             │
    │  inAppToast.send()                              │
    │  email.send()                                   │
    │  sound.send()                                   │
    └────┬────────────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │NotificationDeliveries│
    │──────────────────────│
    │ id (PK)              │
    │ notification_id (FK) │
    │ channel_name         │
    │ status               │
    │ error_message        │
    │ message_id (for email)
    │ created_at           │
    └──────────────────────┘


    ┌──────────────────────┐      ┌──────────────────────┐
    │   Bull Queue         │      │   Redis Store        │
    │  (Job Management)    │      │  (Queue Storage)     │
    │                      │      │                      │
    │  add()               │◄────►│ notifications-queue  │
    │  process()           │      │ job:<id>:data        │
    │  on('completed')     │      │ job:<id>:state       │
    │  on('failed')        │      │                      │
    └──────────────────────┘      └──────────────────────┘
```

---

## 7. Retry & Failure Handling Flow

```
                    ┌──────────────┐
                    │ Deliver Notif│
                    │ via Channel  │
                    └────────┬─────┘
                             │
                    ┌────────▼───────┐
                    │ Success?       │
                    └──┬─────────┬──┘
                     Y │         │N
                       │         │
                  ┌────▼─┐   ┌───▼──────────────┐
                  │Mark  │   │Max Retries      │
                  │sent  │   │Exceeded?        │
                  │      │   └──┬────────┬─────┘
                  └──────┘    Y │        │N
                               │        │
                      ┌────────▼┐   ┌───▼────────┐
                      │Log Fail │   │ Requeue    │
                      │Mark     │   │ with       │
                      │Failed   │   │ Backoff    │
                      │         │   │ (exp, 2x)  │
                      │Notify   │   └─┬──────┬───┘
                      │Ops Team │     │      │
                      └─────────┘     │      │
                                      │      │
                            ┌─────────▼┐  ┌─▼──────┐
                            │Next      │  │Requeue │
                            │Retry     │  │Success?
                            │Scheduled │  └────────┘
                            └────┬─────┘
                                 │
                        ┌────────▼────────┐
                        │Wait & Retry     │
                        │(exponential     │
                        │backoff delay)   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │ Retry Attempt│
                        │ (loop back)   │
                        └──────────────┘

BACKOFF SCHEDULE:
Attempt 1: Immediate
Attempt 2: 2000ms (2s)
Attempt 3: 4000ms (4s)
Attempt 4: 8000ms (8s)
Max: 3-5 attempts per channel
```

---

## 8. Service Integration Points

```
┌────────────────────────────────────────────────────────────────┐
│                  DailyUse Application                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Frontend (Vue 3)                                             │
│  ├─ Notification Toast Component                              │
│  ├─ Settings/Preferences UI                                   │
│  ├─ SSE Subscription Handler                                  │
│  └─ Service Worker Registration                               │
│                                                                │
└────────────────┬─────────────────────────────────────────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
  ┌────┐      ┌──────┐     ┌───────────┐
  │HTTP│      │SSE   │     │Service    │
  │APIs│      │Stream│     │Worker API │
  └─┬──┘      └──┬───┘     └───┬───────┘
    │            │              │
    └────────────┼──────────────┘
                 │
             ┌───▼──────────────────────┐
             │   Express Backend        │
             ├────────────────────────┐ │
             │ Notification Module    │ │
             │ ┌────────────────────┐ │ │
             │ │ NotificationService│ │ │
             │ │ NotificationRepo   │ │ │
             │ │ ChannelRegistry    │ │ │
             │ │ QueueService       │ │ │
             │ └────┬───────────────┘ │ │
             └─────┬─────────────────┘ │
                   │                   │
             ┌─────▼─────┐  ┌──────────┴──┐
             │ MongoDB   │  │ Redis       │
             │ (persist) │  │ (queue)     │
             └───────────┘  └─────────────┘
                   │
     ┌─────────────┼──────────┬──────────┐
     │             │          │          │
     ▼             ▼          ▼          ▼
  ┌──────┐    ┌──────┐   ┌──────┐   ┌──────────┐
  │SendG │    │Web   │   │SMTP  │   │External  │
  │rid   │    │Push  │   │Service   │APIs      │
  │Email │    │API   │   │Provider  │(Slack,   │
  │API   │    │      │   │          │Webhook)  │
  └──────┘    └──────┘   └──────┘   └──────────┘
```

---

End of Architecture Diagrams Document
