import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Log for debugging (remove in production)
  console.log('Admin check:', { userId: user.id, profile, profileError })

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <AdminShell
      user={{
        email: user.email || '',
        fullName: user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      }}
    >
      {children}
    </AdminShell>
  )
}
