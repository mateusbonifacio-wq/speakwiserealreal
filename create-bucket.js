/**
 * Script para criar o bucket audio-recordings no Supabase Storage
 * Execute: node create-bucket.js
 */

const fs = require('fs');

// Ler .env.local
function loadEnv() {
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    return {};
  }
  
  const content = fs.readFileSync(envFile, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  
  return env;
}

const env = loadEnv();
let SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Se ainda tiver placeholder, pedir ao usuário
if (!SUPABASE_URL || SUPABASE_URL.includes('your_') || SUPABASE_URL.includes('COLE_')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada no .env.local');
  console.error('   Por favor, adicione a URL do Supabase no .env.local');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes('your_') || SERVICE_ROLE_KEY.includes('COLE_')) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local');
  console.error('   Por favor, adicione a service_role key no .env.local');
  process.exit(1);
}

// Extrair project reference da URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Erro: URL do Supabase inválida');
  process.exit(1);
}

const API_URL = `https://${projectRef}.supabase.co/storage/v1/bucket`;

async function createBucket() {
  console.log('🔌 Conectando ao Supabase...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        name: 'audio-recordings',
        public: false, // Bucket privado
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/*'],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Bucket "audio-recordings" criado com sucesso!\n');
      console.log('📋 Detalhes:');
      console.log(`   Nome: ${data.name}`);
      console.log(`   Público: ${data.public ? 'Sim' : 'Não (Privado)'}`);
      console.log(`   Criado em: ${data.created_at}\n`);
      console.log('🔄 Agora recarregue a página do app e tente fazer upload novamente!\n');
    } else {
      if (data.message && data.message.includes('already exists')) {
        console.log('⚠️  Bucket "audio-recordings" já existe!\n');
        console.log('✅ Tudo certo, você pode usar o bucket existente.\n');
      } else {
        console.error('❌ Erro ao criar bucket:', data.message || JSON.stringify(data));
        console.error('\n📝 Tente criar manualmente:');
        console.error('   1. Acesse: https://app.supabase.com');
        console.error('   2. Vá em Storage → Create bucket');
        console.error('   3. Nome: audio-recordings');
        console.error('   4. Desmarque "Public bucket"');
        console.error('   5. Clique em "Create bucket"\n');
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\n📝 Tente criar manualmente:');
    console.error('   1. Acesse: https://app.supabase.com');
    console.error('   2. Vá em Storage → Create bucket');
    console.error('   3. Nome: audio-recordings');
    console.error('   4. Desmarque "Public bucket"');
    console.error('   5. Clique em "Create bucket"\n');
  }
}

createBucket();

