# E12 Requirements: Landing Page & Marketing

**Epic:** E12 - Landing Page & Marketing
**Status:** IN PROGRESS
**Created:** 2026-02-08
**Last Updated:** 2026-02-08

> **Detaillierte Requirements:** Siehe [E12-DETAILED-REQUIREMENTS.md](./E12-DETAILED-REQUIREMENTS.md) für vollständige User Stories mit Acceptance Criteria (Given/When/Then), SEO-Spezifikationen, Performance Budget und Technical Requirements.

---

## 1. Epic Overview

### 1.1 Vision
Die Landing Page ist das Herzstück des Marketing-Auftritts von Manyleads.io. Sie soll potenzielle Kunden überzeugen, die Plattform zu nutzen und zur Registrierung führen.

### 1.2 Scope
**In Scope:**
- Landing Page für nicht-authentifizierte Nutzer (/)
- Features-Übersicht
- Preisgestaltung mit Plan-Vergleich
- Testimonials/Bewertungen
- FAQ-Bereich
- CTA-Buttons (Registrierung, Sales-Kontakt)
- SEO-Optimierung
- Responsive Design

**Out of Scope:**
- Blog (separates Epic)
- Help Center (E14)
- Admin-Dashboard (E11)

### 1.3 Target Audience
- B2B Sales Manager
- Marketing-Teams
- Gründer und Startups
- Freelancer im Vertrieb

---

## 2. Sub-Projects

### PROJ-28: Landing Page
**Ziel:** Komplette Landing Page mit allen Sections

**Key Features:**
- Hero Section mit Value Proposition
- Features Section (3-4 Kernfunktionen)
- Pricing Section (Free/Pro/Enterprise)
- Testimonials Section
- FAQ Section
- Footer

**Acceptance Criteria:**
- [ ] Alle Sections implementiert
- [ ] CTA-Buttons funktional
- [ ] Responsive Design
- [ ] Animationen implementiert

### PROJ-29: SEO & Marketing Content
**Ziel:** SEO-optimierter Content und Metadaten

**Key Features:**
- Meta-Tags (Title, Description)
- Open Graph Tags
- JSON-LD Structured Data
- robots.txt & sitemap.xml
- Keyword-optimierte Copy

**Acceptance Criteria:**
- [ ] Lighthouse SEO Score >=90
- [ ] Valid Open Graph markup
- [ ] Valid JSON-LD structured data
- [ ] Sitemap generiert

---

## 3. Functional Requirements

### 3.1 Hero Section
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R1 | Headline: "Finde deine idealen B2B-Kunden" | Must |
| E12-R2 | Subheadline mit Value Proposition | Must |
| E12-R3 | Primary CTA: "Jetzt kostenlos starten" → /registrieren | Must |
| E12-R4 | Secondary CTA: "Demo ansehen" oder "Mehr erfahren" | Should |
| E12-R5 | Hero-Illustration oder Bild | Should |
| E12-R6 | Scroll-Indikator für weitere Sections | Could |

### 3.2 Features Section
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R7 | 3-4 Feature-Karten mit Icons | Must |
| E12-R8 | Jede Karte: Icon, Titel, Beschreibung | Must |
| E12-R9 | Animation bei Scroll | Should |

### 3.3 Pricing Section
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R10 | 3 Pricing-Tier Karten (Free/Pro/Enterprise) | Must |
| E12-R11 | Feature-Liste pro Tier | Must |
| E12-R12 | CTA-Button pro Karte | Must |
| E12-R13 | Pro/Enterprise verlinken zu Stripe Checkout | Must |
| E12-R14 | Preise aus E8 (Stripe) anzeigen | Should |

### 3.4 Testimonials Section
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R15 | 3-4 Kundenstimmen | Should |
| E12-R16 | Avatar, Name, Position, Unternehmen | Should |
| E12-R17 | Zitat/Bewertungstext | Should |

### 3.5 FAQ Section
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R18 | 5-7 häufige Fragen | Must |
| E12-R19 | Accordion/Expandable UI | Must |
| E12-R20 | Fragen und Antworten auf Deutsch | Must |

### 3.6 Footer
| ID | Requirement | Priority |
|----|-------------|----------|
| E12-R21 | Logo und kurze Beschreibung | Must |
| E12-R22 | Links: Features, Preise, FAQ | Must |
| E12-R23 | Rechtliche Links: Impressum, Datenschutz | Must |
| E12-R24 | Social Media Icons | Could |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Lighthouse Performance Score >=90
- First Contentful Paint <1.8s
- Largest Contentful Paint <2.5s
- Bilder lazy-loaded und optimiert

### 4.2 SEO
- Meta Title: "Manyleads.io - B2B Lead-Generation Plattform"
- Meta Description: max 160 Zeichen, keyword-optimiert
- Canonical URL auf Root
- Open Graph für Social Sharing
- JSON-LD: Organization, Product schema

### 4.3 Accessibility
- WCAG 2.1 Level AA Compliance
- Tastatur-Navigation funktional
- Farbkontrast >=4.5:1
- Alt-Texte für Bilder

### 4.4 Browser Support
- Chrome (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Edge (letzte 2 Versionen)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## 5. Integration Requirements

### 5.1 E2: Authentication Integration
| Feature | Integration Point |
|---------|-------------------|
| "Jetzt kostenlos starten" CTA | Link zu /registrieren |
| Navigation Sign Up | Link zu /registrieren |
| Navigation Log In | Link zu /anmelden |

### 5.2 E8: Stripe Integration
| Feature | Integration Point |
|---------|-------------------|
| Pro Plan CTA | Stripe Checkout Session |
| Enterprise Plan CTA | Kontaktformular oder Stripe |
| Pricing Anzeige | Aus E8 Plan-Daten |

---

## 6. Content Requirements (German)

### 6.1 Hero Copy (Draft)
- **Headline:** "Finde deine idealen B2B-Kunden in Sekunden"
- **Subheadline:** "Manyleads.io hilft dir, hochwertige Leads zu identifizieren, zu filtern und zu kontaktieren - alles an einem Ort."
- **Primary CTA:** "Jetzt kostenlos starten"
- **Secondary CTA:** "Mehr erfahren"

### 6.2 Features (Draft)
1. **Leistungsstarke Suche** - Durchsuche Tausende von Unternehmen mit intelligenten Filtern
2. **Qualifizierte Leads** - Erhalte kontextreiche Firmendaten für personalisierte Outreach
3. **CRM-Integration** - Verwalte Kontakte und Deals direkt in der Plattform
4. **Kostenlose Credits** - Starte mit 30 Credits kostenlos, kein Kreditkarte erforderlich

### 6.3 Pricing (Draft)
- **Free:** 0€ - 30 Credits/Monat, Basis-Suche, Lead-Export
- **Pro:** 49€/Monat - 500 Credits, Erweiterte Filter, CRM, API-Zugriff
- **Enterprise:** Individuell - Unbegrenzte Credits, SSO, dedizierter Support

---

## 7. Design Requirements

### 7.1 Visual Design
- Primary: Blue (HSL 217 91% 60%)
- Accent: Purple (HSL 270 95% 75%)
- Background: White/Light gray sections
- Cards: Glass/White mit Shadow
- Typography: System-UI/Inter

### 7.2 Animations
- Hero: Fade-in + Slide-up on load
- Sections: Fade-in on scroll (Intersection Observer)
- Cards: Subtle hover lift effect
- CTAs: Scale on hover
- Reduced-motion: Respect prefers-reduced-motion

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | >=90 |
| Lighthouse Accessibility | >=95 |
| Lighthouse SEO | >=90 |
| Mobile Responsiveness | Pass |
| CTA Click-through Rate | >5% |
| Bounce Rate | <50% |
| Time on Page | >2 Minuten |

---

## 9. Open Questions

1. Sollen Testimonials echte Kunden oder generische Platzhalter sein?
2. Gibt es ein Hero-Bild/Illustration oder nur Text?
3. Sollen Enterprise-Anfragen an E-Mail gehen oder Formular?
4. Welche Keywords sollen für SEO fokussiert werden?

---

**Next Step:** Architecture Document (Task #2)
