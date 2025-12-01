// Test all available models to find the best ones
require('dotenv').config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello' }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 50 },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return { works: false, status: response.status, error: errorText.substring(0, 150) }
    }
    
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    return text ? { works: true, response: text } : { works: false, error: 'No text' }
  } catch (error) {
    return { works: false, error: error.message }
  }
}

async function main() {
  const allModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
  ]
  
  console.log('🧪 Testing all available models...\n')
  
  const results = []
  for (const model of allModels) {
    console.log(`Testing ${model}...`)
    const result = await testModel(model)
    results.push({ model, ...result })
    
    if (result.works) {
      console.log(`✅ ${model} WORKS!\n`)
    } else {
      console.log(`❌ ${model} failed: ${result.status || 'error'} - ${result.error?.substring(0, 100)}\n`)
    }
  }
  
  const working = results.filter(r => r.works)
  
  console.log('\n📊 SUMMARY:\n')
  console.log(`Working models (${working.length}):`)
  working.forEach(r => console.log(`  ✅ ${r.model}`))
  
  console.log(`\nFailed models (${results.length - working.length}):`)
  results.filter(r => !r.works).forEach(r => console.log(`  ❌ ${r.model}: ${r.status || r.error?.substring(0, 80)}`))
  
  if (working.length > 0) {
    console.log(`\n💡 Recommended order for lib/ai/gemini.ts:`)
    working.forEach((r, i) => console.log(`   ${i + 1}. '${r.model}'`))
  }
}

main().catch(console.error)

