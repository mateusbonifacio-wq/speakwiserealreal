/**
 * Transcribe audio using ElevenLabs Speech-to-Text API
 * @param audioBuffer - The audio file as a Buffer
 * @returns The transcript text
 */
export async function transcribeWithElevenLabs(
  audioBuffer: Buffer
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }
  
  // Use FormData for multipart/form-data upload
  // In Node.js, we need to use form-data package
  const FormData = (await import('form-data')).default
  const formData = new FormData()
  formData.append('audio', audioBuffer, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg',
  })
  
  // ElevenLabs Speech-to-Text API endpoint
  // Note: This endpoint may need adjustment based on ElevenLabs documentation
  // Common endpoints:
  // - https://api.elevenlabs.io/v1/speech-to-text
  // - https://api.elevenlabs.io/v1/audio/transcription
  // If they have a different endpoint, update this URL
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
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
  
  const data = await response.json()
  
  // Adjust based on actual ElevenLabs STT response format
  // Common formats: data.text, data.transcript, or nested structure
  if (typeof data === 'string') {
    return data
  }
  return data.text || data.transcript || data.transcription || JSON.stringify(data)
}

/**
 * Alternative: If ElevenLabs STT uses a different format, adjust accordingly
 * For now, we'll use a more generic approach that can be adapted
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    return await transcribeWithElevenLabs(audioBuffer)
  } catch (error) {
    console.error('ElevenLabs transcription error:', error)
    throw error
  }
}

