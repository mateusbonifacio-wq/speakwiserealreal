import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const password = process.env.ACCESS_CODE_PASSWORD

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta.' },
      { status: 500 }
    )
  }

  if (!password) {
    return NextResponse.json(
      { error: 'ACCESS_CODE_PASSWORD não está definida. Defina no Vercel/ambiente.' },
      { status: 500 }
    )
  }

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Código inválido.' },
      { status: 400 }
    )
  }

  const raw = (body?.code ?? '').toString().trim().replace(/\D/g, '')
  const code = raw.slice(0, 6)
  if (code.length !== 6) {
    return NextResponse.json(
      { error: 'Código deve ter 6 dígitos.' },
      { status: 400 }
    )
  }

  const service = createServiceClient()
  const { data: row, error: lookupError } = await service
    .from('access_codes')
    .select('email')
    .eq('code', code)
    .maybeSingle()

  const email = row && 'email' in row ? (row as { email: string }).email : null
  if (lookupError || !email) {
    return NextResponse.json(
      { error: 'Código inválido ou inexistente.' },
      { status: 401 }
    )
  }

  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return NextResponse.json(
      { error: 'Não foi possível iniciar sessão. Verifique o código ou contacte o suporte.' },
      { status: 401 }
    )
  }

  return response
}
