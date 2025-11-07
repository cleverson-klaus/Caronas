# 🚀 Guia de Configuração - UniCarona com Supabase

## 📋 1. Comandos de Setup

Execute no terminal para instalar as dependências:

```bash
npm install express dotenv @supabase/supabase-js
```

Ou se preferir instalar uma por uma:

```bash
npm install express
npm install dotenv
npm install @supabase/supabase-js
```

---

## 🔑 2. Configuração do Arquivo `.env`

Crie ou atualize o arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Configurações do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Porta do Servidor
PORT=3000
```

### Como obter as credenciais do Supabase:

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Crie um novo projeto (ou use um existente)
4. Vá em **Settings** → **API**
5. Copie:
   - **Project URL** → use como `SUPABASE_URL`
   - **anon/public key** → use como `SUPABASE_ANON_KEY`

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` no Git! Ele já está no `.gitignore`.

---

## 🗄️ 3. Configuração do Banco de Dados no Supabase

### Criar a tabela `usuarios` no Supabase:

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Execute o seguinte script:

```sql
-- Criar tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    email_universidade VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255), -- Não é mais necessário, mas mantido para compatibilidade
    foto_rosto_url VARCHAR(255),
    foto_carteirinha_url VARCHAR(255),
    verificado BOOLEAN DEFAULT false,
    data_cadastro TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler seus próprios dados
CREATE POLICY "Usuários podem ler próprios dados"
    ON usuarios FOR SELECT
    USING (auth.uid() = id);

-- Política: Usuários podem atualizar seus próprios dados
CREATE POLICY "Usuários podem atualizar próprios dados"
    ON usuarios FOR UPDATE
    USING (auth.uid() = id);

-- Política: Permitir inserção (será usado pelo backend)
CREATE POLICY "Permitir inserção via backend"
    ON usuarios FOR INSERT
    WITH CHECK (true);
```

---

## 📁 4. Estrutura de Arquivos Criada

```
Caronas/
├── index.js              # Servidor principal com endpoints
├── supabaseClient.js     # Cliente Supabase configurado
├── package.json           # Dependências atualizadas
├── .env                   # Variáveis de ambiente (não commitado)
└── GUIA_SUPABASE.md      # Este guia
```

---

## 🎯 5. Endpoints Disponíveis

### POST `/cadastro`
Cria um novo usuário no sistema.

**Body (JSON):**
```json
{
  "nome": "João Silva",
  "email": "joao@universidade.edu.br",
  "password": "senha123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "user": {
    "id": "uuid-do-usuario",
    "email": "joao@universidade.edu.br",
    "nome_completo": "João Silva",
    "verificado": false
  },
  "session": { ... }
}
```

---

### POST `/login`
Autentica um usuário existente.

**Body (JSON):**
```json
{
  "email": "joao@universidade.edu.br",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Login realizado com sucesso!",
  "user": {
    "id": "uuid-do-usuario",
    "nome_completo": "João Silva",
    "email_universidade": "joao@universidade.edu.br",
    "verificado": false
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

---

### GET `/testar`
Testa se o servidor está rodando.

**Resposta:**
```json
{
  "message": "Servidor UniCarona rodando com Supabase!",
  "status": "ok"
}
```

---

## 🚀 6. Como Iniciar o Servidor

1. **Instale as dependências:**
   ```bash
   npm install   ```

2. **Configure o arquivo `.env`** com suas credenciais do Supabase

3. **Inicie o servidor:**
   ```bash
   npm start
   ```

4. **Teste o servidor:**
   - Acesse: `http://localhost:3000/testar`
   - Ou use Postman/Insomnia para testar os endpoints

---

## ✅ 7. Verificação de Funcionamento

### Teste de Cadastro:
```bash
curl -X POST http://localhost:3000/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Usuario",
    "email": "teste@teste.com",
    "password": "senha123"
  }'
```

### Teste de Login:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "password": "senha123"
  }'
```

---

## 🆘 Problemas Comuns

### Erro: "Variáveis de ambiente do Supabase não configuradas"
**Solução:** Verifique se o arquivo `.env` existe e contém `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### Erro: "relation 'usuarios' does not exist"
**Solução:** Execute o script SQL no Supabase para criar a tabela `usuarios`

### Erro: "Invalid API key"
**Solução:** Verifique se copiou a chave correta (anon/public key, não a service_role key)

### Erro: "Email already registered"
**Solução:** O email já está cadastrado. Use outro email ou faça login

---

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

