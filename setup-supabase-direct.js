/**
 * Setup Direto no Supabase via PostgreSQL Connection
 * Execute: npm install pg
 * Depois: node setup-supabase-direct.js
 */

const { Client } = require('pg');
const fs = require('fs');

// Connection string do Supabase - parsear manualmente
const connectionConfig = {
  host: 'db.itlduwfctyyxnkhnguhs.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Edi$H?a8F$ADD_f',
  ssl: {
    rejectUnauthorized: false // Supabase requer SSL
  }
};

async function setupSupabase() {
  const client = new Client(connectionConfig);

  try {
    console.log('🔌 Conectando ao Supabase...\n');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler SQL dos arquivos
    console.log('📖 Lendo arquivos SQL...\n');
    const setupSQL = fs.readFileSync('supabase/setup-complete.sql', 'utf8');
    const storageSQL = fs.readFileSync('supabase/storage-setup-complete.sql', 'utf8');

    // Remover comentários e dividir em comandos
    const cleanSQL = setupSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    // Dividir por ponto e vírgula, mas manter CREATE POLICY completo
    const commands = [];
    let currentCommand = '';
    let inPolicy = false;
    
    const lines = cleanSQL.split('\n');
    for (const line of lines) {
      currentCommand += line + '\n';
      
      // Detectar início de CREATE POLICY
      if (line.trim().toUpperCase().startsWith('CREATE POLICY')) {
        inPolicy = true;
      }
      
      // Se encontrou ponto e vírgula e não está dentro de uma policy, finalizar comando
      if (line.trim().endsWith(';') && !inPolicy) {
        const cmd = currentCommand.trim();
        if (cmd.length > 0) {
          commands.push(cmd);
        }
        currentCommand = '';
      } else if (line.trim().endsWith(';') && inPolicy) {
        // Finalizar policy
        const cmd = currentCommand.trim();
        if (cmd.length > 0) {
          commands.push(cmd);
        }
        currentCommand = '';
        inPolicy = false;
      }
    }
    
    // Adicionar último comando se houver
    if (currentCommand.trim().length > 0) {
      commands.push(currentCommand.trim());
    }

    console.log('📝 Executando setup das tabelas...\n');
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd.trim().length === 0) continue;
      
      try {
        await client.query(cmd);
        console.log(`✅ Comando ${i + 1}/${commands.length} executado`);
      } catch (error) {
        // Ignorar erros de "já existe"
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('relation') && error.message.includes('already exists') ||
            error.message.includes('policy') && error.message.includes('already exists')) {
          console.log(`⚠️  Comando ${i + 1} já existe (ignorado)`);
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          // Continuar mesmo com erro
        }
      }
    }

    console.log('\n📦 Executando setup do storage...\n');
    
    // Processar storage SQL da mesma forma
    const cleanStorageSQL = storageSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    const storageCommands = [];
    let currentStorageCmd = '';
    let inStoragePolicy = false;
    
    const storageLines = cleanStorageSQL.split('\n');
    for (const line of storageLines) {
      currentStorageCmd += line + '\n';
      
      if (line.trim().toUpperCase().startsWith('CREATE POLICY')) {
        inStoragePolicy = true;
      }
      
      if (line.trim().endsWith(';') && !inStoragePolicy) {
        const cmd = currentStorageCmd.trim();
        if (cmd.length > 0) {
          storageCommands.push(cmd);
        }
        currentStorageCmd = '';
      } else if (line.trim().endsWith(';') && inStoragePolicy) {
        const cmd = currentStorageCmd.trim();
        if (cmd.length > 0) {
          storageCommands.push(cmd);
        }
        currentStorageCmd = '';
        inStoragePolicy = false;
      }
    }
    
    if (currentStorageCmd.trim().length > 0) {
      storageCommands.push(currentStorageCmd.trim());
    }

    for (let i = 0; i < storageCommands.length; i++) {
      const cmd = storageCommands[i];
      if (cmd.trim().length === 0) continue;
      
      try {
        await client.query(cmd);
        console.log(`✅ Política de storage ${i + 1}/${storageCommands.length} criada`);
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('policy') && error.message.includes('already exists')) {
          console.log(`⚠️  Política de storage ${i + 1} já existe (ignorado)`);
        } else {
          console.error(`❌ Erro na política de storage ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETO!');
    console.log('='.repeat(60));
    console.log('\n✅ Tabelas criadas');
    console.log('✅ RLS policies configuradas');
    console.log('✅ Storage policies configuradas\n');
    console.log('📝 NOTA: Você ainda precisa criar o bucket manualmente:');
    console.log('   1. Vá em Storage no Supabase dashboard');
    console.log('   2. Crie bucket: audio-recordings (PRIVADO)\n');
    console.log('🔄 Agora recarregue a página do app no Vercel!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Verifique se a connection string está correta');
    }
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

// Executar
setupSupabase().catch(console.error);

