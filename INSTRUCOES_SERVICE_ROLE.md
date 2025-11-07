# 🔑 Como Obter a Service Role Key do Supabase

## ⚠️ IMPORTANTE: Row Level Security (RLS)

O erro que você está recebendo é porque o Supabase tem **Row Level Security (RLS)** ativado na tabela `usuarios`. Para operações do backend (como criar usuários), precisamos usar a **Service Role Key** que bypassa o RLS.

---

## 📋 Passos para Obter a Service Role Key

1. **Acesse o painel do Supabase:**
   - Vá para [https://supabase.com](https://supabase.com)
   - Faça login na sua conta

2. **Selecione seu projeto:**
   - Clique no projeto "UniCarona" (ou o nome do seu projeto)

3. **Acesse as configurações da API:**
   - No menu lateral, clique em **Settings** (⚙️)
   - Depois clique em **API**

4. **Copie a Service Role Key:**
   - Role a página até encontrar a seção **Project API keys**
   - Você verá duas chaves:
     - **anon/public** - Esta você já tem (é a `SUPABASE_ANON_KEY`)
     - **service_role** - Esta é a que você precisa! ⚠️
   
   **⚠️ ATENÇÃO:** A Service Role Key tem **acesso total** ao banco de dados e **bypassa todas as políticas RLS**. 
   - **NUNCA** exponha essa chave no frontend
   - **NUNCA** commite no Git
   - Use **APENAS** no backend

5. **Adicione no arquivo `.env`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

---

## ✅ Após Adicionar a Service Role Key

1. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl + C)
   npm start
   ```

2. **Teste novamente o cadastro**

---

## 🔒 Segurança

- ✅ A Service Role Key está no `.env` (que já está no `.gitignore`)
- ✅ O código usa `supabaseAdmin` apenas para operações do backend
- ✅ O frontend continua usando a chave `anon` (segura)

---

## 🆘 Se Ainda Der Erro

Se mesmo com a Service Role Key ainda der erro, verifique:

1. **A tabela `usuarios` existe?**
   - Vá em **Table Editor** no Supabase
   - Verifique se a tabela `usuarios` está lá

2. **As colunas estão corretas?**
   - A tabela deve ter: `id`, `nome_completo`, `email_universidade`, `verificado`
   - O tipo de `id` deve ser `UUID` (não `INT`)

3. **RLS está configurado?**
   - Vá em **Authentication** → **Policies**
   - Verifique as políticas da tabela `usuarios`

