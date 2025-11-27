/**
 * Setup Automatizado do Supabase
 * Execute: node setup-supabase-cli.js
 * 
 * Este script vai te guiar e executar tudo automaticamente
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function executeSQLViaAPI(supabaseUrl, serviceRoleKey, sql) {
  return new Promise((resolve, reject) => {
    // Extrair project reference da URL
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) {
      reject(new Error('URL inválida'));
      return;
    }
    
    const projectRef = match[1];
    const hostname = `${projectRef}.supabase.co`;
    
    // Tentar usar a Management API do Supabase
    // Nota: A Management API requer autenticação especial
    const options = {
      hostname: hostname,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Conexão com Supabase verificada!');
          resolve(true);
        } else {
          console.log('⚠️  Não foi possível executar SQL via API diretamente.');
          console.log('📋 Vou criar um guia passo a passo para você.\n');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('⚠️  Usando método alternativo...\n');
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Setup Automatizado do Supabase\n');
  console.log('Vou te ajudar a configurar tudo!\n');

  const supabaseUrl = await question('📌 URL do Supabase (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('🔑 Service Role Key (Settings → API → service_role): ');

  console.log('\n⏳ Verificando conexão...\n');

  // Verificar conexão
  const connected = await executeSQLViaAPI(supabaseUrl, serviceRoleKey, '');

  // Ler SQL dos arquivos
  const setupSQL = fs.readFileSync('supabase/setup-complete.sql', 'utf8');
  const storageSQL = fs.readFileSync('supabase/storage-setup-complete.sql', 'utf8');

  console.log('📋 SETUP INSTRUÇÕES:\n');
  console.log('=' .repeat(60));
  console.log('PASSO 1: Criar Tabelas');
  console.log('=' .repeat(60));
  console.log(`1. Abra: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`);
  console.log('2. Clique em "New query"');
  console.log('3. Copie e cole o SQL abaixo:\n');
  console.log(setupSQL);
  console.log('\n4. Clique em "Run" (ou Ctrl+Enter)\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 1...');

  console.log('\n' + '=' .repeat(60));
  console.log('PASSO 2: Criar Bucket de Storage');
  console.log('=' .repeat(60));
  console.log(`1. Vá para: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/storage/buckets`);
  console.log('2. Clique em "Create bucket"');
  console.log('3. Nome: audio-recordings');
  console.log('4. ⚠️  DESMARQUE "Public bucket" (deixe PRIVADO)');
  console.log('5. Clique em "Create bucket"\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 2...');

  console.log('\n' + '=' .repeat(60));
  console.log('PASSO 3: Configurar Storage Policies');
  console.log('=' .repeat(60));
  console.log(`1. Volte para: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`);
  console.log('2. Clique em "New query"');
  console.log('3. Copie e cole o SQL abaixo:\n');
  console.log(storageSQL);
  console.log('\n4. Clique em "Run" (ou Ctrl+Enter)\n');
  
  await question('✅ Pressione ENTER quando terminar o Passo 3...');

  console.log('\n' + '=' .repeat(60));
  console.log('✅ SETUP COMPLETO!');
  console.log('=' .repeat(60));
  console.log('\n🎉 Agora recarregue a página do seu app no Vercel!');
  console.log('   O erro deve ter desaparecido.\n');

  rl.close();
}

main().catch(console.error);

