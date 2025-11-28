import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server'
import { getAudioSession, updateAudioSessionAnalysis } from '@/lib/supabase/audio-sessions'
import { getProjectById } from '@/lib/supabase/projects'
import { analyzeWithGemini } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { audio_session_id, pitch_transcript, context, project_id, attempt_number, previous_scores } = body

    // Support both old format (audio_session_id) and new format (pitch_transcript + context)
    let transcript: string
    let sessionType: 'pitch' | 'context' = 'pitch'
    let projectIdForContext: string | null = project_id || null

    if (pitch_transcript) {
      // New format: direct transcript and context
      transcript = pitch_transcript
    } else if (audio_session_id) {
      // Old format: fetch from session
      const audioSession = await getAudioSession(audio_session_id)

      if (!audioSession) {
        return NextResponse.json({ error: 'Audio session not found' }, { status: 404 })
      }

      // Verify ownership
      if (audioSession.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (!audioSession.transcript) {
        return NextResponse.json(
          { error: 'Transcript not available. Please transcribe the audio first.' },
          { status: 400 }
        )
      }

      transcript = audioSession.transcript
      sessionType = audioSession.type as 'pitch' | 'context'
      projectIdForContext = audioSession.project_id
    } else {
      return NextResponse.json(
        { error: 'Either audio_session_id or pitch_transcript is required' },
        { status: 400 }
      )
    }

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // 3. Fetch project defaults if provided
    let projectContext = null
    if (projectIdForContext) {
      projectContext = await getProjectById(projectIdForContext)
      if (!projectContext) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const combinedContext = {
      audience: context?.audience || projectContext?.default_audience || '',
      goal: context?.goal || projectContext?.default_goal || '',
      duration: context?.duration || projectContext?.default_duration || '',
      scenario: context?.scenario || projectContext?.default_scenario || '',
      english_level: context?.english_level || '',
      tone_style: context?.tone_style || '',
      constraints: context?.constraints || '',
      additional_notes: context?.additional_notes || '',
      context_transcript: context?.context_transcript || '',
    }

    const contextParts: string[] = []
    if (projectContext) {
      contextParts.push(
        `Project: ${projectContext.name}${projectContext.project_type ? ` (${projectContext.project_type})` : ''}`
      )
    }
    if (combinedContext.audience) contextParts.push(`Audience: ${combinedContext.audience}`)
    if (combinedContext.goal) contextParts.push(`Goal: ${combinedContext.goal}`)
    if (combinedContext.duration) contextParts.push(`Duration: ${combinedContext.duration}`)
    if (combinedContext.scenario) contextParts.push(`Scenario: ${combinedContext.scenario}`)
    if (combinedContext.english_level) contextParts.push(`English Level: ${combinedContext.english_level}`)
    if (combinedContext.tone_style) contextParts.push(`Tone/Style: ${combinedContext.tone_style}`)
    if (combinedContext.constraints) contextParts.push(`Constraints: ${combinedContext.constraints}`)
    if (combinedContext.additional_notes) contextParts.push(`Additional Notes: ${combinedContext.additional_notes}`)
    if (combinedContext.context_transcript) contextParts.push(`Context Transcript: ${combinedContext.context_transcript}`)

    let contextString = ''
    if (contextParts.length > 0) {
      contextString = '\n\nContext Information:\n' + contextParts.join('\n')
    }

    // 4. Analyze with Gemini (pass transcript, context object, attempt number, and previous scores)
    const analysisJson = await analyzeWithGemini(
      transcript,
      sessionType,
      combinedContext,
      attempt_number,
      previous_scores
    )

    // 5. If audio_session_id was provided, update the session
    if (audio_session_id) {
      await updateAudioSessionAnalysis(audio_session_id, analysisJson)
    }

    // 6. Return analysis
    return NextResponse.json({
      analysis_json: analysisJson,
      combined_context: combinedContext,
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

