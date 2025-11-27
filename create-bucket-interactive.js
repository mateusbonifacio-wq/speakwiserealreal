/**
 * Script interativo para criar o bucket audio-recordings
 * Execute: node create-bucket-interactive.js
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

async function createBucket() {
  console.log('📦 Criar Bucket audio-recordings no Supabase\n');

  const supabaseUrl = await question('URL do Supabase (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('Service Role Key: ');

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Informações incompletas. Cancelado.');
    rl.close();
    return;
  }

  // Extrair project reference
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.log('❌ URL inválida. Use o formato: https://xxxxx.supabase.co');
    rl.close();
    return;
  }

  const projectRef = match[1];
  const API_URL = `https://${projectRef}.supabase.co/storage/v1/bucket`;

  console.log('\n🔌 Criando bucket...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
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
      if (data.message && (data.message.includes('already exists') || data.message.includes('duplicate'))) {
        console.log('✅ Bucket "audio-recordings" já existe!\n');
        console.log('🔄 Tudo certo, você pode usar o bucket existente.\n');
        console.log('📝 Se ainda houver erro, verifique as políticas de storage no SQL Editor.\n');
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

  rl.close();
}

createBucket();

