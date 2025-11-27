/**
 * Script para atualizar variáveis do Supabase no .env.local
 * Execute: node update-supabase-env.js
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
  console.log('🔧 Atualizar Variáveis do Supabase no .env.local\n');

  const supabaseUrl = await question('1. NEXT_PUBLIC_SUPABASE_URL (ex: https://xxxxx.supabase.co): ');
  const anonKey = await question('2. NEXT_PUBLIC_SUPABASE_ANON_KEY: ');
  const serviceRoleKey = await question('3. SUPABASE_SERVICE_ROLE_KEY: ');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.log('\n❌ Todas as informações são obrigatórias. Cancelado.');
    rl.close();
    return;
  }

  // Ler .env.local atual
  let envContent = '';
  if (fs.existsSync('.env.local')) {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } else {
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

  // Atualizar variáveis
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.trim()}`
  );
  envContent = envContent.replace(
    /SUPABASE_SERVICE_ROLE_KEY=.*/,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey.trim()}`
  );

  // Salvar
  fs.writeFileSync('.env.local', envContent);

  console.log('\n✅ .env.local atualizado com sucesso!');
  console.log('\n📋 Variáveis atualizadas:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim().substring(0, 30)}...`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.trim().substring(0, 30)}...`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey.trim().substring(0, 30)}...`);
  console.log('\n🔄 Reinicie o servidor: npm run dev\n');

  rl.close();
}

main().catch(console.error);

