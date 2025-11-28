import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Analyze transcript with Google Gemini API
 * @param transcript - The transcribed text
 * @param type - 'pitch' or 'context'
 * @returns Structured analysis JSON
 */
export async function analyzeWithGemini(
  transcript: string,
  type: 'pitch' | 'context'
): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }
  
  // Construct the prompt based on type
  const systemPrompt = "You are SpeakWise Real, an expert pitch and communication coach."
  
  let userPrompt: string
  if (type === 'pitch') {
    userPrompt = `Please analyze this pitch transcript and provide structured feedback in JSON format with the following fields:
- summary: A brief summary of the pitch
- strengths: An array of strengths identified
- improvements: An array of areas for improvement
- suggestions: An array of actionable suggestions
- improved_pitch: A suggested improved version of the pitch

Transcript:
${transcript}`
  } else {
    userPrompt = `Please analyze this context transcript (audience/goal information) and provide structured feedback in JSON format with the following fields:
- summary: A brief summary of the context
- strengths: An array of strengths identified
- improvements: An array of areas for improvement
- suggestions: An array of actionable suggestions

Transcript:
${transcript}`
  }
  
  try {
    // Use the official Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try models in order - use newer models first as they're more likely to work
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    // Combine system prompt and user prompt into a single message
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
    
    let lastError: Error | null = null
    
    for (const modelName of models) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        const result = await model.generateContent(fullPrompt)
        const response = await result.response
        const generatedText = response.text()
        
        if (!generatedText) {
          throw new Error('No response from Gemini API')
        }
        
        console.log(`[Gemini] Success with model: ${modelName}, response length: ${generatedText.length}`)
        
        // Try to parse as JSON (Gemini might return JSON or text)
        try {
          // Try to extract JSON from the response if it's wrapped in markdown code blocks
          const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                            generatedText.match(/```\n([\s\S]*?)\n```/) ||
                            [null, generatedText]
          
          const parsed = JSON.parse(jsonMatch[1] || generatedText)
          console.log('[Gemini] Successfully parsed JSON response')
          return parsed
        } catch (parseError) {
          // If parsing fails, return as structured object
          console.log('[Gemini] Could not parse as JSON, returning structured object')
          return {
            summary: generatedText,
            strengths: [],
            improvements: [],
            suggestions: [],
            ...(type === 'pitch' ? { improved_pitch: '' } : {}),
            raw_response: generatedText,
          }
        }
      } catch (error: any) {
        console.log(`[Gemini] Model ${modelName} failed:`, error.message)
        lastError = error
        // Continue to next model
      }
    }
    
    // If all models failed, throw the last error
    if (lastError) {
      throw lastError
    }
    
    throw new Error('No Gemini models available')
  } catch (error: any) {
    console.error('[Gemini] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    })
    throw new Error(`Google Gemini API error: ${error.message || 'Unknown error'}`)
  }
}

