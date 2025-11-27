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

  try {
    // Use the official ElevenLabs SDK
    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js')
    
    const client = new ElevenLabsClient({
      apiKey: apiKey.trim(),
    })

    // Convert Buffer to Blob for the SDK
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    
    // Create a File-like object from the Blob
    // The SDK expects a File, but we can pass a Blob with a filename
    const file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' })

    // Call the Speech-to-Text API using the SDK
    const response = await client.speechToText.convert({
      file: file,
      modelId: options.modelId || 'scribe_v1',
      languageCode: options.languageCode || 'eng',
      diarize: options.diarize !== undefined ? options.diarize : true,
      tagAudioEvents: options.tagAudioEvents !== undefined ? options.tagAudioEvents : true,
    })

    // The response is a SpeechToTextChunkResponseModel or similar
    // Extract the text from the response
    if (typeof response === 'string') {
      return response
    }
    
    // Handle different response types
    if (response && typeof response === 'object') {
      // If it's a chunk response with text property
      if ('text' in response && typeof response.text === 'string') {
        return response.text
      }
      // If it's a chunk response with words array
      if ('words' in response && Array.isArray(response.words)) {
        return response.words
          .map((word: any) => word.word || word.text || '')
          .filter(Boolean)
          .join(' ')
      }
      // If it's a multichannel response
      if ('transcripts' in response && Array.isArray(response.transcripts)) {
        return response.transcripts
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
      }
    }

    // Fallback: stringify the response
    return JSON.stringify(response)
  } catch (error: any) {
    // If SDK fails, provide detailed error
    console.error('ElevenLabs SDK error:', error)
    throw new Error(`ElevenLabs API error: ${error.message || 'Unknown error'}`)
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
