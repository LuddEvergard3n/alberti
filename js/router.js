/**
 * router.js
 * Alberti — Museu Interativo de Arte
 *
 * Roteador hash-based para SPA estático no GitHub Pages.
 * Funciona sem servidor — todas as rotas são #/caminho.
 *
 * Responsabilidades:
 *   - Registrar rotas com handlers
 *   - Resolver rota ativa pelo hash da URL
 *   - Extrair parâmetros de rota (ex: #/obra/:id)
 *   - Chamar handler correto ao navegar
 *   - Atualizar estado via setState()
 *   - Gerenciar scroll ao navegar
 *   - Atualizar aria-current nos links de navegação
 */

import { setState, getState } from './state.js';

/**
 * Mapa de rotas registradas.
 * Chave: padrão de rota (ex: 'obra/:id')
 * Valor: função handler(params)
 *
 * @type {Map<string, Function>}
 */
const routes = new Map();

/**
 * Handler chamado quando nenhuma rota corresponde.
 * @type {Function|null}
 */
let notFoundHandler = null;

/* =========================================================
   REGISTRO DE ROTAS
   ========================================================= */

/**
 * Registra uma rota e seu handler.
 *
 * O padrão suporta segmentos dinâmicos prefixados com ':'.
 * Ex: 'obra/:id', 'artista/:id', 'periodo/:id'
 *
 * @param {string}   pattern - Padrão de rota sem o '#/'
 * @param {Function} handler - Função handler(params: Object) => void
 * @returns {void}
 */
export function registerRoute(pattern, handler) {
  if (typeof handler !== 'function') {
    throw new TypeError(`[Router] Handler para "${pattern}" deve ser uma função`);
  }
  routes.set(pattern, handler);
}

/**
 * Registra o handler para rota não encontrada (404).
 *
 * @param {Function} handler
 * @returns {void}
 */
export function setNotFoundHandler(handler) {
  notFoundHandler = handler;
}

/* =========================================================
   RESOLUÇÃO DE ROTA
   ========================================================= */

/**
 * Extrai o caminho da rota a partir do hash atual da URL.
 * Remove o '#/' inicial e barras finais.
 *
 * Exemplos:
 *   ''           → ''
 *   '#/'         → ''
 *   '#/museu'    → 'museu'
 *   '#/obra/abc' → 'obra/abc'
 *
 * @returns {string}
 */
function getCurrentPath() {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return '';
  return hash.replace(/^#\//, '').replace(/\/$/, '');
}

/**
 * Tenta corresponder um caminho a um padrão de rota.
 * Retorna os parâmetros extraídos, ou null se não corresponder.
 *
 * @param {string} pattern - Padrão registrado (ex: 'obra/:id')
 * @param {string} path    - Caminho atual (ex: 'obra/last-supper')
 * @returns {Object|null}  - Parâmetros extraídos, ou null
 */
function matchRoute(pattern, path) {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments    = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return null;

  const params = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const s = pathSegments[i];

    if (p.startsWith(':')) {
      // Segmento dinâmico — extrai parâmetro
      params[p.slice(1)] = decodeURIComponent(s);
    } else if (p !== s) {
      // Segmento estático não corresponde
      return null;
    }
  }

  return params;
}

/**
 * Resolve o caminho atual contra as rotas registradas.
 * Chama o handler da rota correspondente, ou notFoundHandler.
 *
 * @returns {void}
 */
function resolve() {
  const path = getCurrentPath();

  // Determinar nome da rota para o estado
  // '' → 'home', 'museu' → 'museu', 'obra/x' → 'obra'
  const routeName = path.split('/')[0] || 'home';

  for (const [pattern, handler] of routes) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      setState({ route: routeName, routeParams: params });
      handler(params);
      updateNavLinks(routeName);
      scrollToTop();
      return;
    }
  }

  // Rota vazia → home
  if (path === '') {
    setState({ route: 'home', routeParams: {} });
    const homeHandler = routes.get('');
    if (homeHandler) {
      homeHandler({});
      updateNavLinks('home');
      return;
    }
  }

  // Rota não encontrada
  setState({ route: '404', routeParams: { path } });
  if (notFoundHandler) {
    notFoundHandler({ path });
  }
  updateNavLinks(null);
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

/**
 * Navega para uma rota programaticamente.
 * Atualiza o hash da URL, o que dispara o evento hashchange.
 *
 * @param {string} path - Caminho sem '#/' (ex: 'museu', 'obra/last-supper')
 * @returns {void}
 */
export function navigate(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  window.location.hash = `/${normalized}`;
}

/**
 * Navega para a rota anterior no histórico do navegador.
 *
 * @returns {void}
 */
export function navigateBack() {
  window.history.back();
}

/**
 * Retorna o nome da rota atual.
 *
 * @returns {string}
 */
export function getCurrentRoute() {
  return getState().route;
}

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

/**
 * Faz scroll suave para o topo ao navegar.
 *
 * @returns {void}
 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Atualiza o atributo aria-current nos links de navegação.
 * Links com data-route igual à rota ativa recebem aria-current="page".
 *
 * @param {string|null} routeName - Nome da rota ativa
 * @returns {void}
 */
function updateNavLinks(routeName) {
  const links = document.querySelectorAll('[data-route]');
  links.forEach(link => {
    const isActive = link.dataset.route === routeName;
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa o roteador.
 * Deve ser chamado uma vez, em main.js, após registrar todas as rotas.
 *
 * - Escuta o evento hashchange
 * - Resolve a rota inicial
 *
 * @returns {void}
 */
export function initRouter() {
  window.addEventListener('hashchange', resolve);
  resolve(); // resolver rota ao carregar
}
