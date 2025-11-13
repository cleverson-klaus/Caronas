// index.js (O Servidor Backend - Salve na raiz 'Caronas/')

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Middleware
app.use(cors()); // Permite requisições do seu frontend
app.use(express.json()); // Permite ao Express entender JSON

// === Configuração do Cliente ADMIN do Supabase ===
// Puxa as chaves do seu arquivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // A CHAVE SECRETA!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erro Crítico: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.");
    console.error("Verifique seu arquivo .env");
    process.exit(1); 
}

// Cria o cliente ADMIN (que pode criar usuários)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// === Rotas da API ===

app.get('/', (req, res) => {
    res.send('Servidor Backend do UniCarona está rodando!');
});

/**
 * Rota POST /cadastro
 * Recebe os dados do formulário de 'cadastro.html'
 */
app.post('/cadastro', async (req, res) => {
    
    // 1. Extrai todos os dados do formulário
    const { 
        nome, email, password, genero, 
        is_driver, vehicle_model, vehicle_color 
    } = req.body;

    // 2. Validação básica
    if (!nome || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        // 3. Tenta criar o novo usuário no Supabase Auth
        const { data, error } = await supabaseAdmin.auth.signUp({
            email: email,
            password: password,
            options: {
                // 4. Salva os dados extras (nome, gênero, carro) nos metadados
                // O "gatilho" (trigger) que criamos no Supabase vai ler isso!
                data: {
                    full_name: nome,
                    gender: genero || 'nao-informado',
                    is_driver: is_driver || false,
                    vehicle_model: is_driver ? vehicle_model : null,
                    vehicle_color: is_driver ? vehicle_color : null
                }
            }
        });

        // 4. Trata erros (ex: email já existe)
        if (error) {
            console.error('Erro ao criar usuário no Supabase:', error.message);
            return res.status(400).json({ message: error.message });
        }

        // 5. Sucesso!
        console.log('Usuário criado com sucesso:', data.user.email);
        return res.status(201).json({ message: 'Usuário criado com sucesso!', data: data });

    } catch (err) {
        console.error('Erro inesperado no servidor:', err);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// === Inicia o Servidor ===
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Aguardando requisições em http://localhost:${PORT}`);
});