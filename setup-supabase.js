/**
 * Setup Automatizado do Supabase
 * 
 * USO:
 *   node setup-supabase.js
 * 
 * O script vai te guiar passo a passo!
 */

const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`\n📌 Abra manualmente: ${url}\n`);
    }
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SETUP AUTOMATIZADO DO SUPABASE');
  console.log('='.repeat(60) + '\n');

  const supabaseUrl = await question('📌 URL do Supabase (ex: https://xxxxx.supabase.co): ');
  
  // Validar URL
  if (!supabaseUrl.includes('supabase.co')) {
    console.log('❌ URL inválida. Use o formato: https://xxxxx.supabase.co');
    rl.close();
    return;
  }

  const appUrl = supabaseUrl.replace('https://', 'https://app.');
  const sqlUrl = `${appUrl}/project/_/sql`;
  const storageUrl = `${appUrl}/project/_/storage/buckets`;

  // Ler SQL
  const setupSQL = fs.readFileSync('supabase/setup-complete.sql', 'utf8');
  const storageSQL = fs.readFileSync('supabase/storage-setup-complete.sql', 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('📋 PASSO 1: Criar Tabelas no Banco de Dados');
  console.log('='.repeat(60));
  console.log('\nVou abrir o SQL Editor para você...\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`🌐 Abrindo: ${sqlUrl}\n`);
  // openBrowser(sqlUrl);

  console.log('📝 INSTRUÇÕES:');
  console.log('1. No SQL Editor, clique em "New query"');
  console.log('2. Copie TODO o SQL abaixo e cole no editor:');
  console.log('\n' + '-'.repeat(60));
  console.log(setupSQL);
  console.log('-'.repeat(60));
  console.log('\n3. Clique em "Run" (ou pressione Ctrl+Enter)');
  console.log('4. Você deve ver: "Success. No rows returned"\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 1...');

  console.log('\n' + '='.repeat(60));
  console.log('📦 PASSO 2: Criar Bucket de Storage');
  console.log('='.repeat(60));
  console.log(`\n🌐 Abrindo Storage: ${storageUrl}\n`);
  // openBrowser(storageUrl);

  console.log('📝 INSTRUÇÕES:');
  console.log('1. Clique em "Create bucket"');
  console.log('2. Nome do bucket: audio-recordings');
  console.log('3. ⚠️  IMPORTANTE: DESMARQUE "Public bucket" (deixe PRIVADO)');
  console.log('4. Clique em "Create bucket"\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 2...');

  console.log('\n' + '='.repeat(60));
  console.log('🔒 PASSO 3: Configurar Políticas de Storage');
  console.log('='.repeat(60));
  console.log(`\n🌐 Volte para: ${sqlUrl}\n`);
  // openBrowser(sqlUrl);

  console.log('📝 INSTRUÇÕES:');
  console.log('1. Clique em "New query" novamente');
  console.log('2. Copie TODO o SQL abaixo e cole no editor:');
  console.log('\n' + '-'.repeat(60));
  console.log(storageSQL);
  console.log('-'.repeat(60));
  console.log('\n3. Clique em "Run" (ou pressione Ctrl+Enter)');
  console.log('4. Você deve ver: "Success. No rows returned"\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 3...');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SETUP COMPLETO!');
  console.log('='.repeat(60));
  console.log('\n✅ Tabelas criadas');
  console.log('✅ Bucket de storage criado');
  console.log('✅ Políticas de segurança configuradas\n');
  console.log('🔄 Agora:');
  console.log('1. Recarregue a página do seu app no Vercel');
  console.log('2. Faça login novamente');
  console.log('3. Tente fazer upload de um áudio\n');
  console.log('✨ O erro deve ter desaparecido!\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Erro:', error.message);
  rl.close();
});
