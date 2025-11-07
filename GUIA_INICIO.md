# 🚀 Guia de Início Rápido - UniCarona Backend

## ⚠️ Erro: "localhost se recusou a se conectar" (ERR_CONNECTION_REFUSED)

Este erro significa que o servidor **não está rodando**. Siga os passos abaixo:

---

## 📋 Checklist de Verificação

### 1️⃣ **Instalar Dependências**

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

**Verifique se apareceu a pasta `node_modules`** após a instalação.

---

### 2️⃣ **Criar Arquivo `.env`**

Crie um arquivo chamado `.env` na raiz do projeto (mesma pasta do `index.js`) com o seguinte conteúdo:

```env
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=unicarona_db
PORT=3000
```

**⚠️ IMPORTANTE:**
- Substitua `sua_senha_aqui` pela senha do seu PostgreSQL
- Se seu usuário do PostgreSQL não for `postgres`, altere `DB_USER`
- Certifique-se de que o banco `unicarona_db` já foi criado (rode o `database_setup.sql`)

---

### 3️⃣ **Verificar se o PostgreSQL está rodando**

No Windows, verifique se o serviço PostgreSQL está ativo:

1. Abra o **Gerenciador de Tarefas** (Ctrl + Shift + Esc)
2. Vá na aba **Serviços**
3. Procure por `postgresql` ou `PostgreSQL`
4. Verifique se está **Em execução**

Se não estiver, inicie o serviço ou abra o **pgAdmin** ou **psql**.

---

### 4️⃣ **Iniciar o Servidor**

No terminal, execute:

```bash
npm start
```

**Você deve ver uma mensagem como:**
```
============================================
Servidor UniCarona rodando na porta 3000...
============================================
Acesse http://localhost:3000/testar-db para testar a conexão com o banco
Acesse http://localhost:3000/usuarios para listar os usuários
```

---

### 5️⃣ **Testar no Navegador**

Com o servidor rodando, acesse:
- `http://localhost:3000/testar-db`

---

## 🔧 Problemas Comuns

### ❌ Erro: "Variáveis de ambiente não configuradas"
**Solução:** Crie o arquivo `.env` conforme o passo 2.

### ❌ Erro: "A porta 3000 já está em uso"
**Solução:** 
- Feche outros programas usando a porta 3000, OU
- Altere `PORT=3001` no arquivo `.env`

### ❌ Erro: "Não foi possível conectar ao banco"
**Solução:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Certifique-se de que o banco `unicarona_db` existe

### ❌ Erro: "Cannot find module 'express'"
**Solução:** Execute `npm install` novamente.

---

## 📝 Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Verificar se Node.js está instalado
node --version

# Verificar se npm está instalado
npm --version
```

---

## ✅ Quando tudo estiver funcionando

Você verá no navegador (ao acessar `/testar-db`):
```json
{
  "message": "Conexão com o PostgreSQL bem-sucedida!",
  "hora_do_banco": "2024-01-15T10:30:00.000Z"
}
```

