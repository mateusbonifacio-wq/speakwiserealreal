// Test script using REST API directly with v1
require('dotenv').config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log(`✅ API Key found (length: ${apiKey.length})\n`)

async function testModel(version, modelName) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Say "Hello, this is a test"' }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50,
        },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return { works: false, error: `${response.status}: ${errorText.substring(0, 200)}` }
    }
    
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (text) {
      return { works: true, response: text.substring(0, 100) }
    }
    
    return { works: false, error: 'No text in response' }
  } catch (error) {
    return { works: false, error: error.message }
  }
}

async function main() {
  console.log('🔍 Testing Gemini API with REST direct (v1)...\n')
  
  // Test models that might work with v1
  const tests = [
    { version: 'v1', name: 'gemini-2.0-flash' },
    { version: 'v1', name: 'gemini-1.5-flash' },
    { version: 'v1', name: 'gemini-1.5-pro' },
  ]
  
  for (const { version, name } of tests) {
    console.log(`Testing ${version}/${name}...`)
    const result = await testModel(version, name)
    
    if (result.works) {
      console.log(`\n✅ SUCCESS! ${version}/${name} WORKS!`)
      console.log(`   Response: ${result.response}...`)
      console.log(`\n💡 Use this in lib/ai/gemini.ts:`)
      console.log(`   const url = \`https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=\${apiKey}\``)
      process.exit(0)
    } else {
      console.log(`   ❌ Failed: ${result.error.substring(0, 150)}`)
    }
  }
  
  console.log('\n❌ None of the tested models work')
  console.log('💡 The API key may need specific permissions or the models may not be available for this key')
  process.exit(1)
}

main()

