# E12: Landing Page & Marketing - Detailed Requirements

## Epic Overview

**Epic ID:** E12
**Epic Name:** Landing Page & Marketing
**Status:** 🔵 Planned
**Priority:** High
**Goal:** Professionelle Landing Page mit modernem Design, SEO-Optimierung und Conversion-Fokus

---

## Table of Contents

1. [User Stories](#user-stories)
   - [Hero Section](#hero-section)
   - [Features/Benefits](#featuresbenefits)
   - [Pricing](#pricing)
   - [Testimonials](#testimonials)
   - [FAQ](#faq)
   - [CTA Sections](#cta-sections)
   - [Footer](#footer)
2. [SEO Requirements](#seo-requirements)
3. [Technical Requirements](#technical-requirements)
4. [Edge Cases](#edge-cases)
5. [UI/UX Specifications](#uiux-specifications)
6. [Performance Budget](#performance-budget)

---

## User Stories

### Hero Section

#### E12-US-001: Hero Section mit Haupt-CTA
**Story:** Als Besucher möchte ich sofort verstehen, was Manyleads bietet und eine klare Handlungsaufforderung sehen, damit ich mich schnell orientieren kann.

**Acceptance Criteria:**
- **Given** ein Besucher öffnet die Landing Page
- **When** die Seite geladen ist
- **Then** sieht er:
  - Hauptheadline: "Finde verifizierte B2B-Leads in Minuten"
  - Subheadline: "Durchsuche über 5 Millionen Unternehmen. Filtere nach Branche, Standort und Größe. Exportiere direkt in dein CRM."
  - Zwei CTA-Buttons: "Kostenlos starten" (Primary) und "Demo ansehen" (Secondary)
  - Hero-Visual: Animierte Dashboard-Vorschau oder 3D-Visualisierung
  - Trust-Indicators: "4.9/5 Rating", "2,000+ Nutzer", "GDPR-konform"

**UI-Mockup:**
```
+-------------------------------------------------------------+
|  [Logo]                                    [Login] [Registrieren] |
+-------------------------------------------------------------+
|                                                             |
|     Finde verifizierte B2B-Leads                            |
|     in Minuten                                              |
|     ===========                                             |
|                                                             |
|     Durchsuche über 5 Millionen Unternehmen...              |
|                                                             |
|     [Kostenlos starten]  [Demo ansehen]                     |
|                                                             |
|     ⭐ 4.9/5 · 2,000+ Nutzer · GDPR-konform                |
|                                                             |
|     +------------------+                                    |
|     |                  |                                    |
|     |  Dashboard-Mock  |  ← Animierter Screenshot          |
|     |                  |     oder 3D-Visual                 |
|     +------------------+                                    |
|                                                             |
+-------------------------------------------------------------+
```

---

#### E12-US-002: Logo-Cloud (Social Proof)
**Story:** Als Besucher möchte ich sehen, dass vertrauenswürdige Unternehmen Manyleads nutzen, damit ich die Plattform als seriös einstufen kann.

**Acceptance Criteria:**
- **Given** der Besucher scrollt unter den Hero-Bereich
- **When** der Logo-Bereich sichtbar wird
- **Then** sieht er:
  - Headline: "Vertraut von über 2.000 Unternehmen"
  - 6-8 Partner-Logos in Grayscale (nur für Demo)
  - Logos in horizontaler Reihe (Desktop) / 2x4 Grid (Mobile)
  - Subtile Animation: Fade-in bei Scroll

---

### Features/Benefits

#### E12-US-003: Features Grid mit Icons
**Story:** Als Besucher möchte ich die Hauptfunktionen der Plattform schnell überblicken, damit ich bewerten kann, ob sie meinen Bedarf deckt.

**Acceptance Criteria:**
- **Given** der Besucher ist im Features-Bereich
- **When** er die Karten ansieht
- **Then** sieht er 6 Feature-Karten in 3x2 Grid (Desktop):

| Feature | Icon | Headline | Description |
|---------|------|----------|-------------|
| 1 | Search | Intelligente Suche | Filtere nach Branche, Standort, Unternehmensgröße, Revenue und 20+ Kriterien |
| 2 | Shield | Verifizierte Daten | Alle Kontaktdaten werden täglich verifiziert. 95%+ Deliverability garantiert |
| 3 | Download | Einfacher Export | Exportiere als CSV, XLSX oder direkt zu Salesforce, HubSpot, Pipedrive |
| 4 | Users | Team-Kollaboration | Teile Sammlungen mit deinem Team. Kontrolliere Zugriffsrechte |
| 5 | Bell | Echtzeit-Alerts | Erhalte Benachrichtigungen bei neuen Leads, die deine Kriterien matchen |
| 6 | Lock | DSGVO-konform | Alle Daten DSGVO-konform verarbeitet. EU-Server, keine Weitergabe |

**UI-Verhalten:**
- Hover: Karte hebt sich leicht ab (shadow-lg, translateY -4px)
- Animation: Staggered fade-in bei Scroll (100ms delay zwischen Karten)
- Icons: Lucide React Icons, 48px, Primary Color

---

#### E12-US-004: Feature-Deep-Dive (Alternating Layout)
**Story:** Als Besucher möchte ich detailliertere Einblicke in die wichtigsten Features, damit ich die technischen Möglichkeiten verstehe.

**Acceptance Criteria:**
- **Given** der Besucher scrollt weiter
- **When** er den Deep-Dive-Bereich erreicht
- **Then** sieht er 3 Feature-Blöcke im alternierenden Layout:

**Block 1: KI-gestützte Suche (Text links, Bild rechts)**
- Headline: "Suche wie ein Pro – ohne SQL-Kenntnisse"
- Bullet Points:
  - Natürlichsprachige Filter: "Finde Software-Unternehmen in Berlin mit 50-200 Mitarbeitern"
  - 50+ Filterkriterien: Von Branche bis Technologie-Stack
  - Smarte Vorschläge: Die KI lernt aus deinen Suchen
- CTA: "Such-Features erkunden"
- Visual: Screenshot des Filter-Panels mit Animation

**Block 2: CRM-Integration (Text rechts, Bild links)**
- Headline: "Nahtlose Integration in deinen Workflow"
- Bullet Points:
  - Zwei-Klick-Export zu Salesforce, HubSpot, Pipedrive
  - API-Zugriff für Enterprise-Kunden
  - Webhook-Integration für Echtzeit-Updates
- CTA: "Integrationen ansehen"
- Visual: Logos der integrierten Tools mit Pfeilen

**Block 3: Team-Kollaboration (Text links, Bild rechts)**
- Headline: "Leads teilen, Deals closen"
- Bullet Points:
  - Gemeinsame Sammlungen für Vertriebsteams
  - Kommentare und Notizen zu jedem Lead
  - Aktivitäts-Tracking: Wer hat wann was kontaktiert
- CTA: "Kollaboration entdecken"
- Visual: Team-Dashboard Screenshot

---

### Pricing

#### E12-US-005: Pricing Section mit Plans
**Story:** Als Besucher möchte ich transparente Preise sehen, damit ich entscheiden kann, ob Manyleads in mein Budget passt.

**Acceptance Criteria:**
- **Given** der Besucher ist im Pricing-Bereich
- **When** er die Preistabelle ansieht
- **Then** sieht er:

**Toggle:** Monatlich / Jährlich (20% Rabatt beim Jahrespaket)

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Preis** | €0 | €49/Monat | €199/Monat |
| **Suchen/Monat** | 3 | 50 | unbegrenzt |
| **Leads/Monat** | 30 | 1,000 | 5,000 |
| **Kontakte** | 50 | 500 | unbegrenzt |
| **Export** | - | CSV, XLSX | + API, Webhooks |
| **Integrationen** | - | 5 Tools | Alle + Custom |
| **Support** | Community | Email | Priority + Phone |

**UI-Details:**
- Pro-Plan als "Empfohlen" mit Badge hervorgehoben
- Enterprise mit "Kontakt" Button statt Preis für Custom-Pricing
- Feature-Liste mit Check/X Icons
- Hover: Subtle Scale (1.02)

---

#### E12-US-006: Pricing FAQ Accordion
**Story:** Als Besucher möchte ich häufige Fragen zum Pricing direkt auf der Pricing-Seite beantwortet haben, damit ich keine Unsicherheiten habe.

**Acceptance Criteria:**
- **Given** der Besucher ist unter den Pricing-Plänen
- **When** er auf eine Frage klickt
- **Then** expandiert das Accordion und zeigt die Antwort

**FAQ-Items:**
1. "Kann ich jederzeit kündigen?" → "Ja, monatliche Abos können jederzeit gekündigt werden. Jahrespläne haben 14 Tage Widerrufsrecht."
2. "Was passiert nach dem kostenlosen Limit?" → "Du kannst upgraden oder wartest bis zum nächsten Monat. Deine Daten bleiben erhalten."
3. "Gibt es Rabatte für Startups?" → "Ja! Startups unter 2 Jahren erhalten 50% Rabatt auf Pro im ersten Jahr."
4. "Wie funktioniert das Enterprise-Pricing?" → "Enterprise ist individuell. Buche ein Gespräch mit unserem Sales-Team."

---

### Testimonials

#### E12-US-007: Testimonials Carousel
**Story:** Als Besucher möchte ich echte Nutzerstimmen lesen, damit ich das Nutzenversprechen durch soziale Bewährtheit bestätigt sehe.

**Acceptance Criteria:**
- **Given** der Besucher ist im Testimonials-Bereich
- **When** er durch die Testimonials scrollt oder swiped
- **Then** sieht er:

**Testimonial-Karten (3 sichtbar auf Desktop, 1 auf Mobile):**
- Avatar-Bild (80x80px, rounded-full)
- Name und Rolle
- Unternehmenslogo (klein)
- 5-Sterne-Bewertung
- Zitat (max. 200 Zeichen)
- "Verifizierter Nutzer" Badge

**Beispiel-Testimonials:**
1. "Manyleads hat unseren Vertrieb transformiert. Wir finden jetzt in 5 Minuten, was früher Tage gedauert hat." – Sarah M., Sales Director bei TechStart
2. "Die Datenqualität ist herausragend. 90%+ unserer Cold Emails erreichen echte Entscheider." – Michael K., CEO bei GrowthAgency
3. "Endlich eine Lead-Plattform, die DSGVO-konform arbeitet. Unser Datenschutzbeauftragter ist happy!" – Lisa T., Marketing Lead bei Enterprise GmbH

**UI-Verhalten:**
- Auto-rotate alle 5 Sekunden (pausiert bei Hover)
- Navigation: Pfeile links/rechts + Dots-Indikatoren
- Swipe-Gesten auf Mobile

---

#### E12-US-008: Stats/Numbers Section
**Story:** Als Besucher möche ich beeindruckende Zahlen sehen, damit ich die Reichweite und Effektivität der Plattform einschätzen kann.

**Acceptance Criteria:**
- **Given** der Besucher ist im Stats-Bereich
- **When** dieser sichtbar wird
- **Then** zählen animierte Zahlen hoch:

| Stat | Zahl | Label |
|------|------|-------|
| 1 | 5M+ | Unternehmen in der Datenbank |
| 2 | 50M+ | Verifizierte Kontaktdaten |
| 3 | 2,000+ | Aktive Nutzer |
| 4 | 95% | Datenqualitäts-Score |

**Animation:** Count-Up von 0 bis Zielwert über 2 Sekunden bei Scroll-Into-View

---

### FAQ

#### E12-US-009: Comprehensive FAQ Section
**Story:** Als Besucher möchte ich umfassende Antworten auf meine Fragen, damit ich ohne Kontaktaufnahme alle Unklarheiten beseitigen kann.

**Acceptance Criteria:**
- **Given** der Besucher ist im FAQ-Bereich
- **When** er auf eine Frage klickt
- **Then** expandiert das Accordion mit Animation

**FAQ-Kategorien (Tabs):**

**Allgemein:**
1. Was ist Manyleads?
2. Für wen ist Manyleads geeignet?
3. Wie unterscheidet ihr euch von ZoomInfo/Lusha?

**Daten & Qualität:**
4. Woher kommen die Daten?
5. Wie oft werden die Daten aktualisiert?
6. Was ist die Genauigkeit der Kontaktdaten?

**DSGVO & Compliance:**
7. Ist Manyleads DSGVO-konform?
8. Wo werden die Daten gespeichert?
9. Wie kann ich meine Daten löschen?

**Technisch:**
10. Welche Browser werden unterstützt?
11. Gibt es eine mobile App?
12. Funktioniert es mit meinem CRM?

**UI-Verhalten:**
- Accordion mit smooth expand/collapse (300ms)
- Nur ein Item gleichzeitig geöffnet
- Suchfeld optional (nur bei >10 FAQs)

---

### CTA Sections

#### E12-US-010: Mid-Page CTA Section
**Story:** Als Besucher möchte ich nach dem Lesen der Features einen erneuten Call-to-Action sehen, damit ich nicht bis zum Ende scrollen muss, um zu starten.

**Acceptance Criteria:**
- **Given** der Besucher hat die Features gelesen
- **When** er zum Mid-CTA scrollt
- **Then** sieht er:
  - Headline: "Bereit, deinen Vertrieb zu skalieren?"
  - Subheadline: "Starte kostenlos – keine Kreditkarte nötig"
  - Primary CTA: "Jetzt kostenlos starten"
  - Secondary CTA: "Sales kontaktieren" (Enterprise)
  - Trust-Element: "14 Tage kostenlos testen"

**UI:**
- Hintergrund: Subtle Gradient (Primary zu Background)
- Container: Glass-Card Effekt
- Padding: py-20 für visuelle Trennung

---

#### E12-US-011: Final CTA Section
**Story:** Als Besucher möchte ich am Ende der Seite eine finale Handlungsaufforderung sehen, damit ich nach dem gesamten Content eine klare nächste Aktion habe.

**Acceptance Criteria:**
- **Given** der Besucher ist am Ende der Landing Page
- **When** er den letzten CTA-Bereich sieht
- **Then** sieht er:
  - Headline: "Starte jetzt deine Lead-Revolution"
  - Subheadline: "Join 2,000+ Unternehmen, die Manyleads für ihr Wachstum nutzen"
  - Email-Input + "Kostenlos starten" Button (Inline-Form)
  - Disclaimer: "Keine Kreditkarte nötig. Kündige jederzeit."
  - Hintergrund: Hero-Pattern oder Subtle Animation

---

### Footer

#### E12-US-012: Comprehensive Footer
**Story:** Als Besucher möchte ich im Footer wichtige Links und rechtliche Informationen finden, damit ich mich auf der Seite orientieren kann.

**Acceptance Criteria:**
- **Given** der Besucher ist am Seitenende
- **When** er den Footer betrachtet
- **Then** sieht er:

**4-Spalten Layout:**

| Produkt | Unternehmen | Ressourcen | Rechtliches |
|---------|-------------|------------|-------------|
| Features | Über uns | Blog | Impressum |
| Preise | Karriere | Hilfe-Center | Datenschutz |
| Integrationen | Kontakt | API-Dokumentation | AGB |
| Changelog | Press | Status | Cookie-Richtlinie |

**Bottom Bar:**
- Copyright: "© 2026 Manyleads.io – Alle Rechte vorbehalten"
- Social Icons: LinkedIn, Twitter/X, GitHub (optional)
- Sprach-Selector: Deutsch / English (optional)
- Made with ♥ in Germany

---

## SEO Requirements

### Meta-Tags

```html
<!-- Primary -->
<title>Manyleads.io – B2B Lead-Generierung für Vertriebsteams</title>
<meta name="title" content="Manyleads.io – B2B Lead-Generierung für Vertriebsteams">
<meta name="description" content="Finde verifizierte B2B-Leads mit KI-gestützter Suche. Durchsuche 5M+ Unternehmen. Exportiere direkt zu Salesforce, HubSpot, Pipedrive. Starte kostenlos.">

<!-- Keywords -->
<meta name="keywords" content="B2B Leads, Lead-Generierung, Vertrieb, Kontaktdaten, Unternehmenssuche, CRM Integration, Sales Prospecting">

<!-- Robots -->
<meta name="robots" content="index, follow">
<meta name="googlebot" content="index, follow">

<!-- Canonical -->
<link rel="canonical" href="https://manyleads.io/">

<!-- Alternate Languages -->
<link rel="alternate" hreflang="de" href="https://manyleads.io/">
<link rel="alternate" hreflang="en" href="https://manyleads.io/en/">
<link rel="alternate" hreflang="x-default" href="https://manyleads.io/">
```

### Open Graph (Social Sharing)

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://manyleads.io/">
<meta property="og:title" content="Manyleads.io – B2B Lead-Generierung für Vertriebsteams">
<meta property="og:description" content="Finde verifizierte B2B-Leads mit KI-gestützter Suche. Durchsuche 5M+ Unternehmen. Starte kostenlos.">
<meta property="og:image" content="https://manyleads.io/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="de_DE">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://manyleads.io/">
<meta property="twitter:title" content="Manyleads.io – B2B Lead-Generierung">
<meta property="twitter:description" content="Finde verifizierte B2B-Leads mit KI-gestützter Suche. 5M+ Unternehmen. Starte kostenlos.">
<meta property="twitter:image" content="https://manyleads.io/og-image.png">
```

### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Manyleads.io",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "199",
    "priceCurrency": "EUR",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free",
        "price": "0",
        "priceCurrency": "EUR"
      },
      {
        "@type": "Offer",
        "name": "Pro",
        "price": "49",
        "priceCurrency": "EUR",
        "priceValidUntil": "2027-12-31"
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "2000"
  },
  "description": "B2B Lead-Generierung mit KI-gestützter Suche. Durchsuche 5M+ Unternehmen.",
  "url": "https://manyleads.io",
  "logo": "https://manyleads.io/logo.png",
  "screenshot": "https://manyleads.io/screenshot.png"
}
```

### Additional SEO Requirements

| Requirement | Specification |
|-------------|---------------|
| Semantic HTML | Verwende `<header>`, `<main>`, `<section>`, `<footer>`, `<article>`, `<nav>` |
| Heading Hierarchy | Nur ein H1, logische H2-H6 Struktur |
| Alt-Text | Alle Bilder mit beschreibendem Alt-Text |
| Internal Links | Mindestens 5 interne Links zu anderen Seiten |
| Sitemap | `/sitemap.xml` mit allen Landing Page URLs |
| Robots.txt | Zugang zu wichtigen Seiten erlauben |
| Page Speed | Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1 |

---

## Technical Requirements

### Framework & Libraries

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, SSR/SSG, Image Optimization |
| React | 19.x | UI Components |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Base Components |
| Framer Motion | Latest | Animations |
| Lucide React | Latest | Icons |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked sections |
| Tablet | 640px - 1024px | 2-column grids |
| Desktop | > 1024px | Full layout, 3-4 column grids |

### Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Fade In | 500ms | ease-out | Scroll into view |
| Slide Up | 600ms | cubic-bezier(0.16, 1, 0.3, 1) | Scroll into view |
| Scale Hover | 200ms | ease-in-out | Mouse hover |
| Count Up | 2000ms | ease-out | Scroll into view |
| Accordion | 300ms | ease-in-out | Click |
| Carousel | 500ms | ease-in-out | Auto/Swipe |

### Performance Requirements

| Metric | Target | Budget |
|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.5s | 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s | 3.0s |
| Time to Interactive (TTI) | < 3.5s | 4.0s |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.15 |
| Total Page Size | < 500KB | 800KB |
| JavaScript Bundle | < 150KB | 200KB |
| Image Size | < 200KB (hero) | 300KB |

### Image Specifications

| Image | Format | Dimensions | Loading |
|-------|--------|------------|---------|
| Hero Visual | WebP/AVIF | 1200x800 | Eager |
| Feature Screenshots | WebP | 800x600 | Lazy |
| Testimonial Avatars | WebP/JPG | 160x160 | Lazy |
| Partner Logos | SVG | Vector | Eager |
| Icons | SVG | Vector | Inline |

### Code Organization

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 # Landing Page
│   │   ├── layout.tsx               # Marketing Layout
│   │   ├── preise/
│   │   │   └── page.tsx             # Pricing Page
│   │   ├── features/
│   │   │   └── page.tsx             # Features Page
│   │   └── ueber-uns/
│   │       └── page.tsx             # About Page
│   └── layout.tsx                   # Root Layout
├── components/
│   └── landing/
│       ├── hero-section.tsx
│       ├── logo-cloud.tsx
│       ├── features-grid.tsx
│       ├── feature-deep-dive.tsx
│       ├── pricing-section.tsx
│       ├── testimonials-carousel.tsx
│       ├── stats-section.tsx
│       ├── faq-section.tsx
│       ├── cta-section.tsx
│       └── footer.tsx
├── hooks/
│   └── use-scroll-animation.ts
└── lib/
    └── seo/
        ├── meta-tags.ts
        └── structured-data.ts
```

---

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| E12-EC-001 | Keine JS aktiviert | Seite bleibt vollständig lesbar, Animationen deaktiviert |
| E12-EC-002 | Langsame Verbindung | Hero-Bild mit LQIP (Low Quality Image Placeholder) |
| E12-EC-003 | Mobile Menu offen + Resize | Menu schließt sich automatisch bei Resize auf Desktop |
| E12-EC-004 | FAQ Accordion spam-click | Debounce: Animation muss beendet sein vor nächstem Toggle |
| E12-EC-005 | Testimonial Auto-rotate + Manual | Manuelle Navigation pausiert Auto-rotate für 10s |
| E12-EC-006 | Pricing Toggle schnell geklickt | Debounce: Keine mehrfachen State-Changes |
| E12-EC-007 | Form-Submit ohne JS | Server-side Fallback für Email-Form |
| E12-EC-008 | Bild lädt nicht | Alt-Text angezeigt, Layout nicht broken |
| E12-EC-009 | Reduced Motion Preference | Alle Animationen deaktivieren bei `prefers-reduced-motion: reduce` |
| E12-EC-010 | Viewport zu klein | Horizontal Scroll verhindern, Content anpassen |
| E12-EC-011 | SSR Hydration Mismatch | Konsistente IDs, kein Zufall bei SSR |
| E12-EC-012 | Tracking Blocker | Analytics graceful degraden, keine Fehler |

---

## UI/UX Specifications

### Design Tokens

```css
/* Colors */
--primary: 217 91% 60%;           /* HSL Blue */
--primary-foreground: 0 0% 100%;
--accent: 270 95% 75%;            /* HSL Purple */
--background: 0 0% 100%;
--foreground: 222 84% 5%;
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;

/* Spacing */
--section-padding: 5rem;          /* py-20 */
--container-max: 1280px;          /* max-w-7xl */

/* Typography */
--font-heading: Inter, sans-serif;
--font-body: Inter, sans-serif;
--hero-size: 3.75rem;             /* text-6xl */
--h2-size: 2.25rem;               /* text-4xl */
--h3-size: 1.25rem;               /* text-xl */
--body-size: 1rem;                /* text-base */
```

### Component Specifications

**Hero Section:**
- Min-Height: 80vh (Desktop), auto (Mobile)
- Text: Zentriert, max-width 3xl
- CTA-Buttons: Gap 4, mt-8
- Trust-Indicators: Flex row, gap-6, mt-6

**Feature Cards:**
- Padding: p-6
- Border: 1px solid muted
- Border-Radius: rounded-xl
- Shadow: shadow-sm (hover: shadow-lg)
- Transition: all 200ms

**Pricing Cards:**
- Pro: Ring-2 ring-primary (highlighted)
- Padding: p-8
- Feature-List: space-y-3
- CTA: Full-width button

**Testimonials:**
- Card: glass-card, p-6
- Avatar: 80x80, rounded-full
- Quote: italic, text-lg
- Navigation: Bottom-center, gap-2

**FAQ:**
- Accordion: border-b border-muted
- Padding: py-4
- Icon: Chevron (rotates 180deg when open)

---

## Performance Budget

### Resource Limits

| Resource Type | Limit | Strategy |
|---------------|-------|----------|
| Total Page Weight | < 500KB | Image optimization, code splitting |
| JavaScript | < 150KB | Lazy load non-critical JS |
| CSS | < 50KB | Tailwind purge, inline critical CSS |
| Images | < 200KB (Hero) | WebP/AVIF, responsive images |
| Fonts | < 30KB | System fonts preferred, subset if custom |
| Third-Party | < 50KB | Async loading, preconnect |

### Loading Strategy

1. **Critical CSS:** Inline in `<head>`
2. **Hero Image:** Preload, eager loading
3. **Fonts:** `font-display: swap`
4. **Non-Critical JS:** `async` oder `defer`
5. **Below-fold Images:** Lazy loading mit blur-up placeholder

### Caching Strategy

| Asset Type | Cache Control |
|------------|---------------|
| HTML | no-cache (dynamic) |
| CSS/JS | 1 year (immutable) |
| Images | 1 year (immutable) |
| Fonts | 1 year (immutable) |
| API Calls | no-store |

---

## Success Criteria

- [ ] Alle 12 User Stories implementiert
- [ ] Lighthouse Performance Score >= 90
- [ ] Lighthouse Accessibility Score >= 95
- [ ] Lighthouse SEO Score >= 95
- [ ] Lighthouse Best Practices Score >= 90
- [ ] Core Web Vitals alle im "Good" Bereich
- [ ] Responsive auf allen Breakpoints (Mobile, Tablet, Desktop)
- [ ] Alle Animationen funktionieren mit `prefers-reduced-motion`
- [ ] SEO Meta-Tags vollständig
- [ ] Structured Data validiert (Google Rich Results Test)
- [ ] Keine Layout Shifts (CLS < 0.1)
- [ ] Deutsche UI überall
- [ ] Alle Edge Cases behandelt

---

## Dependencies

**Blocks:**
- PROJ-27 (Landing Page Core) - Basis-Implementierung

**Blocked By:**
- PROJ-8 (User-Provider) - Für Pricing-Plan-Anzeige
- E8 COMPLETED (Stripe) - Für Pricing-Integration

---

## Estimated Effort

- Frontend Development: 5-7 Tage
- SEO & Performance Optimization: 2-3 Tage
- QA & Testing: 2-3 Tage
- Content Creation: 1-2 Tage

**Total:** 10-15 Tage (parallel: 6-8 Tage)
