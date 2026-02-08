// Deal Statistics API Route
// GET /api/deals/stats - Get comprehensive deal statistics

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Use the database function for pipeline stats
    const { data: stats, error: statsError } = await supabase.rpc('get_pipeline_stats', {
      p_user_id: user.id
    })

    if (statsError) {
      console.error('Error fetching pipeline stats:', statsError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Statistiken' },
        { status: 500 }
      )
    }

    // Fetch additional time-based stats
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        *,
        stage:deal_stages(is_won_stage, is_lost_stage)
      `)
      .eq('user_id', user.id)

    if (dealsError) {
      console.error('Error fetching deals for stats:', dealsError)
    }

    const allDeals = deals || []

    // Calculate deals by stage
    const { data: stages } = await supabase
      .from('deal_stages')
      .select('id, name, color, is_won_stage, is_lost_stage')
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order('order_index')

    const stageStats = stages?.map(stage => {
      const stageDeals = allDeals.filter(d => d.stage_id === stage.id)
      return {
        stage_id: stage.id,
        stage_name: stage.name,
        color: stage.color,
        is_won_stage: stage.is_won_stage,
        is_lost_stage: stage.is_lost_stage,
        count: stageDeals.length,
        total_value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      }
    }) || []

    // Calculate monthly data (last 6 months)
    const monthlyData = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const monthDeals = allDeals.filter(d => {
        if (!d.actual_close_date) return false
        const closeDate = new Date(d.actual_close_date)
        return closeDate >= monthStart && closeDate < monthEnd && d.is_won !== null
      })

      const won = monthDeals.filter(d => d.is_won === true)
      const lost = monthDeals.filter(d => d.is_won === false)

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        won_count: won.length,
        lost_count: lost.length,
        won_value: won.reduce((sum, d) => sum + (d.value || 0), 0),
        lost_value: lost.reduce((sum, d) => sum + (d.value || 0), 0),
      })
    }

    return NextResponse.json({
      stats: stats || {},
      stage_breakdown: stageStats,
      monthly_trends: monthlyData,
    })
  } catch (error) {
    console.error('Error in deals stats GET:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
