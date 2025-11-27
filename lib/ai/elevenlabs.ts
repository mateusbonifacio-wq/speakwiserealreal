/**
 * Transcribe audio using ElevenLabs Speech-to-Text API
 * @param audioBuffer - The audio file as a Buffer
 * @param options - Optional transcription parameters
 * @returns The transcript text
 */
export async function transcribeWithElevenLabs(
  audioBuffer: Buffer,
  options: {
    modelId?: string
    languageCode?: string
    diarize?: boolean
    tagAudioEvents?: boolean
  } = {}
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }

  // Use REST API directly (SDK may not work well in Node.js server environment)
  // Based on Python SDK: elevenlabs.speech_to_text.convert()
  return transcribeWithElevenLabsREST(audioBuffer, options, apiKey)
}

/**
 * Fallback REST API implementation
 */
async function transcribeWithElevenLabsREST(
  audioBuffer: Buffer,
  options: {
    modelId?: string
    languageCode?: string
    diarize?: boolean
    tagAudioEvents?: boolean
  },
  apiKey: string
): Promise<string> {
  const FormData = (await import('form-data')).default
  
  const formData = new FormData()
  formData.append('file', audioBuffer, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg',
  })
  
  if (options.modelId) {
    formData.append('model_id', options.modelId)
  }
  if (options.languageCode) {
    formData.append('language_code', options.languageCode)
  }
  if (options.diarize !== undefined) {
    formData.append('diarize', options.diarize.toString())
  }
  if (options.tagAudioEvents !== undefined) {
    formData.append('tag_audio_events', options.tagAudioEvents.toString())
  }
  
  // Try the endpoint based on Python SDK: speech_to_text.convert()
  const endpoint = 'https://api.elevenlabs.io/v1/speech-to-text/convert'
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      ...(formData.getHeaders ? formData.getHeaders() : {}),
    },
    // @ts-ignore
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData: any = { detail: errorText || 'Unknown error' }
    try {
      if (errorText) {
        errorData = JSON.parse(errorText)
      }
    } catch {
      errorData = { detail: errorText }
    }
    throw new Error(`ElevenLabs API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const data = await response.json()
    return data.text || data.transcript || data.transcription || JSON.stringify(data)
  } else {
    return await response.text()
  }
}

/**
 * Convenience wrapper with default settings matching the Python example
 * Uses scribe_v1 model with diarization and audio event tagging
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    return await transcribeWithElevenLabs(audioBuffer, {
      modelId: 'scribe_v1',
      languageCode: 'eng',
      diarize: true,
      tagAudioEvents: true,
    })
  } catch (error) {
    console.error('ElevenLabs transcription error:', error)
    throw error
  }
}
