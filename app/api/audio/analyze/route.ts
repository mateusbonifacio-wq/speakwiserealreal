import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { getAudioSession, updateAudioSessionAnalysis, getPreviousAnalyzedPitchSessions, createAudioSession } from '@/lib/supabase/audio-sessions'
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

    // 4. Fetch previous analyzed pitch sessions for progress tracking (only for pitch type)
    let attemptNumber: number | undefined = undefined
    let previousAttempts: Array<{
      attempt: number
      created_at: string
      scores?: {
        clarity?: number
        structure_flow?: number
        persuasiveness?: number
        storytelling?: number
        conciseness?: number
        fit_for_audience?: number
        delivery_energy?: number
      }
    }> = []

    if (sessionType === 'pitch' && projectIdForContext) {
      // Get previous analyzed pitch sessions (excluding current if we have audio_session_id)
      const previousSessions = await getPreviousAnalyzedPitchSessions(
        projectIdForContext,
        audio_session_id,
        3 // Limit to last 3 attempts
      )

      // Calculate attempt number
      attemptNumber = previousSessions.length + 1

      // Build previous attempts array with scores
      previousAttempts = previousSessions.map((session, index) => {
        const scores = session.analysis_json?.scores
        const extractedScores = scores ? {
          clarity: typeof scores.clarity === 'object' && scores.clarity?.score !== undefined ? scores.clarity.score : (typeof scores.clarity === 'number' ? scores.clarity : undefined),
          structure_flow: typeof scores.structure_flow === 'object' && scores.structure_flow?.score !== undefined ? scores.structure_flow.score : (typeof scores.structure_flow === 'number' ? scores.structure_flow : undefined),
          persuasiveness: typeof scores.persuasiveness === 'object' && scores.persuasiveness?.score !== undefined ? scores.persuasiveness.score : (typeof scores.persuasiveness === 'number' ? scores.persuasiveness : undefined),
          storytelling: typeof scores.storytelling === 'object' && scores.storytelling?.score !== undefined ? scores.storytelling.score : (typeof scores.storytelling === 'number' ? scores.storytelling : undefined),
          conciseness: typeof scores.conciseness === 'object' && scores.conciseness?.score !== undefined ? scores.conciseness.score : (typeof scores.conciseness === 'number' ? scores.conciseness : undefined),
          fit_for_audience: typeof scores.fit_for_audience === 'object' && scores.fit_for_audience?.score !== undefined ? scores.fit_for_audience.score : (typeof scores.fit_for_audience === 'number' ? scores.fit_for_audience : undefined),
          delivery_energy: typeof scores.delivery_energy === 'object' && scores.delivery_energy?.score !== undefined ? scores.delivery_energy.score : (typeof scores.delivery_energy === 'number' ? scores.delivery_energy : undefined),
        } : undefined

        return {
          attempt: index + 1,
          created_at: session.created_at,
          scores: extractedScores,
        }
      })
    }

    // Use provided attempt_number if available, otherwise use calculated one
    const finalAttemptNumber = attempt_number || attemptNumber

    // 5. Analyze with Gemini (pass transcript, context object, attempt number, and previous attempts)
    const analysisJson = await analyzeWithGemini(
      transcript,
      sessionType,
      combinedContext,
      finalAttemptNumber,
      previousAttempts.length > 0 ? previousAttempts : undefined
    )

    // 6. Ensure analysis_json includes scores for future progress tracking
    if (!analysisJson.scores) {
      // If scores are missing, create a placeholder structure
      analysisJson.scores = {}
    }

    // 7. Save analysis to a session
    let savedSessionId: string | null = null
    
    if (audio_session_id) {
      // Update existing session
      await updateAudioSessionAnalysis(audio_session_id, analysisJson)
      savedSessionId = audio_session_id
    } else if (sessionType === 'pitch' && projectIdForContext) {
      // Create a new session for direct transcript analysis (so it shows in progress)
      // Use a placeholder audio path since we don't have an actual audio file
      const newSession = await createAudioSession(
        user.id,
        'pitch',
        'direct-transcript', // Placeholder path
        projectIdForContext
      )
      // Update the new session with transcript and analysis
      const supabase = await createClient()
      const { error: updateError } = await supabase
        .from('audio_sessions')
        .update({
          transcript: transcript,
          analysis_json: analysisJson,
        })
        .eq('id', newSession.id)
      
      if (updateError) {
        console.error('Failed to update new session:', updateError)
        // Continue anyway - the session was created
      }
      savedSessionId = newSession.id
    }

    // 8. Return analysis
    return NextResponse.json({
      analysis_json: analysisJson,
      combined_context: combinedContext,
      attempt_number: finalAttemptNumber,
      session_id: savedSessionId, // Return the session ID so frontend can refresh
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

