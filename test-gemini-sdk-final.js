// Test script using the official Google Generative AI SDK
require('dotenv').config({ path: '.env.local' })
const { GoogleGenerativeAI } = require('@google/generative-ai')

const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log(`✅ API Key found (length: ${apiKey.length})\n`)

async function testModel(modelName) {
  try {
    console.log(`🧪 Testing model: ${modelName}`)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })
    
    const result = await model.generateContent('Say "Hello, this is a test" in JSON format: {"message": "your response"}')
    const response = await result.response
    const text = response.text()
    
    console.log(`✅ ${modelName} WORKS!`)
    console.log(`   Response: ${text.substring(0, 100)}...\n`)
    return { works: true, model: modelName, response: text }
  } catch (error) {
    const errorMsg = error.message || error.toString()
    console.log(`❌ ${modelName} failed: ${errorMsg.substring(0, 150)}...\n`)
    return { works: false, model: modelName, error: errorMsg }
  }
}

async function main() {
  console.log('🔍 Testing Gemini models with official SDK (same order as code)...\n')
  
  // Same order as in lib/ai/gemini.ts
  const models = [
    'gemini-1.5-flash',      // Fast and efficient, widely available
    'gemini-1.5-pro',        // More powerful, widely available
    'gemini-2.0-flash-exp',  // Latest experimental (if available)
  ]
  
  for (const modelName of models) {
    const result = await testModel(modelName)
    if (result.works) {
      console.log(`\n💡 SOLUTION: Use model "${result.model}"`)
      console.log(`   This model works and will be used in production!\n`)
      process.exit(0)
    }
  }
  
  console.log('\n❌ None of the models work with the SDK')
  console.log('💡 Possible issues:')
  console.log('   1. API key permissions - check Google AI Studio')
  console.log('   2. Billing/quota - verify your Google Cloud account')
  console.log('   3. API key type - make sure it\'s a Gemini API key, not a different service')
  process.exit(1)
}

main()

