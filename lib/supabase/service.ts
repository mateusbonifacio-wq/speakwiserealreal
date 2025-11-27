import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Debug: Log available env vars (remove in production)
  if (!serviceRoleKey) {
    const availableKeys = Object.keys(process.env)
      .filter(k => k.includes('SUPABASE'))
      .join(', ')
    console.error('Available SUPABASE env vars:', availableKeys || 'NONE')
  }

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY. Available SUPABASE vars: ' + 
      (Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ') || 'NONE'))
  }

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

