'use client'

// E12 US-12.9: Marketing Footer Component
// Links + Newsletter signup

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Linkedin, Twitter, ArrowRight } from 'lucide-react'
import { footerContent } from '@/lib/landing/data/content'
import { useState } from 'react'

export function MarketingFooter() {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter signup logic would go here
    alert('Vielen Dank für deine Anmeldung!')
    setEmail('')
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold gradient-text">
                {footerContent.company.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {footerContent.company.description}
            </p>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {footerContent.newsletter.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {footerContent.newsletter.description}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={footerContent.newsletter.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
                <Button type="submit" size="sm" className="h-9 px-3">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">
              {footerContent.links.product.title}
            </h4>
            <ul className="space-y-3">
              {footerContent.links.product.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">
              {footerContent.links.company.title}
            </h4>
            <ul className="space-y-3">
              {footerContent.links.company.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">
              {footerContent.links.legal.title}
            </h4>
            <ul className="space-y-3">
              {footerContent.links.legal.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {footerContent.copyright}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href={footerContent.social[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href={footerContent.social[1].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
