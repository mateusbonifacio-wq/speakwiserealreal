import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      project_type,
      description,
      default_audience,
      default_goal,
      default_duration,
      default_scenario,
    } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        project_type: project_type?.trim() || null,
        description: description?.trim() || null,
        default_audience: default_audience?.trim() || null,
        default_goal: default_goal?.trim() || null,
        default_duration: default_duration?.trim() || null,
        default_scenario: default_scenario?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ project: data })
  } catch (error: any) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

