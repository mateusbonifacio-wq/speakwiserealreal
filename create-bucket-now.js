/**
 * Criar bucket usando as informações do .env.local
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
    const trimmed = line.trim();
    // Ignorar comentários e linhas vazias
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    }
  });
  
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis não encontradas no .env.local');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ URL inválida');
  process.exit(1);
}

const API_URL = `https://${projectRef}.supabase.co/storage/v1/bucket`;

async function createBucket() {
  console.log('📦 Criando bucket audio-recordings...\n');

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
        public: false,
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
      if (data.message && (data.message.includes('already exists') || data.message.includes('duplicate'))) {
        console.log('✅ Bucket "audio-recordings" já existe!\n');
        console.log('🔄 Tudo certo, você pode usar o bucket existente.\n');
      } else {
        console.error('❌ Erro ao criar bucket:', data.message || JSON.stringify(data));
        console.error('\n📝 Tente criar manualmente no Supabase Dashboard → Storage\n');
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\n📝 Tente criar manualmente no Supabase Dashboard → Storage\n');
  }
}

createBucket();

