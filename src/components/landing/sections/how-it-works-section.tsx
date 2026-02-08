'use client'

// E12 US-12.5: How It Works Section
// 3 Step Cards with icons

import { Search, Sparkles, Download } from 'lucide-react'
import { StaggerContainer, StaggerItem, FadeInUp } from '../animations/motion-components'
import { howItWorksContent } from '@/lib/landing/data/content'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  Sparkles,
  Download,
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {howItWorksContent.headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {howItWorksContent.subheadline}
          </p>
        </FadeInUp>

        {/* Step Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {howItWorksContent.steps.map((step, index) => {
            const Icon = iconMap[step.icon]
            return (
              <StaggerItem key={index}>
                <div className="relative group">
                  {/* Connector Line (hidden on mobile) */}
                  {index < howItWorksContent.steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-px">
                      <div className="w-full h-full bg-gradient-to-r from-border via-primary/30 to-border" />
                    </div>
                  )}

                  <div className="text-center">
                    {/* Step Number */}
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 mb-6 group-hover:scale-105 transition-transform duration-300">
                      <span className="text-3xl font-bold gradient-text">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
