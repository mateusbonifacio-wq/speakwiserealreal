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
    const projectId = formData.get('project_id') as string | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (type !== 'pitch') {
      return NextResponse.json({ error: 'Invalid type. Must be "pitch". Use /api/project/transcribe-context for context.' }, { status: 400 })
    }

    const supabase = await createClient()

    let validatedProjectId: string | null = null
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .single()

      if (projectError || !project || project.user_id !== user.id) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      validatedProjectId = project.id
    }

    // 3. Create audio session record (with placeholder path) - only for pitch
    const audioSession = await createAudioSession(
      user.id,
      'pitch',
      'placeholder', // Will be updated after upload
      validatedProjectId
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
    await supabase
      .from('audio_sessions')
      .update({ audio_path: uploadResult.path })
      .eq('id', audioSession.id)

    // 8. Transcribe with ElevenLabs using scribe_v1 model with diarization
    // Use auto-detect language (null) for better accuracy
    let transcript: string
    try {
      // Get MIME type from the file
      const mimeType = audioFile.type || 'audio/webm'
      
      console.log('[Upload] Starting transcription with ElevenLabs...', {
        fileSize: audioBuffer.length,
        mimeType,
        fileName: audioFile.name,
      })
      
      // Use auto-detect for best results, but can be overridden
      // Supported languages: 'eng' (English), 'por' (Portuguese), 'spa' (Spanish), 'fra' (French), etc.
      // null = auto-detect (recommended for mixed or unknown languages)
      transcript = await transcribeWithElevenLabs(audioBuffer, {
        modelId: 'scribe_v1',
        languageCode: null, // Auto-detect language for best accuracy
        diarize: false, // Disable diarization for single speaker (better accuracy and faster)
        tagAudioEvents: false, // Disable audio event tagging (focus on speech, not sounds)
        mimeType: mimeType,
      })
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcription returned empty result')
      }
      
      console.log('[Upload] Transcription successful, length:', transcript.length)
      console.log('[Upload] Transcript preview:', transcript.substring(0, 100))
    } catch (transcribeError: any) {
      console.error('[Upload] Transcription error:', transcribeError)
      // Return error response instead of embedding error in transcript
      return NextResponse.json(
        { 
          error: `Transcription failed: ${transcribeError.message || 'Unknown error'}`,
          details: transcribeError.message,
        },
        { status: 500 }
      )
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

