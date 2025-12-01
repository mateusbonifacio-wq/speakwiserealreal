# Configuração do Slide Deck

Este guia explica como configurar o suporte para upload de slide decks (PDF e PPTX) no seu projeto.

## 📋 Pré-requisitos

1. Supabase configurado e funcionando
2. Acesso ao Supabase Dashboard

## 🗄️ Passo 1: Executar Migração do Banco de Dados

Execute o arquivo SQL no Supabase SQL Editor:

```bash
supabase/add-slides-support.sql
```

Ou copie e cole o conteúdo do arquivo diretamente no Supabase SQL Editor.

Isso irá:
- Adicionar o campo `slide_deck_original_url` à tabela `projects`
- Criar a tabela `project_slides` com as colunas necessárias
- Configurar RLS (Row Level Security) policies

## 📦 Passo 2: Criar Bucket de Storage (OBRIGATÓRIO)

⚠️ **IMPORTANTE**: Este passo é obrigatório! O bucket deve ser criado antes de usar a funcionalidade de upload de slides.

1. Acesse o **Supabase Dashboard** → **Storage**
2. Clique em **"Create bucket"** ou **"New bucket"**
3. Configure:
   - **Name**: `project-decks` (exatamente este nome, sem espaços)
   - **Public bucket**: ❌ **Desmarque** (deixe privado)
   - **File size limit**: 50MB (ou o valor desejado)
   - **Allowed MIME types**: Deixe vazio ou adicione `application/pdf` e `application/vnd.openxmlformats-officedocument.presentationml.presentation`
4. Clique em **"Create bucket"**

**Verificação**: Após criar, você deve ver o bucket `project-decks` na lista de buckets.

## 🔐 Passo 3: Configurar Storage Policies

Execute o arquivo SQL no Supabase SQL Editor:

```bash
supabase/create-slide-deck-bucket.sql
```

Isso criará as políticas de segurança para que usuários possam:
- Fazer upload de arquivos para seus próprios projetos
- Ler arquivos de seus próprios projetos
- Atualizar/deletar arquivos de seus próprios projetos

## ✅ Verificação

Após executar os passos acima:

1. **Verifique a tabela `project_slides`**:
   - Deve existir no banco de dados
   - Deve ter as colunas: `id`, `project_id`, `index`, `title`, `content`, `thumbnail_url`, `created_at`

2. **Verifique o bucket `project-decks`**:
   - Deve existir no Storage
   - Deve estar configurado como privado

3. **Teste o upload**:
   - Acesse um projeto no aplicativo
   - Role até a seção "Pitch Deck (opcional)"
   - Faça upload de um arquivo PDF ou PPTX
   - Verifique se os slides são extraídos e exibidos

## 🐛 Troubleshooting

### Erro: "Bucket not found"
- Certifique-se de que o bucket `project-decks` foi criado no Supabase Storage

### Erro: "Permission denied"
- Verifique se as storage policies foram executadas corretamente
- Certifique-se de que o usuário está autenticado

### Erro: "Failed to parse PPTX"
- O arquivo PPTX pode estar corrompido ou em formato incompatível
- Tente converter para PDF e fazer upload novamente
- Verifique se o arquivo é realmente um `.pptx` válido

### Slides não aparecem após upload
- Verifique os logs do servidor para erros de extração
- Certifique-se de que a tabela `project_slides` foi criada
- Verifique se o RLS está configurado corretamente

## 📝 Notas

- **Tamanho máximo**: 50MB por arquivo (configurável no bucket)
- **Formatos suportados**: PDF (.pdf) e PowerPoint (.pptx)
- **Extração**: Cada página/slide é extraída como um registro separado na tabela `project_slides`
- **Privacidade**: Arquivos são armazenados de forma privada, acessíveis apenas pelo proprietário do projeto

## 🚀 Próximos Passos (Futuro)

- [ ] Adicionar suporte para thumbnails de slides
- [ ] Melhorar extração de texto de PPTX
- [ ] Adicionar sincronização de slides com análise de pitch
- [ ] Suporte para mais formatos (ODP, etc.)

