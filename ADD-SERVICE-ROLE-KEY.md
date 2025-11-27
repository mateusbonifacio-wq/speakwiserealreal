# 🔑 Adicionar SUPABASE_SERVICE_ROLE_KEY no .env.local

## Opção 1: Editar Manualmente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Encontre a linha: `SUPABASE_SERVICE_ROLE_KEY=COLE_SUA_SERVICE_ROLE_KEY_AQUI`
3. Substitua `COLE_SUA_SERVICE_ROLE_KEY_AQUI` pela sua service_role key do Supabase
4. Salve o arquivo

## Opção 2: Usar o Script

Execute:
```bash
node update-env-local.js
```

Cole a chave quando solicitado.

## Opção 3: PowerShell (Windows)

Execute no PowerShell:
```powershell
$key = Read-Host "Cole a SUPABASE_SERVICE_ROLE_KEY"
(Get-Content .env.local) -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$key" | Set-Content .env.local
```

## ✅ Após Adicionar

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. O erro "Missing env.SUPABASE_SERVICE_ROLE_KEY" deve desaparecer

## 📝 Exemplo de .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← Sua chave aqui
ELEVENLABS_API_KEY=sk_482383917a63e0626768fa3c5d0fecf5b4756b896ed90763
GOOGLE_AI_API_KEY=sua_chave_google_ai
```

