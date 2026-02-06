# Manyleads.io - Vollständige Projektdokumentation

## 📌 Projektübersicht

**Manyleads.io** ist eine professionelle B2B Lead-Generierungs-Plattform, die mithilfe von KI und Google Maps-Integration Unternehmen dabei hilft, qualifizierte Leads zu finden. Die Plattform bietet eine intuitive Benutzeroberfläche, ein umfassendes CRM-System und verschiedene Abonnement-Modelle.

### Kernfunktionen
- 🔍 **KI-gestützte Lead-Suche** über Google Maps
- 👥 **Entscheider-Suche** (Inhaber, Geschäftsführer, Ansprechpartner)
- 📊 **CRM-System** für Lead-Management
- 💳 **Stripe-Integration** für Abonnements und Credit-Pakete
- 📥 **CSV/Excel Export** der Suchergebnisse
- 🔔 **Echtzeit-Benachrichtigungen**
- 🌐 **Social Media Daten-Extraktion**

### Inhaber & Branding
- **Marke**: Manyleads.io
- **Inhaber**: Tolgahan Fistikeken

---

## 🏗️ Technologie-Stack

### Frontend
| Technologie | Version | Zweck |
|------------|---------|-------|
| React | 18.3.1 | UI Framework |
| TypeScript | - | Typsichere Entwicklung |
| Vite | - | Build Tool & Dev Server |
| Tailwind CSS | - | Utility-first CSS |
| shadcn/ui | - | UI Komponenten-Bibliothek |
| React Router | 6.30.1 | Client-side Routing |
| TanStack Query | 5.83.0 | Server-State Management |
| Framer Motion | - | Animationen (indirekt via Komponenten) |

### Backend (Lovable Cloud / Supabase)
| Technologie | Zweck |
|------------|-------|
| Supabase | Datenbank, Auth, Edge Functions |
| PostgreSQL | Relationale Datenbank |
| Row Level Security (RLS) | Datensicherheit |
| Supabase Realtime | Live-Updates |
| Edge Functions (Deno) | Serverless Backend-Logik |

### Externe Dienste
| Dienst | Zweck |
|--------|-------|
| Stripe | Zahlungsabwicklung |
| n8n | Workflow-Automatisierung für Scraping |
| Google Maps API | Unternehmenssuche |
| Apify | Web-Scraping (alternativ) |

---

## 📁 Projektstruktur

```
manyleads/
├── public/                     # Statische Assets
│   ├── favicon.ico
│   ├── lovable-uploads/        # Hochgeladene Bilder
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/             # React-Komponenten
│   │   ├── ui/                 # shadcn/ui Basiskomponenten
│   │   ├── dashboard/          # Dashboard-spezifische Komponenten
│   │   ├── AppSidebar.tsx      # Haupt-Navigation
│   │   ├── GoogleMap.tsx       # Lead-Suche Hauptkomponente (4000+ Zeilen)
│   │   ├── ActiveSearchBanner.tsx
│   │   ├── AdminRoute.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── CollectionPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── FeedbackDialog.tsx
│   │   ├── FAQDialog.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── SmartFiltersDialog.tsx
│   │   ├── QuickFiltersDialog.tsx
│   │   ├── SearchRecoveryDialog.tsx
│   │   ├── ForgotPasswordDialog.tsx
│   │   └── Footer.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentifizierungs-Kontext
│   │
│   ├── hooks/
│   │   ├── useCredits.ts       # Credit-System mit Realtime-Sync
│   │   ├── useCRM.ts           # CRM-Operationen
│   │   ├── useNotifications.ts
│   │   ├── useActiveSearch.tsx
│   │   ├── useApifyProgress.ts
│   │   ├── useSearchPersistence.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── integrations/
│   │   ├── lovable/            # Lovable-Cloud Integration
│   │   └── supabase/
│   │       ├── client.ts       # Supabase Client (auto-generiert)
│   │       └── types.ts        # Datenbank-Typen (auto-generiert)
│   │
│   ├── lib/
│   │   ├── utils.ts            # Utility-Funktionen (cn, etc.)
│   │   ├── tasks.ts            # Such-Schritte Definition
│   │   └── useTaskProgress.ts  # Fortschrittsanzeige
│   │
│   ├── pages/
│   │   ├── Index.tsx           # Suche-Seite (geschützt)
│   │   ├── BusinessLanding.tsx # Landing Page (öffentlich)
│   │   ├── Dashboard.tsx       # Dashboard (geschützt)
│   │   ├── CRM.tsx             # CRM-System (geschützt)
│   │   ├── Pricing.tsx         # Preisseite
│   │   ├── Auth.tsx            # Login/Registrierung
│   │   ├── ResetPassword.tsx   # Passwort zurücksetzen
│   │   ├── Admin.tsx           # Admin-Dashboard (Admin-only)
│   │   ├── CollectionDetails.tsx # Sammlungs-Details
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── Help.tsx
│   │   ├── Privacy.tsx
│   │   ├── Terms.tsx
│   │   ├── Impressum.tsx
│   │   ├── AnwendungsfaellePage.tsx
│   │   ├── Resources.tsx
│   │   └── NotFound.tsx
│   │
│   ├── utils/
│   │   ├── subscriptionAccess.ts  # Abo-Zugriffskontrolle
│   │   └── demoData.ts            # Demo-Daten Generator
│   │
│   ├── App.tsx                 # Haupt-App mit Routing
│   ├── App.css
│   ├── main.tsx                # Entry Point
│   └── index.css               # Design System (CSS Variablen)
│
├── supabase/
│   ├── config.toml             # Supabase Konfiguration
│   └── functions/              # Edge Functions
│       ├── apify-google-maps/
│       ├── apify-progress-webhook/
│       ├── create-checkout/
│       ├── extract-business-info/
│       ├── get-google-maps-key/
│       ├── google-maps-proxy/
│       ├── linkedin-search-pdl/
│       ├── n8n-proxy/
│       ├── n8n-results-webhook/
│       ├── reset-subscription-credits/
│       ├── scrape-social-media/
│       └── stripe-webhook/
│
├── .lovable/
│   └── plan.md                 # Entwicklungs-Plan
│
├── tailwind.config.ts          # Tailwind Konfiguration
├── vite.config.ts              # Vite Konfiguration
├── tsconfig.json               # TypeScript Konfiguration
└── components.json             # shadcn/ui Konfiguration
```

---

## 🎨 Design System

### Farbpalette (HSL-Format)

```css
/* Heller Modus */
--background: 0 0% 100%;           /* Weiß */
--foreground: 222.2 84% 4.9%;      /* Fast Schwarz */
--primary: 217 91% 60%;            /* Blau */
--accent: 270 95% 75%;             /* Lila/Violett */
--muted: 210 40% 96.1%;            /* Helles Grau */
--destructive: 0 84.2% 60.2%;      /* Rot */

/* Dunkler Modus */
--background: 222.2 84% 4.9%;      /* Fast Schwarz */
--foreground: 210 40% 98%;         /* Weiß */
--primary: 217 91% 60%;            /* Blau */
--accent: 270 95% 75%;             /* Lila/Violett */
```

### Gradienten
```css
--gradient-primary: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(270 95% 75%) 100%);
--gradient-secondary: linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(210 40% 96%) 100%);
--gradient-accent: linear-gradient(135deg, hsl(270 95% 75%) 0%, hsl(260 95% 80%) 100%);
```

### Schatten
```css
--shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-medium: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-large: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-glow: 0 0 20px rgba(59, 130, 246, 0.15);
```

### Animationen
- `animate-fade-in`: Einblenden mit leichtem Slide-up
- `animate-scale-in`: Skalieren beim Erscheinen
- `animate-slide-up`: Von unten nach oben sliden
- `animate-pulse-glow`: Pulsierender Glow-Effekt

### UI-Konventionen
- **Buttons**: Kompakt (h-9 w-9) mit Tooltips
- **Cards**: Mit `glass-card` Klasse für Glasmorphismus
- **Gradient Text**: `.gradient-text` für Markentext
- **Hover Effects**: `.hover-lift` für Karteneffekte

---

## 🗄️ Datenbank-Schema

### Tabellen-Übersicht

#### `profiles` - Benutzerprofile
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Benutzer-ID (= auth.uid) |
| email | TEXT | E-Mail Adresse |
| full_name | TEXT | Vollständiger Name |
| avatar_url | TEXT | Profilbild URL |
| created_at | TIMESTAMP | Erstellungsdatum |
| updated_at | TIMESTAMP | Aktualisierungsdatum |

#### `user_credits` - Credit-System
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID (FK) | Benutzer-ID |
| total_credits | INTEGER | Gesamt-Credits |
| used_credits | INTEGER | Verbrauchte Credits |
| created_at | TIMESTAMP | Erstellungsdatum |
| updated_at | TIMESTAMP | Aktualisierungsdatum |

**RLS Policies**: Benutzer können nur eigene Credits lesen/bearbeiten.

#### `subscriptions` - Abonnements
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| plan_name | TEXT | Plan (Free/Starter/Pro/Enterprise) |
| status | TEXT | Status (active/canceled) |
| stripe_customer_id | TEXT | Stripe Kunden-ID |
| stripe_subscription_id | TEXT | Stripe Abo-ID |
| current_period_start | TIMESTAMP | Abrechnungsperiode Start |
| current_period_end | TIMESTAMP | Abrechnungsperiode Ende |

**RLS Policies**: Nur Leserechte für eigene Abonnements.

#### `payments` - Zahlungen
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| product_type | TEXT | 'subscription' oder 'credit_pack' |
| plan_name | TEXT | Plan-Name (bei Abos) |
| credits_amount | INTEGER | Credit-Menge (bei Paketen) |
| amount_paid | INTEGER | Betrag in Cent |
| currency | TEXT | Währung (default: 'eur') |
| status | TEXT | pending/completed |
| stripe_session_id | TEXT | Stripe Session ID |
| stripe_payment_intent_id | TEXT | Stripe Payment Intent ID |

**RLS Policies**: Nur Leserechte für eigene Zahlungen.

#### `search_results` - Suchergebnisse
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| search_id | TEXT | Eindeutige Such-ID |
| user_id | UUID | Benutzer-ID |
| query_params | JSONB | Suchparameter |
| status | TEXT | processing/completed/failed |
| progress | INTEGER | Fortschritt (0-100) |
| total_expected | INTEGER | Erwartete Ergebnisse |
| results | JSONB | Suchergebnisse |
| error_message | TEXT | Fehlermeldung |

#### `search_collections` - Gespeicherte Sammlungen
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| search_query | TEXT | Suchanfrage |
| location | TEXT | Standort |
| results_count | INTEGER | Anzahl Ergebnisse |
| search_results | JSONB | Vollständige Ergebnisse |
| csv_data | TEXT | CSV Export-Daten |
| filename | TEXT | Export-Dateiname |

#### `crm_contacts` - CRM Kontakte
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| name | TEXT | Kontaktname |
| company | TEXT | Firmenname |
| email | TEXT | E-Mail |
| phone | TEXT | Telefon |
| website | TEXT | Webseite |
| address | TEXT | Adresse |
| street | TEXT | Straße |
| city | TEXT | Stadt |
| country_code | TEXT | Ländercode |
| stage | TEXT | Lead/Qualifiziert/Opportunity/Kunde |
| status | TEXT | nicht_angegangen/kontaktiert/interessiert/nicht_interessiert |
| source | TEXT | Herkunft |
| url | TEXT | Google Maps URL (für Duplikat-Check) |
| category_name | TEXT | Branchenkategorie |
| contact_count | INTEGER | Kontaktversuche |
| last_contacted | TIMESTAMP | Letzter Kontakt |

#### `notifications` - Benachrichtigungen
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| type | TEXT | Benachrichtigungstyp |
| title | TEXT | Titel |
| message | TEXT | Nachricht |
| metadata | JSONB | Zusätzliche Daten |
| read | BOOLEAN | Gelesen-Status |

#### `user_roles` - Admin-Rollen
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| role | ENUM | admin/moderator/user |

#### `feedback` - Nutzerfeedback
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| user_id | UUID | Benutzer-ID |
| email | TEXT | E-Mail |
| message | TEXT | Feedback-Nachricht |
| attachment_url | TEXT | Anhang URL |
| status | TEXT | neu/bearbeitet/in_bearbeitung |

#### `contact_submissions` - Kontaktanfragen
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID (PK) | Primärschlüssel |
| name | TEXT | Name |
| email | TEXT | E-Mail |
| subject | TEXT | Betreff |
| message | TEXT | Nachricht |
| status | TEXT | neu/bearbeitet |
| processed_at | TIMESTAMP | Bearbeitungszeitpunkt |

#### `apify_progress_updates` - Scraping-Fortschritt
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| search_id | TEXT | Such-ID |
| run_id | TEXT | Apify Run ID |
| status | TEXT | Status |
| processed_items | INTEGER | Verarbeitete Items |
| phase | TEXT | maps/enrichment |
| dataset_id | TEXT | Dataset ID |
| message | TEXT | Statusnachricht |

---

## 💳 Preismodell & Abonnements

### Abo-Pläne

| Plan | Preis | Credits/Monat | Features |
|------|-------|---------------|----------|
| **Kostenlos** | €0 | 30 (einmalig) | Standard-Daten |
| **Starter** | €19/Monat | 150 | + Ansprechpartner (teilweise geblurrt), Social Media (teilweise) |
| **Pro** | €49/Monat | 500 | + Voller Zugriff auf alle Daten, CSV Export, Smart Filter |
| **Enterprise** | €199/Monat | 1.500 | + API-Zugang, Team-Accounts, Priorisierter Support |

### Credit-Pakete (Einmalkauf)

| Paket | Preis | Pro Lead | Ersparnis |
|-------|-------|----------|-----------|
| 100 Credits | €29 | €0,29 | - |
| 500 Credits | €99 | €0,19 | 33% |
| 1.000 Credits | €149 | €0,15 | 48% |

### Feature-Zugriff Matrix

```typescript
type FeatureAccess = boolean | 'partial';

const accessMatrix = {
  social_media: { 
    free: false, 
    starter: 'partial',  // Erste 1-2 Links sichtbar
    pro: true, 
    enterprise: true 
  },
  contact_person: { 
    free: false, 
    starter: 'partial',  // Teilweise sichtbar
    pro: true, 
    enterprise: true 
  },
  email: { 
    free: false, 
    starter: false, 
    pro: true, 
    enterprise: true 
  },
  csv_export: { 
    free: false, 
    starter: false, 
    pro: true, 
    enterprise: true 
  },
  advanced_filters: { 
    free: false, 
    starter: false, 
    pro: true, 
    enterprise: true 
  },
  api_access: { 
    free: false, 
    starter: false, 
    pro: false, 
    enterprise: true 
  },
  team_accounts: { 
    free: false, 
    starter: false, 
    pro: false, 
    enterprise: true 
  },
};
```

### Credit-Verbrauch

- **Standard-Suche**: 1 Credit pro Lead
- **Entscheider-Suche**: 1 Credit pro Lead + 0,5 Credit pro gefundenem Entscheider

### Credit-Aufladung (Abonnenten)

Ein täglicher pg_cron Job (00:05 Uhr) lädt die Credits zum Periodenbeginn auf:
- Starter: +150 Credits
- Pro: +500 Credits
- Enterprise: +1.500 Credits

---

## 🔐 Authentifizierung

### Auth-Methoden
- **E-Mail/Passwort**: Standard-Registrierung und Login
- **Google OAuth**: Social Login via Lovable Cloud Auth

### Auth-Flow

```
┌──────────────┐     ┌────────────────┐     ┌───────────────┐
│   User       │────▶│  Auth Page     │────▶│   Supabase    │
│   (/auth)    │     │  (Email/Google)│     │   Auth        │
└──────────────┘     └────────────────┘     └───────────────┘
                              │                      │
                              │   onAuthStateChange  │
                              │◀─────────────────────│
                              │                      │
                              ▼                      ▼
                     ┌────────────────┐     ┌───────────────┐
                     │  AuthContext   │────▶│   profiles    │
                     │  (User State)  │     │   (upsert)    │
                     └────────────────┘     └───────────────┘
```

### Geschützte Routen

```typescript
// ProtectedRoute.tsx - Prüft ob User eingeloggt ist
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

// AdminRoute.tsx - Prüft Admin-Rolle in user_roles Tabelle
<Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
```

### Passwort-Reset-Flow
1. User klickt "Passwort vergessen"
2. `ForgotPasswordDialog` sendet Reset-Email via Supabase
3. Email enthält Link zu `/auth/reset-password`
4. `ResetPassword.tsx` ermöglicht neues Passwort

---

## 🔍 Lead-Suche (Kernfunktion)

### Komponente: `GoogleMap.tsx`

Die Hauptkomponente für die Lead-Suche (4000+ Zeilen) bietet:

### Such-Modi
- **Business-Suche**: Unternehmen über Google Maps finden
- **People-Suche**: Entscheider/Personen finden (Premium)

### Suchparameter
- **Suchbegriff**: z.B. "Restaurant", "Friseur", "Anwalt"
- **Standort**: Stadt, PLZ oder Region
- **Max. Ergebnisse**: 1-500 Leads
- **Mit Entscheidern**: Upsell-Option für Ansprechpartner

### Datenstruktur (LeadData)

```typescript
interface LeadData {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  business_status?: string;
  formatted_phone_number?: string;
  website?: string;
  
  // Entscheider-Daten
  contact_person?: string | { 
    first_name?: string; 
    last_name?: string; 
    salutation?: string 
  };
  contact_email?: string;
  
  // Social Media
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
  
  // Zusätzliche Infos
  business_info?: {
    owner?: string;
    ceo?: string;
    contact_person?: string;
    social_media?: {...};
    email?: string;
    legal_form?: string;
    vat_number?: string;
    registration_number?: string;
  };
  
  contact_info?: {
    emails?: string[];
    contact_person?: string;
    social_media?: {...};
  };
  
  opening_hours?: {...};
  quality_score?: number;
  data_completeness?: number;
}
```

### Such-Ablauf

```
┌─────────────────┐
│  1. User gibt   │
│  Suchbegriff    │
│  + Standort ein │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Credit-     │
│  Prüfung        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  3. n8n-proxy   │────▶│  n8n Workflow   │
│  Edge Function  │     │  (Scraping)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │   Realtime Updates    │
         │◀──────────────────────│
         ▼                       │
┌─────────────────┐              │
│  4. Fortschritts-│◀────────────┘
│  anzeige (Steps) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. n8n-results │
│  -webhook       │
│  (Credit-Abzug) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. Ergebnis-   │
│  anzeige +      │
│  Sammlung       │
└─────────────────┘
```

### Such-Schritte Anzeige

```typescript
const SEARCH_STEPS = [
  { id: 'validating', label: 'Anfrage validieren', status: 'pending' },
  { id: 'connecting', label: 'Mit Dienst verbinden', status: 'pending' },
  { id: 'searching', label: 'Unternehmen suchen', status: 'pending' },
  { id: 'extracting', label: 'Daten extrahieren', status: 'pending' },
  { id: 'enriching', label: 'Kontaktdaten anreichern', status: 'pending' },
  { id: 'finishing', label: 'Ergebnisse speichern', status: 'pending' },
];
```

### Filter-System

Das Filter-System verwendet ein "Ja/Nein/Egal" Konzept:

```typescript
interface Filters {
  // Social Media
  hasInstagram: 'ja' | 'nein' | 'egal';
  hasFacebook: 'ja' | 'nein' | 'egal';
  hasLinkedin: 'ja' | 'nein' | 'egal';
  hasYoutube: 'ja' | 'nein' | 'egal';
  hasTiktok: 'ja' | 'nein' | 'egal';
  hasTwitter: 'ja' | 'nein' | 'egal';
  
  // Kontakt & Website
  hasWebsite: 'ja' | 'nein' | 'egal';
  hasEmail: 'ja' | 'nein' | 'egal';
  hasPhone: 'ja' | 'nein' | 'egal';
  
  // Qualität
  hasRating: 'ja' | 'nein' | 'egal';
  hasReviews: 'ja' | 'nein' | 'egal';
  hasPhotos: 'ja' | 'nein' | 'egal';
  minRating: number;
  maxRating: number;
  minReviews: number;
  maxReviews: number;
  
  // Business Status
  isOpenNow: 'ja' | 'nein' | 'egal';
  isOperational: 'ja' | 'nein' | 'egal';
}
```

**Hinweis**: Smart Filter (erweiterte Filter nach Social Media, E-Mail, Bewertung) sind nur für Pro+ Nutzer verfügbar.

---

## 🖥️ CRM-System

### Features
- **Kontakt-Übersicht**: Alle importierten Leads
- **Filter**: Website, E-Mail, Telefon, Status, Stage
- **Status-Tracking**: 
  - nicht_angegangen
  - kontaktiert
  - interessiert
  - nicht_interessiert
- **Stage-Pipeline**:
  - Lead
  - Qualifiziert
  - Opportunity
  - Kunde
- **Bulk-Aktionen**: Mehrfachauswahl, Löschen
- **Edit-Dialog**: Kontaktdaten bearbeiten

### Import aus Suche
Leads können direkt aus den Suchergebnissen ins CRM importiert werden. Die `useCRM.ts` Hook-Funktion `bulkSaveLeadsToCRM` verwendet eine Hash-Logik basierend auf der Google Maps URL zur Duplikatsvermeidung.

---

## 📥 Export-Funktionen

### CSV-Export (Pro+)

Exportierte Felder:
- Unternehmen
- Adresse
- Telefon
- E-Mail
- Website
- Bewertung
- Bewertungen (Anzahl)
- Entscheider
- Instagram
- Facebook
- LinkedIn
- YouTube
- Twitter

### Ansicht-Einstellungen
Benutzer können die Spaltenansicht in der Tabelle anpassen und speichern.

---

## 🛎️ Benachrichtigungssystem

### Notification-Typen
- `search_completed`: Suche abgeschlossen
- `credits_low`: Credits niedrig
- `subscription_renewed`: Abo erneuert

### Realtime-Updates
Benachrichtigungen werden über Supabase Realtime synchronisiert und erscheinen in Echtzeit in der Sidebar (`NotificationBell.tsx`).

---

## 🔧 Edge Functions

### `n8n-proxy`
Leitet Suchanfragen an den n8n Workflow weiter.

### `n8n-results-webhook`
Empfängt Suchergebnisse von n8n:
1. Speichert Ergebnisse in `search_results`
2. Berechnet Credit-Verbrauch
3. Zieht Credits ab (`user_credits`)
4. Erstellt Sammlung in `search_collections`
5. Erstellt Benachrichtigung

### `create-checkout`
Erstellt Stripe Checkout Sessions für:
- Abonnements (subscription)
- Credit-Pakete (credit_pack)

### `stripe-webhook`
Verarbeitet Stripe Events:
- `checkout.session.completed`: Zahlung erfolgreich
- `customer.subscription.deleted`: Abo gekündigt

### `apify-google-maps`
Alternative Scraping-Methode über Apify.

### `apify-progress-webhook`
Fortschritts-Updates von Apify.

### `extract-business-info`
Extrahiert Geschäftsinformationen aus Webseiten.

### `scrape-social-media`
Findet Social Media Links.

### `linkedin-search-pdl`
Sucht Personen über People Data Labs API.

### `reset-subscription-credits`
Setzt Credits zum Periodenbeginn zurück (cron-triggered).

### `get-google-maps-key`
Liefert Google Maps API Key für Frontend.

### `google-maps-proxy`
Proxy für Google Maps API Anfragen.

---

## 👨‍💼 Admin-Dashboard

### Zugriff
Nur Benutzer mit `role: 'admin'` in `user_roles` Tabelle.

### Features
- **Kontaktanfragen**: Übersicht aller Anfragen, Status-Änderung, Löschung
- **Feedback**: Übersicht aller Feedbacks mit Anhängen
- **Statistiken**: Neue Anfragen, Neues Feedback

### Admin-Route Protection

```typescript
// AdminRoute.tsx
const AdminRoute = ({ children }) => {
  // Prüft has_role(auth.uid(), 'admin') via Supabase
  // Redirect zu / wenn kein Admin
};
```

---

## 🔄 Realtime-Features

### Credit-Synchronisation
```typescript
// useCredits.ts
supabase
  .channel('credits-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_credits',
    filter: `user_id=eq.${userIdRef.current}`,
  }, (payload) => {
    // Update lokaler State
  })
  .subscribe();
```

### Aktive Suche Banner
`ActiveSearchBanner.tsx` zeigt den Fortschritt einer laufenden Suche global an.

---

## 🛣️ Routing-Übersicht

### Öffentliche Routen
| Route | Komponente | Beschreibung |
|-------|-----------|--------------|
| `/` | BusinessLanding | Landing Page |
| `/auth` | Auth | Login/Registrierung |
| `/auth/reset-password` | ResetPassword | Passwort zurücksetzen |
| `/pricing` | Pricing | Preisseite |
| `/resources` | Resources | Blog/Ressourcen |
| `/anwendungsfaelle` | AnwendungsfaellePage | Use Cases |
| `/about` | About | Über uns |
| `/contact` | Contact | Kontakt |
| `/help` | Help | Hilfe |
| `/privacy` | Privacy | Datenschutz |
| `/terms` | Terms | AGB |
| `/impressum` | Impressum | Impressum |

### Geschützte Routen (Login erforderlich)
| Route | Komponente | Beschreibung |
|-------|-----------|--------------|
| `/search` | Index | Lead-Suche |
| `/dashboard` | Dashboard | Dashboard |
| `/crm` | CRM | CRM-System |
| `/history` | HistoryPage | Suchverlauf |
| `/collection` | CollectionPage | Sammlungen |
| `/collection/:id` | CollectionDetails | Sammlungs-Details |

### Admin-Route
| Route | Komponente | Beschreibung |
|-------|-----------|--------------|
| `/admin` | Admin | Admin-Dashboard |

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-Spezifisches
- Hamburger-Menü auf Landing Page
- Collapsible Sidebar
- Touch-freundliche Buttons
- Responsive Tabellen mit horizontalem Scroll

### Hook: `use-mobile.tsx`
```typescript
const isMobile = useIsMobile(); // < 768px
```

---

## 🔒 Sicherheit

### Row Level Security (RLS)
Alle Tabellen haben RLS-Policies die sicherstellen, dass:
- Benutzer nur eigene Daten lesen/bearbeiten können
- Admins erweiterte Rechte haben
- Öffentliche Formulare (Kontakt, Feedback) von allen eingereicht werden können

### Auth Token Handling
- Supabase Auth Token wird automatisch bei allen API-Calls mitgesendet
- Edge Functions validieren Token für geschützte Operationen
- Service Role Key nur serverseitig (Edge Functions)

### DSGVO-Konformität
- Datenschutzerklärung vorhanden
- Impressum mit vollständigen Angaben
- Datenminimierung bei Lead-Daten

---

## 🧪 Development

### Lokale Entwicklung
```bash
npm install
npm run dev
```

### Umgebungsvariablen
Die `.env` Datei wird automatisch von Lovable Cloud verwaltet:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Edge Function Secrets
Über Lovable Cloud Settings:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_PRICE_CREDITS_100`
- `STRIPE_PRICE_CREDITS_500`
- `STRIPE_PRICE_CREDITS_1000`
- `N8N_WEBHOOK_URL`
- `GOOGLE_MAPS_API_KEY`
- `APIFY_TOKEN`
- `PDL_API_KEY`

---

## 📊 Deployment

### Lovable Cloud
- **Preview**: https://id-preview--94df545e-69ab-4827-b697-82f563915149.lovable.app
- **Production**: https://manyleads-75.lovable.app

### Deployment-Ablauf
1. Code-Änderungen werden automatisch im Preview deployed
2. Edge Functions werden automatisch deployed
3. Für Production: "Publish" Button in Lovable UI

---

## 🐛 Bekannte Probleme & Lösungen

### Credit-Abzug Bug
**Problem**: Credits wurden nicht korrekt abgezogen weil `total_credits` nicht im SELECT war.
**Lösung**: `.select('used_credits, total_credits')` in `n8n-results-webhook`.

### Daten-Blurring bei Starter-Plan
**Problem**: Teilweise Blur von Premium-Daten funktioniert nicht konsistent.
**Lösung**: `subscriptionAccess.ts` definiert `'partial'` Access-Level.

---

## 📚 Wichtige Hooks

### `useCredits()`
- `credits`: Verfügbare Credits
- `totalCredits`: Gesamt-Credits
- `loading`: Lade-Status
- `consumeCredits(amount)`: Credits verbrauchen
- `addCredits(amount)`: Credits hinzufügen
- `refetchCredits()`: Neu laden

### `useCRM()`
- `bulkSaveLeadsToCRM(leads)`: Leads importieren
- Duplikatsvermeidung via URL-Hash

### `useAuth()`
- `user`: Aktueller Benutzer
- `session`: Session-Objekt
- `loading`: Auth-Lade-Status
- `signIn()`, `signUp()`, `signOut()`
- `signInWithGoogle()`
- `resetPassword()`, `updatePassword()`

### `useActiveSearch()`
- Verwaltet laufende Suche
- Speichert Progress in localStorage
- Ermöglicht Wiederaufnahme nach Browser-Schließung

### `useNotifications()`
- Realtime-Benachrichtigungen
- Ungelesene zählen
- Als gelesen markieren

---

## 🎯 Geplante Features

Siehe `.lovable/plan.md` für aktuelle Entwicklungspläne.

---

## 📞 Support & Kontakt

- **Feedback**: Über FeedbackDialog in der App
- **Kontakt**: Über Kontaktformular auf /contact
- **FAQ**: Über FAQDialog in der Sidebar

---

*Zuletzt aktualisiert: Februar 2026*
