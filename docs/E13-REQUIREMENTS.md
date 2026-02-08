# Epic E13: Einstellungen & Profil - Requirements

**Projekt:** Manyleads.io
**Epic:** E13 - Einstellungen & Profil (Settings & Profile)
**Projekt-ID:** PROJ-30
**Status:** IN PROGRESS
**Erstellt:** 2026-02-08
**Sprache:** Deutsche UI

---

## 1. Epic Overview

### Ziel
Epic E13 implementiert ein umfassendes Einstellungs- und Profil-Management-System für Manyleads.io. Nutzer können ihre Profile verwalten, Benachrichtigungseinstellungen konfigurieren, Sicherheitseinstellungen anpassen und Datenschutz-Optionen nutzen.

### Scope
- Profil-Einstellungen (Name, Avatar, Unternehmen)
- Benachrichtigungs-Einstellungen (E10 Integration)
- Sicherheits-Einstellungen (Passwort ändern, 2FA)
- Konto-Einstellungen (Sprache, Zeitzone)
- Datenschutz-Einstellungen (Daten exportieren/löschen)

### Abhängigkeiten

| Epic | Status | Integration |
|------|--------|-------------|
| E2 (Auth) | ✅ COMPLETED | Auth-System, User-Profile |
| E3 (Credits) | ✅ COMPLETED | Credit-Display in Profil |
| E8 (Stripe) | ✅ COMPLETED | Billing/Subscription Management |
| E10 (Notifications) | ✅ COMPLETED | Notification Preferences |

---

## 2. User Stories

### US-13.1: Profil-Einstellungen

**Als** registrierter Nutzer
**möchte ich** mein Profil bearbeiten können
**damit** meine Daten aktuell sind und andere mich korrekt identifizieren können.

#### Acceptance Criteria

| ID | Kriterium | Priorität |
|----|-----------|-----------|
| AC-1.1 | Nutzer kann Vornamen und Nachnamen ändern | Must Have |
| AC-1.2 | Nutzer kann Avatar hochladen (max 2MB, JPG/PNG) | Must Have |
| AC-1.3 | Avatar wird als Circle-Display in Sidebar und Header angezeigt | Must Have |
| AC-1.4 | Nutzer kann Unternehmensnamen eingeben | Should Have |
| AC-1.5 | Nutzer kann Position/Jobtitel eingeben | Could Have |
| AC-1.6 | Änderungen werden sofort gespeichert mit Erfolgsmeldung | Must Have |
| AC-1.7 | Validierung: Name mindestens 2 Zeichen, max 100 Zeichen | Must Have |

#### UI Specifications

**Profil-Seite:** `/dashboard/einstellungen/profil`

```
┌─────────────────────────────────────────────────────────────┐
│ Profil-Einstellungen                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Avatar                                                     │
│  ┌───────────────┐   [Avatar hochladen]    Max 2MB, JPG/PNG │
│  │   [Bild]      │                                           │
│  └───────────────┘                                           │
│                                                             │
│  Persönliche Informationen                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Vorname*          [Max        ]                         ││
│  │ Nachname*         [Mustermann  ]                        ││
│  │ Position          [Geschäftsführer ]                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Unternehmen                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Firmenname        [Muster GmbH       ]                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                        [Abbrechen] [Speichern]
└─────────────────────────────────────────────────────────────┘
```

---

### US-13.2: Benachrichtigungs-Einstellungen

**Als** registrierter Nutzer
**möchte ich** steuern können, welche Benachrichtigungen ich erhalte
**damit** ich nur relevante Informationen bekomme und nicht überflutet werde.

#### Acceptance Criteria

| ID | Kriterium | Priorität |
|----|-----------|-----------|
| AC-2.1 | Nutzer kann In-App Benachrichtigungen pro Typ ein/ausschalten | Must Have |
| AC-2.2 | Unterstützte Typen: Suche abgeschlossen, Export fertig, Deal-Status, Credits niedrig, System-Updates | Must Have |
| AC-2.3 | Einstellungen werden in `notification_preferences` Tabelle gespeichert | Must Have |
| AC-2.4 | Änderungen wirken sich sofort auf neue Benachrichtigungen aus | Must Have |
| AC-2.5 | Master-Toggle "Alle Benachrichtigungen" deaktiviert alle Typen | Should Have |
| AC-2.6 | Browser-Benachrichtigungen können aktiviert werden (optional) | Could Have |

#### UI Specifications

**Benachrichtigungs-Seite:** `/dashboard/einstellungen/benachrichtigungen`

```
┌─────────────────────────────────────────────────────────────┐
│ Benachrichtigungs-Einstellungen                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  In-App Benachrichtigungen                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ Suche abgeschlossen      [Toggle: Ein/Aus]           ││
│  │ ☑ Export fertiggestellt    [Toggle: Ein/Aus]           ││
│  │ ☑ Deal-Status geändert     [Toggle: Ein/Aus]           ││
│  │ ☑ Credits niedrig          [Toggle: Ein/Aus]           ││
│  │ ☐ System-Updates           [Toggle: Ein/Aus]           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Zusätzliche Kanäle                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☐ E-Mail Benachrichtigungen [Toggle: Ein/Aus]          ││
│  │ ☐ Browser-Benachrichtigungen [Toggle: Ein/Aus]         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                        [Zurücksetzen] [Speichern]
└─────────────────────────────────────────────────────────────┘
```

#### Integration mit E10
- API: `/api/notifications/preferences` (GET/PUT)
- Tabelle: `notification_preferences` (bereits in E10 erstellt)
- Frontend: Komponenten aus E10 wiederverwenden

---

### US-13.3: Sicherheits-Einstellungen

**Als** registrierter Nutzer
**möchte ich** meine Sicherheitseinstellungen verwalten können
**damit** mein Konto vor unbefugtem Zugriff geschützt ist.

#### Acceptance Criteria

| ID | Kriterium | Priorität |
|----|-----------|-----------|
| AC-3.1 | Nutzer kann Passwort ändern (altes Passwort erforderlich) | Must Have |
| AC-3.2 | Neues Passwort muss Mindestanforderungen erfüllen (8 Zeichen, 1 Groß, 1 Klein, 1 Zahl) | Must Have |
| AC-3.3 | Bestätigung des neuen Passworts muss übereinstimmen | Must Have |
| AC-3.4 | 2FA kann aktiviert werden (TOTP via Authenticator App) | Should Have |
| AC-3.5 | QR-Code wird angezeigt für 2FA-Einrichtung | Should Have |
| AC-3.6 | Backup-Codes werden generiert bei 2FA-Aktivierung | Should Have |
| AC-3.7 | Aktive Sessions werden angezeigt und können beendet werden | Could Have |

#### UI Specifications

**Sicherheits-Seite:** `/dashboard/einstellungen/sicherheit`

```
┌─────────────────────────────────────────────────────────────┐
│ Sicherheits-Einstellungen                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Passwort ändern                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Aktuelles Passwort      [••••••••    ]                  ││
│  │ Neues Passwort          [••••••••    ]                  ││
│  │ ├─ Mindestens 8 Zeichen          ☑                      ││
│  │ ├─ Groß- und Kleinbuchstaben     ☑                      ││
│  │ └─ Mindestens eine Zahl          ☐                      ││
│  │ Neues Passwort bestät.  [••••••••    ]                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                        [Passwort ändern]    │
│                                                             │
│  Zwei-Faktor-Authentifizierung                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Status: Nicht aktiviert                                 ││
│  │                                                         ││
│  │ [2FA Aktivieren]                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Aktive Sitzungen                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Chrome / Windows - Hamburg, DE - Jetzt     [Beenden]   ││
│  │ Safari / macOS - Berlin, DE - Vor 2 Tagen  [Beenden]   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 2FA Flow

```
Step 1: User klickt "2FA Aktivieren"
    ↓
Step 2: API generiert TOTP-Secret, speichert als "pending"
    ↓
Step 3: QR-Code wird angezeigt (otpauth:// URI)
    ↓
Step 4: User scannt mit Authenticator App
    ↓
Step 5: User gibt 6-stelligen Code ein zur Verifikation
    ↓
Step 6: Bei Erfolg: 2FA aktiviert + 10 Backup-Codes angezeigt
```

---

### US-13.4: Konto-Einstellungen

**Als** registrierter Nutzer
**möchte ich** allgemeine Kontoeinstellungen anpassen können
**damit** die Anwendung meinen Präferenzen entspricht.

#### Acceptance Criteria

| ID | Kriterium | Priorität |
|----|-----------|-----------|
| AC-4.1 | Nutzer kann Sprache auswählen (Deutsch, Englisch) | Should Have |
| AC-4.2 | Nutzer kann Zeitzone auswählen (Europe/Berlin als Default) | Should Have |
| AC-4.3 | Nutzer kann Datumsformat wählen (DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY) | Could Have |
| AC-4.4 | Nutzer kann Währung wählen (EUR, USD, GBP) | Could Have |
| AC-4.5 | Einstellungen werden in `user_settings` Tabelle gespeichert | Must Have |
| AC-4.6 | Zeitzone beeinflusst Datumsanzeige in der gesamten App | Should Have |

#### UI Specifications

**Konto-Seite:** `/dashboard/einstellungen/konto`

```
┌─────────────────────────────────────────────────────────────┐
│ Konto-Einstellungen                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Regionale Einstellungen                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Sprache           [Deutsch ▼]                           ││
│  │ Zeitzone          [Europe/Berlin ▼]                     ││
│  │ Datumsformat      [DD.MM.YYYY ▼]                        ││
│  │ Währung           [EUR ▼]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Account-Informationen                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ E-Mail              max@example.com                     ││
│  │ Registriert am      08.02.2026                          ││
│  │ Aktueller Plan      Professional                        ││
│  │                                                     [Upgrade]│
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                        [Abbrechen] [Speichern]
└─────────────────────────────────────────────────────────────┘
```

---

### US-13.5: Datenschutz-Einstellungen (GDPR)

**Als** registrierter Nutzer
**möchte ich** meine Daten exportieren oder löschen können
**damit** ich meine Datenschutzrechte gemäß DSGVO ausüben kann.

#### Acceptance Criteria

| ID | Kriterium | Priorität |
|----|-----------|-----------|
| AC-5.1 | Nutzer kann alle gespeicherten Daten als JSON exportieren | Must Have |
| AC-5.2 | Export enthält: Profil, Credits, Suchverlauf, Sammlungen, CRM-Daten | Must Have |
| AC-5.3 | Export wird als Download bereitgestellt | Must Have |
| AC-5.4 | Nutzer kann Konto löschen (Soft-Delete mit 30-Tage Grace Period) | Must Have |
| AC-5.5 | Bei Löschung: Warnung über irreversible Datenverlust | Must Have |
| AC-5.6 | Bei Löschung: Bestätigung durch Eingabe der E-Mail erforderlich | Must Have |
| AC-5.7 | Daten werden nach 30 Tagen endgültig gelöscht (Hard-Delete) | Must Have |
| AC-5.8 | Admin wird über Löschung informiert | Could Have |

#### UI Specifications

**Datenschutz-Seite:** `/dashboard/einstellungen/datenschutz`

```
┌─────────────────────────────────────────────────────────────┐
│ Datenschutz-Einstellungen                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Datenexport (DSGVO Art. 20)                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Lade alle deine Daten im JSON-Format herunter:          ││
│  │                                                         ││
│  │ • Profil-Informationen                                  ││
│  │ • Credit-Transaktionen                                  ││
│  │ • Suchverlauf und Ergebnisse                            ││
│  │ • Sammlungen                                            ││
│  │ • CRM-Kontakte und Deals                                ││
│  │ • Benachrichtigungen                                    ││
│  │                                                         ││
│  │ [Alle Daten exportieren]                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Konto löschen                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ Achtung: Diese Aktion kann nicht rückgängig gemacht  ││
│  │ werden!                                                 ││
│  │                                                         ││
│  │ Dein Konto wird sofort deaktiviert. Alle Daten werden   ││
│  │ nach 30 Tagen endgültig gelöscht.                       ││
│  │                                                         ││
│  │ [Konto löschen]                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Lösch-Flow

```
Step 1: User klickt "Konto löschen"
    ↓
Step 2: Modal mit Warnung und Konsequenzen
    ↓
Step 3: User muss E-Mail zur Bestätigung eingeben
    ↓
Step 4: Bei Übereinstimmung: Soft-Delete ausführen
    ↓
Step 5: User wird ausgeloggt, Account als "pending_deletion" markiert
    ↓
Step 6: Cron-Job löscht nach 30 Tagen endgültig
```

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Seiten laden in < 500ms
- Avatar-Upload: Progress-Indikator für Dateien > 500KB
- Settings-Änderungen: Sofortige Feedback (< 200ms)

### 3.2 Security
- Alle Änderungen erfordern gültige Session
- Passwort-Änderung erfordert aktuelles Passwort
- 2FA-Setup erfordert Verifikation vor Aktivierung
- Datenexport enthält nur eigene Daten (RLS enforced)
- Konto-Löschung erfordert E-Mail-Bestätigung

### 3.3 Accessibility
- Alle Formulare mit Labels und ARIA-Attributen
- Toggle-Switches: Tastatur-navigierbar
- Fehlermeldungen: Screen-Reader kompatibel
- Kontrastverhältnis mind. 4.5:1

### 3.4 Internationalization
- Alle Strings in deutscher Sprache (Primary)
- English-Support als Fallback (optional)
- Datumsformate lokalisierbar

---

## 4. Datenbank Schema

### Neue Tabellen

#### user_settings
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Regional Settings
  language VARCHAR(10) DEFAULT 'de',
  timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
  date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);
```

#### user_sessions (optional für aktive Sessions)
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  session_token_hash TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Erweiterungen bestehender Tabellen

#### profiles (Erweiterung)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  company_name TEXT,
  job_title TEXT,
  avatar_url TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- encrypted
  pending_deletion_at TIMESTAMP WITH TIME ZONE,
  deletion_requested_at TIMESTAMP WITH TIME ZONE;
```

---

## 5. API Specification

### 5.1 Profile Settings

#### GET /api/settings/profile
```json
{
  "first_name": "Max",
  "last_name": "Mustermann",
  "email": "max@example.com",
  "company_name": "Muster GmbH",
  "job_title": "Geschäftsführer",
  "avatar_url": "https://..."
}
```

#### PATCH /api/settings/profile
Request:
```json
{
  "first_name": "Max",
  "last_name": "Mustermann",
  "company_name": "Muster GmbH",
  "job_title": "Geschäftsführer"
}
```

#### POST /api/settings/avatar
- Content-Type: multipart/form-data
- Max size: 2MB
- Accepted: image/jpeg, image/png

Response:
```json
{
  "avatar_url": "https://...",
  "updated_at": "2026-02-08T10:00:00Z"
}
```

### 5.2 Security Settings

#### GET /api/settings/security
```json
{
  "has_password": true,
  "two_factor_enabled": false,
  "sessions": [
    {
      "id": "...",
      "device": "Chrome / Windows",
      "location": "Hamburg, DE",
      "last_active": "2026-02-08T10:00:00Z",
      "is_current": true
    }
  ]
}
```

#### POST /api/settings/password
Request:
```json
{
  "current_password": "...",
  "new_password": "..."
}
```

#### POST /api/settings/2fa/setup
Response:
```json
{
  "secret": "BASE32SECRET",
  "qr_code_url": "otpauth://totp/Manyleads:max@example.com?secret=...",
  "backup_codes": ["12345678", "87654321", "..."]
}
```

#### POST /api/settings/2fa/verify
Request:
```json
{
  "code": "123456",
  "secret": "BASE32SECRET"
}
```

Response:
```json
{
  "enabled": true,
  "backup_codes": ["12345678", "87654321", "..."]
}
```

### 5.3 Account Settings

#### GET /api/settings/account
```json
{
  "email": "max@example.com",
  "created_at": "2026-02-08T10:00:00Z",
  "plan_tier": "professional",
  "settings": {
    "language": "de",
    "timezone": "Europe/Berlin",
    "date_format": "DD.MM.YYYY",
    "currency": "EUR"
  }
}
```

#### PUT /api/settings/account
Request:
```json
{
  "language": "de",
  "timezone": "Europe/Berlin",
  "date_format": "DD.MM.YYYY",
  "currency": "EUR"
}
```

### 5.4 Privacy Settings

#### POST /api/settings/export
Response:
```json
{
  "download_url": "https://...",
  "expires_at": "2026-02-08T11:00:00Z"
}
```

#### POST /api/settings/delete-account
Request:
```json
{
  "confirmation_email": "max@example.com"
}
```

Response:
```json
{
  "scheduled_at": "2026-03-10T10:00:00Z",
  "message": "Konto wird am 10.03.2026 endgültig gelöscht"
}
```

---

## 6. Frontend Routes

| Route | Beschreibung | Komponente |
|-------|--------------|------------|
| `/dashboard/einstellungen` | Settings Overview (Redirect zu Profil) | SettingsPage |
| `/dashboard/einstellungen/profil` | Profil-Einstellungen | ProfileSettings |
| `/dashboard/einstellungen/benachrichtigungen` | Benachrichtigungen | NotificationSettings |
| `/dashboard/einstellungen/sicherheit` | Sicherheit | SecuritySettings |
| `/dashboard/einstellungen/konto` | Konto-Einstellungen | AccountSettings |
| `/dashboard/einstellungen/datenschutz` | Datenschutz | PrivacySettings |
| `/dashboard/einstellungen/abonnement` | Abonnement (E8) | SubscriptionSettings |
| `/dashboard/einstellungen/abrechnung` | Rechnungen (E8) | BillingSettings |

---

## 7. Component Specifications

### 7.1 Settings Layout
- Sidebar mit allen Settings-Kategorien
- Aktiver State für aktuelle Kategorie
- Mobile: Collapsible Menu oder Tabs

### 7.2 Form Components
- ProfileForm: Name, Company, Job Title inputs
- AvatarUpload: Dropzone + Preview + Validation
- PasswordForm: Current/New/Confirm mit Strength Meter
- TwoFactorSetup: QR-Code Display + Verification Input
- RegionalSettings: Selects für Language, Timezone, Date Format
- DangerZone: Export + Delete Account (red styling)

### 7.3 Reused Components
- ToggleSwitch: shadcn/ui Switch
- FormSection: Card mit Header und Content
- SettingItem: Label + Description + Control
- ConfirmDialog: Modal für kritische Aktionen

---

## 8. Integration Points

### 8.1 E2 (Auth)
- Profile-Daten aus `profiles` Tabelle
- Passwort-Änderung via Supabase Auth API
- Session-Management für aktive Sessions

### 8.2 E3 (Credits)
- Credit-Balance-Anzeige in Profil
- Link zu Credits-Seite

### 8.3 E8 (Stripe)
- Abonnement-Status anzeigen
- Link zu Upgrade/Change Plan
- Rechnungs-Historie

### 8.4 E10 (Notifications)
- Notification Preferences werden hier konfiguriert
- Reuse API: `/api/notifications/preferences`

---

## 9. Success Criteria

| Kriterium | Messung |
|-----------|---------|
| Profil-Änderungen | 100% der AC von US-13.1 erfüllt |
| Benachrichtigungen | 100% der AC von US-13.2 erfüllt |
| Sicherheit | Passwort-Änderung funktioniert, 2FA optional |
| Konto | Einstellungen werden korrekt gespeichert |
| Datenschutz | Export funktioniert, Löschung mit Grace Period |
| Performance | Pages laden in < 500ms |
| Security | Keine Security Vulnerabilities im Test |

---

## 10. Risks & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Avatar-Upload zu langsam | Medium | Medium | Progress-Indikator, Client-Resize |
| 2FA zu komplex | Medium | Low | Als optional markieren, gute UX |
| Datenexport zu groß | Low | High | Streaming, Größen-Limit, ZIP |
| Konto-Löschung irreversibel | Medium | High | 30-Tage Grace Period, Bestätigung |

---

## 11. Appendix

### A. Validations

**Name Validation:**
- Min: 2 Zeichen
- Max: 100 Zeichen
- Erlaubt: Buchstaben (inkl. Umlaute), Leerzeichen, Bindestriche

**Password Validation:**
- Min: 8 Zeichen
- Max: 128 Zeichen
- Muss enthalten: 1 Groß, 1 Klein, 1 Zahl
- Optional: 1 Sonderzeichen

**Avatar Validation:**
- Max: 2MB
- Formate: JPEG, PNG
- Min Dimensions: 128x128
- Max Dimensions: 2048x2048

### B. Timezones
```javascript
const SUPPORTED_TIMEZONES = [
  'Europe/Berlin',
  'Europe/Vienna',
  'Europe/Zurich',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore'
];
```

### C. Languages
```javascript
const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
];
```

---

**Document Status:** READY FOR ARCHITECTURE
**Next Step:** Solution Architect erstellt Architecture Document
