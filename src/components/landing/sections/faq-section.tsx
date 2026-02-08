'use client'

// E12 US-12.8: FAQ Section
// Accordion with contact CTA

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { FadeInUp, StaggerContainer, StaggerItem } from '../animations/motion-components'
import { faqContent } from '@/lib/landing/data/content'

export function FAQSection() {
  return (
    <section id="faq" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {faqContent.headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {faqContent.subheadline}
          </p>
        </FadeInUp>

        {/* FAQ Accordion */}
        <StaggerContainer className="max-w-3xl mx-auto">
          <StaggerItem>
            <Accordion type="single" collapsible className="space-y-4">
              {faqContent.faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-background data-[state=open]:border-primary/30 transition-colors"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </StaggerItem>
        </StaggerContainer>

        {/* Contact CTA */}
        <FadeInUp className="mt-16 max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {faqContent.cta.headline}
              </h3>
              <p className="text-muted-foreground mb-6">
                {faqContent.cta.text}
              </p>
              <Link href={faqContent.cta.button.href}>
                <Button variant="outline">
                  {faqContent.cta.button.label}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeInUp>
      </div>
    </section>
  )
}
