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
interface PreviousAttempt {
  attempt: number
  created_at: string
  scores?: {
    clarity?: number
    structure_flow?: number
    persuasiveness?: number
    storytelling?: number
    conciseness?: number
    fit_for_audience?: number
    delivery_energy?: number
  }
}

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
  previousAttempts?: PreviousAttempt[]
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

Progress Awareness:
- You will receive an attempt_number indicating this is attempt #N for this project.
- You may receive a previous_attempts array with earlier attempts and their scores.
- When previous attempts are provided, explicitly comment on improvement/regression:
  - Mention specific score changes (e.g., "Clarity improved from 5 → 7")
  - Note areas that stayed the same (e.g., "Structure stayed at 6/10")
  - Acknowledge progress and encourage continued iteration
- Always reference their journey: "compared to last time...", "you've improved in...", etc.

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
    
    // Build attempt and previous attempts info
    let attemptInfo = ''
    if (attemptNumber) {
      attemptInfo += `\n\nThis is Attempt #${attemptNumber} for this project.`
    }
    
    if (previousAttempts && previousAttempts.length > 0) {
      attemptInfo += `\n\nPrevious Attempts History:`
      previousAttempts.forEach((prev, idx) => {
        attemptInfo += `\n\nAttempt #${prev.attempt} (${new Date(prev.created_at).toLocaleDateString()}):`
        if (prev.scores) {
          if (prev.scores.clarity !== undefined) attemptInfo += `\n  - Clarity: ${prev.scores.clarity}/10`
          if (prev.scores.structure_flow !== undefined) attemptInfo += `\n  - Structure & Flow: ${prev.scores.structure_flow}/10`
          if (prev.scores.persuasiveness !== undefined) attemptInfo += `\n  - Persuasiveness: ${prev.scores.persuasiveness}/10`
          if (prev.scores.storytelling !== undefined) attemptInfo += `\n  - Storytelling: ${prev.scores.storytelling}/10`
          if (prev.scores.conciseness !== undefined) attemptInfo += `\n  - Conciseness: ${prev.scores.conciseness}/10`
          if (prev.scores.fit_for_audience !== undefined) attemptInfo += `\n  - Fit for Audience: ${prev.scores.fit_for_audience}/10`
          if (prev.scores.delivery_energy !== undefined) attemptInfo += `\n  - Delivery & Energy: ${prev.scores.delivery_energy}/10`
        }
      })
      attemptInfo += `\n\nIMPORTANT: Compare this current attempt with the previous attempts above. In your score_comparison field, explicitly mention:`
      attemptInfo += `\n- Which scores improved (e.g., "Clarity improved from 5 → 7")`
      attemptInfo += `\n- Which scores stayed the same (e.g., "Structure stayed at 6/10")`
      attemptInfo += `\n- Which scores decreased (if any)`
      attemptInfo += `\n- Overall progress assessment`
    }
    
    userPrompt = `CRITICAL: You MUST respond with ONLY a valid JSON object. 
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO explanations before or after the JSON
- NO text outside the JSON object
- Start your response with { and end with }
- The ENTIRE response must be parseable as JSON

Return this exact JSON structure:

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
  "score_comparison": "If previous_attempts provided, explicitly compare current scores with previous attempts. Mention specific improvements (e.g., 'Clarity improved from 5 → 7'), areas that stayed same, and overall progress. If this is attempt #1, use empty string.",
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

CRITICAL REMINDER: 
- Your ENTIRE response must be a valid JSON object
- Start with { and end with }
- NO markdown formatting (\`\`\`json or \`\`\`)
- NO explanatory text before or after
- NO code blocks
- The response must be directly parseable by JSON.parse()

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
            // Note: responseMimeType is not supported in REST API v1
            // Relying on prompt instructions and JSON parsing instead
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
      console.log(`[Gemini] Raw response length: ${generatedText.length} chars`)
      console.log(`[Gemini] Raw response preview: ${generatedText.substring(0, 200)}...`)
      
      // Try to parse as JSON (Gemini might return JSON or text)
      try {
        // Step 1: Strip markdown code blocks aggressively
        let cleanedText = generatedText.trim()
        
        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        cleanedText = cleanedText.replace(/^```json\s*/i, '')
        cleanedText = cleanedText.replace(/^```\s*/, '')
        cleanedText = cleanedText.replace(/\s*```$/g, '')
        cleanedText = cleanedText.trim()
        
        // Step 2: Find JSON object boundaries (first { to last })
        const firstBrace = cleanedText.indexOf('{')
        const lastBrace = cleanedText.lastIndexOf('}')
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
        } else if (firstBrace === -1 || lastBrace === -1) {
          throw new Error(`No JSON object found. First brace: ${firstBrace}, Last brace: ${lastBrace}`)
        }
        
        // Step 3: Remove any trailing text/comments after the JSON
        // Sometimes Gemini adds explanations after the JSON
        cleanedText = cleanedText.trim()
        
        // Step 4: Try to fix common JSON issues
        // Remove any text before the first { (in case there's a prefix)
        const jsonStart = cleanedText.indexOf('{')
        if (jsonStart > 0) {
          cleanedText = cleanedText.substring(jsonStart)
        }
        
        // Remove any text after the last } (in case there's a suffix)
        const jsonEnd = cleanedText.lastIndexOf('}')
        if (jsonEnd >= 0 && jsonEnd < cleanedText.length - 1) {
          cleanedText = cleanedText.substring(0, jsonEnd + 1)
        }
        
        // Step 5: Fix common JSON formatting issues
        // Remove any trailing commas before closing braces/brackets
        cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1')
        
        console.log(`[Gemini] Cleaned JSON length: ${cleanedText.length} chars`)
        console.log(`[Gemini] Cleaned JSON preview: ${cleanedText.substring(0, 300)}...`)
        
        // Step 6: Parse the cleaned JSON
        const parsed = JSON.parse(cleanedText)
        
        // Step 7: Validate structure for pitch type
        if (type === 'pitch' && parsed) {
          // Ensure all required fields exist with proper types
          if (!parsed.greeting) parsed.greeting = ''
          if (!parsed.quick_summary) parsed.quick_summary = ''
          if (!parsed.scores) parsed.scores = {}
          if (!parsed.score_comparison) parsed.score_comparison = ''
          if (!parsed.context_check) parsed.context_check = ''
          if (!parsed.emotional_delivery_analysis) parsed.emotional_delivery_analysis = ''
          if (!parsed.what_you_did_well) parsed.what_you_did_well = []
          if (!parsed.what_to_improve) parsed.what_to_improve = []
          if (!parsed.improved_pitch) parsed.improved_pitch = ''
          if (!parsed.alternative_openings) parsed.alternative_openings = []
          if (!parsed.alternative_closings) parsed.alternative_closings = []
          if (!parsed.delivery_tips) parsed.delivery_tips = []
          if (!parsed.next_practice_exercise) parsed.next_practice_exercise = ''
        }
        
        console.log(`[Gemini] Successfully parsed JSON with keys: ${Object.keys(parsed).join(', ')}`)
        return parsed
      } catch (parseError: any) {
        console.error('[Gemini] JSON parse error:', parseError.message)
        console.error('[Gemini] Full generated text (first 1000 chars):', generatedText.substring(0, 1000))
        console.error('[Gemini] Full generated text (last 500 chars):', generatedText.substring(Math.max(0, generatedText.length - 500)))
        
        // Try multiple retry strategies
        const retryStrategies = [
          // Strategy 1: Extract JSON between first { and last }
          () => {
            const firstBrace = generatedText.indexOf('{')
            const lastBrace = generatedText.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              let retryText = generatedText.substring(firstBrace, lastBrace + 1)
              // Remove all markdown
              retryText = retryText.replace(/```/g, '')
              retryText = retryText.replace(/json/gi, '')
              retryText = retryText.replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
              return retryText.trim()
            }
            return null
          },
          // Strategy 2: Find JSON object using regex
          () => {
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              let retryText = jsonMatch[0]
              retryText = retryText.replace(/```/g, '')
              retryText = retryText.replace(/,(\s*[}\]])/g, '$1')
              return retryText.trim()
            }
            return null
          },
          // Strategy 3: Try to fix common issues and parse
          () => {
            let retryText = generatedText
            // Remove markdown
            retryText = retryText.replace(/```json/gi, '')
            retryText = retryText.replace(/```/g, '')
            // Find JSON boundaries
            const firstBrace = retryText.indexOf('{')
            const lastBrace = retryText.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1) {
              retryText = retryText.substring(firstBrace, lastBrace + 1)
              // Fix trailing commas
              retryText = retryText.replace(/,(\s*[}\]])/g, '$1')
              // Fix unescaped quotes in strings (basic attempt)
              retryText = retryText.replace(/(".*?")/g, (match: string) => {
                // If the string contains unescaped quotes, try to escape them
                if (match.match(/"[^"]*"[^"]*"/)) {
                  return match.replace(/(?<!\\)"/g, '\\"')
                }
                return match
              })
              return retryText.trim()
            }
            return null
          },
        ]
        
        for (let i = 0; i < retryStrategies.length; i++) {
          try {
            const retryText = retryStrategies[i]()
            if (retryText) {
              const retryParsed = JSON.parse(retryText)
              console.log(`[Gemini] Successfully parsed on retry strategy ${i + 1}`)
              
              // Validate structure
              if (type === 'pitch' && retryParsed) {
                if (!retryParsed.greeting) retryParsed.greeting = ''
                if (!retryParsed.quick_summary) retryParsed.quick_summary = ''
                if (!retryParsed.scores) retryParsed.scores = {}
                if (!retryParsed.score_comparison) retryParsed.score_comparison = ''
                if (!retryParsed.context_check) retryParsed.context_check = ''
                if (!retryParsed.emotional_delivery_analysis) retryParsed.emotional_delivery_analysis = ''
                if (!retryParsed.what_you_did_well) retryParsed.what_you_did_well = []
                if (!retryParsed.what_to_improve) retryParsed.what_to_improve = []
                if (!retryParsed.improved_pitch) retryParsed.improved_pitch = ''
                if (!retryParsed.alternative_openings) retryParsed.alternative_openings = []
                if (!retryParsed.alternative_closings) retryParsed.alternative_closings = []
                if (!retryParsed.delivery_tips) retryParsed.delivery_tips = []
                if (!retryParsed.next_practice_exercise) retryParsed.next_practice_exercise = ''
              }
              
              return retryParsed
            }
          } catch (retryError: any) {
            console.error(`[Gemini] Retry strategy ${i + 1} failed:`, retryError.message)
            continue
          }
        }
        
        // If all parsing strategies fail, return error response
        console.error('[Gemini] All parsing strategies failed. Raw response:', generatedText)
        return {
          greeting: 'Hello! I analyzed your pitch, but encountered a formatting issue.',
          quick_summary: 'The AI response could not be properly formatted. This may be a temporary issue. Please try analyzing again.',
          scores: {},
          score_comparison: '',
          context_check: '',
          emotional_delivery_analysis: '',
          what_you_did_well: [],
          what_to_improve: ['The analysis response could not be parsed. Please try analyzing again.'],
          improved_pitch: '',
          alternative_openings: [],
          alternative_closings: [],
          delivery_tips: [],
          next_practice_exercise: '',
          _parse_error: true,
          _raw_response: generatedText.substring(0, 500), // Include first 500 chars for debugging
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

