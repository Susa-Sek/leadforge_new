'use client'

// E12 US-12.6: Pricing Section
// 3 Pricing Cards + Monthly/Annual Toggle

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles } from 'lucide-react'
import { FadeInUp, StaggerContainer, StaggerItem } from '../animations/motion-components'
import { pricingContent } from '@/lib/landing/data/content'

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {pricingContent.headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {pricingContent.subheadline}
          </p>
        </FadeInUp>

        {/* Billing Toggle */}
        <FadeInUp className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            {pricingContent.billing.monthly}
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            {pricingContent.billing.annual}
          </span>
          <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20">
            {pricingContent.billing.savings}
          </Badge>
        </FadeInUp>

        {/* Pricing Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {pricingContent.plans.map((plan, index) => (
            <StaggerItem key={index}>
              <Card
                className={`relative h-full flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/10 scale-105 z-10'
                    : 'border-border/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Beliebt
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        €{isAnnual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-muted-foreground">/Monat</span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Jährlich abgerechnet
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={plan.cta.href} className="mt-auto">
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta.label}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Footer Note */}
        <FadeInUp className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            {pricingContent.footer}
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}
