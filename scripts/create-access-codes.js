/**
 * Cria 5 contas de acesso por código (6 dígitos) no Supabase.
 *
 * Pré-requisitos:
 * 1. Executar o SQL em supabase/add-access-codes.sql no Supabase (criar tabela access_codes).
 * 2. Variáveis de ambiente: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ACCESS_CODE_PASSWORD.
 *
 * Uso: node scripts/create-access-codes.js
 *
 * Os 5 códigos criados são: 847291, 361504, 592817, 104638, 729345
 * (guarde estes códigos para distribuir pelas 5 contas.)
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PASSWORD = process.env.ACCESS_CODE_PASSWORD

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

if (!PASSWORD || PASSWORD.length < 6) {
  console.error('Defina ACCESS_CODE_PASSWORD em .env.local (mínimo 6 caracteres)')
  process.exit(1)
}

const CODES = [
  { code: '847291', email: 'speakwise_847291@internal.speakwise.app' },
  { code: '361504', email: 'speakwise_361504@internal.speakwise.app' },
  { code: '592817', email: 'speakwise_592817@internal.speakwise.app' },
  { code: '104638', email: 'speakwise_104638@internal.speakwise.app' },
  { code: '729345', email: 'speakwise_729345@internal.speakwise.app' },
]

async function main() {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('A criar 5 utilizadores e códigos de acesso...\n')

  for (const { code, email } of CODES) {
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    })

    if (userError) {
      if (userError.message.includes('already been registered')) {
        console.log(`Conta já existe: ${code} (${email})`)
      } else {
        console.error(`Erro ao criar utilizador ${email}:`, userError.message)
        continue
      }
    } else if (user?.user) {
      console.log(`Utilizador criado: ${email} (id: ${user.user.id})`)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.user.id,
        full_name: null,
      }, { onConflict: 'id' })
      if (profileError) console.error('  Aviso: perfil:', profileError.message)
    }

    const { error: codeError } = await supabase.from('access_codes').upsert(
      { code, email },
      { onConflict: 'code' }
    )
    if (codeError) {
      console.error(`  Erro ao inserir código ${code}:`, codeError.message)
    } else {
      console.log(`  Código ${code} associado a ${email}`)
    }
  }

  console.log('\n--- Códigos de 6 dígitos (5 contas) ---')
  CODES.forEach(({ code }) => console.log(code))
  console.log('\nGuarde estes códigos. Cada um dá acesso a uma conta separada.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
