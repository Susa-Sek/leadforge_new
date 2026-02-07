'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  company: string | null
}

interface Credits {
  remaining: number
  total: number
  used: number
}

interface PlanConfig {
  planName: string
  creditsLimit: number
  isActive: boolean
  currentPeriodEnd: string | null
  features: {
    canExport: boolean
    maxResults: number
    prioritySupport: boolean
  }
}

interface UserContextType {
  user: User | null
  profile: Profile | null
  credits: Credits
  planConfig: PlanConfig | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [credits, setCredits] = useState<Credits>({ remaining: 0, total: 0, used: 0 })
  const [planConfig, setPlanConfig] = useState<PlanConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserData = useCallback(async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setUser(null)
        setProfile(null)
        setCredits({ remaining: 0, total: 0, used: 0 })
        setPlanConfig(null)
        setLoading(false)
        return
      }

      const userId = session.user.id
      setUser(session.user)

      // Fetch profile, credits, and subscription in parallel
      const [profileResult, creditsResult, subscriptionResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, company')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_credits')
          .select('total_credits, used_credits')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('subscriptions')
          .select('status, current_period_end, plan_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single(),
      ])

      // Set profile
      if (profileResult.data) {
        setProfile(profileResult.data)
      }

      // Set credits
      if (creditsResult.data) {
        const { total_credits, used_credits } = creditsResult.data
        setCredits({
          remaining: total_credits - used_credits,
          total: total_credits,
          used: used_credits,
        })
      }

      // Set plan config
      if (subscriptionResult.data) {
        // Fetch plan details
        const { data: planData } = await supabase
          .from('plans')
          .select('name, credits_limit, features')
          .eq('id', subscriptionResult.data.plan_id)
          .single()

        if (planData) {
          const features = planData.features as Record<string, boolean | number> || {}
          setPlanConfig({
            planName: planData.name,
            creditsLimit: planData.credits_limit,
            isActive: subscriptionResult.data.status === 'active',
            currentPeriodEnd: subscriptionResult.data.current_period_end,
            features: {
              canExport: features.can_export as boolean ?? false,
              maxResults: features.max_results as number ?? 50,
              prioritySupport: features.priority_support as boolean ?? false,
            },
          })
        }
      } else {
        // Default free plan config
        setPlanConfig({
          planName: 'Free',
          creditsLimit: 30,
          isActive: true,
          currentPeriodEnd: null,
          features: {
            canExport: false,
            maxResults: 50,
            prioritySupport: false,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          await fetchUserData()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCredits({ remaining: 0, total: 0, used: 0 })
          setPlanConfig(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  // Realtime subscription for credits
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`user_credits:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'total_credits' in payload.new && 'used_credits' in payload.new) {
            const { total_credits, used_credits } = payload.new as { total_credits: number; used_credits: number }
            setCredits({
              remaining: total_credits - used_credits,
              total: total_credits,
              used: used_credits,
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, supabase])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    await fetchUserData()
    setLoading(false)
  }, [fetchUserData])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const value: UserContextType = {
    user,
    profile,
    credits,
    planConfig,
    loading,
    refreshUser,
    logout,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
