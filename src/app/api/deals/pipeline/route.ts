// Deal Pipeline API Route
// GET /api/deals/pipeline - Get pipeline data grouped by stages

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

    // Fetch all available stages for this user (system + custom)
    const { data: stages, error: stagesError } = await supabase
      .from('deal_stages')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order('order_index')

    if (stagesError) {
      console.error('Error fetching stages:', stagesError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Pipeline-Stages' },
        { status: 500 }
      )
    }

    // Fetch all deals for this user with contacts
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, name, company, email, phone),
        stage:deal_stages(id, name, color, is_won_stage, is_lost_stage, order_index)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dealsError) {
      console.error('Error fetching deals:', dealsError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Deals' },
        { status: 500 }
      )
    }

    // Group deals by stage
    const pipelineData = stages?.map(stage => {
      const stageDeals = (deals || []).filter(deal => deal.stage_id === stage.id)
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
      const weightedValue = stageDeals.reduce(
        (sum, deal) => sum + ((deal.value || 0) * (deal.probability || 0) / 100),
        0
      )

      return {
        stage: {
          id: stage.id,
          name: stage.name,
          color: stage.color,
          order_index: stage.order_index,
          is_won_stage: stage.is_won_stage,
          is_lost_stage: stage.is_lost_stage,
          is_system: stage.is_system,
          default_probability: stage.default_probability,
        },
        deals: stageDeals,
        stats: {
          count: stageDeals.length,
          total_value: totalValue,
          weighted_value: Math.round(weightedValue * 100) / 100,
        }
      }
    }) || []

    // Calculate overall stats
    const allDeals = deals || []
    const openDeals = allDeals.filter(d => d.is_won === null)
    const wonDeals = allDeals.filter(d => d.is_won === true)
    const lostDeals = allDeals.filter(d => d.is_won === false)

    const totalPipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    const weightedPipelineValue = openDeals.reduce(
      (sum, deal) => sum + ((deal.value || 0) * (deal.probability || 0) / 100),
      0
    )

    const overallStats = {
      total_deals: allDeals.length,
      open_deals_count: openDeals.length,
      won_deals_count: wonDeals.length,
      lost_deals_count: lostDeals.length,
      total_pipeline_value: totalPipelineValue,
      weighted_pipeline_value: Math.round(weightedPipelineValue * 100) / 100,
      average_probability: openDeals.length > 0
        ? Math.round(openDeals.reduce((sum, d) => sum + (d.probability || 0), 0) / openDeals.length * 100) / 100
        : 0,
    }

    return NextResponse.json({
      pipeline: pipelineData,
      stats: overallStats,
    })
  } catch (error) {
    console.error('Error in pipeline GET:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
