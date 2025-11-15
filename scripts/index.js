/* ============================================
 * ARQUIVO scripts/index.js (VERSÃO COMPLETA E CORRIGIDA)
 * ============================================ */
import { supabase } from './supabaseClient.js';
import { api } from './api.js';
import { traçarESalvarRota, buscarRotas, deletarRota } from './rotas.js'; // [MODIFICADO]
import { criarPedido, buscarPedidos, deletarPedido } from './pedidos.js'; // [MODIFICADO]
import { buscarFavoritos, criarFavorito } from './favoritos.js'; // [NOVO]
document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // CHAVE DA API E VARIÁVEIS GLOBAIS
    // =============================================
    const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2xldmVyc29uZ2swOCIsImEiOiJjbWhxeGpjcGkxMWx5MmpvcG91anBkcDY0In0.3ipMnEGsN-_CfZgsafBvOg'; 
    let map;
    // =============================================
    // SELETORES DE PÁGINA E NAVEGAÇÃO
    // =============================================
    const allPages = document.querySelectorAll('.page');
    const desktopNavButtons = document.querySelectorAll('.sidebar-desktop .nav-btn');
    const mobileNavButtons = document.querySelectorAll('#mobile-nav .nav-btn');
    
    // [NOVO] Seletores para o menu móvel e SOS
    const mobileNav = document.getElementById('mobile-nav');
    const mobileSosBtn = document.getElementById('mobile-sos-btn');

    // [MODIFICADO] Adicionamos um parâmetro 'prefillData'
    function showPage(pageId, prefillData = null) {
        allPages.forEach(page => {
            page.style.display = 'none';
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = 'flex'; // Usamos 'flex' para todos os containers
        }
        
        // [MODIFICADO] Controla a visibilidade do menu móvel
        if (pageId === 'page-login' || pageId === 'page-cadastro') {
            // Esconde o menu e o SOS no login/cadastro
            if (mobileNav) mobileNav.style.display = 'none';
            if (mobileSosBtn) mobileSosBtn.style.display = 'none';
        } else {
            // Mostra o menu e o SOS nas outras páginas (no mobile)
            if (mobileNav) mobileNav.style.display = 'flex';
            if (mobileSosBtn) mobileSosBtn.style.display = 'flex';
        }

        // Inicializa ou redimensiona o mapa apenas se a página do mapa for exibida
        if (pageId === 'page-mapa') {
            if (!map) { 
                inicializarMapa();
            } else {
                setTimeout(() => map.resize(), 100); 
            }
        }

        // [NOVO] Scrolla o chat e foca no input
        if (pageId === 'page-chat') {
            scrollToBottom();
            const input = document.getElementById('messageInput');
            if (input) input.focus();
        }

        // [NOVO] Lógica para preencher o formulário
        if (pageId === 'page-viagens' && prefillData) {
            
            // Força a aba "Criar" e "Pedir Carona" a ficarem ativas
            document.getElementById('criar-tab')?.click();
            document.getElementById('rider-tab')?.click();
            
            // Preenche o campo de input correto
            const inputElement = document.getElementById(prefillData.targetInput);
            if (inputElement) {
                inputElement.value = prefillData.name;
            }
        }
    }
    // --- Listeners de Navegação (Desktop) ---
    desktopNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPage = button.getAttribute('data-target');
            
            // Sincroniza o 'active' state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === targetPage) {
                    btn.classList.add('active');
                }
            });
            
            showPage(targetPage);
            
            if (targetPage === 'page-viagens') {
                carregarConteudoAbaViagens(); 
            }
        });
    });
    // --- Listeners de Navegação (Mobile) ---
    mobileNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPage = button.getAttribute('data-target');
            // Sincroniza o 'active' state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === targetPage) {
                    btn.classList.add('active');
                }
            });
            showPage(targetPage);
            if (targetPage === 'page-viagens') {
                carregarConteudoAbaViagens(); 
            }
        });
    });
    // =============================================
    // LÓGICA DE LOGIN E AUTENTICAÇÃO
    // =============================================
    // --- Pega Iniciais do Nome ---
    function getInitials(fullName) {
        if (!fullName) return '?';
        const names = fullName.split(' ');
        const first = names[0][0];
        const last = names.length > 1 ? names[names.length - 1][0] : '';
        return (first + last).toUpperCase();
    }
    // --- Atualiza a UI (Desktop e Mobile) ---
    function updateUIForUser(user) {
        // Seletores Desktop
        const loginNavBtn = document.getElementById('login-nav-btn');
        const profileBtn = document.getElementById('profile-sidebar-btn');
        const profileInitials = document.getElementById('profile-initials');
        const profileName = document.getElementById('profile-name');
        // Seletores Mobile
        const mobileLoginNavBtn = document.getElementById('mobile-login-nav-btn');
        const mobileProfileBtn = document.getElementById('mobile-profile-sidebar-btn');
        const mobileProfileInitials = document.getElementById('mobile-profile-initials');
        const mobileNavLogo = document.getElementById('mobile-nav-logo'); // [NOVO]
        
        // Seletor do formulário de carona (para filtro de gênero)
        const preferenciaGeneroContainer = document.getElementById('preferencia-genero-container');
        if (user) {
            // Usuário está logado
            const userName = user.user_metadata?.full_name || 'Usuário';
            const userInitials = getInitials(userName);
            const userGender = user.user_metadata?.gender;
            // UI Desktop
            if (loginNavBtn) loginNavBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'flex';
            if (profileInitials) profileInitials.textContent = userInitials;
            if (profileName) profileName.textContent = userName.split(' ')[0];
            // UI Mobile
            if (mobileNavLogo) mobileNavLogo.style.display = 'flex'; // [NOVO] Mostra a logo
            if (mobileLoginNavBtn) mobileLoginNavBtn.style.display = 'none';
            if (mobileProfileBtn) mobileProfileBtn.style.display = 'flex';
            if (mobileProfileInitials) mobileProfileInitials.textContent = userInitials;
            
            // Mostra a opção "apenas mulheres" se o usuário for feminino
            if (preferenciaGeneroContainer) {
                preferenciaGeneroContainer.style.display = (userGender === 'feminino') ? 'block' : 'none';
            }

            carregarEdesenharFavoritos(); // [NOVO] Carrega os favoritos

        } else {
            // Usuário está deslogado
            // UI Desktop
            if (loginNavBtn) loginNavBtn.style.display = 'flex';
            if (profileBtn) profileBtn.style.display = 'none';
            
            // UI Mobile
            if (mobileNavLogo) mobileNavLogo.style.display = 'none'; // [NOVO] Esconde a logo
            if (mobileLoginNavBtn) mobileLoginNavBtn.style.display = 'flex';
            if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
            
            // Esconde filtro de gênero
            if (preferenciaGeneroContainer) preferenciaGeneroContainer.style.display = 'none';

            meusFavoritos = []; // Limpa o cache
            carregarEdesenharFavoritos(); // Limpa os botões da tela
        }
    }
    
    // --- Verifica a Sessão ao Carregar a Página ---
    (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            updateUIForUser(session.user);
            showPage('page-mapa'); // Mostra o mapa se logado
            document.querySelectorAll('.nav-btn[data-target="page-mapa"]').forEach(b => b.classList.add('active'));
        } else {
            updateUIForUser(null);
            showPage('page-login'); // Mostra o login se deslogado
            document.querySelectorAll('.nav-btn[data-target="page-login"]').forEach(b => b.classList.add('active'));
        }
    })();
    // --- Listener do Formulário de Login ---
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorMessageDiv = document.getElementById('login-error-message');
            
            const submitButton = formLogin.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';
            try {
                // USA A FUNÇÃO DE LOGIN DO api.js
                const { data, error } = await api.signIn(email, password);
                if (error) {
                    throw new Error(error.message);
                }
                if (data.user) {
                    // SUCESSO!
                    errorMessageDiv.style.display = 'none';
                    updateUIForUser(data.user);
                    
                    // Ativa o botão do mapa
                    document.querySelectorAll('.nav-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('data-target') === 'page-mapa') {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Redireciona para a página do mapa
                    showPage('page-mapa');
                }
            } catch (error) {
                let friendlyError = 'Email ou senha inválidos. Tente novamente.';
                if (error.message.includes('Email not confirmed')) {
                    friendlyError = 'Email não confirmado. Por favor, verifique sua caixa de entrada (e spam) e clique no link de confirmação.';
                }
                console.warn('Erro no login:', error.message);
                errorMessageDiv.textContent = friendlyError;
                errorMessageDiv.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar';
            }
        });
    }
    // --- Listeners dos Menus de Perfil (Desktop e Mobile) ---
    
    // Seletores
    const desktopProfileBtn = document.getElementById('profile-sidebar-btn');
    const desktopProfileMenu = document.getElementById('profile-menu');
    const desktopLogoutMenuBtn = document.getElementById('logout-menu-btn');
    const desktopEditProfileBtn = document.getElementById('edit-profile-btn');
    const mobileProfileBtn = document.getElementById('mobile-profile-sidebar-btn');
    const mobileProfileMenu = document.getElementById('mobile-profile-menu');
    const mobileLogoutMenuBtn = document.getElementById('mobile-logout-menu-btn');
    const mobileEditProfileBtn = document.getElementById('mobile-edit-profile-btn');
    
    // Função Genérica de Logout
    async function handleLogout() {
        if (desktopProfileMenu) desktopProfileMenu.classList.remove('show');
        if (mobileProfileMenu) mobileProfileMenu.classList.remove('show');
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao sair:', error.message);
        } else {
            updateUIForUser(null);
            showPage('page-login');
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === 'page-login') {
                    btn.classList.add('active');
                }
            });
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }
    }
    // Função Genérica de Editar Perfil
    function handleEditProfile(e) {
        e.preventDefault();
        alert('A página "Editar Perfil" ainda será construída!');
        if (desktopProfileMenu) desktopProfileMenu.classList.remove('show');
        if (mobileProfileMenu) mobileProfileMenu.classList.remove('show');
    }
    // Listeners Desktop
    if (desktopProfileBtn && desktopProfileMenu) {
        desktopProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            desktopProfileMenu.classList.toggle('show');
        });
    }
    if (desktopLogoutMenuBtn) desktopLogoutMenuBtn.addEventListener('click', handleLogout);
    if (desktopEditProfileBtn) desktopEditProfileBtn.addEventListener('click', handleEditProfile);
    // Listeners Mobile
    if (mobileProfileBtn && mobileProfileMenu) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileProfileMenu.classList.toggle('show');
        });
    }
    if (mobileLogoutMenuBtn) mobileLogoutMenuBtn.addEventListener('click', handleLogout);
    if (mobileEditProfileBtn) mobileEditProfileBtn.addEventListener('click', handleEditProfile);
    // Listener de Fechar Menu (Global)
    window.addEventListener('click', (e) => {
        if (desktopProfileMenu && desktopProfileMenu.classList.contains('show')) {
            if (!desktopProfileBtn.contains(e.target)) {
                desktopProfileMenu.classList.remove('show');
            }
        }
        if (mobileProfileMenu && mobileProfileMenu.classList.contains('show')) {
            if (!mobileProfileBtn.contains(e.target)) {
                mobileProfileMenu.classList.remove('show');
            }
        }
    });

    // =============================================
    // LÓGICA DE LOCAIS FAVORITOS
    // =============================================
    
    let meusFavoritos = []; // Cache local

    /**
     * Busca os favoritos do Supabase e os desenha na tela
     */
    async function carregarEdesenharFavoritos() {
        try {
            meusFavoritos = await buscarFavoritos();
            
            // Define onde os botões de favoritos devem aparecer
            const containers = [
                document.getElementById('favoritos-partida-container'),
                document.getElementById('favoritos-destino-container'),
                document.getElementById('favoritos-partida-motorista'),
                document.getElementById('favoritos-destino-motorista')
            ];

            containers.forEach(container => {
                if (container) {
                    container.innerHTML = ''; // Limpa
                    meusFavoritos.forEach(fav => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'btn-favorito';
                        btn.textContent = fav.nome_local;
                        btn.dataset.endereco = fav.endereco_text; // Guarda o endereço no botão
                        
                        // Adiciona o listener para preencher o input
                        btn.addEventListener('click', () => {
                            const inputId = (container.id.includes('partida')) ? 
                                (container.id.includes('motorista') ? 'inputPartidaMotorista' : 'inputPartida') : 
                                (container.id.includes('motorista') ? 'inputDestinoMotorista' : 'inputDestino');
                            
                            document.getElementById(inputId).value = fav.endereco_text;
                        });
                        
                        container.appendChild(btn);
                    });
                }
            });
            
        } catch (error) {
            console.error("Erro ao carregar favoritos:", error);
        }
    }

    /**
     * Salva um novo local favorito
     * @param {string} inputId ID do campo de input (ex: 'inputPartida')
     */
    async function salvarNovoFavorito(inputId) {
        const input = document.getElementById(inputId);
        if (!input || !input.value) {
            alert("O campo de endereço não pode estar vazio.");
            return;
        }
        
        const nome = prompt("Dê um nome para este favorito (Ex: Casa, Uni):");
        if (!nome || nome.trim() === '') {
            return; // Usuário cancelou
        }
        
        try {
            await criarFavorito(nome, input.value);
            alert(`"${nome}" salvo com sucesso!`);
            carregarEdesenharFavoritos(); // Atualiza os botões
        } catch (error) {
            alert("Erro ao salvar favorito: " + error.message);
        }
    }

    // --- Listeners para os botões "Salvar Favorito" (Estrela) ---
    document.getElementById('btnSalvarPartida')?.addEventListener('click', () => salvarNovoFavorito('inputPartida'));
    document.getElementById('btnSalvarDestino')?.addEventListener('click', () => salvarNovoFavorito('inputDestino'));
    document.getElementById('btnSalvarPartidaMotorista')?.addEventListener('click', () => salvarNovoFavorito('inputPartidaMotorista'));
    document.getElementById('btnSalvarDestinoMotorista')?.addEventListener('click', () => salvarNovoFavorito('inputDestinoMotorista'));

    // =============================================
    // LÓGICA DO MAPA (MAPBOX GL JS)
    // =============================================
    function inicializarMapa() {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v12', 
            center: [-53.52, -26.68], // [lon, lat]
            zoom: 12,
            pitch: 50 // ATIVA O 3D
        });
        map.on('load', () => {
            // Adiciona controle de geolocalização (GPS)
            map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true
            }), 'top-right'); 
            // Adiciona fonte de rota (vazia por enquanto)
            map.addSource('route', { type: 'geojson', data: null });
            map.addLayer({
                id: 'routeLayer',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#ff8c00', 'line-width': 6 }
            }, 'road-label');
            
            // Bloco para aumentar o tamanho das fontes e ícones
            const layersToEnlarge = ['poi-label', 'road-label', 'place-label', 'natural-label'];
            layersToEnlarge.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'icon-size', 1.5);
                    map.setLayoutProperty(layerId, 'text-size', [
                        'interpolate', ['linear'], ['zoom'],
                        10, 12,
                        16, 16,
                        22, 22
                    ]);
                    // [MODIFICADO] Cor do texto para PRETO, com contorno BRANCO forte
                    map.setPaintProperty(layerId, 'text-color', '#000000'); // Cor do texto preta
                    map.setPaintProperty(layerId, 'text-halo-color', 'rgba(255, 255, 255, 1)'); // Contorno branco opaco
                    map.setPaintProperty(layerId, 'text-halo-width', 2); // Largura do contorno
                }
            });
            
            // [NOVO] Listener de clique para POIs (Pontos de Interesse)
            map.on('click', 'poi-label', (e) => {
                // Pega o nome e as coordenadas do POI
                const coordinates = e.lngLat;
                const poiName = e.features[0].properties.name;

                // Cria o HTML para o pop-up
                const popupHTML = `
                    <div class="poi-popup">
                        <strong>${poiName}</strong>
                        <p>Usar este local como:</p>
                        <button class="btn btn-sm btn-primary w-100 mb-1 btn-popup-action" data-action="partida" data-name="${poiName}">
                            📍 Ponto de Partida
                        </button>
                        <button class="btn btn-sm btn-success w-100 btn-popup-action" data-action="destino" data-name="${poiName}">
                            🏁 Ponto de Destino
                        </button>
                    </div>
                `;

                // Cria e exibe o pop-up
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupHTML)
                    .addTo(map);
            });

            // Muda o cursor para "ponteiro" ao passar sobre um POI
            map.on('mouseenter', 'poi-label', () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'poi-label', () => {
                map.getCanvas().style.cursor = '';
            });

        });
    }

    // [NOVA FUNÇÃO] - Converte Coordenadas [lon, lat] em Endereço
    async function getAddressFromCoords(coords) {
        // coords é [lon, lat]
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json` +
                    `?access_token=${MAPBOX_ACCESS_TOKEN}` +
                    `&limit=1` +
                    `&types=address,poi,locality,neighborhood`; 
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro no Geocoding Reverso: Status ${response.status}`);
            const data = await response.json();
            
            if (data?.features?.length > 0) {
                return data.features[0].place_name; // Retorna o nome do local
            } else {
                return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`; 
            }
        } catch (err) {
            console.error('Erro no Geocoding Reverso (Mapbox):', err);
            return null;
        }
    }

    // =============================================
    // LÓGICA DA PÁGINA "CARONAS" (page-viagens)
    // =============================================
    // --- Carrega o conteúdo da aba ativa ---
    function carregarConteudoAbaViagens() {
        const abaAtiva = document.querySelector('#viagensTabs .nav-link.active');
        if (!abaAtiva) return;
        if (abaAtiva.id === 'pedidos-tab') {
            carregarPedidosDeCarona();
        } else if (abaAtiva.id === 'ofertas-tab') {
            carregarCaronasDisponiveis(); 
        }
        // A aba "Criar" não precisa carregar nada
    }
    // --- Busca OFERTAS (Motoristas) ---
    async function carregarCaronasDisponiveis() {
        const container = document.getElementById('caronas-list-container');
        const loading = document.getElementById('caronas-loading');
        
        const { data: { user } } = await supabase.auth.getUser(); // [NOVO] Pega o usuário logado
        
        const inputOrigem = document.getElementById('filtroOrigem');
        const inputDestino = document.getElementById('filtroDestino');
        if (!container || !loading || !inputOrigem || !inputDestino) return; 
        const origemFiltro = inputOrigem.value;
        const destinoFiltro = inputDestino.value;
        loading.style.display = 'block';
        container.innerHTML = ''; 
        try {
            const rotas = await buscarRotas({
                origemCidade: origemFiltro || null,
                destinoCidade: destinoFiltro || null
            });
            if (rotas.length === 0) {
                container.innerHTML = `<div class="card-viagem empty-state"><i class="bi bi-compass"></i><h3>Nenhuma carona OFERECIDA encontrada</h3><p>Tente ajustar seus filtros ou volte mais tarde.</p></div>`;
            } else {
                rotas.forEach(rota => {
                    // [MODIFICADO] Passa o ID do usuário logado
                    container.insertAdjacentHTML('beforeend', criarCardCarona(rota, user?.id));
                });
            }
        } catch (error) {
            console.error('Erro ao buscar caronas (ofertas):', error);
            container.innerHTML = `<div class="card-viagem empty-state text-danger"><i class="bi bi-exclamation-triangle"></i><h3>Erro ao buscar caronas</h3><p>${error.message}</p></div>`;
        } finally {
            loading.style.display = 'none';
        }
    }
    
    // --- Busca PEDIDOS (Passageiros) ---
    async function carregarPedidosDeCarona() {
        const container = document.getElementById('pedidos-list-container');
        const loading = document.getElementById('pedidos-loading');
        
        const { data: { user } } = await supabase.auth.getUser(); // [NOVO] Pega o usuário logado

        if (!container || !loading) return;
        loading.style.display = 'block';
        container.innerHTML = ''; 
        try {
            const pedidos = await buscarPedidos(); // Função de pedidos.js
            if (pedidos.length === 0) {
                container.innerHTML = `<div class="card-viagem empty-state"><i class="bi bi-person-arms-up"></i><h3>Ninguém está pedindo carona agora</h3><p>Seja o primeiro a publicar seu pedido!</p></div>`;
            } else {
                pedidos.forEach(pedido => {
                    // [MODIFICADO] Passa o ID do usuário logado
                    const cardHTML = criarCardPedido(pedido, user?.id); 
                    container.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            container.innerHTML = `<div class="card-viagem empty-state text-danger"><i class="bi bi-exclamation-triangle"></i><h3>Erro ao buscar pedidos</h3><p>${error.message}</p></div>`;
        } finally {
            loading.style.display = 'none';
        }
    }
    // --- Cria o HTML de um card de PEDIDO ---
    function criarCardPedido(pedido, loggedInUserId) { // [MODIFICADO]
        const dataViagem = new Date(pedido.data_viagem).toLocaleString('pt-BR', { 
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
        });
        
        const nomePassageiro = pedido.profiles?.full_name || 'Usuário';
        let badgePreferencias = '';
        if (pedido.preferencia_genero_motorista === 'apenas_mulher') {
            badgePreferencias = `<span class="status-badge status-female-only"><i class="bi bi-gender-female"></i> Só Motorista Mulher</span>`;
        }

        // [NOVO] Adiciona o botão de deletar se for o dono
        let deleteButtonHTML = '';
        if (pedido.usuario_id === loggedInUserId) {
            deleteButtonHTML = `<button class="btn-delete-post" title="Excluir pedido"><i class="bi bi-trash3-fill"></i></button>`;
        }

        return `
        <div class="card-viagem trip-card" data-pedido-id="${pedido.id}">
            ${deleteButtonHTML} 
            <div class="trip-header">
                <div class="trip-date-time">
                    <i class="bi bi-calendar-event"></i>
                    <span>${dataViagem}</span>
                </div>
                ${badgePreferencias}
            </div>
            <div class="trip-route">
                <div class="route-item">
                    <div class="route-icon route-icon-start"><i class="bi bi-flag-fill"></i></div>
                    <span class="route-text">${pedido.origem_text}</span>
                </div>
                <div class="route-item">
                    <div class="route-icon route-icon-end"><i class="bi bi-geo-alt-fill"></i></div>
                    <span class="route-text">${pedido.destino_text}</span>
                </div>
            </div>
            <div class="trip-footer">
                <div class="trip-participant">
                    <div class="participant-avatar">${getInitials(nomePassageiro)}</div>
                    <span>Pedido por: <strong>${nomePassageiro}</strong></span>
                </div>
                <button class="btn btn-action btn-details btn-oferecer-carona" data-user-id="${pedido.usuario_id}">
                    <i class="bi bi-send-fill"></i> Oferecer Carona (Chat)
                </button>
            </div>
        </div>
        `;
    }
    // --- Cria o HTML de um card de OFERTA ---
    function criarCardCarona(rota, loggedInUserId) { // [MODIFICADO]
        const dataViagem = rota.data_viagem ? 
            new Date(rota.data_viagem).toLocaleString('pt-BR', { 
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            }) : 'Data não definida';
        const custo = rota.custo ? `R$ ${parseFloat(rota.custo).toFixed(2)}` : 'Grátis';
        
        // [NOVO] Pega o nome do motorista
        const nomeMotorista = rota.profiles?.full_name || 'Motorista';

        // [NOVO] Adiciona o botão de deletar se for o dono
        let deleteButtonHTML = '';
        if (rota.usuario_id === loggedInUserId) {
            deleteButtonHTML = `<button class="btn-delete-post" title="Excluir rota"><i class="bi bi-trash3-fill"></i></button>`;
        }

        return `
        <div class="card-viagem trip-card" data-rota-id="${rota.id}">
            ${deleteButtonHTML} 
            <div class="trip-header">
                <div class="trip-date-time">
                    <i class="bi bi-calendar-event"></i>
                    <span>${dataViagem}</span>
                </div>
                <span class="status-badge status-pending">${rota.vagas || 'M'} Vagas</span>
            </div>
            <div class="trip-route">
                <div class="route-item">
                    <div class="route-icon route-icon-start"><i class="bi bi-flag-fill"></i></div>
                    <span class="route-text">${rota.origem_text}</span>
                </div>
                <div class="route-item">
                    <div class="route-icon route-icon-end"><i class="bi bi-geo-alt-fill"></i></div>
                    <span class="route-text">${rota.destino_text}</span>
                </div>
            </div>
            <div class="trip-footer">
                <div class="trip-participant-stack">
                    <div class="trip-participant">
                        <div class="participant-avatar">${getInitials(nomeMotorista)}</div>
                        <span>Motorista: <strong>${nomeMotorista}</strong></span>
                    </div>
                    <div class="trip-cost">
                        <i class="bi bi-cash-coin"></i>
                        <span>Contribuição: <strong>${custo}</strong></span>
                    </div>
                </div>
                <button class="btn btn-action btn-details btn-pedir-carona" data-user-id="${rota.usuario_id}">
                    <i class="bi bi-hand-index-thumb"></i> Pedir Carona (Chat)
                </button>
            </div>
        </div>
        `;
    }
    
    // --- Listeners da página "Caronas" (Abas e Botões) ---
    document.getElementById('page-viagens').addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        // Botão de filtrar (aba Ofertas)
        if (e.target.id === 'btnBuscarCaronas' || e.target.closest('#btnBuscarCaronas')) {
            carregarCaronasDisponiveis();
        }
        
        // Troca de Abas (Criar/Pedidos/Ofertas)
        if (e.target.matches('#viagensTabs .nav-link')) {
            setTimeout(carregarConteudoAbaViagens, 50);
        }
        // [MODIFICADO] Botão de iniciar chat
        const chatButton = e.target.closest('.btn-oferecer-carona, .btn-pedir-carona');
        if (chatButton) {
            const targetUserId = chatButton.dataset.userId;
            console.log(`Iniciando chat com o usuário (ID: ${targetUserId})...`);
            
            // Encontra e "clica" no botão do chat na sidebar/nav-mobile
            const chatNavBtn = document.querySelector('.nav-btn[data-target="page-chat"]');
            if (chatNavBtn) {
                chatNavBtn.click(); // Isso vai chamar o showPage('page-chat') e ativar a aba
            }
            
            // No futuro, aqui também passaremos o ID do usuário para o chat
            // ex: loadChatConversation(targetUserId);
        }

        // [NOVO] Botão de deletar post
        const deleteButton = e.target.closest('.btn-delete-post');
        if (deleteButton) {
            const card = deleteButton.closest('.card-viagem');
            const rotaId = card.dataset.rotaId;
            const pedidoId = card.dataset.pedidoId;

            if (confirm('Tem certeza que deseja excluir esta publicação?')) {
                try {
                    if (rotaId) {
                        await deletarRota(rotaId);
                    } else if (pedidoId) {
                        await deletarPedido(pedidoId);
                    }
                    card.remove(); // Remove o card da tela
                } catch (error) {
                    alert('Erro ao excluir: ' + error.message);
                }
            }
        }
    });
    // =============================================
    // LISTENERS DE FORMULÁRIOS (CRIAR CARONA)
    // =============================================
    // --- Formulário PEDIR Carona (Passageiro) ---
    const formProcurar = document.getElementById('formProcurarCarona');
    if (formProcurar) {
        formProcurar.addEventListener('submit', async function(e) {
            e.preventDefault();
            const partidaTxt = document.getElementById('inputPartida').value;
            const destinoTxt = document.getElementById('inputDestino').value;
            const dataHora = document.getElementById('inputDataHora').value;
            const apenasMulher = document.getElementById('prefApenasMulher').checked;
            
            // Salva o Pedido no banco de dados
            try {
                const pedidoData = {
                    origemText: partidaTxt,
                    destinoText: destinoTxt,
                    dataViagem: new Date(dataHora).toISOString(),
                    preferenciaGenero: apenasMulher ? 'apenas_mulher' : 'qualquer'
                };
                
                const novoPedido = await criarPedido(pedidoData);
                
                alert('Sucesso! Seu pedido de carona foi publicado.');
                formProcurar.reset();
                
                // Ativa a aba "Pedidos" para o usuário ver o que acabou de criar
                document.getElementById('pedidos-tab').click();
            } catch (error) {
                console.error("Erro ao publicar pedido:", error);
                alert("Erro ao publicar seu pedido: " + error.message);
            }
        });
    }
    // --- Formulário OFERECER Carona (Motorista) ---
    const formOferecer = document.getElementById('formOferecerCarona');
    if (formOferecer) {
        formOferecer.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const partidaTxt = document.getElementById('inputPartidaMotorista').value;
            const destinoTxt = document.getElementById('inputDestinoMotorista').value;
            const valor = document.getElementById('inputCusto').value;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Erro: Você não está logado! Faça o login para publicar.');
                return;
            }
            try {
                const rotaSalva = await traçarESalvarRota({
                    usuarioId: user.id,
                    origemText: partidaTxt,
                    destinoText: destinoTxt,
                    distanciaKm: null, // Não estamos mais no mapa
                    custo: parseFloat(valor),
                    vagas: 3, // Valor padrão
                    dataViagem: new Date().toISOString(), // Valor padrão
                    rotaGeoJSON: null, // Não estamos mais no mapa
                });
                alert('Sucesso! Sua rota foi publicada com o ID: ' + rotaSalva.id);
                formOferecer.reset();
                
                // Ativa a aba "Ofertas" para o usuário ver
                document.getElementById('ofertas-tab').click();
            } catch (error) {
                console.error('Erro ao salvar rota no Supabase:', error);
                alert('Erro ao publicar rota: ' + error.message);
            }
        });
    }
    
    // =============================================
    // LÓGICA DO MODAL DE PÂNICO
    // =============================================
    
    // Seleciona os elementos (Desktop e Mobile)
    const sosButtons = document.querySelectorAll('.sos-button-sidebar, .sos-button-mobile');
    const panicModal = document.getElementById('panicModal');
    const cancelPanic = document.getElementById('cancelPanic');
    const confirmPanic = document.getElementById('confirmPanic');
    if (panicModal && cancelPanic && confirmPanic) {
        // Clicar no SOS -> MOSTRA o modal
        sosButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                panicModal.style.display = 'flex';
            });
        });
        
        // Clicar em "Cancelar" -> ESCONDE o modal
        cancelPanic.addEventListener('click', function() {
            panicModal.style.display = 'none';
        });
        
        // Clicar em "Sim, preciso de ajuda"
        confirmPanic.addEventListener('click', function() {
            alert('Ajuda a caminho! (Simulação)');
            panicModal.style.display = 'none';
        });
    }

    // =============================================
    // LÓGICA DO CHAT (COPIADO DE chat.html)
    // =============================================
    
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const chatBackButton = document.getElementById('chatBackButton');

    // Clica no botão "Voltar" do chat
    if (chatBackButton) {
        chatBackButton.addEventListener('click', () => {
            // Volta para a página de Caronas
            const caronasNavBtn = document.querySelector('.nav-btn[data-target="page-viagens"]');
            if (caronasNavBtn) {
                caronasNavBtn.click();
            }
        });
    }

    // Clica no botão "Enviar"
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Pressiona Enter no input
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Função para enviar mensagem
    function sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        const message = input.value.trim();

        if (message === '') {
            return;
        }
        
        // Adicionar mensagem ao chat (simulação)
        addMessage(message, 'sent');

        // Limpar input
        input.value = '';

        // Simulação de resposta
        setTimeout(() => {
            addMessage("Recebido! Estou a caminho.", 'received');
        }, 1500);
    }

    // Função para adicionar mensagem ao chat
    function addMessage(text, type) {
        const chatBody = document.getElementById('chatBody');
        if (!chatBody) return;
        
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <div>
                <div class="message-bubble">${escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        chatBody.appendChild(messageDiv);
        scrollToBottom();
    }

    // Função para escapar HTML (prevenir XSS)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Função para rolar até o final do chat
    function scrollToBottom() {
        const chatBody = document.getElementById('chatBody');
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }
    
    // [NOVO] Listener global para os botões do pop-up do mapa
    document.addEventListener('click', (e) => {
        // Verifica se o clique foi em um botão de ação do pop-up
        if (e.target.matches('.btn-popup-action')) {
            const action = e.target.dataset.action;
            const name = e.target.dataset.name;
            
            // Define qual input deve ser preenchido
            const targetInputId = (action === 'partida') ? 'inputPartida' : 'inputDestino';
            
            // Prepara os dados
            const prefillData = {
                targetInput: targetInputId,
                name: name
            };

            // Encontra e "clica" no botão da sidebar "Caronas"
            const caronasNavBtn = document.querySelector('.nav-btn[data-target="page-viagens"]');
            if (caronasNavBtn) {
                caronasNavBtn.click();
            }
            
            // Chama a showPage com os dados para preenchimento
            // Usamos um setTimeout para dar tempo da aba trocar
            setTimeout(() => {
                showPage('page-viagens', prefillData);
            }, 50);
        }
    });

    // [NOVO] Listener para o botão "Usar minha localização"
    const btnUseGPS = document.getElementById('use-gps-partida');
    if (btnUseGPS) {
        btnUseGPS.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Geolocalização não é suportada pelo seu navegador.");
                return;
            }

            btnUseGPS.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Buscando...';
            btnUseGPS.disabled = true;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const coords = [position.coords.longitude, position.coords.latitude];
                const address = await getAddressFromCoords(coords);
                
                if (address) {
                    document.getElementById('inputPartida').value = address;
                } else {
                    alert("Não foi possível encontrar o endereço da sua localização.");
                }
                
                btnUseGPS.innerHTML = '<i class="bi bi-geo-fill"></i> Usar minha localização';
                btnUseGPS.disabled = false;

            }, (error) => {
                console.error("Erro ao obter localização:", error);
                alert("Erro ao obter sua localização. Verifique se a permissão de GPS está ativa.");
                btnUseGPS.innerHTML = '<i class="bi bi-geo-fill"></i> Usar minha localização';
                btnUseGPS.disabled = false;
            });
        });
    }

    // [NOVO] Listener para o botão "Usar minha localização" do MOTORISTA
    const btnUseGPSMotorista = document.getElementById('use-gps-partida-motorista');
    if (btnUseGPSMotorista) {
        btnUseGPSMotorista.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("Geolocalização não é suportada pelo seu navegador.");
                return;
            }

            btnUseGPSMotorista.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Buscando...';
            btnUseGPSMotorista.disabled = true;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const coords = [position.coords.longitude, position.coords.latitude];
                const address = await getAddressFromCoords(coords);
                
                if (address) {
                    document.getElementById('inputPartidaMotorista').value = address;
                } else {
                    alert("Não foi possível encontrar o endereço da sua localização.");
                }
                
                btnUseGPSMotorista.innerHTML = '<i class="bi bi-geo-fill"></i> Usar minha localização';
                btnUseGPSMotorista.disabled = false;

            }, (error) => {
                console.error("Erro ao obter localização:", error);
                alert("Erro ao obter sua localização. Verifique se a permissão de GPS está ativa.");
                btnUseGPSMotorista.innerHTML = '<i class="bi bi-geo-fill"></i> Usar minha localização';
                btnUseGPSMotorista.disabled = false;
            });
        });
    }


}); // Fim do DOMContentLoaded