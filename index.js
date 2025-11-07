// ============================================
// UniCarona - Servidor Backend
// Versão Supabase
// ============================================

// Carregar dependências
const path = require('path');
const express = require('express');
const { supabase, supabaseAdmin } = require('./supabaseClient');
require('dotenv').config();

// Criar instância do Express
const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para CORS (permitir requisições do frontend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware para servir arquivos estáticos (HTML, CSS, JS) da pasta atual.
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));


// Porta do servidor
const PORT = process.env.PORT || 3000;

// ============================================
// ROTAS
// ============================================

// Rota principal - serve a página de login por padrão
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

// Rota para favicon (evita erro 404)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Rota de teste
app.get('/testar', (req, res) => {
    res.json({
        message: 'Servidor UniCarona rodando com Supabase!',
        status: 'ok'
    });
});

// ============================================
// ENDPOINT 1: Cadastro de Usuário
// ============================================
app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        // Validação dos campos obrigatórios
        if (!nome || !email || !password) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                details: 'Nome, email e senha são obrigatórios'
            });
        }

        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido',
                details: 'Por favor, forneça um email válido'
            });
        }

        // Validação de senha (mínimo 6 caracteres)
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Senha muito curta',
                details: 'A senha deve ter pelo menos 6 caracteres'
            });
        }

        console.log('Tentando criar usuário:', email);

        // 1. Criar usuário no sistema de autenticação do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nome_completo: nome
                }
            }
        });

        if (authError) {
            console.error('Erro ao criar usuário no auth:', authError);
            return res.status(400).json({
                error: 'Erro ao criar usuário',
                details: authError.message
            });
        }

        if (!authData.user) {
            return res.status(400).json({
                error: 'Falha ao criar usuário',
                details: 'Não foi possível criar o usuário'
            });
        }

        console.log('Usuário criado no auth com ID:', authData.user.id);

        // 2. Inserir dados adicionais na tabela usuarios
        // Usar supabaseAdmin para bypassar RLS (Row Level Security)
        const { data: userData, error: dbError } = await supabaseAdmin
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id, // Usar o mesmo ID do auth
                    nome_completo: nome,
                    email_universidade: email,
                    verificado: false
                    // data_cadastro será preenchido automaticamente pelo DEFAULT do banco
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Erro ao inserir na tabela usuarios:', dbError);
            
            // Se falhar ao inserir na tabela, tentar remover o usuário do auth
            // (opcional, dependendo da sua estratégia)
            
            return res.status(500).json({
                error: 'Erro ao salvar dados do usuário',
                details: dbError.message,
                note: 'Usuário criado no sistema de autenticação, mas houve erro ao salvar dados adicionais'
            });
        }

        console.log('Usuário criado com sucesso:', userData);

        // Resposta de sucesso
        res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                nome_completo: nome,
                verificado: false
            },
            session: authData.session
        });

    } catch (error) {
        console.error('Erro inesperado no cadastro:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// ============================================
// ENDPOINT 2: Login de Usuário
// ============================================
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validação dos campos obrigatórios
        if (!email || !password) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                details: 'Email e senha são obrigatórios'
            });
        }

        console.log('Tentando fazer login:', email);

        // Fazer login usando Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error('Erro no login:', authError);
            return res.status(401).json({
                error: 'Credenciais inválidas',
                details: authError.message
            });
        }

        if (!authData.user || !authData.session) {
            return res.status(401).json({
                error: 'Falha no login',
                details: 'Não foi possível autenticar o usuário'
            });
        }

        console.log('Login bem-sucedido para:', authData.user.email);

        // Buscar dados adicionais do usuário na tabela usuarios
        // Usar supabaseAdmin para bypassar RLS
        const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('id, nome_completo, email_universidade, verificado, foto_rosto_url')
            .eq('id', authData.user.id)
            .single();

        // 

        // Resposta de sucesso com dados da sessão
        res.json({
            message: 'Login realizado com sucesso!',
            user: userData,
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at,
                expires_in: authData.session.expires_in
            }

    } catch (error) {
        console.error('Erro inesperado no login:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n============================================`);
    console.log(`Servidor UniCarona rodando na porta ${PORT}...`);
    console.log(`Banco de dados: Supabase`);
    console.log(`============================================`);
    console.log(`Endpoints disponíveis:`);
    console.log(`  GET  http://localhost:${PORT}/ (Página de Login)`);
    console.log(`  POST http://localhost:${PORT}/cadastro`);
    console.log(`  POST http://localhost:${PORT}/login`);
    console.log(`  GET  http://localhost:${PORT}/testar\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERRO: A porta ${PORT} já está em uso!`);
        console.error(`   Tente usar outra porta ou feche o processo que está usando a porta ${PORT}\n`);
    } else {
        console.error('\n❌ ERRO ao iniciar o servidor:', err);
    }
    process.exit(1);
});
