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
  
  // Helper function to create FormData with different field names
  const createFormData = (fieldName: 'file' | 'audio' = 'file') => {
    const formData = new FormData()
    formData.append(fieldName, audioBuffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    })
    
    // Append optional parameters (only if provided)
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
    return formData
  }
  
  // ElevenLabs Speech-to-Text API endpoints to try
  // Based on the Python SDK: elevenlabs.speech_to_text.convert()
  const endpoints = [
    { url: 'https://api.elevenlabs.io/v1/speech-to-text', field: 'file' as const },
    { url: 'https://api.elevenlabs.io/v1/speech-to-text', field: 'audio' as const },
    { url: 'https://api.elevenlabs.io/v1/speech-to-text/convert', field: 'file' as const },
    { url: 'https://api.elevenlabs.io/v1/speech-to-text/convert', field: 'audio' as const },
  ]

  let lastError: Error | null = null
  
  for (const { url, field } of endpoints) {
    try {
      const formData = createFormData(field)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          ...(formData.getHeaders ? formData.getHeaders() : {}),
        },
        // @ts-ignore - form-data works with fetch in Node.js 18+
        body: formData,
      })

      if (response.ok) {
        // Success - process response
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json()
          return data.text || data.transcript || data.transcription || JSON.stringify(data)
        } else {
          return await response.text()
        }
      } else {
        const errorText = await response.text()
        let errorData: any = { detail: errorText || 'Unknown error' }
        try {
          if (errorText) {
            errorData = JSON.parse(errorText)
          }
        } catch {
          // If not JSON, use the text as-is
          errorData = { detail: errorText }
        }
        
        // If it's not 404, this might be the right endpoint but with wrong params
        if (response.status !== 404) {
          lastError = new Error(`ElevenLabs API error: ${response.status} - ${JSON.stringify(errorData)}`)
          // Don't continue if it's a 400/401/403 - those are parameter/auth errors
          if (response.status < 404) {
            throw lastError
          }
        } else {
          lastError = new Error(`Endpoint not found: ${url} (field: ${field})`)
        }
      }
    } catch (error: any) {
      // If it's a JSON parse error, continue
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        lastError = error
        continue
      }
      lastError = error
      // Continue to next endpoint only if it was a 404
      if (error.message && !error.message.includes('404') && !error.message.includes('Not Found')) {
        throw error
      }
    }
  }

  // If all endpoints failed with 404, provide helpful error
  throw new Error(
    `ElevenLabs Speech-to-Text endpoint not found. ` +
    `This feature may require a specific ElevenLabs plan. ` +
    `Please verify: 1) Your API key has Speech-to-Text access, 2) Check the latest ElevenLabs API docs, ` +
    `3) The endpoint may be: https://api.elevenlabs.io/v1/speech-to-text or /v1/speech-to-text/convert. ` +
    `Last error: ${lastError?.message || 'Unknown'}`
  )
  
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

