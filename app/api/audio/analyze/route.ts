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
    const { audio_session_id } = body

    if (!audio_session_id) {
      return NextResponse.json({ error: 'audio_session_id is required' }, { status: 400 })
    }

    // 3. Fetch the audio session
    const audioSession = await getAudioSession(audio_session_id)

    if (!audioSession) {
      return NextResponse.json({ error: 'Audio session not found' }, { status: 404 })
    }

    // 4. Verify ownership
    if (audioSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 5. Check if transcript exists
    if (!audioSession.transcript) {
      return NextResponse.json(
        { error: 'Transcript not available. Please transcribe the audio first.' },
        { status: 400 }
      )
    }

    // 6. Analyze with Gemini
    const analysisJson = await analyzeWithGemini(
      audioSession.transcript,
      audioSession.type as 'pitch' | 'context'
    )

    // 7. Update audio session with analysis
    await updateAudioSessionAnalysis(audioSession.id, analysisJson)

    // 8. Return analysis
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

