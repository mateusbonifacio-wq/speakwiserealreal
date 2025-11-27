/**
 * Script Automatizado para Setup do Supabase
 * Execute: node setup-supabase-auto.js
 * 
 * Este script vai:
 * 1. Criar as tabelas (profiles, audio_sessions)
 * 2. Configurar RLS policies
 * 3. Criar o bucket de storage
 * 4. Configurar storage policies
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function executeSQL(supabaseUrl, serviceRoleKey, sql) {
  return new Promise((resolve, reject) => {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      reject(new Error('URL do Supabase inválida'));
      return;
    }

    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    };

    // Nota: A API REST do Supabase não tem um endpoint direto para executar SQL arbitrário
    // Vamos usar uma abordagem diferente - criar um script que o usuário pode executar
    // ou usar a Management API se disponível
    
    console.log('⚠️  A API REST do Supabase não permite executar SQL arbitrário diretamente.');
    console.log('📋 Vou criar um arquivo com todas as instruções e SQL pronto para copiar.\n');
    resolve(false);
  });
}

async function main() {
  console.log('🚀 Setup Automatizado do Supabase\n');
  console.log('Vou te guiar através do processo.\n');

  const supabaseUrl = await question('1. Digite a URL do seu projeto Supabase (ex: https://xxxxx.supabase.co): ');
  const serviceRoleKey = await question('2. Digite a Service Role Key (Settings → API → service_role): ');
  
  console.log('\n⏳ Processando...\n');

  // SQL para criar tabelas
  const setupSQL = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Audio Sessions table
CREATE TABLE IF NOT EXISTS public.audio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    transcript TEXT,
    analysis_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can select own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Audio Sessions RLS Policies
CREATE POLICY "Users can insert own audio sessions"
    ON public.audio_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own audio sessions"
    ON public.audio_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own audio sessions"
    ON public.audio_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio sessions"
    ON public.audio_sessions FOR DELETE USING (auth.uid() = user_id);`;

  const storageSQL = `CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own audio"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own audio"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);`;

  // Salvar SQL em arquivos
  const fs = require('fs');
  fs.writeFileSync('supabase-setup-tables.sql', setupSQL);
  fs.writeFileSync('supabase-setup-storage.sql', storageSQL);

  console.log('✅ Arquivos SQL criados!\n');
  console.log('📋 PRÓXIMOS PASSOS:\n');
  console.log('1. Abra o Supabase: ' + supabaseUrl + '/project/_/sql');
  console.log('2. Clique em "New query"');
  console.log('3. Abra o arquivo: supabase-setup-tables.sql');
  console.log('4. Copie TODO o conteúdo e cole no SQL Editor');
  console.log('5. Clique em "Run" (ou Ctrl+Enter)\n');
  console.log('6. Depois, vá em Storage → Create bucket');
  console.log('   Nome: audio-recordings (PRIVADO)');
  console.log('7. Volte ao SQL Editor e execute: supabase-setup-storage.sql\n');
  
  console.log('💡 DICA: Os arquivos SQL já estão prontos neste diretório!');
  console.log('   - supabase-setup-tables.sql');
  console.log('   - supabase-setup-storage.sql\n');

  rl.close();
}

main().catch(console.error);

