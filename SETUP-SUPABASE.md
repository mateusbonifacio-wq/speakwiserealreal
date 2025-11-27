# 🚀 Setup Supabase - Guia Passo a Passo

## 📋 Checklist

- [ ] Criar tabelas no banco de dados
- [ ] Criar bucket de storage
- [ ] Adicionar políticas de storage
- [ ] Verificar variáveis de ambiente no Vercel

---

## Passo 1: Criar Tabelas no Banco de Dados

### 1.1 Acesse o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Faça login
3. Selecione seu projeto

### 1.2 Abra o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New query** (ou use o atalho)

### 1.3 Execute o SQL
1. Abra o arquivo `supabase/setup-complete.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

✅ **Resultado esperado**: Você deve ver "Success. No rows returned"

---

## Passo 2: Criar Bucket de Storage

### 2.1 Acesse Storage
1. No menu lateral, clique em **Storage**

### 2.2 Crie o Bucket
1. Clique no botão **Create bucket**
2. **Nome do bucket**: `audio-recordings` (exatamente assim)
3. ⚠️ **IMPORTANTE**: Desmarque a opção **"Public bucket"** (deixe PRIVADO)
4. Clique em **Create bucket**

✅ **Resultado esperado**: Você verá o bucket `audio-recordings` na lista

---

## Passo 3: Adicionar Políticas de Storage

### 3.1 Volte ao SQL Editor
1. Clique em **SQL Editor** novamente
2. Clique em **New query**

### 3.2 Execute o SQL de Storage
1. Abra o arquivo `supabase/storage-setup-complete.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

✅ **Resultado esperado**: Você deve ver "Success. No rows returned"

---

## Passo 4: Verificar Variáveis de Ambiente no Vercel

### 4.1 Acesse o Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Faça login
3. Selecione seu projeto

### 4.2 Vá para Settings
1. Clique em **Settings**
2. No menu lateral, clique em **Environment Variables**

### 4.3 Adicione/Verifique as Variáveis

Certifique-se de ter estas 5 variáveis:

| Variável | Onde encontrar |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (clique em "Reveal") |
| `ELEVENLABS_API_KEY` | `sk_482383917a63e0626768fa3c5d0fecf5b4756b896ed90763` |
| `GOOGLE_AI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### 4.4 Configurar Ambientes
Para cada variável, selecione:
- ✅ **Production**
- ✅ **Preview**  
- ✅ **Development**

### 4.5 Salvar
1. Clique em **Save** para cada variável
2. Faça um **novo deploy** no Vercel (ou aguarde o redeploy automático)

---

## ✅ Verificação Final

Após completar todos os passos:

1. **Recarregue a página** do seu app no Vercel
2. **Faça login** novamente
3. **Tente fazer upload** de um áudio

Se ainda houver erro, verifique:
- ✅ SQL foi executado com sucesso?
- ✅ Bucket `audio-recordings` foi criado?
- ✅ Políticas de storage foram aplicadas?
- ✅ Todas as variáveis de ambiente estão no Vercel?
- ✅ Novo deploy foi feito no Vercel?

---

## 🆘 Problemas Comuns

### Erro: "Could not find the table"
→ Execute o SQL do `setup-complete.sql` novamente

### Erro: "Bucket not found"
→ Crie o bucket `audio-recordings` manualmente no Storage

### Erro: "Permission denied"
→ Execute o SQL do `storage-setup-complete.sql` após criar o bucket

### Erro: "Unauthorized"
→ Verifique se as variáveis de ambiente estão corretas no Vercel

---

## 📞 Próximos Passos

Depois de configurar tudo:
1. Teste o upload de áudio
2. Teste a gravação de áudio
3. Verifique se a transcrição funciona
4. Teste a análise com Gemini

Boa sorte! 🚀

