import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Use service role client to bypass RLS issues
  const serviceSupabase = createServiceClient()

  // Fetch profile and credits in parallel
  const [profileResult, creditsResult] = await Promise.all([
    serviceSupabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    serviceSupabase
      .from('user_credits')
      .select('total_credits, used_credits')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const creditsData = creditsResult.data
    ? {
        remaining: creditsResult.data.total_credits - creditsResult.data.used_credits,
        total: creditsResult.data.total_credits,
        used: creditsResult.data.used_credits,
      }
    : { remaining: 0, total: 0, used: 0 }

  const userData = {
    email: user.email ?? '',
    fullName: profileResult.data?.full_name ?? null,
    avatarUrl: profileResult.data?.avatar_url ?? null,
  }

  return (
    <DashboardShell user={userData} credits={creditsData}>
      {children}
    </DashboardShell>
  )
}
