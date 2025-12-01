import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase/server'
import { updateProjectContext } from '@/lib/supabase/projects'
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
    const projectId = formData.get('project_id') as string

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 3. Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 4. Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // 5. Transcribe with ElevenLabs
    let transcript: string
    try {
      const mimeType = audioFile.type || 'audio/webm'
      
      transcript = await transcribeWithElevenLabs(audioBuffer, {
        modelId: 'scribe_v1',
        languageCode: null,
        diarize: true,
        tagAudioEvents: true,
        mimeType: mimeType,
      })
      
      console.log('[Context] Transcription successful, length:', transcript.length)
    } catch (transcribeError: any) {
      console.error('[Context] Transcription error:', transcribeError)
      return NextResponse.json(
        { error: `Transcription failed: ${transcribeError.message}` },
        { status: 500 }
      )
    }

    // 6. Save transcript directly to project
    await updateProjectContext(projectId, {
      context_transcript: transcript,
    })

    // 7. Return response
    return NextResponse.json({
      transcript,
      project_id: projectId,
    })
  } catch (error: any) {
    console.error('Context transcription error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

