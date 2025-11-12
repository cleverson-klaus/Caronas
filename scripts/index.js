import { supabase } from './supabaseClient.js';
import { traçarESalvarRota } from './rotas.js';

// ============================================
// INÍCIO DO CÓDIGO DO FRONTEND (scripts/index.js)
// ============================================

// Aguarda o DOM (a página) ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // CHAVE DA API E VARIÁVEIS GLOBAIS
    // =============================================
    
    // 🔑 COLE SUA CHAVE PÚBLICA DO MAPBOX AQUI
    const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2xldmVyc29uZ2swOCIsImEiOiJjbWhxeGpjcGkxMWx5MmpvcG91anBkcDY0In0.3ipMnEGsN-_CfZgsafBvOg'; 

    let map;
    let startMarker = null; 
    let endMarker = null; 
    let lastRouteGeoJSON = null; // Armazena o último GeoJSON da rota

    // =============================================
    // SELETORES DE PÁGINA E NAVEGAÇÃO
    // =============================================
    const allPages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const actionPanel = document.querySelector('.action-panel'); // Pega o painel de busca

    function showPage(pageId) {
        allPages.forEach(page => {
            page.style.display = 'none';
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            
            if (['page-mapa', 'page-viagens', 'page-chat', 'page-login'].includes(pageId)) {
                targetPage.style.display = 'flex';
            } else {
                targetPage.style.display = 'block';
            }

            if (pageId === 'page-mapa') {
                // Sempre que a página do mapa for exibida, garante que o painel de busca esteja visível
                if (actionPanel) {
                    actionPanel.style.display = 'block';
                }

                if (!map) { 
                    inicializarMapa();
                } else {
                    // Para Mapbox, o redimensionamento é mais robusto
                    setTimeout(() => map.resize(), 100); 
                }
            }
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const targetPageId = button.getAttribute('data-target');
            showPage(targetPageId);
        });
    });

    showPage('page-login'); 

    // =============================================
    // LÓGICA DO MAPA (MAPBOX GL JS)
    // =============================================

    function inicializarMapa() {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11', // Tema escuro
            center: [-53.52, -26.68], // [lon, lat]
            zoom: 12,
            pitch: 50 // [MODIFICADO] Esta linha ativa o 3D
        });

        map.on('load', () => {
            // Adiciona a fonte da rota vazia ao carregar o mapa
            map.addSource('route', {
                type: 'geojson',
                data: null
            });
            // Adiciona a camada que vai desenhar a linha da rota
            map.addLayer({
                id: 'routeLayer',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ff8c00', // Cor laranja GoUni
                    'line-width': 6
                }
            });
        });
    }

    // Função para "traduzir" texto em coordenadas [lon, lat] usando Mapbox
    async function getCoords(texto) {
        if (!texto) return null;
        
        const textoBusca = texto.includes(',') ? texto : `${texto}, Santa Catarina`;
        const bboxSC = [-54.0, -29.5, -48.0, -25.8].join(','); // Bounding box de SC

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(textoBusca)}.json` +
                    `?access_token=${MAPBOX_ACCESS_TOKEN}` +
                    `&limit=1` +
                    `&country=BR` +
                    `&bbox=${bboxSC}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro no Geocoding: Status ${response.status}`);
            const data = await response.json();
            
            if (data?.features?.length > 0) {
                return data.features[0].center; // [lon, lat]
            } else {
                alert('Endereço não encontrado em Santa Catarina: "' + texto + '".');
                return null; 
            }
        } catch (err) {
            console.error('Erro no Geocoding (Mapbox):', err);
            alert('Erro ao buscar coordenadas: ' + err.message);
            return null;
        }
    }

    // Função para buscar a rota na API do Mapbox
    async function desenharRota(coordsPartida, coordsDestino) {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
                        `${coordsPartida[0]},${coordsPartida[1]};${coordsDestino[0]},${coordsDestino[1]}` +
                        `?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Falha ao buscar rota: Status ${response.status}`);

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                console.error("Erro na resposta do Mapbox Directions:", data);
                alert("Não foi possível traçar a rota. Verifique os endereços digitados.");
                return;
            }

            const routeGeometry = data.routes[0].geometry;
            const routeSummary = data.routes[0];

            // Cria um GeoJSON completo para salvar no banco
            lastRouteGeoJSON = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {
                        summary: {
                            distance: routeSummary.distance, // em metros
                            duration: routeSummary.duration // em segundos
                        }
                    },
                    geometry: routeGeometry
                }]
            };

            plotarLinhaNoMapa(routeGeometry, coordsPartida, coordsDestino);

        } catch (error) {
            console.error("Erro na API de Rotas (Mapbox):", error);
            alert("Erro ao se comunicar com o serviço de rotas.");
        }
    }

    function plotarLinhaNoMapa(routeGeometry, startCoords, endCoords) {
        // Limpa marcadores antigos
        if (startMarker) startMarker.remove();
        if (endMarker) endMarker.remove();

        // Atualiza a fonte de dados da rota no mapa
        map.getSource('route').setData(routeGeometry);

        // Cria novos marcadores
        startMarker = new mapboxgl.Marker({ color: '#198754' }) // Verde
            .setLngLat(startCoords)
            .addTo(map);

        endMarker = new mapboxgl.Marker({ color: '#DC3545' }) // Vermelho
            .setLngLat(endCoords)
            .addTo(map);

        // Ajusta o zoom para mostrar a rota inteira
        const bounds = new mapboxgl.LngLatBounds(startCoords, endCoords);
        map.fitBounds(bounds, { padding: 60, duration: 1000 });

        // =================================================================
        // ✅ OBJETIVO CUMPRIDO: Oculta o painel de busca após a rota ser desenhada.
        // =================================================================
        if (actionPanel) {
            actionPanel.style.display = 'none';
        }
    }

    // =============================================
    // LISTENERS DE FORMULÁRIOS
    // =============================================

    const formProcurar = document.getElementById('formProcurarCarona');
    if (formProcurar) {
        formProcurar.addEventListener('submit', async function(e) {
            e.preventDefault();
            const partidaTxt = document.getElementById('inputPartida').value;
            const destinoTxt = document.getElementById('inputDestino').value;
            
            const coordsPartida = await getCoords(partidaTxt);
            const coordsDestino = await getCoords(destinoTxt);

            if (coordsPartida && coordsDestino) {
                await desenharRota(coordsPartida, coordsDestino);
            }
        });
    }

    const formOferecer = document.getElementById('formOferecerCarona');
    if (formOferecer) {
        formOferecer.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const partidaTxt = document.getElementById('inputPartidaMotorista').value;
            const destinoTxt = document.getElementById('inputDestinoMotorista').value;
            const valor = document.getElementById('inputCusto').value;
            
            const coordsPartida = await getCoords(partidaTxt);
            const coordsDestino = await getCoords(destinoTxt);

            if (!coordsPartida || !coordsDestino) {
                alert("Não foi possível encontrar as coordenadas para a rota. Verifique os endereços.");
                return;
            }
            
            await desenharRota(coordsPartida, coordsDestino);

            // Simula um usuário logado. Em um app real, você pegaria o ID do usuário da sessão.
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Erro: Você não está logado! Faça o login para publicar.');
                return;
            }

            try {
                console.log("Salvando rota no Supabase...");

                // Calcula a distância em km a partir do GeoJSON
                const distanciaMetros = lastRouteGeoJSON?.features[0]?.properties?.summary?.distance ?? null;
                const distanciaKm = distanciaMetros ? (distanciaMetros / 1000).toFixed(2) : null;

                const rotaSalva = await traçarESalvarRota({
                    usuarioId: user.id,
                    origemText: partidaTxt,
                    destinoText: destinoTxt,
                    distanciaKm: distanciaKm,
                    custo: parseFloat(valor),
                    vagas: 3, // Exemplo
                    dataViagem: new Date().toISOString(), // Exemplo
                    rotaGeoJSON: lastRouteGeoJSON, // O GeoJSON completo retornado pela ORS
                });

                alert('Sucesso! Sua rota foi publicada no Supabase com o ID: ' + rotaSalva.id);
                formOferecer.reset();

            } catch (error) {
                console.error('Erro ao salvar rota no Supabase:', error);
                alert('Erro ao publicar rota: ' + error.message);
            }
        });
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorMessageDiv = document.getElementById('login-error-message');

            try {
                // Futuramente, aqui entrará a lógica de login com Supabase
                alert(`Tentativa de login com:\nEmail: ${email}\nSenha: [oculta]`);
                errorMessageDiv.style.display = 'none';
            } catch (error) {
                errorMessageDiv.textContent = error.message;
                errorMessageDiv.style.display = 'block';
            }
        });
    }

    // =============================================
    // LÓGICA DO MODAL DE PÂNICO
    // =============================================
    
    // Seleciona os elementos
    const sosButton = document.querySelector('.sos-button-sidebar');
    const panicModal = document.getElementById('panicModal');
    const cancelPanic = document.getElementById('cancelPanic');
    const confirmPanic = document.getElementById('confirmPanic');

    if (sosButton && panicModal && cancelPanic && confirmPanic) {
        // Clicar no SOS (Sidebar) -> MOSTRA o modal
        sosButton.addEventListener('click', function() {
            panicModal.style.display = 'flex';
        });
        
        // Clicar em "Cancelar" -> ESCONDE o modal
        cancelPanic.addEventListener('click', function() {
            panicModal.style.display = 'none';
        });
        
        // Clicar em "Sim, preciso de ajuda"
        confirmPanic.addEventListener('click', function() {
            alert('Ajuda a caminho! (Simulação)');
            // (Aqui, no futuro, chamaremos a API do backend)
            panicModal.style.display = 'none';
        });
    }
})