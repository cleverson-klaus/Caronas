// ============================================
// UniCarona - Módulo de API
// Centraliza todas as chamadas ao backend
// ============================================

const API_URL = 'http://localhost:3000';

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // Se a resposta não for OK, o próprio JSON de erro do backend será retornado
            return data;
        }

        return data;
    } catch (error) {
        console.error(`Erro na chamada da API para ${endpoint}:`, error);
        return {
            error: 'Falha de comunicação com o servidor.',
            details: 'Não foi possível conectar ao servidor. Verifique se ele está rodando e tente novamente.'
        };
    }
}

const api = {
    cadastrarUsuario: (userData) => {
        return fetchAPI('/cadastro', { method: 'POST', body: JSON.stringify(userData) });
    },
    loginUsuario: (credentials) => {
        return fetchAPI('/login', { method: 'POST', body: JSON.stringify(credentials) });
    },
};

window.api = api;