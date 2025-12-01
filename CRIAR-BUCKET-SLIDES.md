# 🚀 Como Criar o Bucket para Slide Decks

## ⚠️ Erro: "Bucket 'project-decks' not found"

Este erro significa que o bucket de storage ainda não foi criado no Supabase. 

## 🎯 Método Rápido: Script Automático

Se você tem acesso ao terminal e às credenciais do Supabase:

1. Execute o script:
   ```bash
   node create-slide-deck-bucket.js
   ```

2. O script pedirá:
   - Supabase URL (ex: https://xxxxx.supabase.co)
   - Service Role Key (encontre em Settings → API → service_role)

3. O bucket será criado automaticamente!

4. Depois, execute as políticas no SQL Editor:
   - Abra `supabase/create-slide-deck-bucket.sql`
   - Execute no Supabase SQL Editor

## 📋 Método Manual: Passo a Passo

Se preferir criar manualmente, siga os passos abaixo:

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o seu projeto

### 2. Navegue até Storage

1. No menu lateral esquerdo, clique em **"Storage"** (ícone de pasta)
2. Você verá a lista de buckets existentes

### 3. Criar Novo Bucket

1. Clique no botão **"New bucket"** ou **"Create bucket"** (geralmente no canto superior direito)
2. Uma janela/modal será aberta

### 4. Configurar o Bucket

Preencha os campos:

- **Name**: `project-decks`
  - ⚠️ **IMPORTANTE**: Use exatamente este nome, sem espaços, sem maiúsculas extras
  - Deve ser: `project-decks` (não `project_decks`, não `Project-Decks`, etc.)

- **Public bucket**: ❌ **DESMARQUE** (deixe desmarcado)
  - O bucket deve ser **privado** para segurança

- **File size limit**: `50` (ou o valor desejado em MB)
  - Este é o tamanho máximo por arquivo

- **Allowed MIME types**: (opcional)
  - Você pode deixar vazio ou adicionar:
    - `application/pdf`
    - `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### 5. Criar o Bucket

1. Clique em **"Create bucket"** ou **"Create"**
2. O bucket deve aparecer na lista de buckets

### 6. Configurar Políticas de Segurança (IMPORTANTE)

Após criar o bucket, você precisa configurar as políticas de segurança:

1. Vá para **SQL Editor** no menu lateral
2. Abra o arquivo `supabase/create-slide-deck-bucket.sql` do projeto
3. Copie todo o conteúdo SQL
4. Cole no SQL Editor
5. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

Isso criará as políticas que permitem:
- Usuários fazerem upload de arquivos para seus próprios projetos
- Usuários lerem arquivos de seus próprios projetos
- Usuários atualizarem/deletarem arquivos de seus próprios projetos

## ✅ Verificação

Para verificar se está tudo correto:

1. **Bucket criado**: 
   - Vá em Storage → você deve ver `project-decks` na lista

2. **Políticas configuradas**:
   - Vá em Storage → `project-decks` → Policies
   - Você deve ver 4 políticas:
     - "Users can upload to own project decks"
     - "Users can read own project decks"
     - "Users can update own project decks"
     - "Users can delete own project decks"

3. **Teste o upload**:
   - Volte ao aplicativo
   - Tente fazer upload de um slide deck novamente
   - Deve funcionar agora! ✅

## 🐛 Problemas Comuns

### "Bucket already exists"
- O bucket já foi criado anteriormente
- Verifique se está na lista de buckets
- Se estiver, pule para o passo 6 (configurar políticas)

### "Permission denied" após criar o bucket
- As políticas de segurança não foram configuradas
- Execute o SQL do arquivo `supabase/create-slide-deck-bucket.sql`

### Não consigo ver o botão "Create bucket"
- Verifique se você tem permissões de administrador no projeto
- Entre em contato com o administrador do projeto Supabase

## 📸 Visual Guide (se disponível)

Se você tiver acesso visual ao Supabase Dashboard:

```
Supabase Dashboard
├── Menu Lateral
│   ├── Table Editor
│   ├── SQL Editor ← Use para políticas
│   ├── Storage ← CLIQUE AQUI
│   └── ...
│
Storage Page
├── Lista de Buckets
│   └── [project-decks] ← Deve aparecer aqui após criar
│
└── Botão "New bucket" ← Clique aqui para criar
```

## 🎯 Resumo Rápido

1. ✅ Supabase Dashboard → Storage
2. ✅ "New bucket" → Nome: `project-decks` → Privado → Criar
3. ✅ SQL Editor → Executar `supabase/create-slide-deck-bucket.sql`
4. ✅ Testar upload no aplicativo

Pronto! 🎉
