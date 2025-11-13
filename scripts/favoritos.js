// scripts/favoritos.js
import { supabase } from './supabaseClient.js';

/**
 * Busca os locais favoritos do usuário logado.
 */
export async function buscarFavoritos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('locais_favoritos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome_local', { ascending: true });

    if (error) {
        console.error('Erro ao buscar favoritos:', error);
        return [];
    }
    return data;
}

/**
 * Cria um novo local favorito.
 * @param {string} nome O nome do local (Ex: "Casa")
 * @param {string} endereco O endereço completo
 */
export async function criarFavorito(nome, endereco) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { data, error } = await supabase
        .from('locais_favoritos')
        .insert([
            { usuario_id: user.id, nome_local: nome, endereco_text: endereco }
        ])
        .select()
        .single();
    
    if (error) {
        console.error('Erro ao criar favorito:', error);
        throw error;
    }
    return data;
}