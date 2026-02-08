'use client'

// E12 US-12.9: CTA Section (Final Banner)
// Final call-to-action before footer

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { FadeInUp } from '../animations/motion-components'
import { ctaContent } from '@/lib/landing/data/content'

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl">
        <div className="absolute top-20 left-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInUp className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              14 Tage kostenlos testen
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {ctaContent.headline}
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            {ctaContent.subheadline}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaContent.cta.href}>
              <Button size="lg" className="gap-2 text-base px-8">
                {ctaContent.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={ctaContent.secondary.href}>
              <Button size="lg" variant="outline" className="text-base px-8">
                {ctaContent.secondary.label}
              </Button>
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}
