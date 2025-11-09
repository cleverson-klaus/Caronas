# 🚀 Guia de Setup e Uso - Projeto Caronas com Supabase

Este guia contém todas as instruções para configurar, executar e testar o projeto "Caronas" integrado com o Supabase.

---

## 1. 📋 Pré-requisitos

- **Node.js**: Necessário para usar o `live-server`.
- **Conta no Supabase**: Gratuita para começar. Crie uma aqui.
- **Chave da API do OpenRouteService (ORS)**: Para o cálculo de rotas. Obtenha uma aqui.

---

## 2. 🔑 Configuração de Chaves e Variáveis

Você precisará configurar três chaves para que o projeto funcione.

### a) `scripts/supabaseClient.js`
Abra este arquivo e substitua os placeholders pelas suas credenciais do Supabase.

```javascript
// substitua por suas variáveis do Supabase
const SUPABASE_URL = '<YOUR_SUPABASE_URL>'; // Cole sua URL aqui
const SUPABASE_ANON_KEY = '<YOUR_SUPABASE_ANON_KEY>'; // Cole sua Chave Anon aqui
```

> **Onde encontrar?** No painel do seu projeto Supabase, vá em **Settings (⚙️) > API**.

### b) `scripts/rotas.js`
Abra este arquivo e, na função `traçarESalvarRota`, insira sua chave do OpenRouteService.

```javascript
// ... dentro da função traçarESalvarRota
const ORS_KEY = '<YOUR_ORS_KEY>'; // Cole sua chave do OpenRouteService aqui
```

---

## 3. 🗄️ Configuração do Banco de Dados (Supabase)

Copie e cole o script SQL abaixo no **SQL Editor** do seu projeto Supabase para criar todas as tabelas necessárias.

> No painel do Supabase, vá para **SQL Editor > New query**.

```sql
-- 1. Tabela para armazenar dados públicos dos usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT UNIQUE,
  tipo TEXT DEFAULT 'passageiro', -- 'passageiro' ou 'motorista'
  telefone TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela para armazenar as rotas oferecidas pelos motoristas
CREATE TABLE rotas (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origem_text TEXT NOT NULL,
  destino_text TEXT NOT NULL,
  cidade_origem TEXT,
  cidade_destino TEXT,
  distancia_km NUMERIC,
  custo NUMERIC,
  vagas INT DEFAULT 1,
  data_viagem TIMESTAMPTZ,
  rota_geojson JSONB, -- Armazena o objeto GeoJSON completo da rota
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela para solicitações de carona
CREATE TABLE solicitacoes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rota_id BIGINT REFERENCES rotas(id) ON DELETE CASCADE,
  passageiro_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  motorista_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'aceita', 'recusada'
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela para mensagens do chat
CREATE TABLE mensagens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  rota_id BIGINT REFERENCES rotas(id) ON DELETE CASCADE,
  remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para as tabelas de chat e solicitações
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens, solicitacoes;
```

---

## 4. 🚀 Como Executar o Projeto

1.  **Instale o Live Server** (se ainda não tiver):
    ```bash
    npm install -g live-server
    ```
2.  **Inicie o servidor** a partir da pasta raiz do projeto (`Caronas/`):
    ```bash
    live-server
    ```
3.  Abra o navegador no endereço fornecido (geralmente `http://127.0.0.1:8080`).

---

## 5. 🔒 Nota sobre Segurança (RLS - Row Level Security)

Para um ambiente de produção, é crucial habilitar o RLS em todas as tabelas e criar políticas de segurança.

**Exemplo de política mínima para a tabela `mensagens`:**
> Permite que um usuário autenticado insira uma mensagem apenas se ele for o remetente.

```sql
-- Habilita RLS na tabela
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Cria a política de INSERT
CREATE POLICY "Usuários só podem inserir suas próprias mensagens"
ON mensagens FOR INSERT
WITH CHECK (auth.uid() = remetente_id);

-- Cria a política de SELECT (ex: todos na rota podem ler)
CREATE POLICY "Membros da rota podem ler as mensagens"
ON mensagens FOR SELECT
USING (
  auth.uid() IN (
    SELECT passageiro_id FROM solicitacoes WHERE rota_id = mensagens.rota_id AND status = 'aceita'
    UNION
    SELECT usuario_id FROM rotas WHERE id = mensagens.rota_id
  )
);
```

Aplique políticas similares para as outras tabelas para garantir que os usuários só possam acessar e modificar os dados que lhes pertencem.