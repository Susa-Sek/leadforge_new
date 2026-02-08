# Epic E10: Benachrichtigungssystem - Requirements (PROJ-26)

**Status:** 🔵 Planned
**Epic ID:** E10
**Projekte:** PROJ-26 (Benachrichtigungssystem)
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Requirements Engineer

---

## Epic Übersicht

Epic E10 implementiert ein vollständiges Benachrichtigungssystem für Manyleads.io, das Nutzer in Echtzeit über wichtige Ereignisse informiert. Das System unterstützt In-App Notifications, Realtime-Updates, konfigurierbare Präferenzen und integriert sich nahtlos mit anderen Epics.

**Kern-Features:**
- Bell-Icon im Header mit Unread-Counter
- Dropdown/Pane mit Notification-Liste
- Supabase Realtime für Live-Updates
- Notification-History mit Filter und Pagination
- Konfigurierbare Benachrichtigungs-Präferenzen
- Integration mit E3 (Credits), E4 (Search), E7 (CRM), E9 (Export)
- Plan-basiertes Feature-Gating (Email/Push für höhere Tiers)

**Kontext:**
- E3 (Credit-System) ist COMPLETED - Low-Credits Notifications möglich
- E4 (Search-System) ist COMPLETED - Search-Complete Notifications möglich
- E7 (CRM-System) ist IN PROGRESS - Deal-Status-Change Notifications geplant
- E9 (Export-System) ist PLANNED - Export-Complete Notifications geplant

---

## PROJ-26: Benachrichtigungssystem

**Status:** 🔵 Planned
**Abhängigkeiten:** Keine (Foundation-Feature, aber Integrationen mit E3/E4/E7/E9)

### Beschreibung

Das Benachrichtigungssystem ermöglicht Nutzern, über wichtige Ereignisse in der App informiert zu werden. Es nutzt Supabase Realtime für sofortige Updates und bietet eine zentrale Stelle für alle App-Notifications.

---

### Feature Matrix (Plan-Gating)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **In-App Notifications** | ✅ | ✅ | ✅ |
| **Realtime Updates** | ✅ | ✅ | ✅ |
| **Notification History** | 30 Tage | 90 Tage | Unbegrenzt |
| **Email Notifications** | ❌ | ✅ | ✅ |
| **Push Notifications** | ❌ | ❌ | ✅ |
| **Custom Notification Rules** | ❌ | ❌ | ✅ |
| **Max Notifications/Monat** | 100 | 1.000 | Unbegrenzt |
| **Quiet Hours** | ✅ | ✅ | ✅ |
| **Sound (optional)** | ✅ | ✅ | ✅ |
| **Browser Notifications** | ✅ | ✅ | ✅ |

❌ = Feature nicht verfügbar, UI Elemente werden ausgeblendet

---

## User Stories

### US-26.1: In-App Notifications Anzeigen

**Als User möchte ich Benachrichtigungen in der App sehen, damit ich über wichtige Ereignisse informiert werde.**

**Acceptance Criteria:**
- [ ] Bell-Icon im Header mit Unread-Counter (rot bei > 0)
- [ ] Counter auf "99+" begrenzt bei 100+ Unread
- [ ] Dropdown/Pane öffnet sich bei Klick auf Bell-Icon
- [ ] Liste zeigt letzte 10 Notifications (neueste zuerst)
- [ ] Unread/Read Status visuell unterschieden (fetter Text vs. normal)
- [ ] Zeitstempel formatiert: "vor 5 Minuten", "heute", "gestern", "vor 3 Tagen"
- [ ] Klick auf Notification öffnet Detail oder führt zur relevanten Seite
- [ ] "Alle als gelesen markieren" Button im Footer
- [ ] "Alle anzeigen" Link zur History-Seite
- [ ] Empty State: "Keine Benachrichtigungen" mit Icon

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Notifications | Benachrichtigungen |
| Mark all as read | Alle als gelesen markieren |
| View all | Alle anzeigen |
| No notifications | Keine Benachrichtigungen |
| Just now | Gerade eben |
| Minutes ago | vor {n} Minuten |
| Hours ago | vor {n} Stunden |
| Today | Heute |
| Yesterday | Gestern |
| Days ago | vor {n} Tagen |

**Notification Item UI:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔔  Ihre Suche ist fertig                          5m   │
│     "150 Leads gefunden für 'Autowerkstatt'..."         │
│                                                         │
│     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                                         │
│ 🔔  Export bereit                                  1h   │
│     "Ihr Export 'kontakte-2026.csv' ist bereit."        │
│     (Durchgestrichen/Grau = Gelesen)                    │
│                                                         │
│     [Alle als gelesen markieren]  [Alle anzeigen →]     │
└─────────────────────────────────────────────────────────┘
```

---

### US-26.2: Echtzeit-Benachrichtigungen

**Als User möchte ich Benachrichtigungen in Echtzeit erhalten, damit ich sofort über wichtige Ereignisse informiert werde.**

**Acceptance Criteria:**
- [ ] Supabase Realtime Subscription auf `notifications` Tabelle
- [ ] Neue Notification erscheint sofort im Dropdown (ohne Refresh)
- [ ] Unread-Counter aktualisiert sich automatisch
- [ ] Browser Notification (optional, nur falls erlaubt)
  - [ ] Permission Request beim ersten Trigger
  - [ ] Anzeige nur wenn App nicht im Fokus
- [ ] Toast für wichtige Notifications (Priority: High/Critical)
- [ ] Sound (optional, abschaltbar in Preferences)
  - [ ] Kurzer Sound bei neuer Notification
  - [ ] Toggle in Einstellungen: "Ton abspielen"
- [ ] Reconnect bei Verbindungsverlust (Retry-Logik)
- [ ] Animation: Bell-Icon wackelt sanft bei neuer Notification

**Toast Notifications (für High/Critical):**
- Position: Bottom-Right
- Duration: 5 Sekunden
- Manuelles Schließen möglich
- Max 3 gleichzeitig sichtbar (Stacking)

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Enable browser notifications | Browser-Benachrichtigungen aktivieren |
| Enable sound | Ton aktivieren |
| Notification sound | Benachrichtigungston |

---

### US-26.3: Notification-Types

**Das System muss folgende Notification-Typen unterstützen:**

| Type | Trigger | Priority | Message (German) | Action-Link |
|------|---------|----------|------------------|-------------|
| **search_complete** | Suche abgeschlossen (E4) | Normal | "Ihre Suche nach {branche} in {stadt} ist fertig. {count} Leads gefunden." | /dashboard/suche?result={id} |
| **export_complete** | Export fertig (E9) | Normal | "Ihr Export '{name}' ist bereit zum Download." | /dashboard/exporte |
| **export_failed** | Export fehlgeschlagen (E9) | High | "Export '{name}' konnte nicht erstellt werden." | /dashboard/exporte |
| **deal_status_change** | Deal-Status geändert (E7) | Normal | "Deal '{name}' wurde auf '{stage}' verschoben." | /dashboard/deals?id={id} |
| **deal_won** | Deal gewonnen (E7) | High | "Herzlichen Glückwunsch! Deal '{name}' wurde gewonnen." | /dashboard/deals?id={id} |
| **deal_lost** | Deal verloren (E7) | Normal | "Deal '{name}' wurde verloren." | /dashboard/deals?id={id} |
| **low_credits** | Wenig Credits (E3) | Critical | "Nur noch {count} Credits übrig. Jetzt aufladen?" | /upgrade |
| **credit_purchase_success** | Kauf erfolgreich (E3) | High | "{amount} Credits wurden Ihrem Konto gutgeschrieben." | - |
| **contact_assigned** | Kontakt zugewiesen | Normal | "{contact} wurde Ihnen zugewiesen." | /dashboard/kontakte/{id} |
| **new_lead** | Neue Leads verfügbar | Normal | "{count} neue Leads in Ihrer Suche." | /dashboard/suche |
| **subscription_trial_ending** | Trial endet bald (E8) | High | "Ihre Testphase endet in {days} Tagen. Upgrade jetzt?" | /upgrade |
| **subscription_payment_failed** | Zahlung fehlgeschlagen (E8) | Critical | "Zahlung fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode." | /dashboard/einstellungen/abrechnung |
| **system_maintenance** | Wartungsankündigung | High | "Geplante Wartung am {datum}. {dauer} Unterbrechung erwartet." | - |
| **welcome** | Neue Registrierung | High | "Willkommen bei Manyleads! Hier sind Ihre ersten Schritte..." | /dashboard/suche |

**Notification Priority Levels:**
- **Critical**: Sofortiger Toast + Sound + Browser-Notification
- **High**: Toast + Counter-Update
- **Normal**: Nur Counter-Update + Dropdown-Anzeige

---

### US-26.4: Notification-Preferences

**Als User möchte ich einstellen können, welche Benachrichtigungen ich erhalten möchte.**

**Acceptance Criteria:**
- [ ] Einstellungen unter `/dashboard/einstellungen/notifications`
- [ ] Toggle pro Notification-Type (In-App an/aus)
- [ ] Email-Benachrichtigungen Toggle (Pro/Enterprise only, Free: Upsell)
- [ ] Push-Notifications Toggle (Enterprise only, Free/Pro: Upsell)
- [ ] Quiet Hours: Keine Benachrichtigungen 22:00-08:00
  - [ ] Start- und End-Zeit konfigurierbar
  - [ ] Zeitzone: Europe/Berlin (default)
- [ ] Sound-Setting: Globaler Toggle + pro Type
- [ ] Speichern lädt Seite nicht neu (Optimistic Update)
- [ ] Default: Alle Typen aktiviert für In-App
- [ ] Änderungen wirken sofort (kein Re-Login nötig)

**Preference Settings UI:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BENACHRICHTIGUNGEN                                              [Zurück]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ALLGEMEINE EINSTELLUNGEN                                        │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  [✓] Browser-Benachrichtigungen aktivieren                      │    │
│  │  [✓] Ton bei neuen Benachrichtigungen                           │    │
│  │  [✓] Ruhezeiten aktivieren (22:00 - 08:00)                      │    │
│  │                                                                  │    │
│  │  [✗] E-Mail Benachrichtigungen        [Upgrade to Pro]          │    │
│  │  [✗] Push Benachrichtigungen          [Upgrade to Enterprise]   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  BENACHRICHTIGUNGSTYPEN                                          │    │
│  │  ─────────────────────────────────────────────────────────────   │    │
│  │                                                                  │    │
│  │  Suche und Leads                          [✓] In-App  [✓] Ton   │    │
│  │  └─ Suchergebnisse fertig                                       │    │
│  │  └─ Neue Leads verfügbar                                        │    │
│  │                                                                  │    │
│  │  Exporte                                  [✓] In-App  [✓] Ton   │    │
│  │  └─ Export fertiggestellt                                       │    │
│  │  └─ Export fehlgeschlagen              [✓] In-App  [✓] Ton [✓] Email│
│  │                                                                  │    │
│  │  CRM                                      [✓] In-App  [✓] Ton   │    │
│  │  └─ Deal-Status geändert                                        │    │
│  │  └─ Deal gewonnen                        [✓] In-App  [✓] Ton [✓] Email│
│  │  └─ Kontakt zugewiesen                                          │    │
│  │                                                                  │    │
│  │  Credits                                  [✓] In-App  [✓] Ton   │    │
│  │  └─ Wenig Credits                   [✓] In-App  [✓] Ton [✓] Email│
│  │  └─ Kauf erfolgreich                                            │    │
│  │                                                                  │    │
│  │  Abonnement                               [✓] In-App  [✓] Ton   │    │
│  │  └─ Trial endet bald                 [✓] In-App  [✓] Ton [✓] Email│
│  │  └─ Zahlung fehlgeschlagen      [✓] In-App  [✓] Ton [✓] Email [✓] Push│
│  │                                                                  │    │
│  │  System                                   [✓] In-App            │    │
│  │  └─ Wartungsankündigungen                                       │    │
│  │  └─ Willkommensnachricht                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                              [Änderungen speichern]                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| Notifications | Benachrichtigungen |
| General Settings | Allgemeine Einstellungen |
| Browser Notifications | Browser-Benachrichtigungen |
| Play Sound | Ton abspielen |
| Quiet Hours | Ruhezeiten |
| Email Notifications | E-Mail Benachrichtigungen |
| Push Notifications | Push-Benachrichtigungen |
| Notification Types | Benachrichtigungstypen |
| Search & Leads | Suche und Leads |
| Exports | Exporte |
| CRM | CRM |
| Credits | Credits |
| Subscription | Abonnement |
| System | System |
| In-App | In-App |
| Sound | Ton |
| Email | E-Mail |
| Push | Push |
| Save Changes | Änderungen speichern |
| Settings saved | Einstellungen gespeichert |
| Upgrade to Pro | Upgrade auf Pro |
| Upgrade to Enterprise | Upgrade auf Enterprise |

---

### US-26.5: Notification-History

**Als User möchte ich alte Benachrichtigungen einsehen können.**

**Acceptance Criteria:**
- [ ] History-Seite `/dashboard/notifications`
- [ ] Tabelle mit allen Notifications (neueste zuerst)
- [ ] Filter: Alle / Ungelesen / Gelesen
- [ ] Filter nach Typ (Multi-Select)
- [ ] Filter nach Datum (Von - Bis)
- [ ] Paginierung: 20 pro Seite
- [ ] Löschen einzelner Notifications (Swipe auf Mobile, Button auf Desktop)
- [ ] "Alle älter als 30 Tage löschen" Button (Bulk)
- [ ] Klick öffnet Detail oder führt zur relevanten Seite
- [ ] Markieren als gelesen/ungelesen pro Notification
- [ ] Empty State: "Keine Benachrichtigungen in dieser Kategorie"

**History Page UI:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BENACHRICHTIGUNGEN                                            [Zurück]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Alle ▼] [Alle Typen ▼] [Datum: Alle ▼]           [✓ Nur Ungelesene]   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ○ │ Typ      │ Nachricht                    │ Zeit    │ Aktionen │  │
│  │────│──────────│──────────────────────────────│─────────│──────────│  │
│  │ ● │ Suche    │ Ihre Suche ist fertig...     │ 5m      │ [Löschen]│  │
│  │ ● │ Export   │ Ihr Export ist bereit...     │ 1h      │ [Löschen]│  │
│  │ ○ │ Deal     │ Deal auf "Angebot"...        │ Gestern │ [Löschen]│  │
│  │ ○ │ Credit   │ Kauf erfolgreich...          │ Vor 3d  │ [Löschen]│  │
│  │ ...│ ...      │ ...                          │ ...     │ ...      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ← Seite 1 von 5 →                              [Alte löschen (30+ Tage)]│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**UI Labels (Deutsch):**

| Label | German |
|-------|--------|
| All | Alle |
| Unread | Ungelesen |
| Read | Gelesen |
| Type | Typ |
| Date | Datum |
| Actions | Aktionen |
| Delete | Löschen |
| Delete old notifications | Alte Benachrichtigungen löschen |
| Delete all older than 30 days | Alle älter als 30 Tage löschen |
| Mark as read | Als gelesen markieren |
| Mark as unread | Als ungelesen markieren |
| No notifications in this category | Keine Benachrichtigungen in dieser Kategorie |
| Are you sure? | Sind Sie sicher? |
| This action cannot be undone | Diese Aktion kann nicht rückgängig gemacht werden |

---

### US-26.6: Integration mit bestehenden Features

**Notifications müssen ausgelöst werden bei folgenden Ereignissen:**

**E4 Search Integration:**
- [ ] Trigger: `search_complete` - Suche erfolgreich abgeschlossen
- [ ] API: `POST /api/search` -> Nach Abschluss Notification erstellen
- [ ] Nachricht: "Ihre Suche nach {query} ist fertig. {count} Leads gefunden."
- [ ] Action-Link: `/dashboard/suche?result={search_id}`

**E9 Export Integration:**
- [ ] Trigger: `export_complete` - Export erfolgreich erstellt
- [ ] API: `POST /api/export/*` -> Bei Completion Notification erstellen
- [ ] Nachricht: "Ihr Export '{filename}' ist bereit zum Download."
- [ ] Action-Link: `/dashboard/exporte`
- [ ] Trigger: `export_failed` - Export fehlgeschlagen
- [ ] Nachricht: "Export '{filename}' konnte nicht erstellt werden."
- [ ] Priority: High (Toast anzeigen)

**E7 CRM Integration:**
- [ ] Trigger: `deal_status_change` - Deal-Stage geändert
- [ ] API: `PATCH /api/deals/[id]/stage` -> Notification bei Stage-Change
- [ ] Nachricht: "Deal '{title}' wurde auf '{stage}' verschoben."
- [ ] Trigger: `deal_won` - Deal auf Gewonnen gesetzt
- [ ] Nachricht: "Herzlichen Glückwunsch! Deal '{title}' wurde gewonnen."
- [ ] Priority: High + Toast
- [ ] Trigger: `deal_lost` - Deal auf Verloren gesetzt
- [ ] Nachricht: "Deal '{title}' wurde verloren."
- [ ] Trigger: `contact_assigned` - Kontakt einem User zugewiesen
- [ ] Nachricht: "{contact_name} wurde Ihnen zugewiesen."

**E3 Credits Integration:**
- [ ] Trigger: `low_credits` - Credits unter 10%
- [ ] Check: Bei jeder Credit-Verbrauch prüfen
- [ ] Nachricht: "Nur noch {count} Credits übrig. Jetzt aufladen?"
- [ ] Priority: Critical + Toast + Browser-Notification
- [ ] Action-Link: `/upgrade`
- [ ] Trigger: `credit_purchase_success` - Erfolgreicher Kauf
- [ ] Nachricht: "{amount} Credits wurden Ihrem Konto gutgeschrieben."
- [ ] Priority: High + Toast

**E8 Subscription Integration:**
- [ ] Trigger: `subscription_trial_ending` - Trial endet in 3 Tagen
- [ ] Cron/Scheduled: Täglicher Check
- [ ] Nachricht: "Ihre Testphase endet in {days} Tagen. Upgrade jetzt?"
- [ ] Priority: High
- [ ] Trigger: `subscription_payment_failed` - Zahlung fehlgeschlagen
- [ ] Webhook: `invoice.payment_failed`
- [ ] Nachricht: "Zahlung fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode."
- [ ] Priority: Critical + Toast + Browser-Notification + Email

---

## Edge Cases

| ID | Kategorie | Scenario | Erwartetes Verhalten |
|----|-----------|----------|---------------------|
| **EC-26-01** | Daten | User offline während Notification | Notification speichern, anzeigen beim nächsten Login |
| **EC-26-02** | Daten | 100+ Unread Notifications | Counter auf "99+" begrenzen, keine Performance-Probleme |
| **EC-26-03** | Daten | Quiet Hours aktiv | Notifications verzögern oder unterdrücken (Queue für später) |
| **EC-26-04** | Daten | Deleted Content (z.B. gelöschter Deal) | Notification zeigt "Inhalt nicht mehr verfügbar", Link deaktiviert |
| **EC-26-05** | Daten | Rate Limiting erreicht (10/Min) | Notifications queue-en, alle 10 Sekunden verarbeiten |
| **EC-26-06** | Daten | Notification-Limit erreicht (Free: 100/Monat) | Älteste Notification löschen, neue erstellen |
| **EC-26-07** | Daten | Sehr lange Nachrichten (>500 Zeichen) | Abschneiden mit "...", Detail-Ansicht zeigt vollständig |
| **EC-26-08** | Daten | Notification-Typ deaktiviert in Preferences | Keine Erstellung/Anzeige dieses Typs |
| **EC-26-09** | UI | User klickt sehr schnell auf "Alle als gelesen" | Debounce/Loading-State, keine doppelte Aktion |
| **EC-26-10** | UI | Dropdown offen während neue Notification | Notification erscheint in Liste, Counter aktualisiert |
| **EC-26-11** | UI | Mobile: Swipe zum Löschen | Swipe-Action implementieren (links/rechts) |
| **EC-26-12** | Realtime | WebSocket-Verbindung verloren | Retry mit Exponential Backoff, Toast bei Reconnect |
| **EC-26-13** | Realtime | Mehrere Tabs geöffnet | Notifications nur einmal anzeigen (Deduplication) |
| **EC-26-14** | Email | E-Mail-Benachrichtigung bounce | Loggen, keine weitere Aktion |
| **EC-26-15** | Email | User hat Email deaktiviert | Nur In-App Notification erstellen |
| **EC-26-16** | Browser | Browser-Notification Permission denied | Nicht erneut fragen, Setting ausblenden |
| **EC-26-17** | Browser | Browser-Notification Permission granted später | Erste Notification sofort zeigen wenn vorhanden |
| **EC-26-18** | Security | User versucht fremde Notification zu lesen | 403 Forbidden (RLS verhindert) |
| **EC-26-19** | Security | User versucht fremde Notification zu löschen | 403 Forbidden |
| **EC-26-20** | Plan | Free-User versucht Email zu aktivieren | Upsell-Prompt anzeigen |
| **EC-26-21** | Plan | Pro-User versucht Push zu aktivieren | Upsell-Prompt anzeigen |
| **EC-26-22** | Plan | Upgrade während Quiet Hours | Quiet Hours bleiben aktiv, neue Features verfügbar |
| **EC-26-23** | DB | Auto-Cleanup läuft | Notifications älter als Retention-Limit löschen |
| **EC-26-24** | DB | Notification-History sehr groß (>1000) | Pagination, keine Performance-Probleme |
| **EC-26-25** | Sound | Sound deaktiviert aber wichtige Notification | Trotzdem kein Sound, nur Toast |

---

## Nicht-funktionale Anforderungen (NFRs)

### Performance

| Operation | Ziel | Bemerkung |
|-----------|------|-----------|
| Unread-Count laden | < 100ms | Initial Load |
| Notification-Liste laden | < 200ms | Dropdown (letzte 10) |
| History laden | < 300ms | 20 Items mit Pagination |
| Realtime Latency | < 500ms | Von DB-Insert bis Anzeige |
| Preference-Save | < 200ms | Optimistic Update |
| Mark as read | < 100ms | API-Response |
| Max Notifications/User | 10.000 | Auto-cleanup bei Überschreitung |

### Sicherheit

| Anforderung | Implementierung |
|-------------|-----------------|
| RLS | User sieht nur eigene Notifications |
| Rate Limiting | Max 10 Notifications/Minute pro User |
| Input Validation | Zod Schemas für alle Inputs |
| No Data Leak | Keine fremden User-Daten in Notifications |
| Audit Logging | Keine (Notifications sind transient) |

### Datenschutz (DSGVO)

| Anforderung | Implementierung |
|-------------|-----------------|
| Auto-Löschung | Nach Retention-Period (30/90/unlimited Tage) |
| Keine PII in Notifications | Nur IDs referenzieren, keine sensiblen Daten |
| Export | Notifications gehören zum vollständigen Datenexport |
| Löschung bei Account-Delete | Alle Notifications des Users löschen |

---

## API Requirements

### API Endpoints

| Endpoint | Method | Beschreibung | Auth | Plan |
|----------|--------|--------------|------|------|
| `/api/notifications` | GET | Liste aller Notifications | JWT | Alle |
| `/api/notifications/unread` | GET | Nur Unread Notifications | JWT | Alle |
| `/api/notifications/unread-count` | GET | Anzahl Unread | JWT | Alle |
| `/api/notifications/:id/read` | POST | Als gelesen markieren | JWT | Alle |
| `/api/notifications/read-all` | POST | Alle als gelesen | JWT | Alle |
| `/api/notifications/:id` | DELETE | Einzelne löschen | JWT | Alle |
| `/api/notifications/cleanup` | POST | Alte löschen (>30 Tage) | JWT | Alle |
| `/api/notifications/preferences` | GET | Preferences laden | JWT | Alle |
| `/api/notifications/preferences` | POST | Preferences speichern | JWT | Alle |
| `/api/notifications/subscribe` | GET | Realtime Subscription (SSE/WS) | JWT | Alle |

### Request/Response Schemas

#### GET /api/notifications

**Query Params:**
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 50
  status?: 'all' | 'unread' | 'read'; // Default: 'all'
  type?: string; // Filter by type
  from?: string; // ISO Date
  to?: string; // ISO Date
}
```

**Response:**
```typescript
{
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Notification Object
```typescript
interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // Context: { search_id, deal_id, etc. }
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

type NotificationType =
  | 'search_complete'
  | 'export_complete'
  | 'export_failed'
  | 'deal_status_change'
  | 'deal_won'
  | 'deal_lost'
  | 'low_credits'
  | 'credit_purchase_success'
  | 'contact_assigned'
  | 'new_lead'
  | 'subscription_trial_ending'
  | 'subscription_payment_failed'
  | 'system_maintenance'
  | 'welcome';
```

#### POST /api/notifications/:id/read

**Response:**
```typescript
{
  success: true;
  notification: Notification;
}
```

#### POST /api/notifications/read-all

**Request Body:**
```typescript
{
  type?: string; // Optional: nur diesen Typ
}
```

**Response:**
```typescript
{
  success: true;
  updatedCount: number;
}
```

#### GET /api/notifications/preferences

**Response:**
```typescript
{
  preferences: {
    // Global Settings
    browser_notifications: boolean;
    sound_enabled: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string; // "22:00"
    quiet_hours_end: string; // "08:00"

    // Per Type Settings
    types: {
      [key in NotificationType]: {
        in_app: boolean;
        email: boolean;
        push: boolean;
        sound: boolean;
      };
    };
  };
  plan: 'free' | 'pro' | 'enterprise';
  limits: {
    maxNotifications: number;
    retentionDays: number;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
}
```

#### POST /api/notifications/preferences

**Request Body:**
```typescript
{
  browser_notifications?: boolean;
  sound_enabled?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  types?: {
    [key in NotificationType]?: {
      in_app?: boolean;
      email?: boolean;
      push?: boolean;
      sound?: boolean;
    };
  };
}
```

### Error Responses

| Status Code | Error Code | Beschreibung |
|-------------|------------|--------------|
| 400 | INVALID_TYPE | Ungültiger Notification-Typ |
| 400 | INVALID_PREFERENCES | Ungültige Preference-Daten |
| 401 | UNAUTHORIZED | Nicht authentifiziert |
| 403 | PLAN_REQUIRED | Feature nicht im aktuellen Plan |
| 403 | FORBIDDEN | Kein Zugriff auf diese Notification |
| 404 | NOTIFICATION_NOT_FOUND | Notification nicht gefunden |
| 429 | RATE_LIMIT_EXCEEDED | Zu viele Anfragen |

---

## Database Schema Requirements

### notifications Tabelle

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Auto-delete nach 30/90/unlimited Tagen
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

### notification_preferences Tabelle

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,

  -- Global Settings
  browser_notifications BOOLEAN DEFAULT FALSE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'Europe/Berlin',

  -- Per Type Settings (JSONB for flexibility)
  type_settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Insert default preferences for new users
CREATE OR REPLACE FUNCTION handle_new_user_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, type_settings)
  VALUES (
    NEW.id,
    '{
      "search_complete": {"in_app": true, "email": false, "push": false, "sound": true},
      "export_complete": {"in_app": true, "email": false, "push": false, "sound": true},
      "export_failed": {"in_app": true, "email": true, "push": false, "sound": true},
      "deal_status_change": {"in_app": true, "email": false, "push": false, "sound": true},
      "deal_won": {"in_app": true, "email": true, "push": false, "sound": true},
      "deal_lost": {"in_app": true, "email": false, "push": false, "sound": true},
      "low_credits": {"in_app": true, "email": true, "push": true, "sound": true},
      "credit_purchase_success": {"in_app": true, "email": false, "push": false, "sound": true},
      "contact_assigned": {"in_app": true, "email": false, "push": false, "sound": true},
      "new_lead": {"in_app": true, "email": false, "push": false, "sound": true},
      "subscription_trial_ending": {"in_app": true, "email": true, "push": false, "sound": true},
      "subscription_payment_failed": {"in_app": true, "email": true, "push": true, "sound": true},
      "system_maintenance": {"in_app": true, "email": false, "push": false, "sound": false},
      "welcome": {"in_app": true, "email": false, "push": false, "sound": true}
    }'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Trigger für neue User
CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_notifications();
```

### Database Functions

```sql
-- Auto-cleanup Funktion für abgelaufene Notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at < NOW();
END;
$$;

-- Funktion zum Erstellen einer Notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_retention_days INTEGER;
  v_plan TEXT;
BEGIN
  -- Plan des Users ermitteln
  SELECT plan INTO v_plan FROM profiles WHERE id = p_user_id;

  -- Retention-Period basierend auf Plan
  v_retention_days := CASE v_plan
    WHEN 'free' THEN 30
    WHEN 'pro' THEN 90
    ELSE NULL -- Unlimited
  END;

  INSERT INTO notifications (
    user_id, type, title, message, data, action_url, priority, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_action_url, p_priority,
    CASE WHEN v_retention_days IS NOT NULL
      THEN NOW() + (v_retention_days || ' days')::INTERVAL
      ELSE NULL
    END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Funktion zum Zählen von Unread Notifications
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND read = FALSE;

  RETURN v_count;
END;
$$;
```

---

## UI/UX Spezifikationen

### Bell-Icon Komponente

**Position:** Dashboard Header (rechts, neben User-Menu)
**Icon:** Lucide `Bell` (oder `BellRing` bei Unread)
**Badge:** Roter Kreis mit Counter (nur wenn > 0)

**States:**
- Default: Graues Icon
- Hover: Dunklere Farbe
- Active (Dropdown offen): Primäre Farbe
- Unread: Roter Badge + Animation

**Animation:**
- Neues Unread: Sanftes Wackeln (CSS Animation)
- Duration: 500ms
- Iteration: 3x

### Dropdown Panel

**Max-Height:** 400px mit Scroll
**Width:** 360px
**Sections:**
1. Header: "Benachrichtigungen" + "Alle als gelesen" Button
2. Liste: Notification Items
3. Footer: "Alle anzeigen" Link

**Gruppierung:**
- Heute
- Gestern
- Diese Woche
- Älter

**Notification Item:**
```
┌─────────────────────────────────────────────────────────┐
│ ┌─────┐                                                 │
│ │ 🔔  │  Titel der Notification                    5m   │
│ └─────┘  Nachricht-Vorschlag (max 2 Zeilen)...          │
│          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
└─────────────────────────────────────────────────────────┘
```

### Notification History Page

**Route:** `/dashboard/notifications`
**Layout:**
- Filter-Bar oben
- Tabelle mit Sortierung
- Pagination unten
- Bulk-Actions (Delete selected)

### Notification Settings Page

**Route:** `/dashboard/einstellungen/notifications`
**Layout:**
- General Settings Card
- Type Settings Cards (Accordion)
- Save Button (sticky bottom)

---

## Integration Points

### E4 - Lead-Suche Integration

**Trigger:**
```typescript
// In /api/search/route.ts nach Abschluss
await createNotification({
  user_id: user.id,
  type: 'search_complete',
  title: 'Suche abgeschlossen',
  message: `Ihre Suche nach ${branche} in ${stadt} ist fertig. ${count} Leads gefunden.`,
  data: { search_id, count },
  action_url: `/dashboard/suche?result=${search_id}`,
  priority: 'normal'
});
```

### E9 - Export Integration

**Trigger:**
```typescript
// In Export Worker bei Completion
await createNotification({
  user_id: user.id,
  type: exportSuccess ? 'export_complete' : 'export_failed',
  title: exportSuccess ? 'Export bereit' : 'Export fehlgeschlagen',
  message: exportSuccess
    ? `Ihr Export '${filename}' ist bereit zum Download.`
    : `Export '${filename}' konnte nicht erstellt werden.`,
  data: { export_id, filename },
  action_url: '/dashboard/exporte',
  priority: exportSuccess ? 'normal' : 'high'
});
```

### E7 - CRM Integration

**Trigger:**
```typescript
// In /api/deals/[id]/stage/route.ts
await createNotification({
  user_id: user.id,
  type: stage === 'closed_won' ? 'deal_won' : stage === 'closed_lost' ? 'deal_lost' : 'deal_status_change',
  title: stage === 'closed_won' ? 'Deal gewonnen!' : stage === 'closed_lost' ? 'Deal verloren' : 'Deal aktualisiert',
  message: `Deal '${deal.title}' wurde ${stage === 'closed_won' ? 'gewonnen' : stage === 'closed_lost' ? 'verloren' : `auf '${stage}' verschoben`}.`,
  data: { deal_id, stage },
  action_url: `/dashboard/deals?id=${deal_id}`,
  priority: stage === 'closed_won' ? 'high' : 'normal'
});
```

### E3 - Credits Integration

**Trigger:**
```typescript
// In Credit-Verbrauch Logik
if (credits.remaining <= 10) {
  await createNotification({
    user_id: user.id,
    type: 'low_credits',
    title: 'Wenig Credits',
    message: `Nur noch ${credits.remaining} Credits übrig. Jetzt aufladen?`,
    data: { remaining: credits.remaining },
    action_url: '/upgrade',
    priority: 'critical'
  });
}
```

---

## Handoff Checklist

### Für Solution Architect

**Zu designen:**

- [ ] **Architecture Document:** `docs/architecture-e10-notification-system.md`
  - [ ] Component Structure (Bell, Dropdown, NotificationItem)
  - [ ] Realtime Architecture (Supabase Realtime vs SSE)
  - [ ] State Management für Notifications
  - [ ] Sound/Browser-Notification Integration
  - [ ] Queue-System für Quiet Hours

- [ ] **API Contracts:**
  - [ ] Detaillierte Zod Schemas für alle Endpoints
  - [ ] Request/Response Beispiele
  - [ ] Error Handling Strategy
  - [ ] Realtime Protocol Definition

- [ ] **Database Design:**
  - [ ] Vollständige SQL Migrations
  - [ ] Index-Optimierung für große History
  - [ ] RLS Policies
  - [ ] Auto-Cleanup Functions
  - [ ] Trigger für neue User

- [ ] **Realtime Design:**
  - [ ] Supabase Realtime Channel Setup
  - [ ] Subscription Management (Subscribe/Unsubscribe)
  - [ ] Reconnect Logic
  - [ ] Deduplication Strategy

- [ ] **Integration Design:**
  - [ ] Notification Service Interface
  - [ ] Integration Points mit E3/E4/E7/E9
  - [ ] Email/Push Provider Interface

- [ ] **Plan-Gating Matrix:**
  - [ ] Feature-Flags für Email/Push
  - [ ] Limit-Checking Logic
  - [ ] Upgrade-Flow Integration

- [ ] **Tech Stack Decisions:**
  - [ ] Realtime: Supabase Realtime vs custom SSE
  - [ ] Sound Library (optional)
  - [ ] Browser Notification API
  - [ ] Email Provider (Supabase vs SendGrid)

---

### Für Backend Developer

**Zu implementieren:**

- [ ] **Database Migrations:**
  - [ ] `notifications` Tabelle
  - [ ] `notification_preferences` Tabelle
  - [ ] Indexes und RLS Policies
  - [ ] Helper Functions (create_notification, cleanup, etc.)
  - [ ] Trigger für neue User

- [ ] **API Routes:**
  - [ ] `GET /api/notifications` - Liste laden
  - [ ] `GET /api/notifications/unread` - Unread laden
  - [ ] `GET /api/notifications/unread-count` - Count
  - [ ] `POST /api/notifications/:id/read` - Als gelesen markieren
  - [ ] `POST /api/notifications/read-all` - Alle als gelesen
  - [ ] `DELETE /api/notifications/:id` - Löschen
  - [ ] `POST /api/notifications/cleanup` - Alte löschen
  - [ ] `GET /api/notifications/preferences` - Preferences laden
  - [ ] `POST /api/notifications/preferences` - Preferences speichern

- [ ] **Notification Service:**
  - [ ] `createNotification()` Helper
  - [ ] Plan-basierte Retention
  - [ ] Rate Limiting
  - [ ] Quiet Hours Check
  - [ ] Preference Check vor Erstellung

- [ ] **Realtime Setup:**
  - [ ] Supabase Realtime Channel
  - [ ] Broadcast bei neuer Notification
  - [ ] Permission Handling

- [ ] **Integration Helpers:**
  - [ ] Hook für E4 Search Complete
  - [ ] Hook für E9 Export Complete/Failed
  - [ ] Hook für E7 Deal Status Change
  - [ ] Hook für E3 Low Credits
  - [ ] Hook für E8 Subscription Events

- [ ] **Email Integration (Pro/Enterprise):**
  - [ ] Email Template für Notifications
  - [ ] Send-Logik mit Rate Limiting
  - [ ] Bounce Handling

- [ ] **Push Integration (Enterprise):**
  - [ ] Push Service Setup (optional)
  - [ ] Subscription Management

- [ ] **Validation:**
  - [ ] Zod Schemas für alle Inputs
  - [ ] Type-Safety

- [ ] **Error Handling:**
  - [ ] Graceful Degradation bei Realtime-Fehlern
  - [ ] Retry-Logik

---

### Für Frontend Developer

**Zu implementieren:**

- [ ] **Components:**
  - [ ] `NotificationBell` - Bell-Icon mit Badge
  - [ ] `NotificationDropdown` - Dropdown Panel
  - [ ] `NotificationItem` - Einzelne Notification
  - [ ] `NotificationList` - Liste in Dropdown/History
  - [ ] `NotificationHistoryTable` - History-Seite
  - [ ] `NotificationFilters` - Filter-Bar
  - [ ] `NotificationSettingsForm` - Einstellungen
  - [ ] `TypeSettingsCard` - Accordion für Typen
  - [ ] `QuietHoursInput` - Zeit-Einstellung

- [ ] **Hooks:**
  - [ ] `useNotifications()` - Notifications laden/verwalten
  - [ ] `useUnreadCount()` - Unread Count (Realtime)
  - [ ] `useNotificationPreferences()` - Preferences verwalten
  - [ ] `useRealtimeNotifications()` - Realtime Subscription
  - [ ] `useBrowserNotifications()` - Browser-Notification API

- [ ] **Pages:**
  - [ ] `/dashboard/notifications` - History
  - [ ] `/dashboard/einstellungen/notifications` - Settings
  - [ ] Integration in Dashboard Header (Bell)

- [ ] **Plan-Gating:**
  - [ ] Upgrade-Prompt für Email (Free)
  - [ ] Upgrade-Prompt für Push (Free/Pro)
  - [ ] Feature-Deaktivierung basierend auf Plan

- [ ] **Realtime Integration:**
  - [ ] Supabase Realtime Client Setup
  - [ ] Subscription auf notifications Tabelle
  - [ ] Reconnect Logic
  - [ ] Deduplication

- [ ] **Sound Integration:**
  - [ ] Audio-Context Setup
  - [ ] Sound abspielen bei neuer Notification (optional)

- [ ] **Browser Notifications:**
  - [ ] Permission Request
  - [ ] Notification anzeigen
  - [ ] Click Handler (zur App navigieren)

- [ ] **UI States:**
  - [ ] Loading States
  - [ ] Error States
  - [ ] Empty States
  - [ ] Success Toasts

- [ ] **German Localization:**
  - [ ] Alle Labels auf Deutsch
  - [ ] Relative Zeitstempel ("vor 5 Minuten")

---

### Für QA Engineer

**Zu testen:**

- [ ] **Functional Tests:**
  - [ ] Bell-Icon zeigt Counter korrekt
  - [ ] Dropdown öffnet/schließt korrekt
  - [ ] Notification als gelesen markieren funktioniert
  - [ ] Alle als gelesen funktioniert
  - [ ] Einzelne Notification löschen
  - [ ] History-Seite laden und filtern
  - [ ] Preferences speichern und laden
  - [ ] Quiet Hours funktioniert
  - [ ] Sound Toggle funktioniert

- [ ] **Realtime Tests:**
  - [ ] Neue Notification erscheint sofort
  - [ ] Counter aktualisiert sich
  - [ ] Reconnect nach Verbindungsverlust
  - [ ] Keine doppelten Notifications

- [ ] **Integration Tests:**
  - [ ] Search Complete Notification
  - [ ] Export Complete/Failed Notification
  - [ ] Deal Status Change Notification
  - [ ] Low Credits Notification
  - [ ] Credit Purchase Notification

- [ ] **Plan-Gating Tests:**
  - [ ] Free: Keine Email-Option sichtbar
  - [ ] Free: Keine Push-Option sichtbar
  - [ ] Pro: Email verfügbar, Push nicht
  - [ ] Enterprise: Alle Features verfügbar
  - [ ] Upgrade-Prompts korrekt

- [ ] **Edge Case Tests:**
  - [ ] 100+ Unread Notifications
  - [ ] Quiet Hours aktiv
  - [ ] Deleted Content in Notification
  - [ ] Rate Limiting
  - [ ] Notification-Limit erreicht
  - [ ] Browser Notification Permission denied
  - [ ] Sound deaktiviert
  - [ ] Mehrere Tabs geöffnet

- [ ] **Performance Tests:**
  - [ ] Unread-Count < 100ms
  - [ ] History laden < 300ms
  - [ ] Realtime Latenz < 500ms
  - [ ] Große History (>1000 Items)

- [ ] **Security Tests:**
  - [ ] RLS Policies (kein Zugriff auf fremde Notifications)
  - [ ] Rate Limiting (10/Min)
  - [ ] Input Validation

- [ ] **Accessibility Tests:**
  - [ ] ARIA Labels
  - [ ] Keyboard Navigation
  - [ ] Screenreader Kompatibilität

- [ ] **UI/UX Tests:**
  - [ ] Responsive Design (Mobile/Tablet/Desktop)
  - [ ] German Labels korrekt
  - [ ] Animationen flüssig
  - [ ] Loading States

---

## Abhängigkeiten

### Von anderen Epics:

| Epic | Benötigt für | Status |
|------|--------------|--------|
| E3 | low_credits, credit_purchase triggers | COMPLETED |
| E4 | search_complete trigger | COMPLETED |
| E7 | deal_status_change triggers | IN PROGRESS |
| E8 | subscription_trial_ending, payment_failed triggers | PLANNED |
| E9 | export_complete, export_failed triggers | PLANNED |

### Externe Dependencies:

| Dependency | Zweck | Installation |
|------------|-------|--------------|
| Supabase Realtime | Live-Updates | Inkludiert |
| Web Push API | Push Notifications (Enterprise) | Optional |

---

## Open Questions

1. **Soll es eine "Wichtig"-Funktion für Notifications geben?**
   - Vorschlag: Star-Icon zum Markieren wichtiger Notifications

2. **Sollen Notifications archiviert oder gelöscht werden?**
   - Vorschlag: Auto-delete nach Retention-Period (nicht archivieren)

3. **Soll es ein "Snooze" für Notifications geben?**
   - Vorschlag: Nein, zu komplex für MVP

4. **Soll es eine Zusammenfassung (Digest) geben?**
   - Vorschlag: Optional für Pro/Enterprise: Tägliche/Weekly Zusammenfassung

5. **Sollen Admins System-Notifications an alle User senden können?**
   - Vorschlag: Ja, über Admin-Panel (zukünftiges Feature)

---

## Changelog

| Datum | Änderung | Autor |
|-------|----------|-------|
| 2026-02-08 | Initial erstellt mit vollständigen User Stories, API Specs, DB Schema | Requirements Engineer |
| 2026-02-08 | Feature Matrix definiert (Free/Pro/Enterprise) | Requirements Engineer |
| 2026-02-08 | Edge Cases dokumentiert (25 Szenarien) | Requirements Engineer |
| 2026-02-08 | Handoff Checklist für alle Teams hinzugefügt | Requirements Engineer |
| 2026-02-08 | Integration Points mit E3/E4/E7/E8/E9 definiert | Requirements Engineer |

---

**Dokument Version:** 1.0
**Autor:** Requirements Engineer
**Review Status:** Ready for Solution Architect Review
**Nächster Schritt:** Task #6 (Solution Architect) kann beginnen
