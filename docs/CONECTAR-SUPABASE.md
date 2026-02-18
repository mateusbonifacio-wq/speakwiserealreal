# Conectar a app ao Supabase (projeto speakwise5)

## 1. Esperar o projeto estar pronto

No dashboard do Supabase, quando o projeto **speakwise5** deixar de mostrar "SETTING UP PROJECT" e aparecer a página principal, está pronto.

## 2. Copiar URL e chaves

1. No menu lateral: **Settings** (ícone de engrenagem).
2. Clique em **API**.
3. Copie:
   - **Project URL** → usa em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (em Project API keys) → usa em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (em Project API keys; clica em "Reveal") → usa em `SUPABASE_SERVICE_ROLE_KEY`

⚠️ A chave **service_role** não deve ser exposta no browser; usa só no servidor (.env.local e Vercel como variável de ambiente, nunca em código público).

## 3. Configurar localmente (.env.local)

Na pasta do projeto, execute:

```bash
node update-supabase-env.js
```

O script pede os 3 valores (URL, anon key, service_role key). Cola cada um quando for pedido. O ficheiro `.env.local` é atualizado.

Ou edita manualmente o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 4. Configurar no Vercel (produção)

1. Vercel → teu projeto → **Settings** → **Environment Variables**.
2. Cria/atualiza:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role
   - `ACCESS_CODE_PASSWORD` = palavra-passe para os códigos de acesso (já usada na app).
3. **Save** e faz **Redeploy** para aplicar.

## 5. Base de dados (schema)

O projeto speakwise5 é novo, por isso a base de dados está vazia. Usa o **setup completo** numa só vez:

- No Supabase: **SQL Editor** → New query.
- Copia todo o conteúdo de **`supabase/01-setup-completo.sql`** e cola no editor → **Run**.

Isso cria todas as tabelas (profiles, projects, audio_sessions, project_slides, access_codes) e as políticas RLS.

Depois de executar o SQL e criares os 5 códigos com `node scripts/create-access-codes.js`, a app fica ligada ao speakwise5.

**Checklist completo:** vê **`docs/O-QUE-TENS-DE-FAZER.md`**.
