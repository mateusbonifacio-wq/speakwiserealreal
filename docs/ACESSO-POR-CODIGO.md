# Acesso por código (6 dígitos)

O login passou a ser apenas por **código de 6 dígitos**, sem email nem palavra-passe na interface.

## Configuração

### 1. Base de dados

No Supabase (SQL Editor), execute o ficheiro:

- `supabase/add-access-codes.sql`

Isso cria a tabela `access_codes` (code, email).

### 2. Variável de ambiente

Defina uma palavra-passe única para todas as contas de código (só usada no servidor):

- **Nome:** `ACCESS_CODE_PASSWORD`
- **Onde:** `.env.local` (local) e no Vercel em **Settings → Environment Variables** (produção)
- Use uma palavra-passe forte (ex.: 12+ caracteres).

### 3. Criar as 5 contas e códigos

Com a tabela criada e `ACCESS_CODE_PASSWORD` definida:

```bash
node scripts/create-access-codes.js
```

Isto cria 5 utilizadores no Supabase e associa 5 códigos de 6 dígitos. Os códigos gerados são:

| Código  | Conta (email interno) |
|---------|------------------------|
| 847291  | speakwise_847291@internal.speakwise.app |
| 361504  | speakwise_361504@internal.speakwise.app |
| 592817  | speakwise_592817@internal.speakwise.app |
| 104638  | speakwise_104638@internal.speakwise.app |
| 729345  | speakwise_729345@internal.speakwise.app |

Guarde estes códigos e distribua um por utilizador. Cada código dá acesso a uma conta independente (projetos e dados separados).

### 4. Vercel

Em **Project → Settings → Environment Variables**, adicione:

- `ACCESS_CODE_PASSWORD` = a mesma palavra-passe que usou no passo 2.

Faça redeploy após guardar.

## Utilização

1. O utilizador abre a app e vai à página de entrada.
2. Introduz apenas o **código de 6 dígitos**.
3. Clica em **Entrar**. A sessão é criada e é redirecionado para `/projects`.

Não é necessário email nem registo; o código é a única credencial visível para o utilizador.
