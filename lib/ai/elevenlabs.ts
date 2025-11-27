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
  
  // Use FormData for multipart/form-data upload
  // In Node.js, we need to use form-data package
  const FormData = (await import('form-data')).default
  const formData = new FormData()
  
  // Append the audio file
  // Note: Field name might be 'file' or 'audio' - adjust based on API response
  formData.append('file', audioBuffer, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg',
  })
  
  // Append optional parameters
  // These parameter names match the Python SDK format
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
  
  // ElevenLabs Speech-to-Text API endpoint
  // Try /v1/speech-to-text/convert first, may need to adjust to:
  // - /v1/speech-to-text/transcribe
  // - /v1/speech-to-text
  // Check ElevenLabs REST API docs if this doesn't work
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text/convert', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      ...(formData.getHeaders ? formData.getHeaders() : {}),
    },
    // @ts-ignore - form-data works with fetch in Node.js 18+
    body: formData,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
  }
  
  // The response might be JSON or plain text
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const data = await response.json()
    // Handle different response formats
    return data.text || data.transcript || data.transcription || JSON.stringify(data)
  } else {
    // Plain text response
    return await response.text()
  }
}

/**
 * Convenience wrapper with default settings matching the Python example
 * Uses scribe_v1 model with diarization and audio event tagging
 */
/**
 * Convenience wrapper with default settings matching the Python example
 * Uses scribe_v1 model with diarization and audio event tagging
 * Note: Model ID might be 'scribe_v1' or 'eleven_scribe_v1' - adjust if needed
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    return await transcribeWithElevenLabs(audioBuffer, {
      modelId: 'scribe_v1', // Try 'eleven_scribe_v1' if this doesn't work
      languageCode: 'eng',
      diarize: true,
      tagAudioEvents: true,
    })
  } catch (error) {
    console.error('ElevenLabs transcription error:', error)
    throw error
  }
}

