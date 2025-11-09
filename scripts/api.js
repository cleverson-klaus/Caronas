import { supabase } from './supabaseClient.js';

// Define um objeto 'api' para organizar as funções de comunicação com o backend/Supabase.
export const api = {
    /**
     * Cadastra um novo usuário enviando os dados para o backend.
     * @param {object} userData - Os dados do usuário.
     * @param {string} userData.nome - O nome completo do usuário.
     * @param {string} userData.email - O email do usuário.
     * @param {string} userData.password - A senha do usuário.
     * @returns {Promise<object>} A resposta do servidor.
     */
    cadastrarUsuario: async (userData) => {
        // O servidor backend está rodando na porta 3000, conforme o GUIA_SUPABASE.md
        const API_URL = 'http://localhost:3000';

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (!response.ok) {
                // Se a resposta não for bem-sucedida (status 4xx ou 5xx),
                // lança um erro com a mensagem vinda do backend.
                throw new Error(result.message || 'Ocorreu um erro no cadastro.');
            }

            return result;

        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            // Retorna um objeto de erro padronizado para o formulário tratar.
            return { error: error.message };
        }
    },

    /**
     * Autentica um usuário existente no Supabase.
     * @param {string} email - O email do usuário.
     * @param {string} password - A senha do usuário.
     * @returns {Promise<{data: object, error: object}>} O resultado da tentativa de login.
     */
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },
};