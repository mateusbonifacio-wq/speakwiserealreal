# 🌐 Como Configurar Domínio Personalizado no Vercel

## Problema
Quando você compartilha o link com outras pessoas, elas não conseguem acessar e precisam entrar pelo Vercel.

## Solução: Configurar Domínio Personalizado

### Opção 1: Usar Domínio do Vercel (Gratuito)

O Vercel já fornece um domínio gratuito no formato:
```
seu-projeto.vercel.app
```

**Para encontrar sua URL:**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Você verá o domínio padrão: `seu-projeto.vercel.app`

**Compartilhe esta URL com outras pessoas!**

---

### Opção 2: Adicionar Domínio Personalizado (Recomendado)

Se você tem um domínio próprio (ex: `speakwise.com`):

#### Passo 1: Adicionar Domínio no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite seu domínio (ex: `speakwise.com` ou `www.speakwise.com`)
6. Clique em **Add**

#### Passo 2: Configurar DNS

O Vercel mostrará instruções específicas. Geralmente você precisa:

**Para domínio raiz (ex: `speakwise.com`):**
- Tipo: `A`
- Nome: `@` ou deixe em branco
- Valor: `76.76.21.21` (IP do Vercel)

**Para subdomínio (ex: `www.speakwise.com`):**
- Tipo: `CNAME`
- Nome: `www`
- Valor: `cname.vercel-dns.com`

#### Passo 3: Aguardar Propagação DNS

- Pode levar de alguns minutos a 48 horas
- O Vercel mostrará o status: "Valid Configuration" quando estiver pronto

---

### Opção 3: Verificar Configurações de Acesso

Se o domínio já está configurado mas pessoas não conseguem acessar:

#### 1. Verificar se o Projeto está Público

1. Vercel Dashboard → Seu Projeto → **Settings** → **General**
2. Verifique se não há restrições de acesso
3. Certifique-se de que o projeto não está em modo "Private"

#### 2. Verificar Variáveis de Ambiente

Certifique-se de que todas as variáveis estão configuradas para **Production**:

1. Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
2. Verifique que cada variável tem ✅ **Production** selecionado

#### 3. Verificar Deploy

1. Vercel Dashboard → Seu Projeto → **Deployments**
2. Certifique-se de que o último deploy está com status ✅ **Ready**
3. Se houver erros, clique no deploy para ver detalhes

---

## 🔍 Como Testar

### Teste 1: Acesso Anônimo
1. Abra uma janela anônima/privada do navegador
2. Acesse sua URL do Vercel
3. Deve carregar a página de login

### Teste 2: Compartilhar Link
1. Envie o link para outra pessoa
2. Peça para ela acessar em um navegador diferente
3. Deve funcionar normalmente

### Teste 3: Verificar Console
1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Não deve haver erros relacionados a CORS ou acesso

---

## 🚨 Problemas Comuns

### "Site não encontrado" ou "404"
- **Causa**: Deploy não foi concluído ou falhou
- **Solução**: 
  1. Vá em **Deployments** no Vercel
  2. Verifique se há um deploy com status ✅
  3. Se não houver, faça um novo deploy

### "Acesso negado" ou "Forbidden"
- **Causa**: Projeto pode estar privado ou com restrições
- **Solução**: 
  1. Settings → General
  2. Verifique configurações de acesso
  3. Certifique-se de que está público

### "Erro ao carregar" ou "Application Error"
- **Causa**: Variáveis de ambiente faltando ou incorretas
- **Solução**: 
  1. Verifique todas as variáveis em Settings → Environment Variables
  2. Certifique-se de que estão configuradas para Production
  3. Faça um novo deploy após adicionar/editar variáveis

### Domínio não funciona
- **Causa**: DNS não configurado corretamente
- **Solução**: 
  1. Verifique as configurações DNS no seu provedor de domínio
  2. Use ferramentas como https://dnschecker.org para verificar propagação
  3. Aguarde até 48 horas para propagação completa

---

## 📝 Checklist Final

Antes de compartilhar com outras pessoas, verifique:

- [ ] Projeto está deployado com sucesso no Vercel
- [ ] URL do Vercel está funcionando (ex: `seu-projeto.vercel.app`)
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Testou em janela anônima
- [ ] Não há erros no console do navegador
- [ ] Página de login carrega corretamente

---

## 🎯 URL para Compartilhar

Depois de configurar, sua URL será:

**Opção 1 (Vercel):**
```
https://seu-projeto.vercel.app
```

**Opção 2 (Domínio próprio):**
```
https://seu-dominio.com
```

**Compartilhe esta URL com seus usuários!**

---

## 💡 Dica

Se você quiser uma URL mais curta e fácil de lembrar, pode usar:
- **Vercel**: O domínio `.vercel.app` já é curto
- **Domínio próprio**: Configure um domínio personalizado
- **Encurtador de URL**: Use serviços como bit.ly ou tinyurl (não recomendado para produção)

