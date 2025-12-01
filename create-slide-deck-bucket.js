/**
 * Script para criar o bucket 'project-decks' no Supabase Storage
 * 
 * Execute: node create-slide-deck-bucket.js
 * 
 * Você precisará:
 * - SUPABASE_URL (ex: https://xxxxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY (encontre em Settings → API → service_role key)
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createBucket() {
  console.log('📦 Criar Bucket project-decks no Supabase\n');
  console.log('Este script criará o bucket necessário para upload de slide decks.\n');

  // Solicitar informações
  const supabaseUrl = await question('🔗 Supabase URL (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('🔑 Service Role Key (Settings → API → service_role): ');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('\n❌ URL e Service Role Key são obrigatórios!\n');
    rl.close();
    process.exit(1);
  }

  // Extrair project ref da URL
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    console.error('\n❌ URL do Supabase inválida! Use o formato: https://xxxxx.supabase.co\n');
    rl.close();
    process.exit(1);
  }

  const projectRef = urlMatch[1];
  const API_URL = `https://${projectRef}.supabase.co/storage/v1/bucket`;

  console.log('\n🔌 Conectando ao Supabase...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        name: 'project-decks',
        public: false, // Bucket privado
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Bucket "project-decks" criado com sucesso!\n');
      console.log('📋 Detalhes:');
      console.log(`   Nome: ${data.name}`);
      console.log(`   Público: ${data.public ? 'Sim' : 'Não (Privado)'}`);
      console.log(`   Tamanho máximo: ${(data.file_size_limit / 1024 / 1024).toFixed(0)}MB`);
      console.log(`   Criado em: ${data.created_at}\n`);
      console.log('📝 Próximo passo: Execute as políticas de storage no SQL Editor');
      console.log('   Arquivo: supabase/create-slide-deck-bucket.sql\n');
      console.log('🔄 Depois disso, recarregue a página do app e tente fazer upload novamente!\n');
    } else {
      if (data.message && (data.message.includes('already exists') || data.message.includes('duplicate'))) {
        console.log('✅ Bucket "project-decks" já existe!\n');
        console.log('🔄 Tudo certo, você pode usar o bucket existente.\n');
        console.log('📝 Se ainda houver erro, verifique as políticas de storage no SQL Editor.\n');
        console.log('   Execute: supabase/create-slide-deck-bucket.sql\n');
      } else {
        console.error('❌ Erro ao criar bucket:', data.message || JSON.stringify(data));
        console.error('\n📝 Tente criar manualmente:');
        console.error('   1. Acesse: https://app.supabase.com');
        console.error('   2. Vá em Storage → Create bucket');
        console.error('   3. Nome: project-decks');
        console.error('   4. Desmarque "Public bucket"');
        console.error('   5. Clique em "Create bucket"\n');
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('\n📝 Tente criar manualmente:');
    console.error('   1. Acesse: https://app.supabase.com');
    console.error('   2. Vá em Storage → Create bucket');
    console.error('   3. Nome: project-decks');
    console.error('   4. Desmarque "Public bucket"');
    console.error('   5. Clique em "Create bucket"\n');
  }

  rl.close();
}

createBucket();

