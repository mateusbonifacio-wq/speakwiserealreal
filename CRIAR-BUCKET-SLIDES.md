# ⚠️ Erro: Bucket não encontrado

## Problema

Você está recebendo o erro:
```
Bucket not found
```

Isso significa que o bucket `project-decks` ainda não foi criado no Supabase Storage.

## Solução Rápida

### Passo 1: Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **"Storage"**

### Passo 2: Criar o Bucket

1. Clique no botão **"Create bucket"** (ou "New bucket")
2. Preencha:
   - **Name**: `project-decks` (exatamente este nome, sem espaços)
   - **Public bucket**: ❌ **DESMARQUE** (deixe privado)
   - **File size limit**: 50 (ou o valor desejado em MB)
   - **Allowed MIME types**: Deixe vazio (aceita todos) ou adicione:
     - `application/pdf`
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
3. Clique em **"Create bucket"**

### Passo 3: Configurar Políticas de Segurança

Após criar o bucket, execute este SQL no **Supabase SQL Editor**:

```sql
-- Storage policies for project-decks bucket
-- Users can upload files to their own project folders
CREATE POLICY "Users can upload to own project decks"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-decks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read files from their own project folders
CREATE POLICY "Users can read own project decks"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-decks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update files in their own project folders
CREATE POLICY "Users can update own project decks"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-decks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete files from their own project folders
CREATE POLICY "Users can delete own project decks"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-decks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Passo 4: Verificar

1. Volte para **Storage** no dashboard
2. Você deve ver o bucket `project-decks` listado
3. Tente fazer upload de um slide deck novamente

## Verificação Rápida

Para verificar se o bucket foi criado corretamente:

1. **Storage** → Você deve ver `project-decks` na lista
2. O bucket deve estar marcado como **Private** (não público)
3. As políticas SQL devem estar aplicadas (verifique em **Storage** → **Policies**)

## Próximos Passos

Após criar o bucket e executar as políticas SQL:

1. Recarregue a página do aplicativo
2. Tente fazer upload de um slide deck novamente
3. O erro deve desaparecer

## Nota Importante

O nome do bucket **DEVE** ser exatamente `project-decks` (minúsculas, com hífen). O código está configurado para usar este nome específico.

