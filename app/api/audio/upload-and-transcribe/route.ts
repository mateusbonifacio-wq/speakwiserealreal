import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'
import { createAudioSession, updateAudioSessionTranscript } from '@/lib/supabase/audio-sessions'
import { uploadAudioToSupabase } from '@/lib/supabase/storage'
import { transcribeWithElevenLabs } from '@/lib/ai/elevenlabs'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const type = formData.get('type') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (type !== 'pitch' && type !== 'context') {
      return NextResponse.json({ error: 'Invalid type. Must be "pitch" or "context"' }, { status: 400 })
    }

    // 3. Create audio session record (with placeholder path)
    const audioSession = await createAudioSession(
      user.id,
      type as 'pitch' | 'context',
      'placeholder' // Will be updated after upload
    )

    // 4. Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // 5. Determine file extension
    const fileName = audioFile.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'mp3'

    // 6. Upload to Supabase Storage
    const uploadResult = await uploadAudioToSupabase(
      user.id,
      audioBuffer,
      audioSession.id,
      fileExtension
    )

    // 7. Update audio session with actual path
    const supabase = await createClient()
    await supabase
      .from('audio_sessions')
      .update({ audio_path: uploadResult.path })
      .eq('id', audioSession.id)

    // 8. Transcribe with ElevenLabs
    let transcript: string
    try {
      transcript = await transcribeWithElevenLabs(audioBuffer)
    } catch (transcribeError: any) {
      console.error('Transcription error:', transcribeError)
      // Still return success but with error in transcript
      transcript = `[Transcription error: ${transcribeError.message}]`
    }

    // 9. Update audio session with transcript
    await updateAudioSessionTranscript(audioSession.id, transcript)

    // 10. Return response
    return NextResponse.json({
      audio_session_id: audioSession.id,
      transcript,
      audio_path: uploadResult.path,
    })
  } catch (error: any) {
    console.error('Upload and transcribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

