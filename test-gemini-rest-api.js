// Test the updated REST API implementation
require('dotenv').config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log(`✅ API Key found (length: ${apiKey.length})\n`)

async function testGeminiREST(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
  
  const testPrompt = `You are SpeakWise Real, an expert pitch and communication coach.

Please analyze this pitch transcript and provide structured feedback in JSON format with the following fields:
- summary: A brief summary of the pitch
- strengths: An array of strengths identified
- improvements: An array of areas for improvement
- suggestions: An array of actionable suggestions
- improved_pitch: A suggested improved version of the pitch

Transcript:
This is a test pitch about my amazing product.`
  
  try {
    console.log(`🧪 Testing ${modelName} with REST API...`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: testPrompt }
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
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`)
    }
    
    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      throw new Error('No response text from Gemini API')
    }
    
    console.log(`✅ ${modelName} WORKS!`)
    console.log(`   Response length: ${generatedText.length} characters`)
    console.log(`   Preview: ${generatedText.substring(0, 150)}...\n`)
    
    // Try to parse JSON
    try {
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                        generatedText.match(/```\n([\s\S]*?)\n```/) ||
                        [null, generatedText]
      const parsed = JSON.parse(jsonMatch[1] || generatedText)
      console.log(`   ✅ JSON parsing successful!`)
      console.log(`   Fields: ${Object.keys(parsed).join(', ')}\n`)
      return { works: true, model: modelName, parsed }
    } catch (parseError) {
      console.log(`   ⚠️  JSON parsing failed (but response received)\n`)
      return { works: true, model: modelName, raw: generatedText }
    }
  } catch (error) {
    console.log(`❌ ${modelName} failed: ${error.message.substring(0, 150)}...\n`)
    return { works: false, model: modelName, error: error.message }
  }
}

async function main() {
  console.log('🔍 Testing updated Gemini REST API implementation...\n')
  
  // Test the models in the same order as the updated code
  const models = [
    'gemini-2.5-flash',        // Latest and most capable
    'gemini-2.0-flash',        // Stable and reliable
    'gemini-2.5-flash-lite',   // Lightweight fallback
  ]
  
  for (const modelName of models) {
    const result = await testGeminiREST(modelName)
    if (result.works) {
      console.log(`\n✅ SUCCESS! The updated implementation will use "${result.model}"`)
      console.log(`   This matches the implementation in lib/ai/gemini.ts\n`)
      process.exit(0)
    }
  }
  
  console.log('\n❌ None of the models worked')
  console.log('💡 Check your API key and network connection')
  process.exit(1)
}

main()

