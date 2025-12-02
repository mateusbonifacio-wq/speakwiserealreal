/**
 * Script simples para mostrar o SQL da migração
 * Execute: node run-slides-migration-simple.js
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Migração SQL para Slide Decks\n');
console.log('─'.repeat(70));
console.log('Copie o SQL abaixo e execute no Supabase SQL Editor:\n');

try {
  const sqlPath = path.join(__dirname, 'supabase', 'add-slides-support.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log(sql);
  console.log('\n─'.repeat(70));
  console.log('\n✅ Próximos passos:');
  console.log('   1. Acesse: https://app.supabase.com');
  console.log('   2. Vá em SQL Editor');
  console.log('   3. Cole o SQL acima');
  console.log('   4. Clique em "Run" (ou Ctrl+Enter / Cmd+Enter)');
  console.log('   5. Verifique se apareceu "Success"\n');
  
} catch (error) {
  console.error('❌ Erro ao ler arquivo SQL:', error.message);
  console.log('\n📝 Execute manualmente:');
  console.log('   1. Abra o arquivo: supabase/add-slides-support.sql');
  console.log('   2. Copie o conteúdo');
  console.log('   3. Cole no Supabase SQL Editor');
  console.log('   4. Execute\n');
}

