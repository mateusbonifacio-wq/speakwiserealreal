require('dotenv').config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_AI_API_KEY
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say hello' }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 50 }
  })
})
.then(r => r.json())
.then(d => {
  if (d.candidates && d.candidates[0]) {
    console.log('✅ gemini-2.5-flash FUNCIONA!')
    console.log('Resposta:', d.candidates[0].content.parts[0].text)
    process.exit(0)
  } else {
    console.log('❌ Erro:', JSON.stringify(d).substring(0, 300))
    process.exit(1)
  }
})
.catch(e => {
  console.log('❌ Erro:', e.message)
  process.exit(1)
})

