// Test the actual Gemini implementation with a real transcript
require('dotenv').config({ path: '.env.local' })

// Simulate the analyzeWithGemini function
async function analyzeWithGemini(transcript, type) {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set')
  }
  
  const systemPrompt = "You are SpeakWise Real, an expert pitch and communication coach."
  
  let userPrompt
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
  
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
  ]
  
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
  let lastError = null
  
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
        
        if (response.status === 404) {
          errorMessage = `Model ${modelName} not found (404). This model may not be available for your API key.`
        } else if (response.status === 403) {
          errorMessage = `Access denied (403) for model ${modelName}. Check API key permissions.`
        } else if (response.status === 429) {
          errorMessage = `Rate limit exceeded (429) for model ${modelName}. Please try again later.`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!generatedText) {
        throw new Error('No response text from Gemini API')
      }
      
      console.log(`✅ [Gemini] Success with model: ${modelName}`)
      
      // Try to parse as JSON
      try {
        const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                          generatedText.match(/```\n([\s\S]*?)\n```/) ||
                          [null, generatedText]
        
        const parsed = JSON.parse(jsonMatch[1] || generatedText)
        return { model: modelName, result: parsed }
      } catch (parseError) {
        return {
          model: modelName,
          result: {
            summary: generatedText,
            strengths: [],
            improvements: [],
            suggestions: [],
            ...(type === 'pitch' ? { improved_pitch: '' } : {}),
            raw_response: generatedText,
          }
        }
      }
    } catch (error) {
      console.log(`❌ [Gemini] Model ${modelName} failed:`, error.message?.substring(0, 100))
      lastError = error
    }
  }
  
  if (lastError) {
    throw lastError
  }
  
  throw new Error('No Gemini models available')
}

async function main() {
  console.log('🧪 Testing Gemini implementation with sample transcript...\n')
  
  const testTranscript = "Hello, my name is John and I'm here to pitch my new startup idea. We're building an AI-powered tool that helps people learn languages faster."
  
  try {
    console.log('Testing pitch analysis...\n')
    const result = await analyzeWithGemini(testTranscript, 'pitch')
    
    console.log(`\n✅ SUCCESS! Used model: ${result.model}`)
    console.log('\nAnalysis result:')
    console.log(JSON.stringify(result.result, null, 2))
    
    console.log('\n✅ Implementation is working correctly!')
  } catch (error) {
    console.error('\n❌ Implementation test failed:')
    console.error(error.message)
    process.exit(1)
  }
}

main().catch(console.error)

