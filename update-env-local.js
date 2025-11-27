/**
 * Script para atualizar .env.local com a SUPABASE_SERVICE_ROLE_KEY
 * Execute: node update-env-local.js
 */

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔧 Atualizar .env.local com SUPABASE_SERVICE_ROLE_KEY\n');

  const serviceRoleKey = await question('Cole a SUPABASE_SERVICE_ROLE_KEY aqui: ');

  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    console.log('❌ Chave vazia. Cancelado.');
    rl.close();
    return;
  }

  // Ler .env.local atual
  let envContent = '';
  if (fs.existsSync('.env.local')) {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } else {
    // Criar template se não existir
    envContent = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ElevenLabs
ELEVENLABS_API_KEY=sk_482383917a63e0626768fa3c5d0fecf5b4756b896ed90763

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_google_ai_api_key
`;
  }

  // Atualizar ou adicionar SUPABASE_SERVICE_ROLE_KEY
  if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    // Substituir valor existente
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey.trim()}`
    );
  } else {
    // Adicionar se não existir
    envContent += `\nSUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey.trim()}\n`;
  }

  // Salvar
  fs.writeFileSync('.env.local', envContent);

  console.log('\n✅ .env.local atualizado com sucesso!');
  console.log('🔄 Reinicie o servidor de desenvolvimento (npm run dev)\n');

  rl.close();
}

main().catch(console.error);

