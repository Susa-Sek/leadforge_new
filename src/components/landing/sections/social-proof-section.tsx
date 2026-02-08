'use client'

// E12 US-12.3: Social Proof Section
// Company logos + statistics

import { FadeInUp, StaggerContainer, StaggerItem } from '../animations/motion-components'
import { socialProofContent } from '@/lib/landing/data/content'

export function SocialProofSection() {
  return (
    <section className="py-16 lg:py-20 border-y bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp className="text-center mb-12">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {socialProofContent.headline}
          </p>
        </FadeInUp>

        {/* Company Logos */}
        <StaggerContainer className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 mb-16">
          {socialProofContent.logos.map((logo, index) => (
            <StaggerItem key={index}>
              <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{logo.initials}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{logo.name}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Stats */}
        <FadeInUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {socialProofContent.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}
