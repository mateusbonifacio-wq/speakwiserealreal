import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'
import { updateProjectContext } from '@/lib/supabase/projects'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { project_id, context } = body

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (!context) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 3. Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 4. Update project context
    await updateProjectContext(project_id, {
      default_audience: context.audience || null,
      default_goal: context.goal || null,
      default_duration: context.duration || null,
      default_scenario: context.scenario || null,
      english_level: context.english_level || null,
      tone_style: context.tone_style || null,
      constraints: context.constraints || null,
      additional_notes: context.additional_notes || null,
      context_transcript: context.context_transcript || null,
      transcription_language: context.transcription_language || null,
    })

    // 5. Return success
    return NextResponse.json({ success: true, project_id })
  } catch (error: any) {
    console.error('Update context error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

