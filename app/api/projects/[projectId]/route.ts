import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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

    const updates: Record<string, string | null> = {}
    if (typeof name === 'string') updates.name = name.trim()
    if (typeof project_type === 'string') updates.project_type = project_type.trim() || null
    if (typeof description === 'string') updates.description = description.trim() || null
    if (typeof default_audience === 'string') updates.default_audience = default_audience.trim() || null
    if (typeof default_goal === 'string') updates.default_goal = default_goal.trim() || null
    if (typeof default_duration === 'string') updates.default_duration = default_duration.trim() || null
    if (typeof default_scenario === 'string') updates.default_scenario = default_scenario.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates })
      .eq('id', params.projectId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ project: data })
  } catch (error: any) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.projectId)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

