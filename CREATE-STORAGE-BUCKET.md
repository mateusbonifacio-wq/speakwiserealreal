# 📦 Criar Bucket de Storage no Supabase

## ❌ Erro: "Bucket not found"

Este erro significa que o bucket `audio-recordings` não foi criado no Supabase Storage.

## ✅ Solução: Criar o Bucket

### Passo 1: Acessar Storage

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### Passo 2: Criar o Bucket

1. Clique no botão **"Create bucket"** (ou **"New bucket"**)
2. **Nome do bucket**: `audio-recordings` (exatamente assim, sem espaços)
3. ⚠️ **IMPORTANTE**: **DESMARQUE** a opção **"Public bucket"** (deixe PRIVADO)
4. Clique em **"Create bucket"**

### Passo 3: Verificar

Você deve ver o bucket `audio-recordings` na lista de buckets.

## ✅ Pronto!

Após criar o bucket:
1. Recarregue a página do app
2. Tente fazer upload de áudio novamente
3. O erro deve desaparecer

## 📋 Checklist

- [ ] Bucket `audio-recordings` criado
- [ ] Bucket está PRIVADO (não público)
- [ ] Políticas de storage já foram aplicadas (via SQL anterior)
- [ ] Testado upload de áudio

## 🔍 Verificar Políticas de Storage

Se ainda houver erro de permissão após criar o bucket, verifique se as políticas foram aplicadas:

1. Vá em **SQL Editor** no Supabase
2. Execute o SQL do arquivo: `supabase/storage-setup-complete.sql`

Ou execute novamente:
```sql
CREATE POLICY "Users can upload own audio"
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
USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
```

