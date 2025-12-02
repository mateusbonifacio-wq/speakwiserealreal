# ✅ Verificação da Configuração de Slide Decks

## Checklist de Configuração

### 1. ✅ Banco de Dados
- [ ] Tabela `project_slides` criada
- [ ] Coluna `slide_deck_original_url` adicionada à tabela `projects`
- [ ] Políticas RLS configuradas para `project_slides`

**Como verificar:**
1. Supabase Dashboard → Table Editor
2. Verifique se a tabela `project_slides` existe
3. Verifique se a tabela `projects` tem a coluna `slide_deck_original_url`

### 2. ✅ Storage Bucket
- [ ] Bucket `project-decks` criado
- [ ] Bucket configurado como privado
- [ ] Políticas de storage configuradas

**Como verificar:**
1. Supabase Dashboard → Storage
2. Verifique se o bucket `project-decks` existe
3. Clique no bucket → Policies
4. Deve ter 4 políticas:
   - "Users can upload to own project decks"
   - "Users can read own project decks"
   - "Users can update own project decks"
   - "Users can delete own project decks"

### 3. ✅ Teste de Upload
- [ ] Acesse um projeto no app
- [ ] Role até "Pitch Deck (opcional)"
- [ ] Faça upload de um arquivo PDF ou PPTX
- [ ] Verifique se os slides são extraídos e exibidos

## 🐛 Se algo não funcionar

### Erro: "Bucket not found"
- Execute: `node create-slide-deck-bucket.js`
- Ou crie manualmente no Supabase Dashboard → Storage

### Erro: "Column not found"
- Execute: `node run-slides-migration-simple.js`
- Copie o SQL e execute no Supabase SQL Editor

### Erro: "Permission denied"
- Verifique se as políticas de storage foram executadas
- Execute: `supabase/create-slide-deck-bucket.sql` no SQL Editor

## ✅ Tudo funcionando?

Se todos os itens acima estão marcados, você está pronto para usar a funcionalidade de slide decks! 🎉

