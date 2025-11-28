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
  
  // Use Google Gemini API (Generative AI)
  // Use v1 API with gemini-1.5-flash (fast and reliable)
  // If that fails, try gemini-1.5-pro on v1
  // Models available on v1: gemini-1.5-flash, gemini-1.5-pro
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ]
  
  let lastError: Error | null = null
  
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
    
    console.log(`[Gemini] Trying model: ${model}`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // Extract the generated text
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!generatedText) {
        throw new Error('No response from Gemini API')
      }
      
      // Try to parse as JSON (Gemini might return JSON or text)
      try {
        // Try to extract JSON from the response if it's wrapped in markdown code blocks
        const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                          generatedText.match(/```\n([\s\S]*?)\n```/) ||
                          [null, generatedText]
        
        return JSON.parse(jsonMatch[1] || generatedText)
      } catch (parseError) {
        // If parsing fails, return as structured object
        return {
          summary: generatedText,
          strengths: [],
          improvements: [],
          suggestions: [],
          ...(type === 'pitch' ? { improved_pitch: '' } : {}),
          raw_response: generatedText,
        }
      }
    } else {
      const errorText = await response.text()
      lastError = new Error(`Google Gemini API error (${model}): ${response.status} - ${errorText}`)
      console.log(`[Gemini] Model ${model} failed:`, lastError.message)
      // Continue to next model
    }
  }
  
  // If all models failed, throw the last error
  if (lastError) {
    throw lastError
  }
  
  throw new Error('No Gemini models available')
  
}

