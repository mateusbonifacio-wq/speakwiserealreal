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
    const languageCode = formData.get('language_code') as string | null

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
    let transcript: string = ''
    let detectedLanguage = 'por' // Default to Portuguese
    
    try {
      // Get MIME type from the file
      const mimeType = audioFile.type || 'audio/webm'
      
      console.log('[Upload] Starting transcription with ElevenLabs...', {
        fileSize: audioBuffer.length,
        mimeType,
        fileName: audioFile.name,
      })
      
      // Use language code from form data, or default to Portuguese
      const selectedLanguage = languageCode && languageCode.trim() !== '' ? languageCode.trim() : 'por'
      const finalLanguageCode = selectedLanguage === '' ? null : selectedLanguage
      
      console.log('[Upload] Using language code:', finalLanguageCode || 'auto-detect')
      
      try {
        // Use the selected language (or auto-detect if empty)
        transcript = await transcribeWithElevenLabs(audioBuffer, {
          modelId: 'scribe_v1',
          languageCode: finalLanguageCode, // Use selected language or auto-detect
          diarize: false, // Disable diarization for single speaker (better accuracy and faster)
          tagAudioEvents: false, // Disable audio event tagging (focus on speech, not sounds)
          mimeType: mimeType,
        })
        detectedLanguage = finalLanguageCode || 'auto'
        console.log('[Upload] Transcription successful with language:', detectedLanguage)
      } catch (transcribeError: any) {
        // If selected language fails, try auto-detect as fallback
        if (finalLanguageCode && finalLanguageCode !== 'auto') {
          console.warn('[Upload] Transcription with selected language failed, trying auto-detect:', transcribeError.message)
          try {
            transcript = await transcribeWithElevenLabs(audioBuffer, {
              modelId: 'scribe_v1',
              languageCode: null, // Auto-detect as fallback
              diarize: false,
              tagAudioEvents: false,
              mimeType: mimeType,
            })
            detectedLanguage = 'auto'
            console.log('[Upload] Transcription with auto-detect successful')
          } catch (autoDetectError: any) {
            throw autoDetectError // Re-throw if auto-detect also fails
          }
        } else {
          throw transcribeError // Re-throw if auto-detect was already tried
        }
      }
      
      console.log('[Upload] Final transcription language:', detectedLanguage)
      
      if (!transcript || transcript.trim().length === 0) {
        console.error('[Upload] Empty transcript received. This might indicate:')
        console.error('  - Audio too short or silent')
        console.error('  - Language not detected correctly')
        console.error('  - Audio quality too poor')
        console.error('  - API issue with ElevenLabs')
        throw new Error('Transcription returned empty result. Please ensure you are speaking clearly and the audio is not too short.')
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

