'use client'

// E12 Landing Page - Marketing Layout Wrapper
// Combines Header, Footer and main content

import { MarketingHeader } from './marketing-header'
import { MarketingFooter } from './marketing-footer'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}
