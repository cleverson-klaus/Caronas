// ============================================
// UniCarona - Cliente Supabase
// ============================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Verificar se as variáveis de ambiente essenciais estão configuradas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
    console.error('   Crie um arquivo .env na raiz do projeto com as seguintes variáveis:');
    console.error('   SUPABASE_URL=https://seu-projeto.supabase.co');
    console.error('   SUPABASE_ANON_KEY=sua-chave-anon-publica');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta');
    console.error('   PORT=3000\n');
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente público (para autenticação)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Cliente administrativo (para operações do backend que precisam bypassar RLS)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

module.exports = { supabase, supabaseAdmin };
