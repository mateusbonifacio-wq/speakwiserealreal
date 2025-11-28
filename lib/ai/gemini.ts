/**
 * Analyze transcript with Google Gemini API
 * Using REST API directly with verified model names
 * 
 * Version: 2.0 (Updated 2024-11-28)
 * - Uses verified working models (gemini-2.5-flash, etc.)
 * - Uses /v1/ endpoint (stable, not /v1beta/)
 * - REST API directly (no SDK)
 * - Enhanced 429 error handling with automatic model fallback
 * 
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
  
  // Use verified available models (tested and confirmed working via REST API)
  // Order: most capable first, then fallbacks
  // All models verified working as of latest test
  const models = [
    'gemini-2.5-flash',        // Latest and most capable (verified working)
    'gemini-2.5-flash-lite',   // Latest lightweight version (verified working)
    'gemini-2.0-flash',        // Stable and reliable (verified working)
    'gemini-2.0-flash-001',    // Stable version variant (verified working)
    'gemini-2.0-flash-lite',   // Lightweight fallback (verified working)
    'gemini-2.0-flash-lite-001', // Lightweight variant (verified working)
  ]
  
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
  let lastError: Error | null = null
  
  for (const modelName of models) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}`)
      
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
        
        // Handle 429 (quota/rate limit) errors specially - try next model
        if (response.status === 429) {
          // Parse quota error details
          try {
            const errorData = JSON.parse(errorText)
            const quotaInfo = errorData.error?.details?.[0]?.quotaInfo || errorData.error?.details?.[0]
            
            if (quotaInfo?.quotaMetric?.includes('free_tier')) {
              errorMessage = `Quota exceeded (429) for model ${modelName}. Free tier limit reached. ` +
                `Please check your billing plan at https://ai.google.dev/usage or upgrade to a paid plan. ` +
                `Learn more: https://ai.google.dev/gemini-api/docs/rate-limits`
            } else {
              // Extract retry delay if available
              const retryInfo = errorData.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'))
              const retryDelay = retryInfo?.retryDelay ? ` Retry after: ${retryInfo.retryDelay}` : ''
              
              errorMessage = `Rate limit exceeded (429) for model ${modelName}.${retryDelay} ` +
                `Please try again later or check your quota: https://ai.google.dev/usage`
            }
          } catch {
            // If parsing fails, use generic message
            errorMessage = `Rate limit exceeded (429) for model ${modelName}. ` +
              `Please check your quota and billing: https://ai.google.dev/usage`
          }
          
          // For 429 errors, skip to next model immediately (don't retry same model)
          console.log(`[Gemini] Quota/rate limit hit for ${modelName}, trying next model...`)
          lastError = new Error(errorMessage)
          continue // Skip to next model in the loop
        } else {
          // For other errors, provide helpful messages
          if (response.status === 404) {
            errorMessage = `Model ${modelName} not found (404). This model may not be available for your API key.`
          } else if (response.status === 403) {
            errorMessage = `Access denied (403) for model ${modelName}. Check API key permissions.`
          }
          
          throw new Error(errorMessage)
        }
      }
      
      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!generatedText) {
        throw new Error('No response text from Gemini API')
      }
      
      console.log(`[Gemini] Success with model: ${modelName}`)
      
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
    } catch (error: any) {
      console.log(`[Gemini] Model ${modelName} failed:`, error.message?.substring(0, 100))
      lastError = error
      // Continue to next model
    }
  }
  
  // If all models failed, throw the last error
  if (lastError) {
    throw lastError
  }
  
  throw new Error('No Gemini models available')
}

