/**
 * Setup via Supabase Management API
 * Requer: @supabase/supabase-js
 * Execute: npm install @supabase/supabase-js
 * Depois: node setup-supabase-api.js
 */

const { createClient } = require('@supabase/supabase-js');
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
  console.log('🚀 Setup Automatizado do Supabase via API\n');

  const supabaseUrl = await question('URL do Supabase (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('Service Role Key: ');

  console.log('\n⏳ Conectando ao Supabase...\n');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Verificar conexão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('✅ Conectado ao Supabase!\n');
    console.log('📝 Executando setup...\n');

    // SQL para executar
    const setupSQL = fs.readFileSync('supabase/setup-complete.sql', 'utf8');
    
    // Nota: O Supabase JS client não tem método direto para executar SQL arbitrário
    // Mas podemos usar a REST API diretamente
    
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    console.log('⚠️  O Supabase JS client não permite executar SQL diretamente.');
    console.log('📋 Vou criar um script Python que você pode executar:\n');
    
    // Criar script Python alternativo
    const pythonScript = `#!/usr/bin/env python3
"""
Script para executar SQL no Supabase via Management API
Execute: python setup-supabase-python.py
"""

import requests
import json

SUPABASE_URL = "${supabaseUrl}"
SERVICE_ROLE_KEY = "${serviceRoleKey}"

# SQL para criar tabelas
setup_sql = """
${setupSQL.replace(/\$\{/g, '\\${')}
"""

def execute_sql(sql):
    """Executa SQL via Supabase Management API"""
    # Nota: A Management API do Supabase requer autenticação especial
    # Por enquanto, vamos apenas mostrar o SQL para copiar
    
    print("⚠️  A Management API do Supabase requer configuração adicional.")
    print("📋 Por favor, execute o SQL manualmente no SQL Editor:\n")
    print("=" * 60)
    print(sql)
    print("=" * 60)
    print("\n1. Vá para: " + SUPABASE_URL + "/project/_/sql")
    print("2. Cole o SQL acima")
    print("3. Clique em 'Run'")

if __name__ == "__main__":
    execute_sql(setup_sql)
`;

    fs.writeFileSync('setup-supabase-python.py', pythonScript);
    console.log('✅ Script Python criado: setup-supabase-python.py');
    console.log('   Execute: python setup-supabase-python.py\n');
    
    // Melhor solução: criar um guia interativo
    console.log('🎯 SOLUÇÃO MAIS RÁPIDA:\n');
    console.log('1. Abra: ' + supabaseUrl.replace('https://', 'https://app.') + '/project/_/sql');
    console.log('2. Execute o SQL do arquivo: supabase/setup-complete.sql\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  rl.close();
}

main().catch(console.error);

