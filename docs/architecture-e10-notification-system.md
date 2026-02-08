# E10 Architecture: Benachrichtigungssystem

## 1. Executive Summary

**Epic:** E10 - Benachrichtigungssystem (PROJ-26)
**Status:** Architecture Phase
**Dependencies:** E3 (Credits), E4 (Search), E7 (CRM), E9 (Export) - Integration Points

### Scope
Das Benachrichtigungssystem bietet Echtzeit-Benachrichtigungen innerhalb der App mit plan-basierter Feature-Gating:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| In-App Notifications | 100/Monat | 1.000/Monat | Unbegrenzt |
| Notification History | 30 Tage | 90 Tage | Unbegrenzt |
| Email Notifications | - | Ja | Ja |
| Push Notifications | - | - | Ja |

### Key Challenges
1. **Echtzeit-Zustellung** - Sofortige Anzeige neuer Benachrichtigungen ohne Page-Reload
2. **Plan-Gating** - Unterschiedliche Limits und Features pro Subscription-Tier
3. **Integration** - Benachrichtigungen aus 5 bestehenden Epics (E3, E4, E7, E9)
4. **Performance** - Schneller Unread-Counter, paginierte History

---

## 2. Component Structure

### Visual Component Tree

```
Dashboard Shell (Header)
├── NotificationBell
│   ├── Icon (Lucide Bell)
│   ├── Badge (Unread Counter)
│   └── Dropdown Trigger
│
├── NotificationDropdown (Sheet/Popover)
│   ├── Header
│   │   ├── Title "Benachrichtigungen"
│   │   ├── Mark-All-Read Button
│   │   └── Link to History
│   ├── NotificationList (max 5 items)
│   │   └── NotificationItem (reusable)
│   │       ├── Icon (type-based)
│   │       ├── Title
│   │       ├── Message
│   │       ├── Timestamp
│   │       ├── Unread-Indicator
│   │       └── Action-Button (optional)
│   └── Footer
│       └── "Alle anzeigen" Link
│
├── NotificationToast (Sonner)
│   └── Toast-Popup for realtime notifications
│       ├── Icon
│       ├── Title
│       ├── Message
│       └── Action-Button
│
└── NotificationSound (optional)
    └── Audio-Feedback on new notification

Pages
├── /dashboard/notifications (History Page)
│   ├── PageHeader
│   │   ├── Title "Alle Benachrichtigungen"
│   │   └── Filter-Tabs (Alle | Ungelesen | Gelesen)
│   ├── FilterBar
│   │   ├── Type-Filter Dropdown
│   │   ├── Date-Range Picker
│   │   └── Search Input
│   ├── NotificationList (paginated)
│   │   └── NotificationItem (extended)
│   │       ├── All fields from dropdown
│   │       └── Delete-Button
│   ├── LoadMore Button
│   └── Empty States
│       ├── No notifications
│       ├── No matching filters
│       └── All caught up illustration
│
└── /dashboard/einstellungen/notifications (Preferences)
    ├── PageHeader "Benachrichtigungseinstellungen"
    ├── Section: In-App Notifications
    │   └── ToggleGrid (14 notification types)
    │       ├── Type Name
    │       ├── Description
    │       └── Toggle Switch
    ├── Section: Email Notifications (Pro+ only)
    │   ├── Upgrade-Badge (Free users)
    │   └── ToggleGrid (disabled for Free)
    ├── Section: Push Notifications (Enterprise only)
    │   ├── Upgrade-Badge (Free/Pro)
    │   └── ToggleGrid (disabled)
    └── Section: Sound Settings
        ├── Enable Sound Toggle
        └── Volume Slider
```

### Hooks Structure

```
useNotifications()
├── State: notifications[]
├── State: unreadCount
├── State: loading
├── Actions:
│   ├── fetchNotifications(page, filters)
│   ├── markAsRead(id)
│   ├── markAllAsRead()
│   └── deleteNotification(id)
└── Pagination: hasMore, loadMore

useNotificationRealtime()
├── Effect: Subscribe to Supabase channel
├── Handler: onNewNotification (INSERT)
├── Handler: onNotificationUpdated (UPDATE)
└── Cleanup: Unsubscribe on unmount

useNotificationPreferences()
├── State: preferences (14 types x 3 channels)
├── Actions:
│   ├── fetchPreferences()
│   ├── updatePreference(type, channel, value)
│   └── savePreferences()
└── Derived: isEnabled(type, channel)

useUnreadCount()
├── State: count (optimistic)
├── Effect: Fetch initial count
├── Realtime: Listen for changes
└── Optimistic: Update before API response
```

---

## 3. Database Schema

### Table: notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification Content
  type VARCHAR(50) NOT NULL, -- 'search_complete', 'export_complete', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Metadata
  data JSONB DEFAULT '{}', -- Flexible payload for type-specific data
  action_url TEXT, -- Optional link for "View Details" button

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Plan-gating tracking
  plan_tier VARCHAR(20) NOT NULL, -- 'free', 'pro', 'enterprise'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete for retention cleanup
  deleted_at TIMESTAMPTZ
);

-- Indexes for Performance
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_plan_tier ON notifications(plan_tier);
CREATE INDEX idx_notifications_retention ON notifications(created_at, plan_tier) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### Table: notification_preferences

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification type (e.g., 'search_complete')
  notification_type VARCHAR(50) NOT NULL,

  -- Channel toggles
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,

  -- Unique constraint per user + type
  UNIQUE(user_id, notification_type)
);

-- Indexes
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Notification Types Enum

```sql
-- Document all 14 notification types
COMMENT ON TABLE notifications IS 'Supported types:
  search_complete, search_failed, export_complete, export_failed,
  credit_low, credit_exhausted, deal_stage_changed, deal_assigned,
  contact_import_complete, contact_import_failed, plan_expiring,
  plan_expired, team_invite_received, system_maintenance';
```

### Cleanup Function (Retention Policy)

```sql
-- Function to clean up old notifications based on plan tier
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Free tier: 30 days retention
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE plan_tier = 'free'
    AND deleted_at IS NULL
    AND created_at < NOW() - INTERVAL '30 days';

  -- Pro tier: 90 days retention
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE plan_tier = 'pro'
    AND deleted_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days';

  -- Enterprise: No automatic cleanup (unlimited)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (if enabled) or external trigger
```

### Realtime Publication

```sql
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 4. Realtime Architecture

### Supabase Realtime Strategy

**Channel Naming:** `notifications:user_{user_id}`

**Event Types:**
- `INSERT` - New notification created
- `UPDATE` - Notification marked as read

**Broadcast Strategy:**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Database       │────▶│  Supabase        │────▶│  Client         │
│  Trigger        │     │  Realtime        │     │  Subscription   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                               │
        │                                               ▼
        │                                       ┌─────────────────┐
        │                                       │  Notification   │
        │                                       │  Toast Display  │
        │                                       └─────────────────┘
        ▼
┌─────────────────┐
│  Edge Function  │ (Alternative: for complex logic)
│  Notification   │
│  Router         │
└─────────────────┘
```

### Client-Side Realtime Handling

**Subscription Lifecycle:**
1. **Mount:** User opens any dashboard page
2. **Subscribe:** Connect to `notifications:user_{userId}` channel
3. **Listen:** Handle INSERT events → Show toast + Update counter
4. **Cleanup:** Unsubscribe on unmount / page navigation

**State Management:**
```
Initial Load:
  API call GET /api/notifications/unread-count → Set initial counter

Realtime Events:
  INSERT → Increment counter optimistically + Show toast
  UPDATE → Decrement counter + Update notification list

User Actions:
  Mark as Read → Optimistic UI update + API call + Broadcast UPDATE
  Mark All Read → Optimistic reset to 0 + API call
```

### Broadcast Options

**Option A: Database Trigger (Recommended)**
- Simple INSERT automatically broadcasts via Supabase Realtime
- No additional code needed
- Works with existing RLS

**Option B: Edge Function Router**
- `notification-router` Edge Function handles complex routing
- Checks user preferences before broadcasting
- Supports email/push routing logic
- More control, more complexity

**Decision:** Start with Option A (database-level), add Edge Function later for email/push expansion.

---

## 5. Notification Service

### Service Location

**File:** `src/lib/notifications/service.ts`

### Service Responsibilities

```
NotificationService
├── Core CRUD
│   ├── createNotification(userId, type, payload)
│   ├── markAsRead(notificationId)
│   ├── markAllAsRead(userId)
│   ├── deleteNotification(notificationId)
│   └── getUnreadCount(userId)
│
├── Query Functions
│   ├── getNotifications(userId, options)
│   │   └── Options: { page, limit, filters, sort }
│   └── getNotificationHistory(userId, pagination)
│
├── Plan-Gating
│   ├── checkMonthlyLimit(userId, planTier)
│   ├── getMonthlyCount(userId)
│   └── shouldCreateNotification(userId, type, planTier)
│
└── Preferences
    ├── getUserPreferences(userId)
    ├── updatePreference(userId, type, channel, value)
    └── shouldNotify(userId, type, channel)
```

### Integration Triggers

**E4 Search Integration:**
```
Search Completion:
  Search API ──▶ createNotification(userId, 'search_complete', {
                   searchId, query, resultCount
                 })
```

**E9 Export Integration:**
```
Export Completion:
  Export API ──▶ createNotification(userId, 'export_complete', {
                   exportId, filename, recordCount, downloadUrl
                 })
```

**E7 CRM Integration:**
```
Deal Update:
  Deal API ───▶ createNotification(assigneeId, 'deal_stage_changed', {
                  dealId, dealName, oldStage, newStage
                })
```

**E3 Credits Integration:**
```
Credit Check:
  Credit API ──▶ if (credits < threshold) {
                   createNotification(userId, 'credit_low', {
                     remainingCredits, threshold
                   })
                 }
```

### Notification Payload Format

```typescript
interface NotificationPayload {
  // Required
  type: NotificationType;           // One of 14 types
  title: string;                    // Display title (German)
  message: string;                  // Display message (German)

  // Optional
  data?: Record<string, any>;       // Type-specific data
  actionUrl?: string;               // "View Details" link
  actionLabel?: string;             // Button text (default: "Anzeigen")

  // System
  priority?: 'low' | 'normal' | 'high';  // Display priority
  icon?: string;                    // Override default icon
}
```

---

## 6. API Contracts

### Zod Schemas

```typescript
// Base schemas
const notificationTypeSchema = z.enum([
  'search_complete', 'search_failed', 'export_complete', 'export_failed',
  'credit_low', 'credit_exhausted', 'deal_stage_changed', 'deal_assigned',
  'contact_import_complete', 'contact_import_failed', 'plan_expiring',
  'plan_expired', 'team_invite_received', 'system_maintenance'
]);

const notificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
  read: z.boolean(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// API: GET /api/notifications
const listNotificationsQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  read: z.enum(['true', 'false', 'all']).default('all'),
  type: notificationTypeSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const listNotificationsResponse = z.object({
  notifications: z.array(notificationSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

// API: GET /api/notifications/unread-count
const unreadCountResponse = z.object({
  count: z.number(),
  monthlyCount: z.number(), // For plan limit display
  monthlyLimit: z.number(), // Current plan limit
});

// API: POST /api/notifications/:id/read
const markAsReadParams = z.object({
  id: z.string().uuid(),
});

const markAsReadResponse = z.object({
  success: z.boolean(),
  notification: notificationSchema,
});

// API: POST /api/notifications/read-all
const markAllReadResponse = z.object({
  success: z.boolean(),
  updatedCount: z.number(),
});

// API: DELETE /api/notifications/:id
const deleteNotificationParams = z.object({
  id: z.string().uuid(),
});

const deleteNotificationResponse = z.object({
  success: z.boolean(),
});

// API: GET /api/notifications/preferences
const notificationChannelSchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
});

const preferencesResponse = z.object({
  preferences: z.record(notificationTypeSchema, notificationChannelSchema),
  planTier: z.enum(['free', 'pro', 'enterprise']),
});

// API: POST /api/notifications/preferences
const updatePreferencesBody = z.object({
  type: notificationTypeSchema,
  channel: z.enum(['inApp', 'email', 'push']),
  enabled: z.boolean(),
});

const updatePreferencesResponse = z.object({
  success: z.boolean(),
  preferences: preferencesResponse.shape.preferences,
});
```

### Error Responses

```typescript
// Standard error format
const errorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

// Common error codes
// 400 - Bad Request (invalid params)
// 401 - Unauthorized (not logged in)
// 403 - Forbidden (not owner of notification)
// 404 - Notification not found
// 429 - Monthly limit reached
// 500 - Internal server error
```

---

## 7. Notification Types Config

### 14 Notification Types Definition

| ID | Name (DE) | Default In-App | Default Email | Default Push | Icon | Color | Action |
|----|-----------|----------------|---------------|--------------|------|-------|--------|
| `search_complete` | Suche abgeschlossen | Ja | Ja (Pro+) | Nein | Search | Blue | `/dashboard/suche?result={id}` |
| `search_failed` | Suche fehlgeschlagen | Ja | Ja (Pro+) | Nein | AlertTriangle | Red | `/dashboard/suche` |
| `export_complete` | Export bereit | Ja | Ja (Pro+) | Nein | Download | Green | Download-Link |
| `export_failed` | Export fehlgeschlagen | Ja | Ja (Pro+) | Nein | XCircle | Red | `/dashboard/exporte` |
| `credit_low` | Guthaben niedrig | Ja | Ja | Nein | Wallet | Orange | `/dashboard/einstellungen/abrechnung` |
| `credit_exhausted` | Guthaben aufgebraucht | Ja | Ja | Ja | AlertCircle | Red | `/upgrade` |
| `deal_stage_changed` | Deal-Status geändert | Ja | Ja (Pro+) | Nein | GitPullRequest | Purple | `/dashboard/deals/{id}` |
| `deal_assigned` | Deal zugewiesen | Ja | Ja (Pro+) | Nein | UserPlus | Blue | `/dashboard/deals/{id}` |
| `contact_import_complete` | Import abgeschlossen | Ja | Nein | Nein | Users | Green | `/dashboard/kontakte` |
| `contact_import_failed` | Import fehlgeschlagen | Ja | Ja | Nein | XCircle | Red | `/dashboard/kontakte` |
| `plan_expiring` | Plan läuft ab | Ja | Ja | Ja | Calendar | Orange | `/dashboard/einstellungen/abrechnung` |
| `plan_expired` | Plan abgelaufen | Ja | Ja | Ja | AlertOctagon | Red | `/upgrade` |
| `team_invite_received` | Team-Einladung | Ja | Ja | Ja | Mail | Blue | Invite-Accept-URL |
| `system_maintenance` | Wartungsarbeiten | Ja | Nein | Nein | Wrench | Gray | Status-Page |

### Type-Specific Data Schemas

```typescript
// Search notifications
interface SearchCompleteData {
  searchId: string;
  query: string;
  resultCount: number;
  filters?: SearchFilters;
}

// Export notifications
interface ExportCompleteData {
  exportId: string;
  filename: string;
  recordCount: number;
  downloadUrl: string;
  expiresAt: string;
}

// Credit notifications
interface CreditLowData {
  remainingCredits: number;
  threshold: number;
  recommendedPlan?: string;
}

// Deal notifications
interface DealStageChangedData {
  dealId: string;
  dealName: string;
  oldStage: string;
  newStage: string;
  changedBy: string;
}

// Plan notifications
interface PlanExpiringData {
  currentPlan: string;
  expiryDate: string;
  renewalUrl: string;
}
```

---

## 8. Plan-Gating Implementation

### Monthly Limits

| Plan | In-App Limit | Counter Display |
|------|--------------|-----------------|
| Free | 100/Monat | "45/100 Benachrichtigungen" |
| Pro | 1.000/Monat | "234/1.000 Benachrichtigungen" |
| Enterprise | Unbegrenzt | "1.234 Benachrichtigungen" |

### Server-Side Gating

```
Before creating notification:
  1. Get user's current plan tier from subscriptions table
  2. Check monthly count in notifications table
  3. If count >= limit:
     - Log warning (monitoring)
     - Return { created: false, reason: 'limit_reached' }
  4. Create notification with plan_tier column
```

### Client-Side Gating

**Preferences Page:**
```
Email Notifications Section:
  Free Users:
    - Show "Upgrade to Pro" badge
    - All toggles disabled
    - CTA: "Mit Pro freischalten"

  Pro Users:
    - All toggles enabled
    - "Inklusive in Ihrem Pro Plan"

Push Notifications Section:
  Free/Pro Users:
    - Show "Enterprise only" badge
    - All toggles disabled
    - CTA: "Enterprise kontaktieren"

  Enterprise Users:
    - All toggles enabled
    - Browser permission request flow
```

**History Page:**
```
Free User with 30+ day old notifications:
  - Show banner: "Benachrichtigungen älter als 30 Tage werden automatisch gelöscht"
  - "Upgrade auf Pro für 90 Tage Aufbewahrung"
```

### Upgrade Prompts

| Context | Free → Pro | Pro → Enterprise |
|---------|------------|------------------|
| Email settings | "E-Mail-Benachrichtigungen freischalten" | N/A |
| Push settings | "Nur in Enterprise verfügbar" | "Push-Benachrichtigungen aktivieren" |
| History retention | "90 Tage Aufbewahrung mit Pro" | "Unbegrenzte Aufbewahrung" |
| Monthly limit hit | "Mehr Benachrichtigungen mit Pro" | N/A |

---

## 9. Integration Points

### E4 Search Integration

**Hook Location:** Search completion webhook/API
**Notification Trigger:** `search_complete` or `search_failed`
**Data Flow:**
```
Search API completes
  ↓
Check user preferences for 'search_complete'
  ↓
If inApp enabled AND limit not reached:
  CREATE notification
  ↓
Broadcast via Realtime
  ↓
Client shows toast
```

### E9 Export Integration

**Hook Location:** Export completion API
**Notification Trigger:** `export_complete` or `export_failed`
**Special Handling:**
- Include `downloadUrl` in notification data
- `actionUrl` points to pre-authenticated download
- 24-hour expiry for download link

### E7 CRM Integration

**Hook Location:** Deal update API (`/api/deals/[id]`)
**Notification Triggers:**
- `deal_stage_changed` - When stage is modified
- `deal_assigned` - When assignee is set/changed
**Recipients:**
- Deal owner (if changed by someone else)
- Previous assignee (if reassigned)

### E3 Credits Integration

**Hook Location:** Credit deduction API + Balance check
**Notification Triggers:**
- `credit_low` - When balance drops below 20
- `credit_exhausted` - When balance reaches 0
**Throttling:**
- `credit_low` max 1x per day
- `credit_exhausted` max 1x per week

### Payload Examples

```json
// Search Complete
{
  "type": "search_complete",
  "title": "Suche abgeschlossen",
  "message": "Ihre Suche nach 'IT-Unternehmen in Berlin' ergab 1.247 Ergebnisse.",
  "data": {
    "searchId": "uuid",
    "query": "IT-Unternehmen in Berlin",
    "resultCount": 1247
  },
  "actionUrl": "/dashboard/suche?result=uuid"
}

// Deal Stage Changed
{
  "type": "deal_stage_changed",
  "title": "Deal-Status aktualisiert",
  "message": "'Acme Corp Deal' wurde von 'Kontakt' zu 'Verhandlung' verschoben.",
  "data": {
    "dealId": "uuid",
    "dealName": "Acme Corp Deal",
    "oldStage": "Kontakt",
    "newStage": "Verhandlung",
    "changedBy": "Max Mustermann"
  },
  "actionUrl": "/dashboard/deals/uuid"
}
```

---

## 10. Handoff Checklists

### For Backend Developer

**Database (Task #7):**
- [ ] Create `notifications` table with all columns
- [ ] Create `notification_preferences` table
- [ ] Add all 5 indexes for performance
- [ ] Configure RLS policies (4 policies)
- [ ] Add realtime publication
- [ ] Create cleanup function for retention policy

**Service Layer:**
- [ ] Create `src/lib/notifications/service.ts`
- [ ] Implement createNotification() with plan-gating
- [ ] Implement markAsRead() and markAllAsRead()
- [ ] Implement getNotifications() with pagination
- [ ] Implement getUnreadCount()
- [ ] Implement preference CRUD

**API Routes:**
- [ ] GET /api/notifications (with pagination, filters)
- [ ] GET /api/notifications/unread-count
- [ ] POST /api/notifications/:id/read
- [ ] POST /api/notifications/read-all
- [ ] DELETE /api/notifications/:id
- [ ] GET /api/notifications/preferences
- [ ] POST /api/notifications/preferences

**Integration Hooks:**
- [ ] Hook into E4 Search completion
- [ ] Hook into E9 Export completion
- [ ] Hook into E7 Deal updates
- [ ] Hook into E3 Credit checks
- [ ] Test all 4 integration flows

**Testing:**
- [ ] Unit tests for service functions
- [ ] API route tests
- [ ] RLS policy tests
- [ ] Plan-gating limit tests

### For Frontend Developer

**Components (Task #8):**
- [ ] Create `NotificationBell` component (Header integration)
- [ ] Create `NotificationDropdown` component
- [ ] Create `NotificationItem` component (reusable)
- [ ] Create `NotificationToast` with Sonner
- [ ] Create `NotificationHistory` page
- [ ] Create `NotificationPreferences` page
- [ ] Create `NotificationSound` utility

**Hooks:**
- [ ] Create `useNotifications()` hook
- [ ] Create `useNotificationRealtime()` hook
- [ ] Create `useNotificationPreferences()` hook
- [ ] Create `useUnreadCount()` with optimistic updates

**Integration:**
- [ ] Add NotificationBell to DashboardShell
- [ ] Implement realtime subscription on mount
- [ ] Add toast display on new notification
- [ ] Add sound feedback (user preference)

**Plan-Gating UI:**
- [ ] Add upgrade badges for Email settings
- [ ] Add upgrade badges for Push settings
- [ ] Add disabled state for unavailable features
- [ ] Add monthly limit indicator
- [ ] Add retention period info

**Testing:**
- [ ] Component rendering tests
- [ ] Hook behavior tests
- [ ] Realtime event handling tests
- [ ] Plan-gating UI tests

### For QA Engineer

**Test Plan (Task #9):**
- [ ] Test all 14 notification types display correctly
- [ ] Test realtime delivery (websocket)
- [ ] Test counter updates (optimistic + API)
- [ ] Test mark as read (single + all)
- [ ] Test notification deletion
- [ ] Test pagination on history page
- [ ] Test filters on history page
- [ ] Test preferences save/load

**Plan-Gating Tests:**
- [ ] Free user: 100/month limit enforced
- [ ] Pro user: 1.000/month limit enforced
- [ ] Enterprise: unlimited notifications
- [ ] Free: 30 day retention (cleanup)
- [ ] Pro: 90 day retention
- [ ] Enterprise: unlimited retention
- [ ] Free: Email settings disabled
- [ ] Pro: Email settings enabled
- [ ] Enterprise: Push settings enabled

**Integration Tests:**
- [ ] E4 Search → notification created
- [ ] E9 Export → notification created
- [ ] E7 Deal update → notification created
- [ ] E3 Credit low → notification created
- [ ] Realtime toast appears on all events

**Edge Cases:**
- [ ] Rapid notification creation (throttling)
- [ ] Multiple tabs (sync behavior)
- [ ] Offline mode (queue behavior)
- [ ] Large history (performance)
- [ ] Permission denied (RLS)

---

## 11. Technical Decisions

| Decision | Options | Choice | Reason |
|----------|---------|--------|--------|
| Realtime | Supabase Realtime / WebSockets | **Supabase Realtime** | Bereits in E4 genutzt, RLS-Integration, einfach |
| Toast Library | Sonner / react-hot-toast / react-toastify | **Sonner** | shadcn/ui kompatibel, modern, Promise-Toast |
| Counter Update | Optimistic / Pessimistic | **Optimistic** | Bessere UX, sofortiges Feedback |
| Sound | Native Audio / Howler.js | **Native Audio** | Leichtgewichtig, keine extra Dependency |
| Pagination | Offset / Cursor | **Offset** | Einfacher für Filter/Sort, ausreichend für <10k |
| State Management | React Context / Zustand | **React Context** | Ausreichend für Notification-State |
| Preferences Storage | Database / LocalStorage | **Database** | Sync across devices, plan-gating |
| Retention Cleanup | pg_cron / External Cron | **pg_cron** | Datenbank-nativ, keine externe Dependency |
| Channel Naming | `user_{id}` / `notifications:{id}` | **`user_{id}`** | Einfacher Subscribe, keine Wildcards |
| Icon System | Lucide / Custom SVG | **Lucide** | Konsistent mit bestehendem Design |

### Decision Details

**Realtime: Supabase Realtime**
- Vorteile: Integriert in Supabase, automatische RLS-Prüfung, bestehende Infrastruktur
- Nachteile: Limitiert auf 200 gleichzeitige Connections (Free), 500 (Pro)
- Mitigation: Connections werden pro Tab gezählt, für MVP ausreichend

**Toast: Sonner**
- Vorteile: Headless UI kompatibel, bessere Animationen, Promise-Toast für async Actions
- Nachteile: Neuere Library, weniger Community-Beiträge
- Alternative: react-hot-toast (falls Probleme auftreten)

**Optimistic Counter:**
- Vorteile: Sofortiges UI-Feedback, bessere wahrgenommene Performance
- Risiko: Rollback bei API-Fehler
- Mitigation: Kurze Timeout, klare Fehlerbehandlung

---

## 12. Performance Considerations

### Database Optimization

**Indexes:**
```sql
-- Unread count (most frequent query)
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- History pagination
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Type filtering
CREATE INDEX idx_notifications_type ON notifications(type);

-- Cleanup job
CREATE INDEX idx_notifications_retention ON notifications(created_at, plan_tier);
```

**Query Patterns:**
- Unread count: `SELECT COUNT(*) WHERE user_id = X AND read = false`
- History: `SELECT * WHERE user_id = X ORDER BY created_at DESC LIMIT 20 OFFSET N`
- Filtered: `SELECT * WHERE user_id = X AND type = Y ORDER BY created_at DESC`

### Client-Side Optimization

**Lazy Loading:**
- Notification history only loaded on `/dashboard/notifications`
- Unread count fetched on dashboard mount
- Preferences loaded on settings page only

**Debouncing:**
- Counter updates debounced (100ms)
- Mark-as-read API calls debounced (500ms)
- Preference saves debounced (1s)

**Virtualization (if needed):**
- React-window for history list (if >100 items)
- Currently not required with 20-item pagination

### Bundle Size Impact

**New Dependencies:**
- `sonner` (~3kb gzipped)
- `lucide-react` icons (already included)
- No additional state management library

**Code Splitting:**
- Preferences page: lazy loaded
- History page: lazy loaded
- Sound utility: dynamically imported

### Realtime Performance

**Connection Management:**
- Subscribe on dashboard mount
- Unsubscribe on unmount
- Reconnect handling with exponential backoff

**Event Throttling:**
- Max 1 toast per 2 seconds (burst protection)
- Counter updates batched (RAF)

### Monitoring

**Key Metrics:**
- API response time (p95 < 200ms)
- Realtime latency (p95 < 500ms)
- Unread count query time (p95 < 50ms)
- Monthly notification creation rate

**Alerts:**
- High error rate on notification creation
- Approaching plan limits (>80%)
- Realtime connection failures

---

## Appendix A: File Structure

```
src/
├── app/
│   ├── api/
│   │   └── notifications/
│   │       ├── route.ts                    # GET list, POST create
│   │       ├── unread-count/
│   │       │   └── route.ts                # GET unread count
│   │       ├── [id]/
│   │       │   ├── read/
│   │       │   │   └── route.ts            # POST mark as read
│   │       │   └── route.ts                # DELETE notification
│   │       ├── read-all/
│   │       │   └── route.ts                # POST mark all read
│   │       └── preferences/
│   │           └── route.ts                # GET/POST preferences
│   │
│   └── dashboard/
│       ├── notifications/
│       │   └── page.tsx                    # History page
│       └── einstellungen/
│           └── notifications/
│               └── page.tsx                # Preferences page
│
├── components/
│   └── notifications/
│       ├── notification-bell.tsx
│       ├── notification-dropdown.tsx
│       ├── notification-item.tsx
│       ├── notification-toast.tsx
│       ├── notification-history.tsx
│       ├── notification-preferences.tsx
│       └── notification-sound.tsx
│
├── hooks/
│   ├── use-notifications.ts
│   ├── use-notification-realtime.ts
│   ├── use-notification-preferences.ts
│   └── use-unread-count.ts
│
├── lib/
│   └── notifications/
│       ├── service.ts                      # Core service functions
│       ├── types.ts                        # TypeScript types
│       ├── constants.ts                    # 14 notification types config
│       └── plan-gating.ts                  # Plan limit logic
│
└── types/
    └── notifications.ts                    # Shared type definitions

supabase/
└── migrations/
    └── 20260208000003_notification_system.sql
```

---

## Appendix B: Migration Dependencies

This migration depends on:
- `20240208000000_initial_schema.sql` (auth.users, profiles)
- `20260208000002_stripe_integration.sql` (subscriptions table for plan-gating)

Required views/functions:
- `user_plan_tier()` - Get user's current subscription tier
- `monthly_notification_count()` - Count notifications this month

---

## Appendix C: Notification Type Icons

| Type | Lucide Icon | Color (Tailwind) |
|------|-------------|------------------|
| search_complete | Search | blue-500 |
| search_failed | AlertTriangle | red-500 |
| export_complete | Download | green-500 |
| export_failed | XCircle | red-500 |
| credit_low | Wallet | orange-500 |
| credit_exhausted | AlertCircle | red-500 |
| deal_stage_changed | GitPullRequest | purple-500 |
| deal_assigned | UserPlus | blue-500 |
| contact_import_complete | Users | green-500 |
| contact_import_failed | XCircle | red-500 |
| plan_expiring | Calendar | orange-500 |
| plan_expired | AlertOctagon | red-500 |
| team_invite_received | Mail | blue-500 |
| system_maintenance | Wrench | gray-500 |

---

**Document Version:** 1.0
**Created:** 2026-02-08
**Author:** Solution Architect (Claude Code)
**Status:** Ready for Review
