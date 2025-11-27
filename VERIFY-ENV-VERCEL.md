# 🔍 Verificar Variáveis de Ambiente no Vercel

## ❌ Erro: "Missing env.SUPABASE_SERVICE_ROLE_KEY"

Este erro significa que a variável não está configurada ou não está disponível no ambiente de execução.

## ✅ Solução Passo a Passo

### 1. Verificar se a Variável Existe

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto `speakwiserealreal`
3. Vá em **Settings** → **Environment Variables**
4. Procure por `SUPABASE_SERVICE_ROLE_KEY`
5. **Verifique:**
   - ✅ O nome está EXATAMENTE: `SUPABASE_SERVICE_ROLE_KEY` (maiúsculas, sem espaços)
   - ✅ O valor não está vazio
   - ✅ Os ambientes estão selecionados (Production, Preview, Development)

### 2. Se a Variável NÃO Existe

1. Clique em **Add New**
2. **Name**: `SUPABASE_SERVICE_ROLE_KEY` (copie exatamente)
3. **Value**: Cole a service_role key do Supabase
4. **Environments**: Selecione TODOS:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Clique em **Save**

### 3. Se a Variável JÁ Existe

1. Clique na variável para editar
2. Verifique se o **Value** está preenchido
3. Verifique se TODOS os ambientes estão selecionados
4. Clique em **Save**

### 4. Fazer Redeploy OBRIGATÓRIO

⚠️ **IMPORTANTE**: Após adicionar/editar variáveis, você DEVE fazer redeploy!

**Opção A - Redeploy Manual:**
1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Clique em **Redeploy**
4. Aguarde terminar

**Opção B - Novo Commit:**
1. Faça qualquer mudança pequena (ex: adicionar um espaço em um arquivo)
2. Commit e push
3. O Vercel fará deploy automático

### 5. Verificar Nome da Variável

⚠️ **COMUM**: Erros de digitação no nome da variável:

❌ **ERRADO:**
- `SUPABASE_SERVICE_ROLE_KEY ` (espaço no final)
- `supabase_service_role_key` (minúsculas)
- `SUPABASE_SERVICE_ROLE` (faltando _KEY)
- `SUPABASE_SERVICE_ROLE_KEY_` (underscore extra)

✅ **CORRETO:**
- `SUPABASE_SERVICE_ROLE_KEY` (exatamente assim)

## 🔍 Verificação Rápida

Execute este comando no terminal do Vercel (ou adicione temporariamente no código):

```javascript
// Adicione temporariamente em qualquer API route para debug
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Existe' : '❌ Não encontrada');
console.log('Todas as env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
```

## 📋 Checklist Completo

- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` existe no Vercel
- [ ] Nome está correto (sem espaços, maiúsculas)
- [ ] Valor está preenchido (não vazio)
- [ ] Todos os ambientes estão selecionados (Production, Preview, Development)
- [ ] Redeploy foi feito APÓS adicionar/editar a variável
- [ ] Aguardou o deploy terminar completamente

## 🆘 Se Ainda Não Funcionar

1. **Delete a variável** e crie novamente
2. **Verifique** se não há caracteres invisíveis (copie o nome exato: `SUPABASE_SERVICE_ROLE_KEY`)
3. **Faça redeploy** novamente
4. **Aguarde** alguns minutos (às vezes leva tempo para propagar)

