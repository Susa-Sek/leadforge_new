// E12 Landing Page - Marketing Layout
// SSG layout for marketing pages

import { MarketingHeader } from '@/components/landing/layout/marketing-header'
import { MarketingFooter } from '@/components/landing/layout/marketing-footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
