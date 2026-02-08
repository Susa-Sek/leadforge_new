# E12 Landing Page - Frontend Components Documentation

**Epic:** E12 Landing Page & Marketing
**Date:** 2026-02-08
**Status:** COMPLETED
**Assignee:** Frontend Developer

## Overview

Vollständige Landing Page Implementation mit 9 Sections, Animationen und SEO.

## File Structure

```
src/
├── app/
│   └── (marketing)/
│       ├── layout.tsx          # Marketing Layout Wrapper
│       └── page.tsx            # Landing Page with all sections
├── components/
│   └── landing/
│       ├── animations/
│       │   └── motion-components.tsx  # Framer Motion wrappers
│       ├── layout/
│       │   ├── index.ts               # Layout exports
│       │   ├── marketing-header.tsx   # Sticky navigation
│       │   ├── marketing-footer.tsx   # Footer with newsletter
│       │   └── marketing-layout.tsx   # Layout wrapper
│       └── sections/
│           ├── index.ts               # Section exports
│           ├── hero-section.tsx       # Hero + Dashboard mock
│           ├── social-proof-section.tsx # Logos + stats
│           ├── features-section.tsx   # 4 Feature cards
│           ├── how-it-works-section.tsx # 3 Step cards
│           ├── pricing-section.tsx    # Pricing + toggle
│           ├── testimonials-section.tsx # Carousel
│           ├── faq-section.tsx        # Accordion + CTA
│           └── cta-section.tsx        # Final banner
└── lib/
    └── landing/
        └── data/
            └── content.ts       # All content data
```

## Components

### 1. MarketingHeader (US-12.1)

Sticky header with backdrop blur on scroll.

**Features:**
- Transparent background initially
- Backdrop blur activates after 50px scroll
- Mobile hamburger menu with slide-in animation
- Logo with gradient text
- Auth buttons (Anmelden, Kostenlos starten)

**Animation:**
```tsx
initial={{ y: -100, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.5, ease: 'easeOut' }}
```

### 2. HeroSection (US-12.2)

Gradient headline with CTA and dashboard mock.

**Features:**
- Gradient text (Primary to Accent)
- Trust badge with CheckCircle icon
- Dual CTA buttons (Primary + Secondary)
- 3 Stats (50K+ Unternehmen, 2.5M+ Kontaktdaten, 98% Verifizierungsrate)
- Dashboard mock UI with search interface preview

**Animations:**
- HeroAnimation: Fade + Scale on mount (0.8s)
- HeroAnimationDelayed: Staggered children (0.2s, 0.3s, 0.4s, 0.5s, 0.7s delays)

### 3. SocialProofSection (US-12.3)

Company logos and statistics.

**Features:**
- 5 company logos (placeholder initials)
- 3 statistics (500+ Aktive Nutzer, 12K Leads/Monat, 4.8 Bewertung)
- FadeInUp scroll animation
- StaggerContainer for logo animation

### 4. FeaturesSection (US-12.4)

4 Feature cards with icons.

**Features:**
- Target: Präzise Zielgruppenansprache
- Zap: Verifizierte Ergebnisse
- Database: Umfassende Datentiefe
- Plug: Nahtlose Integration

**Card Features:**
- Icon with hover scale effect
- Gradient border on hover
- Glass-card styling

**Animation:**
- StaggerContainer: 0.1s stagger between cards
- FadeInUp per card

### 5. HowItWorksSection (US-12.5)

3 Step cards with connector lines.

**Features:**
- 01: Zielgruppe definieren
- 02: Leads generieren
- 03: Exportieren & Kontaktieren
- Connector lines between steps (desktop only)
- Icons: Search, Sparkles, Download

### 6. PricingSection (US-12.6)

3 Pricing cards with monthly/annual toggle.

**Features:**
- Monthly/Annual toggle with Switch component
- 10% savings badge on annual
- 3 Plans: Starter (€49/€44), Professional (€149/€134), Enterprise (€399/€359)
- "Beliebt" badge on Professional
- Feature lists with checkmarks
- Popular plan has scale(1.05) and shadow

**Animation:**
- StaggerContainer for cards
- Price updates smoothly on toggle

### 7. TestimonialsSection (US-12.7)

Carousel with customer quotes.

**Features:**
- 4 Testimonials from different companies
- Auto-advance every 5 seconds
- Manual navigation with arrows
- Pagination dots
- Slide animation (left/right)
- Avatar with initials

**Animation:**
```tsx
initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: direction < 0 ? 300 : -300 }}
```

### 8. FAQSection (US-12.8)

Accordion with contact CTA.

**Features:**
- 8 FAQ items covering Credits, Data freshness, GDPR, CRM integration, etc.
- Accordion with expand/collapse animation
- Contact CTA card at bottom
- MessageCircle icon

### 9. CTASection (Final Banner)

Final call-to-action.

**Features:**
- Gradient background with blur effects
- "14 Tage kostenlos testen" badge
- Dual CTA buttons
- Floating background elements (decorative)

### 10. MarketingFooter (US-12.9)

Footer with links and newsletter.

**Features:**
- Company description
- Product links (Features, Preise, API, Integrationen)
- Company links (Über uns, Karriere, Blog, Kontakt)
- Legal links (Impressum, Datenschutz, AGB)
- Newsletter signup form
- Social links (LinkedIn, Twitter)

## Animation Components

### Framer Motion Wrappers

All animation components use `useInView` for scroll-triggered animations.

**FadeInUp:**
```tsx
hidden: { opacity: 0, y: 30 }
visible: { opacity: 1, y: 0 }
transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
```

**StaggerContainer:**
```tsx
staggerChildren: 0.1
delayChildren: 0.1
```

**HeroAnimation:**
```tsx
initial: { opacity: 0, y: 20, scale: 0.98 }
animate: { opacity: 1, y: 0, scale: 1 }
transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }
```

## SEO Implementation

### Meta Tags
- Title: "Manyleads - B2B Lead-Generation mit KI-gestützter Suche"
- Description: "Finde qualifizierte B2B-Leads..."
- Keywords: B2B Leads, Lead-Generation, Vertrieb...

### Open Graph
- og:title, og:description, og:image
- twitter:card, twitter:title, twitter:description

### JSON-LD Structured Data
- Organization schema
- WebSite schema with SearchAction
- WebPage schema
- SoftwareApplication schema

### Canonical URL
- `alternates: { canonical: '/' }`

## Tailwind Config Updates

Added custom animations:
```ts
animation: {
  'fade-in': 'fade-in 0.6s ease-out',
  'fade-in-up': 'fade-in-up 0.6s ease-out',
  'scale-in': 'scale-in 0.5s ease-out',
  'slide-up': 'slide-up 0.5s ease-out',
  'float': 'float 3s ease-in-out infinite',
}
```

## Dependencies

```json
{
  "framer-motion": "^12.x",
  "lucide-react": "(already installed)"
}
```

## Build Verification

```bash
npm run build
# ✓ Compiled successfully in 36.2s
# ✓ TypeScript check passed
# ✓ Static files generated
```

## Responsive Breakpoints

- Mobile: < 640px (default)
- Tablet: 640px - 1024px (sm:, md:)
- Desktop: > 1024px (lg:, xl:)

## Accessibility

- Semantic HTML (header, main, footer, section)
- ARIA labels on interactive elements
- Keyboard navigation for carousel
- Focus states on buttons
- Color contrast compliant

## Next Steps

**QA Testing Required:**
1. Lighthouse audit (target >=90)
2. Cross-browser testing (Chrome, Firefox, Safari)
3. Mobile responsiveness verification
4. Performance testing (Core Web Vitals)
5. SEO validation (Rich Results Test)

**Link:** `docs/E12-REQUIREMENTS.md` for complete specs
