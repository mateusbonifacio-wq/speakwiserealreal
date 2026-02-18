/**
 * Script para verificar variáveis de ambiente
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente...\n');

const vars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'ACCESS_CODE_PASSWORD': process.env.ACCESS_CODE_PASSWORD,
  'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY,
  'GOOGLE_AI_API_KEY': process.env.GOOGLE_AI_API_KEY,
};

let allOk = true;

for (const [key, value] of Object.entries(vars)) {
  if (!value || value.includes('your_') || value.includes('COLE_')) {
    console.log(`❌ ${key}: NÃO configurada`);
    allOk = false;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key}: ${preview}`);
  }
}

console.log('\n' + '='.repeat(60));
if (allOk) {
  console.log('✅ Todas as variáveis estão configuradas!');
  console.log('🔄 Reinicie o servidor: npm run dev');
} else {
  console.log('⚠️  Algumas variáveis precisam ser configuradas');
  console.log('📝 Edite o arquivo .env.local e adicione as chaves faltantes');
}
console.log('='.repeat(60));

