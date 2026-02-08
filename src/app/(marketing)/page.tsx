// E12 Landing Page - Main Entry Point
// Complete landing page with all 9 sections and SEO

import type { Metadata } from 'next'
import { MarketingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/sections/hero-section'
import { SocialProofSection } from '@/components/landing/sections/social-proof-section'
import { FeaturesSection } from '@/components/landing/sections/features-section'
import { HowItWorksSection } from '@/components/landing/sections/how-it-works-section'
import { PricingSection } from '@/components/landing/sections/pricing-section'
import { TestimonialsSection } from '@/components/landing/sections/testimonials-section'
import { FAQSection } from '@/components/landing/sections/faq-section'
import { CTASection } from '@/components/landing/sections/cta-section'
import { seoContent, siteConfig } from '@/lib/landing/data/content'

// SEO Metadata
export const metadata: Metadata = {
  title: seoContent.title,
  description: seoContent.description,
  keywords: seoContent.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: seoContent.og.title,
    description: seoContent.og.description,
    images: [
      {
        url: seoContent.og.image,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - B2B Lead-Generation Plattform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: seoContent.og.title,
    description: seoContent.og.description,
    images: [seoContent.og.image],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual code
  },
}

// JSON-LD Structured Data
function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}/logo.png`,
        },
        sameAs: [
          'https://linkedin.com/company/manyleads',
          'https://twitter.com/manyleads',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: siteConfig.email,
          contactType: 'customer support',
          availableLanguage: ['German', 'English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        publisher: {
          '@id': `${siteConfig.url}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/suche?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteConfig.url}/#webpage`,
        url: siteConfig.url,
        name: seoContent.title,
        description: seoContent.description,
        isPartOf: {
          '@id': `${siteConfig.url}/#website`,
        },
        about: {
          '@id': `${siteConfig.url}/#organization`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}${seoContent.og.image}`,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '49',
          priceCurrency: 'EUR',
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '500',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <MarketingLayout>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </MarketingLayout>
    </>
  )
}
