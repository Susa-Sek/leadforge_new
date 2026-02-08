# E12 Landing Page - Technical Architecture Document

## Overview

Dieses Dokument beschreibt die vollständige Architektur für die E12 Landing Page Phase der Manyleads.io Plattform. Es deckt alle 12 User Stories ab, von Hero Section bis FAQ-Bereich.

**Status:** Architektur Review Bereit
**Zuletzt aktualisiert:** 2026-02-08
**Verantwortlich:** Solution Architect

---

## Inhaltsverzeichnis

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Component Structure](#2-component-structure)
3. [File Structure](#3-file-structure)
4. [Data Flow](#4-data-flow)
5. [Animation Strategy](#5-animation-strategy)
6. [SEO Implementation](#6-seo-implementation)
7. [Performance Strategy](#7-performance-strategy)
8. [Responsive Breakpoints](#8-responsive-breakpoints)
9. [Integration with Existing Project](#9-integration-with-existing-project)
10. [Tech Decisions](#10-tech-decisions)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LANDING PAGE STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           MARKETING HEADER                               │    │
│  │  - Logo (links)  - Navigation (mitte)  - Auth Buttons (rechts)          │    │
│  │  - Sticky on scroll, glass-morphism effect                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           HERO SECTION                                   │    │
│  │  - H1 Headline (gradient-text)                                          │    │
│  │  - Subheadline (text-muted-foreground)                                  │    │
│  │  - CTA Button Group (Primary + Secondary)                               │    │
│  │  - Interactive Demo Card (search preview)                               │    │
│  │  - Trust Badge ("500+ Unternehmen vertrauen uns")                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         FEATURES SECTION                                 │    │
│  │  - Section Header ( eyebrow + h2 + description )                        │    │
│  │  - Feature Grid (4x Feature Cards)                                      │    │
│  │    └── Card: Icon + Title + Description + Learn More Link               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         HOW IT WORKS SECTION                             │    │
│  │  - Section Header                                                       │    │
│  │  - Step Cards (1-2-3 visual timeline)                                   │    │
│  │    └── Step Number + Icon + Title + Description                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         PRICING SECTION                                  │    │
│  │  - Section Header ("Wähle deinen Plan")                                  │    │
│  │  - Billing Toggle (Monthly/Yearly with "2 Monate geschenkt")            │    │
│  │  - Pricing Cards Grid (Free, Professional, Enterprise)                  │    │
│  │    └── Plan Badge + Price + Features List + CTA Button                  │    │
│  │  - Feature Comparison Table (accordion on mobile)                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                       TESTIMONIALS SECTION                               │    │
│  │  - Section Header                                                       │    │
│  │  - Testimonial Carousel (auto-rotate + manual nav)                      │    │
│  │    └── Avatar + Quote + Name + Role + Company                           │    │
│  │  - Trust Bar (Logos der Kundenunternehmen)                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           FAQ SECTION                                    │    │
│  │  - Section Header                                                       │    │
│  │  - Accordion FAQ List (shadcn/ui Accordion)                             │    │
│  │    └── Question + Answer (rich text support)                            │    │
│  │  - "Noch Fragen?" CTA Box at bottom                                     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           CTA SECTION                                    │    │
│  │  - Final Call-to-Action Banner                                          │    │
│  │  - "Bereit, deine Lead-Generierung zu revolutionieren?"                 │    │
│  │  - Primary CTA Button + Secondary Link                                  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           FOOTER                                         │    │
│  │  - Logo + Tagline                                                       │    │
│  │  - Navigation Links (Produkt, Unternehmen, Rechtliches)                 │    │
│  │  - Newsletter Signup (simple email input)                               │    │
│  │  - Social Links + Copyright                                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Page Layout Flow

```
User arrives at /
       │
       ▼
┌─────────────────┐
│  MarketingLayout│  ← Keine Sidebar, nur Marketing-Header
│  (server-side)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LandingPage    │  ← Client Component mit Animationen
│  (client-side)  │
└─────────────────┘
```

---

## 2. Component Structure

### Component Tree (Visual Hierarchy)

```
src/app/
├── page.tsx                          # Landing Page Root
└── (marketing)/                      # Marketing Route Group (optional)
    └── layout.tsx                    # Marketing Layout (ohne Sidebar)

src/components/landing/
├── sections/                         # Page Sections (1:1 mit US)
│   ├── hero-section.tsx              # E12-US-001, E12-US-002
│   ├── features-section.tsx          # E12-US-003
│   ├── how-it-works-section.tsx      # E12-US-004
│   ├── pricing-section.tsx           # E12-US-005, E12-US-006
│   ├── testimonials-section.tsx      # E12-US-007, E12-US-008
│   ├── faq-section.tsx               # E12-US-009, E12-US-010
│   └── cta-section.tsx               # E12-US-011
│
├── layout/
│   ├── marketing-header.tsx          # Sticky Header mit Navigation
│   ├── marketing-footer.tsx          # Footer mit Links/Newsletter
│   └── section-wrapper.tsx           # Consistent section padding/spacing
│
├── ui-components/                    # Reusable Landing Page UI
│   ├── feature-card.tsx              # Icon + Title + Description
│   ├── step-card.tsx                 # Step Number + Content
│   ├── pricing-card.tsx              # Plan details + CTA
│   ├── testimonial-card.tsx          # Quote + Avatar + Attribution
│   ├── trust-badge.tsx               # "X+ Unternehmen" badge
│   └── logo-cloud.tsx                # Customer logos grid
│
└── animations/                       # Framer Motion Wrappers
    ├── fade-in.tsx                   # Scroll-triggered fade
    ├── slide-up.tsx                  # Slide up on scroll
    ├── stagger-container.tsx         # Stagger children animations
    └── animated-counter.tsx          # Number counting animation
```

### Component Hierarchy Diagram

```
LandingPage (page.tsx)
├── MarketingLayout
│   ├── MarketingHeader (sticky)
│   │   ├── Logo
│   │   ├── NavigationLinks
│   │   └── AuthButtons
│   │
│   ├── Main Content
│   │   ├── HeroSection
│   │   │   ├── FadeIn (animation wrapper)
│   │   │   │   ├── H1 Headline
│   │   │   │   ├── Subheadline
│   │   │   │   └── CTAButtonGroup
│   │   │   ├── SlideUp (animation wrapper)
│   │   │   │   └── InteractiveDemoCard
│   │   │   └── TrustBadge
│   │   │
│   │   ├── FeaturesSection
│   │   │   ├── SectionHeader
│   │   │   └── StaggerContainer
│   │   │       └── FeatureCard (x4)
│   │   │
│   │   ├── HowItWorksSection
│   │   │   ├── SectionHeader
│   │   │   └── StepCards (1-2-3)
│   │   │
│   │   ├── PricingSection
│   │   │   ├── SectionHeader
│   │   │   ├── BillingToggle (month/year)
│   │   │   └── PricingCardsGrid
│   │   │       └── PricingCard (x3)
│   │   │
│   │   ├── TestimonialsSection
│   │   │   ├── SectionHeader
│   │   │   ├── TestimonialCarousel
│   │   │   └── LogoCloud
│   │   │
│   │   ├── FAQSection
│   │   │   ├── SectionHeader
│   │   │   └── AccordionFAQ
│   │   │
│   │   ├── CTASection
│   │   │   └── FinalCTABanner
│   │   │
│   └── MarketingFooter
│       ├── FooterNavigation
│       ├── NewsletterSignup
│       └── CopyrightBar
```

---

## 3. File Structure

### Complete File Tree

```
src/
├── app/
│   ├── page.tsx                              # Landing Page (root)
│   ├── layout.tsx                            # Root Layout (bestehend)
│   ├── globals.css                           # Global styles (bestehend)
│   │
│   ├── (marketing)/                          # Marketing Route Group
│   │   ├── layout.tsx                        # Marketing Layout (no sidebar)
│   │   └── datenschutz/
│   │       └── page.tsx                      # Datenschutz page
│   │   └── impressum/
│   │       └── page.tsx                      # Impressum page
│   │
│   └── api/
│       └── newsletter/
│           └── route.ts                      # Newsletter signup API
│
├── components/
│   ├── landing/
│   │   ├── sections/
│   │   │   ├── hero-section.tsx              # E12-US-001, E12-US-002
│   │   │   ├── features-section.tsx          # E12-US-003
│   │   │   ├── how-it-works-section.tsx      # E12-US-004
│   │   │   ├── pricing-section.tsx           # E12-US-005, E12-US-006
│   │   │   ├── testimonials-section.tsx      # E12-US-007, E12-US-008
│   │   │   ├── faq-section.tsx               # E12-US-009, E12-US-010
│   │   │   └── cta-section.tsx               # E12-US-011
│   │   │
│   │   ├── layout/
│   │   │   ├── marketing-header.tsx
│   │   │   ├── marketing-footer.tsx
│   │   │   └── section-wrapper.tsx
│   │   │
│   │   ├── ui-components/
│   │   │   ├── feature-card.tsx
│   │   │   ├── step-card.tsx
│   │   │   ├── pricing-card.tsx
│   │   │   ├── testimonial-card.tsx
│   │   │   ├── trust-badge.tsx
│   │   │   └── logo-cloud.tsx
│   │   │
│   │   └── animations/
│   │       ├── fade-in.tsx
│   │       ├── slide-up.tsx
│   │       ├── stagger-container.tsx
│   │       └── animated-counter.tsx
│   │
│   └── ui/                                   # shadcn/ui components (bestehend)
│       ├── accordion.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── lib/
│   ├── landing/
│   │   ├── data/
│   │   │   ├── features.ts                   # Feature content data
│   │   │   ├── steps.ts                      # How it works data
│   │   │   ├── pricing.ts                    # Pricing plans data
│   │   │   ├── testimonials.ts               # Testimonials data
│   │   │   └── faq.ts                        # FAQ questions & answers
│   │   │
│   │   └── utils/
│   │       ├── scroll-to-section.ts          # Smooth scroll helper
│   │       └── pricing-calculator.ts         # Price calculation logic
│   │
│   └── utils.ts                              # Existing utilities
│
├── hooks/
│   └── landing/
│       ├── use-scroll-position.ts            # Header visibility logic
│       ├── use-in-view.ts                    # Intersection observer hook
│       └── use-pricing-toggle.ts             # Monthly/yearly state
│
├── types/
│   └── landing.ts                            # Landing page type definitions
│
└── public/
    ├── images/
    │   ├── landing/
    │   │   ├── hero-illustration.svg
    │   │   ├── feature-*.svg                 # Feature icons/illustrations
    │   │   ├── customer-logos/               # Customer company logos
    │   │   └── testimonial-avatars/          # Testimonial user avatars
    │   │
    │   └── favicon/
    │
    └── fonts/                                # If using local fonts
```

---

## 4. Data Flow

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         LOCAL STATE (useState)                           │    │
│  │                                                                          │    │
│  │  - BillingToggle: monthly/yearly                                        │    │
│  │  - FAQAccordion: open/closed items                                      │    │
│  │  - TestimonialCarousel: current slide                                   │    │
│  │  - MobileMenu: open/closed                                              │    │
│  │  - ScrollPosition: for header styling                                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      STATIC DATA (TS Files)                              │    │
│  │                                                                          │    │
│  │  Features, Pricing, Testimonials, FAQ → lib/landing/data/*.ts           │    │
│  │  No API calls needed for landing page content                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      API INTERACTIONS                                    │    │
│  │                                                                          │    │
│  │  - Newsletter Signup: POST /api/newsletter                              │    │
│  │  - CTA Buttons: Link to /registrieren                                   │    │
│  │  - Pricing CTA: Link to /upgrade (with plan param)                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Props Flow Diagram

```
MarketingLayout
├── children: ReactNode (LandingPage content)
├── hideHeader?: boolean (for special pages)
└── hideFooter?: boolean (for special pages)

SectionWrapper (used by all sections)
├── children: ReactNode
├── className?: string (additional styling)
├── id?: string (for anchor links)
└── background?: 'default' | 'muted' | 'gradient'

FeatureCard
├── icon: LucideIcon
├── title: string
├── description: string
└── learnMoreHref?: string

PricingCard
├── plan: PricingPlan
├── billingCycle: 'monthly' | 'yearly'
├── isPopular?: boolean
└── ctaHref: string

TestimonialCard
├── quote: string
├── author: { name, role, company, avatarUrl }
└── rating?: number
```

---

## 5. Animation Strategy

### Framer Motion Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ANIMATION ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        ANIMATION COMPONENTS                              │    │
│  │                                                                          │    │
│  │  FadeIn                                                                  │    │
│  │  ├── trigger: viewport (whileInView)                                    │    │
│  │  ├── duration: 0.5s                                                     │    │
│  │  ├── easing: [0.25, 0.1, 0.25, 1]                                       │    │
│  │  └── used in: Hero headline, section headers                            │    │
│  │                                                                          │    │
│  │  SlideUp                                                                 │    │
│  │  ├── trigger: viewport (whileInView)                                    │    │
│  │  ├── duration: 0.6s                                                     │    │
│  │  ├── offset: 30px → 0px                                                 │    │
│  │  └── used in: Feature cards, pricing cards                              │    │
│  │                                                                          │    │
│  │  StaggerContainer                                                        │    │
│  │  ├── staggerChildren: 0.1s                                              │    │
│  │  ├── delayChildren: 0.2s                                                │    │
│  │  └── used in: Feature grid, Step cards, Pricing grid                    │    │
│  │                                                                          │    │
│  │  AnimatedCounter                                                         │    │
│  │  ├── duration: 2s                                                       │    │
│  │  ├── easing: easeOut                                                    │    │
│  │  └── used in: Trust badges ("500+")                                     │    │
│  │                                                                          │    │
│  │  HeaderScroll                                                            │    │
│  │  ├── trigger: scroll position > 50px                                    │    │
│  │  ├── animation: background blur + shadow                                │    │
│  │  └── used in: MarketingHeader                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Animation Specs (from Requirements)

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Hero Headline | Fade + Scale | 0.8s | cubic-bezier(0.25, 0.1, 0.25, 1) | On mount |
| Hero Subtext | Fade + SlideUp | 0.6s | ease-out | 0.2s delay |
| Feature Cards | Stagger SlideUp | 0.5s each | ease-out | In viewport |
| Step Cards | Stagger Scale | 0.4s each | spring | In viewport |
| Pricing Cards | SlideUp + Fade | 0.6s | ease-out | In viewport |
| Testimonial | Fade | 0.5s | ease-in-out | Carousel change |
| FAQ Accordion | Height + Opacity | 0.3s | ease-in-out | Click |
| Header | Backdrop blur | 0.3s | ease | Scroll > 50px |
| CTA Button | Pulse glow | 2s | ease-in-out | Infinite loop |

### Reduced Motion Support

```typescript
// All animations respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Animation config
const animationConfig = {
  initial: prefersReducedMotion ? false : { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
};
```

---

## 6. SEO Implementation

### Meta Tags Strategy

```typescript
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  // Basic
  title: 'Manyleads.io - KI-gestützte B2B Lead-Generierung',
  description: 'Finde qualifizierte B2B-Leads mit KI-gestützter Suche. Tausende Unternehmen, verifizierte Kontaktdaten, direkter Export.',
  keywords: ['B2B Leads', 'Lead-Generierung', 'Vertrieb', 'Kontaktdaten', 'Unternehmenssuche'],

  // Open Graph
  openGraph: {
    title: 'Manyleads.io - KI-gestützte B2B Lead-Generierung',
    description: 'Finde qualifizierte B2B-Leads mit KI-gestützter Suche.',
    url: 'https://manyleads.io',
    siteName: 'Manyleads.io',
    locale: 'de_DE',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Manyleads.io - B2B Lead-Generierung'
      }
    ]
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Manyleads.io - KI-gestützte B2B Lead-Generierung',
    description: 'Finde qualifizierte B2B-Leads mit KI-gestützter Suche.',
    images: ['/images/twitter-image.jpg']
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },

  // Canonical
  alternates: {
    canonical: 'https://manyleads.io'
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};
```

### JSON-LD Structured Data

```typescript
// Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Manyleads.io',
  url: 'https://manyleads.io',
  logo: 'https://manyleads.io/logo.png',
  description: 'KI-gestützte B2B Lead-Generierung Plattform',
  sameAs: [
    'https://linkedin.com/company/manyleads',
    'https://twitter.com/manyleads'
  ]
};

// SoftwareApplication Schema
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Manyleads.io',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127'
  }
};

// FAQPage Schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};
```

### Implementation

```tsx
// In page.tsx
import Script from 'next/script';

export default function LandingPage() {
  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema)
        }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 7. Performance Strategy

### Performance Budget Compliance

| Metric | Budget | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | Preload hero image, inline critical CSS |
| FID/INP | < 100ms | Lazy load below-fold components |
| CLS | < 0.1 | Fixed dimensions for images, fonts |
| TTFB | < 600ms | Static generation (SSG), Edge caching |
| JS Bundle | < 100KB | Code splitting, tree shaking |
| Total Page | < 1MB | Image optimization, gzip |

### Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  }
};

// Component usage
import Image from 'next/image';

<Image
  src="/images/hero-illustration.jpg"
  alt="Manyleads Dashboard Preview"
  width={800}
  height={600}
  priority              // Preload LCP image
  placeholder="blur"    // Blur placeholder
  blurDataURL="data:image/jpeg;base64,..."
/>;
```

### Lazy Loading Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LAZY LOADING STRATEGY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  IMMEDIATE (above fold)                                                         │
│  ├── Hero Section (eager load)                                                  │
│  ├── Header (eager load)                                                        │
│  └── Hero image (priority loading)                                              │
│                                                                                  │
│  LAZY (below fold)                                                              │
│  ├── Features Section (dynamic import)                                          │
│  ├── How It Works (dynamic import)                                              │
│  ├── Pricing Section (dynamic import)                                           │
│  ├── Testimonials (dynamic import)                                              │
│  ├── FAQ Section (dynamic import)                                               │
│  └── Footer (dynamic import)                                                    │
│                                                                                  │
│  INTERSECTION OBSERVER                                                          │
│  ├── Trigger: 200px before entering viewport                                    │
│  ├── Eager: Load next 2 sections ahead                                          │
│  └── Prefetch: Hover on CTA links                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Dynamic Imports

```typescript
// Lazy load below-fold sections
import { lazy, Suspense } from 'react';

const FeaturesSection = lazy(() => import('@/components/landing/sections/features-section'));
const PricingSection = lazy(() => import('@/components/landing/sections/pricing-section'));
// ... etc

// Loading fallback
const SectionSkeleton = () => (
  <div className="h-[500px] animate-pulse bg-muted rounded-lg" />
);

// Usage
<Suspense fallback={<SectionSkeleton />}>
  <FeaturesSection />
</Suspense>
```

### Font Loading Strategy

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',          // Prevents FOIT
  preload: true,
  variable: '--font-inter'  // CSS variable for Tailwind
});
```

---

## 8. Responsive Breakpoints

### Mobile-First Approach

```
Breakpoints:
├── sm: 640px   (small tablets)
├── md: 768px   (tablets)
├── lg: 1024px  (small desktops)
├── xl: 1280px  (desktops)
└── 2xl: 1536px (large desktops)
```

### Responsive Layout Rules

| Section | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Hero | Stack vertical, text-center | Stack vertical | Side-by-side |
| Features | 1 column stack | 2 column grid | 4 column grid |
| Steps | Vertical timeline | Vertical timeline | Horizontal 1-2-3 |
| Pricing | Stack with swipe hint | 2+1 grid | 3 column grid |
| Testimonials | Single card, swipe | Carousel 2 visible | Carousel 3 visible |
| FAQ | Full width accordion | Full width accordion | Full width accordion |
| Footer | Stack, collapsed nav | 2 column nav | 4 column nav |
| Header | Hamburger menu | Hamburger menu | Full navigation |

### Mobile Optimizations

```typescript
// Touch-friendly sizing
const touchTargets = {
  buttonMinHeight: '44px',
  buttonMinWidth: '44px',
  linkMinHeight: '44px',
  cardPadding: '24px',
  spacing: '16px'
};

// Reduced motion for mobile (battery)
const mobileAnimations = {
  duration: 0.3,        // Faster on mobile
  stagger: 0.05,        // Less stagger delay
  parallax: false       // Disable parallax
};
```

---

## 9. Integration with Existing Project

### Reusable Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     EXISTING COMPONENTS TO REUSE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  UI Components (src/components/ui/)                                             │
│  ├── Button → CTA buttons, pricing CTAs                                         │
│  ├── Card → Feature cards, pricing cards                                        │
│  ├── Accordion → FAQ section                                                    │
│  ├── Input → Newsletter signup                                                  │
│  ├── Badge → Plan badges (Free, Popular)                                        │
│  ├── Sheet → Mobile navigation drawer                                           │
│  └── Separator → Visual dividers                                                │
│                                                                                  │
│  Design System (globals.css)                                                    │
│  ├── .gradient-text → Hero headline, CTAs                                       │
│  ├── .glass-card → Feature cards                                                │
│  ├── .hover-lift → Card hover effects                                           │
│  ├── Colors: HSL 217 91% 60% (Primary)                                          │
│  └── Colors: HSL 270 95% 75% (Accent)                                           │
│                                                                                  │
│  Animations (tailwind.config.ts)                                                │
│  ├── animate-fade-in                                                            │
│  ├── animate-scale-in                                                           │
│  └── animate-slide-up                                                           │
│                                                                                  │
│  Utilities (lib/utils.ts)                                                       │
│  └── cn() → Conditional class merging                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Layout Differences

| Aspect | Dashboard (existing) | Landing Page (new) |
|--------|----------------------|-------------------|
| Layout File | `dashboard/layout.tsx` | `app/(marketing)/layout.tsx` |
| Sidebar | Yes (DashboardShell) | No (clean layout) |
| Header | App-style with nav | Marketing-style sticky |
| Footer | Minimal | Full marketing footer |
| Auth Required | Yes | No (public) |
| Theme Toggle | Yes | Optional |
| Notifications | Bell icon | No |

### Marketing Layout Structure

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
```

---

## 10. Tech Decisions

### Technology Choices

| Technology | Purpose | Reason |
|------------|---------|--------|
| **Next.js 16 App Router** | Framework | SSG for landing page, optimal performance |
| **React 19** | UI Library | Concurrent features, Suspense boundaries |
| **TypeScript** | Type Safety | Full type coverage, better DX |
| **Tailwind CSS 3** | Styling | Utility-first, design system alignment |
| **shadcn/ui** | Base Components | Already integrated, consistent design |
| **Framer Motion** | Animations | Best React animation library, gesture support |
| **Lucide React** | Icons | Consistent icon set, tree-shakeable |
| **next/font** | Typography | Optimized font loading, zero layout shift |
| **next/image** | Images | Automatic optimization, lazy loading |

### Why These Choices?

**Next.js App Router (SSG)**
- Landing pages need fast initial load
- Static generation at build time
- Edge caching with CDN
- No server-side processing needed

**Framer Motion over CSS animations**
- Complex scroll-triggered animations
- Stagger effects for lists
- Gesture support (mobile swipe)
- Reduced motion support built-in
- Better performance for React

**Tailwind + shadcn/ui**
- Design system already established
- No additional CSS to maintain
- Dark mode support built-in
- Responsive utilities

**No State Management Library**
- Local state sufficient (useState)
- No global state needed
- No API data fetching
- Minimal complexity

### Dependencies to Install

```bash
# Already installed (check package.json):
# - next
# - react
# - typescript
# - tailwindcss
# - @radix-ui/* (via shadcn)
# - lucide-react
# - framer-motion (likely needed)

# Verify framer-motion is installed:
npm list framer-motion

# If not installed:
npm install framer-motion

# For intersection observer (optional, can use native):
npm install react-intersection-observer
```

---

## 11. Implementation Checklist

### Frontend Developer Tasks

#### Phase 1: Foundation
- [ ] Create `app/(marketing)/layout.tsx` with MarketingHeader/Footer
- [ ] Create animation wrapper components (FadeIn, SlideUp, Stagger)
- [ ] Set up data files (features.ts, pricing.ts, testimonials.ts, faq.ts)
- [ ] Create SectionWrapper component
- [ ] Set up types (landing.ts)

#### Phase 2: Sections (in order)
- [ ] **Hero Section** (E12-US-001, E12-US-002)
  - Headline with gradient text
  - Subheadline
  - CTA buttons
  - Trust badge
  - Interactive demo preview

- [ ] **Features Section** (E12-US-003)
  - Section header
  - Feature cards grid
  - Icons and descriptions

- [ ] **How It Works Section** (E12-US-004)
  - Step cards (1-2-3)
  - Timeline visualization

- [ ] **Pricing Section** (E12-US-005, E12-US-006)
  - Billing toggle (month/year)
  - Pricing cards
  - Feature comparison

- [ ] **Testimonials Section** (E12-US-007, E12-US-008)
  - Carousel component
  - Auto-rotation
  - Logo cloud

- [ ] **FAQ Section** (E12-US-009, E12-US-010)
  - Accordion implementation
  - Rich text answers
  - Contact CTA at bottom

- [ ] **CTA Section** (E12-US-011)
  - Final banner
  - Primary/secondary CTAs

#### Phase 3: Polish
- [ ] **Header** (E12-US-012)
  - Sticky behavior
  - Scroll-triggered blur
  - Mobile hamburger menu

- [ ] **Footer**
  - Navigation links
  - Newsletter signup
  - Social links
  - Copyright

#### Phase 4: SEO & Performance
- [ ] Meta tags implementation
- [ ] JSON-LD structured data
- [ ] Open Graph images
- [ ] Image optimization (next/image)
- [ ] Lazy loading for below-fold
- [ ] Performance testing (Lighthouse)

#### Phase 5: Responsive
- [ ] Mobile layout testing
- [ ] Tablet layout testing
- [ ] Touch target sizing
- [ ] Reduced motion testing

#### Phase 6: Testing
- [ ] Cross-browser testing
- [ ] Animation performance
- [ ] Accessibility audit (axe)
- [ ] SEO validation
- [ ] Link testing (all CTAs)

### Files to Create

```
Priority 1 (Core):
├── app/(marketing)/layout.tsx
├── components/landing/layout/marketing-header.tsx
├── components/landing/layout/marketing-footer.tsx
├── components/landing/sections/hero-section.tsx
└── components/landing/animations/fade-in.tsx

Priority 2 (Sections):
├── components/landing/sections/features-section.tsx
├── components/landing/sections/pricing-section.tsx
├── components/landing/ui-components/pricing-card.tsx
└── components/landing/data/pricing.ts

Priority 3 (Remaining):
├── components/landing/sections/how-it-works-section.tsx
├── components/landing/sections/testimonials-section.tsx
├── components/landing/sections/faq-section.tsx
├── components/landing/sections/cta-section.tsx
└── All animation components

Priority 4 (Polish):
├── lib/landing/data/*.ts (all data files)
├── hooks/landing/*.ts (all hooks)
├── types/landing.ts
└── public/images/landing/* (all assets)
```

---

## Appendix

### A. Color Reference

```css
/* From globals.css */
--primary: 217 91% 60%;        /* Blue */
--accent: 270 95% 75%;         /* Purple */
--background: 0 0% 100%;       /* White */
--foreground: 222.2 84% 4.9%;  /* Dark */
--muted: 210 40% 96.1%;        /* Light gray */
```

### B. Animation Easing Reference

```typescript
const easings = {
  smooth: [0.25, 0.1, 0.25, 1],      // Standard smooth
  bounce: [0.68, -0.55, 0.265, 1.55], // Bouncy
  snappy: [0.4, 0, 0.2, 1],          // Quick response
  gentle: [0.22, 1, 0.36, 1]         // Soft ease-out
};
```

### C. Navigation Links

```typescript
const navLinks = [
  { label: 'Funktionen', href: '#features' },
  { label: 'Preise', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

const footerLinks = {
  product: [
    { label: 'Funktionen', href: '#features' },
    { label: 'Preise', href: '#pricing' },
    { label: 'API', href: '/api-docs' }
  ],
  company: [
    { label: 'Über uns', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Kontakt', href: '/contact' }
  ],
  legal: [
    { label: 'Impressum', href: '/impressum' },
    { label: 'Datenschutz', href: '/datenschutz' },
    { label: 'AGB', href: '/agb' }
  ]
};
```

---

**Dokument Version:** 1.0
**Autor:** Solution Architect
**Review Status:** Ready for Frontend Developer Handoff
**Zugehörige Feature Spec:** `docs/E12-DETAILED-REQUIREMENTS.md`
