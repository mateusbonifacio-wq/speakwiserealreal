/**
 * Script para executar a migração de slide decks no Supabase
 * 
 * Execute: node run-slides-migration.js
 * 
 * Você precisará:
 * - SUPABASE_URL (ex: https://xxxxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY (encontre em Settings → API → service_role key)
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function executeSQL(supabaseUrl, serviceRoleKey, sql) {
  // Extrair project ref da URL
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    throw new Error('URL do Supabase inválida! Use o formato: https://xxxxx.supabase.co');
  }

  const projectRef = urlMatch[1];
  const API_URL = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

  // Usar a API REST do Supabase para executar SQL
  // Nota: A API REST não suporta execução direta de SQL, então vamos usar o endpoint de query
  // Alternativa: usar a API GraphQL ou executar via pg_rest ou usar a API de management
  
  // Vamos usar uma abordagem diferente: executar via REST API usando o endpoint de query
  // Mas isso requer que o SQL seja executado via SQL Editor ou via API de management
  
  // Melhor abordagem: usar fetch para executar via REST API
  // Mas Supabase não expõe execução direta de SQL via REST sem RPC functions
  
  // Vamos criar uma função RPC temporária ou usar o método direto via PostgREST
  // Na verdade, a melhor forma é usar o endpoint de query do Supabase
  
  const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  // Isso não vai funcionar diretamente. Vamos usar uma abordagem diferente:
  // Executar via API de management do Supabase ou criar uma função RPC
  
  // Alternativa mais simples: usar o Supabase Management API
  // Mas isso requer autenticação diferente
  
  // Vamos usar uma abordagem prática: ler o arquivo SQL e mostrar instruções
  // E também tentar executar via API REST se possível
  
  console.log('\n📝 Executando migração SQL...\n');
  
  // Tentar executar via Supabase Management API
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  try {
    // Dividir SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0 && !cmd.trim().startsWith('--'));
    
    console.log(`Executando ${commands.length} comandos SQL...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (!command || command.startsWith('--')) continue;
      
      console.log(`[${i + 1}/${commands.length}] Executando comando...`);
      
      // Tentar executar via REST API usando uma função RPC
      // Mas como não temos uma função RPC, vamos mostrar o SQL para o usuário executar
      // Ou podemos usar o Supabase CLI se estiver instalado
    }
    
    // Como a execução direta via API é complexa, vamos mostrar o SQL
    console.log('\n⚠️  Execução automática via API não está disponível.');
    console.log('📋 Por favor, execute o SQL manualmente no Supabase SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n✅ Ou copie do arquivo: supabase/add-slides-support.sql\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Por favor, execute o SQL manualmente no Supabase SQL Editor.\n');
  }
}

async function runMigration() {
  console.log('🚀 Executar Migração de Slide Decks no Supabase\n');
  console.log('Este script irá executar a migração SQL necessária.\n');

  // Ler o arquivo SQL
  const sqlPath = path.join(__dirname, 'supabase', 'add-slides-support.sql');
  let sql;
  
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (error) {
    console.error(`❌ Erro ao ler arquivo SQL: ${error.message}`);
    console.error(`   Certifique-se de que o arquivo existe: ${sqlPath}\n`);
    rl.close();
    process.exit(1);
  }

  // Solicitar informações
  const supabaseUrl = await question('🔗 Supabase URL (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('🔑 Service Role Key (Settings → API → service_role): ');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('\n❌ URL e Service Role Key são obrigatórios!\n');
    rl.close();
    process.exit(1);
  }

  try {
    await executeSQL(supabaseUrl, serviceRoleKey, sql);
    
    console.log('\n📝 Próximos passos:');
    console.log('   1. Acesse: https://app.supabase.com');
    console.log('   2. Vá em SQL Editor');
    console.log('   3. Cole o SQL mostrado acima');
    console.log('   4. Clique em "Run"\n');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.log('\n📝 Execute manualmente:');
    console.log('   1. Acesse: https://app.supabase.com');
    console.log('   2. Vá em SQL Editor');
    console.log('   3. Abra o arquivo: supabase/add-slides-support.sql');
    console.log('   4. Execute o SQL\n');
  }

  rl.close();
}

runMigration();

