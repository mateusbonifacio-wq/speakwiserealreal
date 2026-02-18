# O que tens de fazer (checklist)

Tudo o que a app consegue fazer sozinha já está no código. Falta só isto, que só tu podes fazer:

---

## 1. Supabase – esperar e copiar chaves

- Espera o projeto **speakwise5** deixar de estar em "SETTING UP PROJECT".
- Vai a **Settings** → **API**.
- Copia e guarda num sítio seguro:
  - **Project URL**
  - **anon public** (Project API keys)
  - **service_role** (Reveal e copiar)

---

## 2. Base de dados – executar SQL (uma vez)

- No Supabase: **SQL Editor** → **New query**.
- Abre o ficheiro **`supabase/01-setup-completo.sql`** do projeto, copia todo o conteúdo e cola no editor.
- Clica **Run**. Deve correr sem erros.

Isto cria as tabelas (profiles, projects, audio_sessions, project_slides, access_codes) e as políticas RLS.

---

## 3. Variáveis de ambiente – local

- Copia **`.env.example`** para **`.env.local`** (ou cria `.env.local`).
- Preenche com os teus valores (URL e chaves do passo 1, e o resto):

  - `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public  
  - `SUPABASE_SERVICE_ROLE_KEY` = service_role  
  - `ACCESS_CODE_PASSWORD` = uma palavra-passe forte (igual para as 5 contas por código)  
  - `ELEVENLABS_API_KEY` = chave da ElevenLabs  
  - `GOOGLE_AI_API_KEY` = chave do Google AI (Gemini)  

- Ou corre: **`node update-supabase-env.js`** e cola URL + anon + service_role quando pedir (depois completa no `.env.local` as outras variáveis).

Para verificar: **`node check-env.js`**. Deve mostrar tudo ✅.

---

## 4. Criar as 5 contas e códigos (uma vez)

Com o `.env.local` preenchido (incluindo `ACCESS_CODE_PASSWORD`):

```bash
node scripts/create-access-codes.js
```

Isto cria 5 utilizadores no Supabase e associa os códigos. Os códigos são: **847291**, **361504**, **592817**, **104638**, **729345**. Guarda-os para dar a cada utilizador.

---

## 5. Vercel – variáveis e deploy

- No projeto no Vercel: **Settings** → **Environment Variables**.
- Cria as mesmas variáveis do `.env.local` (URL, anon, service_role, ACCESS_CODE_PASSWORD, ELEVENLABS, GOOGLE_AI).
- **Save** e faz **Redeploy** para aplicar.

---

## 6. (Opcional) Bucket para slide decks

Se quiseres upload de PDFs (pitch deck):

- No Supabase: **Storage** → **New bucket** → nome **`project-decks`** → Private.
- No **SQL Editor**, corre o conteúdo de **`supabase/create-slide-deck-bucket.sql`** (só as políticas).

---

## Resumo

| Passo | O que fazer |
|-------|-------------|
| 1 | Copiar URL + anon + service_role do Supabase (Settings → API) |
| 2 | Correr **`supabase/01-setup-completo.sql`** no SQL Editor |
| 3 | Preencher **`.env.local`** (ou usar `node update-supabase-env.js`) |
| 4 | Correr **`node scripts/create-access-codes.js`** para criar os 5 códigos |
| 5 | Definir as mesmas variáveis no Vercel e fazer Redeploy |
| 6 | (Opcional) Criar bucket **project-decks** e políticas do SQL |

Depois disto, a app fica ligada ao speakwise5 e os 5 códigos passam a dar entrada.
