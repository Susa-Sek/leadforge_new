'use client'

// E12 US-12.4: Features Section
// 4 Feature Cards with icons and descriptions

import { Target, Zap, Database, Plug } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StaggerContainer, StaggerItem, FadeInUp } from '../animations/motion-components'
import { featuresContent } from '@/lib/landing/data/content'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Zap,
  Database,
  Plug,
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {featuresContent.headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {featuresContent.subheadline}
          </p>
        </FadeInUp>

        {/* Feature Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {featuresContent.features.map((feature, index) => {
            const Icon = iconMap[feature.icon]
            return (
              <StaggerItem key={index}>
                <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}
