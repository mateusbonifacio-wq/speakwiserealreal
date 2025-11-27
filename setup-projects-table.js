/**
 * Script to add projects table and project_id column to audio_sessions
 * Execute: node setup-projects-table.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Connection string do Supabase - usando as mesmas credenciais do setup-supabase-direct.js
const connectionConfig = {
  host: 'db.itlduwfctyyxnkhnguhs.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Edi$H?a8F$ADD_f',
  ssl: {
    rejectUnauthorized: false // Supabase requer SSL
  }
}

async function setupProjects() {
  const client = new Client(connectionConfig)

  try {
    console.log('🔌 Conectando ao Supabase...\n')
    await client.connect()
    console.log('✅ Conectado!\n')

    // Ler SQL do arquivo
    console.log('📖 Lendo arquivo SQL...\n')
    const sqlFile = path.resolve(__dirname, 'supabase', 'add-projects.sql')
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Erro: Arquivo SQL não encontrado: ${sqlFile}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Executar SQL
    console.log('📝 Executando SQL para criar tabela projects...\n')
    await client.query(sql)
    
    console.log('✅ Tabela projects criada com sucesso!')
    console.log('✅ Coluna project_id adicionada a audio_sessions')
    console.log('✅ Políticas RLS configuradas')
    console.log('✅ Trigger criado para updated_at')
    console.log('\n🎉 Setup completo! Você pode usar a funcionalidade de projetos agora.')

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error.message)
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n⚠️  Alguns objetos já existem. Isso é normal - o script usa IF NOT EXISTS.')
      console.log('✅ Setup pode ter sido concluído anteriormente.')
    } else {
      console.error('\nErro completo:', error)
      process.exit(1)
    }
  } finally {
    await client.end()
    console.log('\n🔌 Desconectado do banco de dados')
  }
}

setupProjects().catch((error) => {
  console.error('Erro fatal:', error)
  process.exit(1)
})
