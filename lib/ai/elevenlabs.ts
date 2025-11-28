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
    languageCode?: string | null
    diarize?: boolean
    tagAudioEvents?: boolean
    mimeType?: string
  } = {}
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }

  try {
    // Use the official ElevenLabs SDK
    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js')
    
    const client = new ElevenLabsClient({
      apiKey: apiKey.trim(),
    })

    // Convert Buffer to File/Blob for better compatibility
    // Determine MIME type from options or default to webm
    const mimeType = options.mimeType || 'audio/webm'
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(audioBuffer)
    const blob = new Blob([uint8Array], { type: mimeType })
    const file = new File([blob], `audio.${mimeType.split('/')[1] || 'webm'}`, { type: mimeType })

    // Use null/undefined for languageCode to enable auto-detection, or use provided language
    // Supported languages: 'eng', 'por' (Portuguese), 'spa', 'fra', 'deu', 'ita', 'pol', 'tur', 'rus', 'dut', 'cze', 'ara', 'chi', 'jpn', 'hun', 'kor'
    // If languageCode is null or undefined, omit it to enable auto-detection
    const languageCode = options.languageCode === null ? undefined : options.languageCode

    console.log('[ElevenLabs] Starting transcription:', {
      modelId: options.modelId || 'scribe_v1',
      languageCode: languageCode || 'auto-detect',
      diarize: options.diarize !== false,
      tagAudioEvents: options.tagAudioEvents !== false,
      audioSize: audioBuffer.length,
      mimeType,
    })

    // Build request object, only include languageCode if it's provided
    const requestParams: any = {
      file: file,
      modelId: options.modelId || 'scribe_v1',
      diarize: options.diarize !== undefined ? options.diarize : true,
      tagAudioEvents: options.tagAudioEvents !== undefined ? options.tagAudioEvents : true,
    }
    
    // Only add languageCode if it's explicitly provided (not null/undefined)
    if (languageCode) {
      requestParams.languageCode = languageCode
    }

    const response = await client.speechToText.convert(requestParams)

    console.log('[ElevenLabs] Response type:', typeof response)
    console.log('[ElevenLabs] Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A')

    // The response is a SpeechToTextChunkResponseModel or similar
    // Extract the text from the response
    // Use type assertion to help TypeScript understand the response can be a string
    if (typeof response === 'string') {
      const transcript = response as string
      console.log('[ElevenLabs] Transcript (string):', transcript.substring(0, 100))
      return transcript
    }
    
    // Handle different response types
    if (response && typeof response === 'object') {
      // If it's a chunk response with text property
      if ('text' in response && typeof response.text === 'string') {
        console.log('[ElevenLabs] Transcript (text property):', response.text.substring(0, 100))
        return response.text
      }
      // If it's a chunk response with words array
      if ('words' in response && Array.isArray(response.words)) {
        const transcript = response.words
          .map((word: any) => word.word || word.text || '')
          .filter(Boolean)
          .join(' ')
        console.log('[ElevenLabs] Transcript (words array):', transcript.substring(0, 100))
        return transcript
      }
      // If it's a multichannel response
      if ('transcripts' in response && Array.isArray(response.transcripts)) {
        const transcript = response.transcripts
          .map((transcript: any) => {
            if (typeof transcript === 'string') return transcript
            if ('text' in transcript) return transcript.text
            if ('words' in transcript && Array.isArray(transcript.words)) {
              return transcript.words
                .map((word: any) => word.word || word.text || '')
                .filter(Boolean)
                .join(' ')
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
        console.log('[ElevenLabs] Transcript (transcripts array):', transcript.substring(0, 100))
        return transcript
      }
      
      // Log the full response for debugging
      console.log('[ElevenLabs] Full response:', JSON.stringify(response, null, 2).substring(0, 500))
    }

    // Fallback: stringify the response
    const fallback = JSON.stringify(response)
    console.warn('[ElevenLabs] Using fallback JSON response')
    return fallback
  } catch (error: any) {
    // If SDK fails, provide detailed error
    console.error('[ElevenLabs] SDK error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      response: error.response ? JSON.stringify(error.response).substring(0, 500) : 'N/A',
    })
    throw new Error(`ElevenLabs API error: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Convenience wrapper with default settings matching the Python example
 * Uses scribe_v1 model with diarization and audio event tagging
 * Auto-detects language for better accuracy
 */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
  try {
    return await transcribeWithElevenLabs(audioBuffer, {
      modelId: 'scribe_v1',
      languageCode: null, // Auto-detect language
      diarize: true,
      tagAudioEvents: true,
      mimeType: mimeType,
    })
  } catch (error) {
    console.error('ElevenLabs transcription error:', error)
    throw error
  }
}
