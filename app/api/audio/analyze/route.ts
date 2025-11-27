import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server'
import { getAudioSession, updateAudioSessionAnalysis } from '@/lib/supabase/audio-sessions'
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
    const { audio_session_id, pitch_transcript, context } = body

    // Support both old format (audio_session_id) and new format (pitch_transcript + context)
    let transcript: string
    let sessionType: 'pitch' | 'context' = 'pitch'

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

    // 3. Build context string if provided
    let contextString = ''
    if (context) {
      const contextParts: string[] = []
      if (context.audience) contextParts.push(`Audience: ${context.audience}`)
      if (context.goal) contextParts.push(`Goal: ${context.goal}`)
      if (context.duration) contextParts.push(`Duration: ${context.duration}`)
      if (context.scenario) contextParts.push(`Scenario: ${context.scenario}`)
      if (context.english_level) contextParts.push(`English Level: ${context.english_level}`)
      if (context.tone_style) contextParts.push(`Tone/Style: ${context.tone_style}`)
      if (context.constraints) contextParts.push(`Constraints: ${context.constraints}`)
      if (context.additional_notes) contextParts.push(`Additional Notes: ${context.additional_notes}`)
      if (context.context_transcript) contextParts.push(`Context Transcript: ${context.context_transcript}`)
      
      if (contextParts.length > 0) {
        contextString = '\n\nContext Information:\n' + contextParts.join('\n')
      }
    }

    // 4. Analyze with Gemini (pass full transcript with context)
    const fullTranscript = transcript + contextString
    const analysisJson = await analyzeWithGemini(fullTranscript, sessionType)

    // 5. If audio_session_id was provided, update the session
    if (audio_session_id) {
      await updateAudioSessionAnalysis(audio_session_id, analysisJson)
    }

    // 6. Return analysis
    return NextResponse.json({
      analysis_json: analysisJson,
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

