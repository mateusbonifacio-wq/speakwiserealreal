# ✅ Checklist: Variáveis de Ambiente no Vercel

## 🔍 Verificar se todas as variáveis estão configuradas

Acesse: **Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

### Variáveis Obrigatórias:

1. ✅ **NEXT_PUBLIC_SUPABASE_URL**
   - Valor: `https://xxxxx.supabase.co` (sua URL do Supabase)
   - Ambientes: Production, Preview, Development

2. ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Valor: Chave `anon public` do Supabase
   - Onde encontrar: Supabase Dashboard → Settings → API → `anon public`
   - Ambientes: Production, Preview, Development

3. ✅ **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Chave `service_role` do Supabase
   - Onde encontrar: Supabase Dashboard → Settings → API → `service_role` (clique em "Reveal")
   - Ambientes: Production, Preview, Development
   - ⚠️ **IMPORTANTE**: Esta chave é secreta, não exponha no cliente!

4. ✅ **ELEVENLABS_API_KEY**
   - Valor: `sk_482383917a63e0626768fa3c5d0fecf5b4756b896ed90763`
   - Ambientes: Production, Preview, Development

5. ✅ **GOOGLE_AI_API_KEY**
   - Valor: Sua chave do Google AI (Gemini)
   - Onde obter: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ambientes: Production, Preview, Development

## 🔧 Como Adicionar/Editar no Vercel:

1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em **Settings**
4. Clique em **Environment Variables** no menu lateral
5. Para cada variável:
   - Clique em **Add New**
   - Digite o **Name** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Digite o **Value**
   - Selecione os **Environments** (Production, Preview, Development)
   - Clique em **Save**

## 🔄 Após Adicionar/Editar:

1. **Faça um novo deploy**:
   - Vá em **Deployments**
   - Clique nos três pontos (⋯) do último deploy
   - Clique em **Redeploy**
   - OU faça um novo commit e push (deploy automático)

## 🐛 Erro "supabaseKey is required"

Este erro significa que uma das variáveis do Supabase está faltando ou está vazia.

**Solução:**
1. Verifique se `NEXT_PUBLIC_SUPABASE_URL` está configurada
2. Verifique se `NEXT_PUBLIC_SUPABASE_ANON_KEY` está configurada
3. Verifique se não há espaços extras nos valores
4. Faça um novo deploy após adicionar/editar

## ✅ Verificação Rápida:

Execute este comando no terminal do Vercel (ou adicione um log temporário):

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
```

Se alguma mostrar ❌, a variável não está configurada.

