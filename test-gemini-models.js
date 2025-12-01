// Test script to list and test available Gemini models via REST API
require('dotenv').config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log(`✅ API Key found (length: ${apiKey.length})\n`)

// First, list all available models
async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Failed to list models: ${response.status} - ${errorText.substring(0, 200)}`)
      return []
    }
    
    const data = await response.json()
    const models = data.models || []
    
    // Filter for generateContent models
    const generateModels = models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .sort()
    
    return generateModels
  } catch (error) {
    console.log(`❌ Error listing models: ${error.message}`)
    return []
  }
}

// Test a specific model
async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`
  
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
              { text: 'Say "Hello, this is a test" in JSON format: {"message": "your response"}' }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return { 
        works: false, 
        status: response.status,
        error: errorText.substring(0, 200) 
      }
    }
    
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (text) {
      return { 
        works: true, 
        response: text.substring(0, 150) 
      }
    }
    
    return { 
      works: false, 
      error: 'No text in response',
      data: JSON.stringify(data).substring(0, 200)
    }
  } catch (error) {
    return { 
      works: false, 
      error: error.message 
    }
  }
}

async function main() {
  console.log('🔍 Step 1: Listing available models...\n')
  const availableModels = await listModels()
  
  if (availableModels.length === 0) {
    console.log('❌ Could not list models. Testing common model names instead...\n')
    
    // Fallback: test common model names
    const commonModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-vision',
    ]
    
    console.log('🧪 Testing common model names...\n')
    const workingModels = []
    
    for (const modelName of commonModels) {
      console.log(`Testing ${modelName}...`)
      const result = await testModel(modelName)
      
      if (result.works) {
        console.log(`✅ ${modelName} WORKS!`)
        console.log(`   Response: ${result.response}...\n`)
        workingModels.push(modelName)
      } else {
        console.log(`❌ ${modelName} failed: ${result.status || 'error'} - ${result.error?.substring(0, 100) || 'unknown error'}\n`)
      }
    }
    
    if (workingModels.length > 0) {
      console.log(`\n💡 SOLUTION: Use one of these working models:`)
      workingModels.forEach(m => console.log(`   - ${m}`))
      console.log(`\n   Recommended: ${workingModels[0]}`)
    } else {
      console.log('\n❌ None of the common models work')
      console.log('💡 Check your API key permissions and billing status')
    }
    
    return
  }
  
  console.log(`✅ Found ${availableModels.length} models with generateContent support:\n`)
  availableModels.forEach(m => console.log(`   - ${m}`))
  
  console.log('\n🧪 Step 2: Testing models (prioritizing stable versions)...\n')
  
  // Prioritize stable models (no -preview, -exp, or date suffixes)
  const stableModels = availableModels.filter(m => 
    !m.includes('-preview') && 
    !m.includes('-exp') && 
    !m.match(/\d{2}-\d{2}/) // No date patterns
  )
  
  const previewModels = availableModels.filter(m => 
    m.includes('-preview') || m.includes('-exp')
  )
  
  // Test order: stable first, then preview
  const modelsToTest = [...stableModels, ...previewModels]
  
  const workingModels = []
  
  for (const modelName of modelsToTest) {
    console.log(`Testing ${modelName}...`)
    const result = await testModel(modelName)
    
    if (result.works) {
      console.log(`✅ ${modelName} WORKS!`)
      console.log(`   Response: ${result.response}...\n`)
      workingModels.push(modelName)
      
      // Stop after finding a few working models
      if (workingModels.length >= 3) {
        break
      }
    } else {
      console.log(`❌ ${modelName} failed: ${result.status || 'error'} - ${result.error?.substring(0, 100) || 'unknown error'}\n`)
    }
  }
  
  if (workingModels.length > 0) {
    console.log(`\n💡 SOLUTION: Use one of these working models:`)
    workingModels.forEach(m => console.log(`   - ${m}`))
    console.log(`\n   Recommended order for lib/ai/gemini.ts:`)
    workingModels.forEach((m, i) => console.log(`   ${i + 1}. ${m}`))
  } else {
    console.log('\n❌ None of the tested models work')
    console.log('💡 Check your API key permissions and billing status')
  }
}

main().catch(console.error)
