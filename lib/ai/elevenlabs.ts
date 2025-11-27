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
  
  // Helper function to create FormData
  const createFormData = () => {
    const formData = new FormData()
    // Try 'file' first, might need to be 'audio' based on API
    formData.append('file', audioBuffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    })
    
    // Append optional parameters
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
  
  // ElevenLabs Speech-to-Text API endpoint
  // Based on the Python SDK example, try these endpoints in order
  const endpoints = [
    'https://api.elevenlabs.io/v1/speech-to-text',
    'https://api.elevenlabs.io/v1/speech-to-text/convert',
  ]

  let lastError: Error | null = null
  
  for (const endpoint of endpoints) {
    try {
      const formData = createFormData()
      const response = await fetch(endpoint, {
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
      } else if (response.status !== 404) {
        // If it's not 404, this might be the right endpoint but with wrong params
        const errorText = await response.text()
        lastError = new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
        // Don't continue if it's a 400/401/403 - those are parameter/auth errors
        if (response.status < 404) {
          throw lastError
        }
      }
      // If 404, try next endpoint
      lastError = new Error(`Endpoint not found: ${endpoint}`)
    } catch (error: any) {
      lastError = error
      // Continue to next endpoint only if it was a 404
      if (error.message && !error.message.includes('404') && !error.message.includes('Not Found')) {
        throw error
      }
    }
  }

  // If all endpoints failed with 404, provide helpful error
  throw new Error(`ElevenLabs Speech-to-Text endpoint not found. Tried: ${endpoints.join(', ')}. Please check the ElevenLabs API documentation for the correct endpoint. The endpoint may have changed or your API key may not have access to Speech-to-Text features.`)
  
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

