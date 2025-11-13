import { supabase } from './supabaseClient.js';

/**
 * Cria uma rota no banco de dados do Supabase.
 * @param {object} rotaData - Os dados da rota a serem salvos.
 * @returns {Promise<object>} Os dados da rota salva.
 */
export async function criarRota({
  usuarioId,
  origemText,
  destinoText,
  distanciaKm = null,
  custo = null,
  vagas = 1,
  dataViagem = null,
  rotaGeoJSON = null,
  cidadeOrigem = null,
  cidadeDestino = null
}) {
  const payload = {
    usuario_id: usuarioId,
    origem_text: origemText,
    destino_text: destinoText,
    distancia_km: distanciaKm,
    custo,
    vagas,
    data_viagem: dataViagem,
    rota_geojson: rotaGeoJSON,
    cidade_origem: cidadeOrigem,
    cidade_destino: cidadeDestino
  };

  const { data, error } = await supabase.from('rotas').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

/**
 * Busca rotas no banco de dados com base em filtros.
 * @param {object} filters - Filtros de cidade de origem e/ou destino.
 * @returns {Promise<Array>} Uma lista de rotas encontradas.
 */
export async function buscarRotas({ origemCidade = null, destinoCidade = null, limit = 50 }) {
  let query = supabase
    .from('rotas')
    .select(`
        *,
        profiles:usuario_id (
            full_name,
            gender
        )
    `);

  if (origemCidade) query = query.ilike('cidade_origem', `%${origemCidade}%`);
  if (destinoCidade) query = query.ilike('cidade_destino', `%${destinoCidade}%`);
  
  const { data, error } = await query.order('criado_em', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

/**
 * Obtém o GeoJSON de uma rota do OpenRouteService e a salva no Supabase.
 * @param {object} params - Parâmetros para traçar e salvar a rota.
 * @returns {Promise<object>} A rota que foi salva no banco de dados.
 */
export async function traçarESalvarRota({
    usuarioId,
    origemText,
    destinoText,
    distanciaKm,
    custo,
    vagas,
    dataViagem,
    rotaGeoJSON
}) {
    try {
        const rotaSalva = await criarRota({
            usuarioId,
            origemText,
            destinoText,
            distanciaKm,
            custo,
            vagas,
            dataViagem,
            rotaGeoJSON, // Salva o GeoJSON completo
        });

        return rotaSalva;
    } catch (err) {
        console.error('Erro ao traçar e salvar rota:', err);
        throw err;
    }
}

/**
 * Deleta uma rota (oferta) de carona.
 * @param {string} id O ID da rota a ser deletada.
 */
export async function deletarRota(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { error } = await supabase
        .from('rotas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id); // Garante que só pode deletar a sua

    if (error) {
        console.error('Erro ao deletar rota:', error);
        throw error;
    }
    return true;
}