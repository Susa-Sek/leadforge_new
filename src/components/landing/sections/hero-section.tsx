'use client'

// E12 US-12.2: Hero Section
// Gradient headline + CTA + trust badge + stats

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { heroContent } from '@/lib/landing/data/content'
import { HeroAnimation, HeroAnimationDelayed } from '../animations/motion-components'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <HeroAnimation>
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-2" />
              {heroContent.trustBadge.text}
            </Badge>
          </HeroAnimation>

          {/* Headline */}
          <HeroAnimation>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="gradient-text">Finde qualifizierte</span>
              <br />
              <span className="text-foreground">B2B-Leads mit</span>
              <br />
              <span className="gradient-text">KI-gestützter Suche</span>
            </h1>
          </HeroAnimation>

          {/* Subheadline */}
          <HeroAnimationDelayed delay={0.2}>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {heroContent.subheadline}
            </p>
          </HeroAnimationDelayed>

          {/* CTA Buttons */}
          <HeroAnimationDelayed delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href={heroContent.cta.primary.href}>
                <Button size="lg" className="gap-2 text-base px-8">
                  {heroContent.cta.primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={heroContent.cta.secondary.href}>
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  <Play className="h-4 w-4" />
                  {heroContent.cta.secondary.label}
                </Button>
              </Link>
            </div>
          </HeroAnimationDelayed>

          {/* Sub Badge */}
          <HeroAnimationDelayed delay={0.4}>
            <p className="text-sm text-muted-foreground">
              {heroContent.trustBadge.subtext}
            </p>
          </HeroAnimationDelayed>

          {/* Stats */}
          <HeroAnimationDelayed delay={0.5}>
            <motion.div
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {heroContent.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </HeroAnimationDelayed>

          {/* Dashboard Preview Mock */}
          <HeroAnimationDelayed delay={0.7}>
            <div className="mt-16 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur-2xl opacity-50" />
              <div className="relative glass-card rounded-xl p-2 sm:p-4">
                <div className="bg-muted/80 rounded-lg p-4 sm:p-6">
                  {/* Mock Search Interface */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-full max-w-md bg-background rounded-lg border flex items-center px-4">
                        <span className="text-sm text-muted-foreground">Suche nach Software-Unternehmen in Berlin...</span>
                      </div>
                      <div className="h-10 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">Suchen</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Branche', 'Standort', 'Unternehmensgröße', 'Technologie'].map((filter) => (
                        <div key={filter} className="h-8 px-3 bg-background rounded-full border flex items-center">
                          <span className="text-xs text-muted-foreground">{filter}</span>
                        </div>
                      ))}
                    </div>
                    {/* Mock Results */}
                    <div className="grid gap-2 mt-4">
                      {[
                        { name: 'TechCorp GmbH', industry: 'Software', size: '50-200' },
                        { name: 'DataFlow AG', industry: 'SaaS', size: '200-500' },
                        { name: 'CloudSync UG', industry: 'Cloud', size: '10-50' },
                      ].map((company, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">{company.name[0]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{company.industry} • {company.size} Mitarbeiter</p>
                            </div>
                          </div>
                          <div className="h-6 w-16 bg-primary rounded text-xs text-primary-foreground flex items-center justify-center">
                            Export
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HeroAnimationDelayed>
        </div>
      </div>
    </section>
  )
}
