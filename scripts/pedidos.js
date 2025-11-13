import { supabase } from './supabaseClient.js';

/**
 * Cria um novo pedido de carona no banco de dados.
 * @param {object} pedidoData - Os dados do pedido.
 * @param {string} pedidoData.origemText - Local de partida.
 * @param {string} pedidoData.destinoText - Local de destino.
 * @param {string} pedidoData.dataViagem - Data e hora da viagem.
 * @param {string} pedidoData.preferenciaGenero - Preferência de gênero do motorista.
 * @returns {Promise<object>} O pedido que foi criado.
 */
export async function criarPedido({ origemText, destinoText, dataViagem, preferenciaGenero }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const payload = {
        usuario_id: user.id,
        origem_text: origemText,
        destino_text: destinoText,
        data_viagem: dataViagem,
        preferencia_genero_motorista: preferenciaGenero,
        status: 'ativo' // Define um status inicial
    };

    const { data, error } = await supabase
        .from('pedidos_carona')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Erro ao criar pedido no Supabase:', error);
        throw error;
    }

    return data;
}

/**
 * Busca todos os pedidos de carona ativos no banco de dados.
 * @returns {Promise<Array>} Uma lista de pedidos de carona.
 */
export async function buscarPedidos() {
    const { data, error } = await supabase
        .from('pedidos_carona')
        .select('*, profiles(full_name)') // Junta com a tabela de perfis para pegar o nome
        .eq('status', 'ativo')
        .order('criado_em', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Deleta um pedido de carona.
 * @param {string} id O ID do pedido a ser deletado.
 */
export async function deletarPedido(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { error } = await supabase
        .from('pedidos_carona')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id); // Garante que só pode deletar o seu

    if (error) {
        console.error('Erro ao deletar pedido:', error);
        throw error;
    }
    return true;
}