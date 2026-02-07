import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/actions/credits'
import { SearchPageClient } from './search-page-client'

export default async function SuchePage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's credit balance
  const credits = await getCreditBalance(user.id)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lead-Suche</h2>
        <p className="text-muted-foreground">
          Finde qualifizierte B2B-Leads mit KI-gestützter Suche. Filtere nach Branche, Standort und mehr.
        </p>
      </div>

      {/* Search Page Client Component */}
      <SearchPageClient
        userId={user.id}
        userCredits={credits.remaining}
        userTotalCredits={credits.total}
      />
    </div>
  )
}
