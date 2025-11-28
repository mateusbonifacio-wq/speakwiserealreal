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
    
    // Use gemini-pro model (the one that worked in the previous version)
    // The SDK handles the API version automatically
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
    })
    
    // Combine system prompt and user prompt into a single message
    // This is the format that worked in the previous version
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
    
    console.log('[Gemini] Using model: gemini-pro')
    console.log('[Gemini] Prompt length:', fullPrompt.length)
    
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const generatedText = response.text()
    
    if (!generatedText) {
      throw new Error('No response from Gemini API')
    }
    
    console.log('[Gemini] Response received, length:', generatedText.length)
    
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
    console.error('[Gemini] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    })
    throw new Error(`Google Gemini API error: ${error.message || 'Unknown error'}`)
  }
}

