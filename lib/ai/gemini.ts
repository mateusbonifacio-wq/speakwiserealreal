/**
 * Analyze transcript with Google Gemini API
 * Using REST API directly with verified model names
 * 
 * Version: 3.0 (Updated 2024-11-28)
 * - Uses verified working models (gemini-2.5-flash, etc.)
 * - Uses /v1/ endpoint (stable, not /v1beta/)
 * - REST API directly (no SDK)
 * - Enhanced 429 error handling with automatic model fallback
 * - New SpeakWise Real coach format with 11-section structure
 * 
 * @param transcript - The transcribed text
 * @param type - 'pitch' or 'context'
 * @param context - Optional context object (audience, goal, duration, etc.)
 * @param attemptNumber - Optional attempt number (1, 2, 3, etc.)
 * @param previousScores - Optional scores from previous attempt
 * @returns Structured analysis JSON
 */
export async function analyzeWithGemini(
  transcript: string,
  type: 'pitch' | 'context',
  context?: {
    audience?: string
    goal?: string
    duration?: string
    scenario?: string
    english_level?: string
    tone_style?: string
    constraints?: string
    additional_notes?: string
  },
  attemptNumber?: number,
  previousScores?: {
    clarity?: number
    structure_flow?: number
    persuasiveness?: number
    storytelling?: number
    conciseness?: number
    fit_for_audience?: number
    delivery_energy?: number
  }
): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }
  
  // Construct the prompt based on type
  const systemPrompt = `You are SpeakWise Real, an AI communication and pitch coach.

Your personality:
- Warm, encouraging, and honest.
- You speak directly to the user, like a supportive coach.
- You focus on helping them improve fast, not on flattery.

Your job:
- Analyze the pitch and give clear, structured, and friendly feedback.
- Talk to the user as "you", not in third person.
- Highlight what they did well and what to improve.
- Show them how they are progressing across attempts.
- Provide a stronger version of the pitch they can practice next.

Style:
- Write in clear, natural English.
- Talk directly to the user.
- Be honest but kind.
- Assume they will do multiple attempts; always encourage them to try again with specific focus.`
  
  let userPrompt: string
  if (type === 'pitch') {
    // Build context information string
    let contextInfo = ''
    if (context) {
      const contextParts: string[] = []
      if (context.audience) contextParts.push(`Audience: ${context.audience}`)
      if (context.goal) contextParts.push(`Goal: ${context.goal}`)
      if (context.duration) contextParts.push(`Duration: ${context.duration}`)
      if (context.scenario) contextParts.push(`Scenario: ${context.scenario}`)
      if (context.english_level) contextParts.push(`English Level: ${context.english_level}`)
      if (context.tone_style) contextParts.push(`Tone/Style: ${context.tone_style}`)
      if (context.constraints) contextParts.push(`Constraints: ${context.constraints}`)
      if (context.additional_notes) contextParts.push(`Additional Notes: ${context.additional_notes}`)
      
      if (contextParts.length > 0) {
        contextInfo = '\n\nContext Information:\n' + contextParts.join('\n')
      }
    }
    
    // Build attempt and previous scores info
    let attemptInfo = ''
    if (attemptNumber) {
      attemptInfo += `\n\nAttempt Number: ${attemptNumber}`
    }
    
    if (previousScores) {
      attemptInfo += `\n\nPrevious Scores (for comparison):`
      if (previousScores.clarity !== undefined) attemptInfo += `\n- Clarity: ${previousScores.clarity}/10`
      if (previousScores.structure_flow !== undefined) attemptInfo += `\n- Structure & Flow: ${previousScores.structure_flow}/10`
      if (previousScores.persuasiveness !== undefined) attemptInfo += `\n- Persuasiveness: ${previousScores.persuasiveness}/10`
      if (previousScores.storytelling !== undefined) attemptInfo += `\n- Storytelling: ${previousScores.storytelling}/10`
      if (previousScores.conciseness !== undefined) attemptInfo += `\n- Conciseness: ${previousScores.conciseness}/10`
      if (previousScores.fit_for_audience !== undefined) attemptInfo += `\n- Fit for Audience: ${previousScores.fit_for_audience}/10`
      if (previousScores.delivery_energy !== undefined) attemptInfo += `\n- Delivery & Energy: ${previousScores.delivery_energy}/10`
    }
    
    userPrompt = `Analyze this pitch transcript and provide feedback in JSON format using the following structure:

{
  "greeting": "Short friendly greeting as SpeakWise Real, acknowledging their effort",
  "quick_summary": "2-3 sentences describing what the pitch is about and the main message",
  "scores": {
    "clarity": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "structure_flow": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "persuasiveness": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "storytelling": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "conciseness": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "fit_for_audience": { "score": 0-10, "explanation": "1 short sentence explaining why" },
    "delivery_energy": { "score": 0-10, "explanation": "1 short sentence explaining why (estimated from text)" }
  },
  "score_comparison": "If previous_scores provided, briefly compare - mention where improved and where stayed same. Otherwise empty string.",
  "context_check": "Restate the context you're using. If something missing, state what you're assuming. Point out any mismatches.",
  "emotional_delivery_analysis": "Look for filler words, uncertainty words, repetition. Comment on confidence level, enthusiasm, pace and emphasis. Be specific like 'you used few filler words, which is great, but the language feels low-energy...'",
  "what_you_did_well": ["4-6 bullet points", "Be specific and positive", "e.g., clarity of idea, strong phrase, good problem statement"],
  "what_to_improve": ["6-10 bullet points", "Each must be practical and specific", "e.g., 'Add one sentence explaining who your ideal customer is'", "Avoid vague advice like 'be more engaging' without explaining how"],
  "improved_pitch": "Rewrite the entire pitch, keeping the same core idea. Adapt length to duration in context. Make sure it: hooks at start, states problem/solution/value clearly, speaks in desired tone_style, ends with clear CTA aligned with goal. Do NOT invent fake numbers, users, or revenue.",
  "alternative_openings": ["3 alternative opening lines or very short intro paragraphs"],
  "alternative_closings": ["3 alternative ways to end the pitch with a clear ask"],
  "delivery_tips": ["4-7 bullet points", "Very concrete: where to slow down, which words to emphasize, when to pause, how to project confidence"],
  "next_practice_exercise": "ONE short exercise for the next attempt, e.g., 'Deliver just the first 45 seconds focusing on Problem + Solution'"
}

Pitch Transcript:
${transcript}${contextInfo}${attemptInfo}`
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
            maxOutputTokens: 4096, // Increased for detailed 11-section pitch analysis
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

