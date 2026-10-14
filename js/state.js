/**
 * state.js
 * Alberti — Museu Interativo de Arte
 *
 * Gerenciamento de estado da aplicação.
 *
 * Padrão: observable simples com subscribe/notify.
 * Sem dependências externas.
 *
 * Responsabilidades:
 *   - Carregar e cachear os JSONs de dados
 *   - Manter estado da UI (rota ativa, modo professor, etc.)
 *   - Notificar assinantes de mudanças
 *   - Expor seletores de dados tipados
 */

/**
 * Caminhos relativos dos arquivos de dados.
 * Ajustar se a estrutura de diretórios mudar.
 *
 * @type {Object.<string, string>}
 */
const DATA_PATHS = {
  artworks:    'data/artworks.json',
  artists:     'data/artists.json',
  periods:     'data/periods.json',
  styles:      'data/styles.json',
  techniques:  'data/techniques.json',
  lessons:     'data/lessons.json',
  comparisons: 'data/comparisons.json',
  exercises:   'data/exercises.json',
  modules:     'data/modules.json',
};

/**
 * Estado inicial da aplicação.
 * Todos os campos que o estado pode conter estão documentados aqui.
 *
 * @typedef {Object} AppState
 * @property {string}  route           - Rota ativa (ex: 'home', 'linguagem', 'museu')
 * @property {Object}  routeParams     - Parâmetros da rota (ex: { id: 'last-supper' })
 * @property {boolean} teacherMode     - Se o painel do professor está aberto
 * @property {boolean} highContrast    - Se o alto contraste está ativo
 * @property {string}  fontSize        - Tamanho de fonte: 'small' | 'normal' | 'large'
 * @property {boolean} loading         - Se dados ainda estão sendo carregados
 * @property {string|null} error       - Mensagem de erro global, ou null
 * @property {Object}  data            - Dados carregados dos JSONs (ver DATA_PATHS)
 * @property {string|null} activeArtworkId - ID da obra sendo visualizada
 * @property {string[]} comparisonIds  - IDs das duas obras na comparação (max 2)
 * @property {Object}  overlays        - Estado dos overlays ativos { thirds, fuga, focal, highlight }
 */
const initialState = {
  route:           'home',
  routeParams:     {},
  teacherMode:     false,
  highContrast:    false,
  fontSize:        'normal',
  loading:         true,
  error:           null,

  data: {
    artworks:    [],
    artists:     [],
    periods:     [],
    styles:      [],
    techniques:  [],
    lessons:     [],
    comparisons: [],
    exercises:   [],
    modules:     [],
  },

  activeArtworkId:  null,
  comparisonIds:    [],

  overlays: {
    thirds:    false,
    fuga:      false,
    focal:     false,
    highlight: false,
  },
};

/**
 * Mapa de assinantes por chave de estado.
 * Chave '*' recebe todas as mudanças.
 *
 * @type {Map<string, Set<Function>>}
 */
const subscribers = new Map();

/**
 * Estado atual da aplicação.
 * Nunca modificar diretamente — usar setState().
 *
 * @type {AppState}
 */
/**
 * Cria uma cópia profunda de um valor serializável.
 * Usa structuredClone quando disponível (Chrome 98+, Firefox 94+, Edge 98+),
 * com fallback para JSON.parse/stringify em versões anteriores.
 *
 * @param {*} value
 * @returns {*}
 */
function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  // Fallback: JSON round-trip. O estado do Alberti contém apenas
  // primitivos e arrays/objetos simples — compatível com este método.
  return JSON.parse(JSON.stringify(value));
}

let state = deepClone(initialState);

/**
 * Retorna uma cópia imutável do estado atual.
 * O chamador não pode mutar o estado através do retorno.
 *
 * @returns {AppState}
 */
export function getState() {
  return deepClone(state);
}

/**
 * Atualiza o estado com um objeto parcial e notifica assinantes.
 *
 * @param {Partial<AppState>} patch - Campos a atualizar.
 * @returns {void}
 */
export function setState(patch) {
  const prevState = state;
  state = { ...state, ...patch };
  notifySubscribers(prevState, state);
}

/**
 * Atualiza um campo aninhado dentro de state.data.
 *
 * @param {string} key   - Chave dentro de state.data (ex: 'artworks')
 * @param {*}      value - Valor a atribuir
 * @returns {void}
 */
export function setData(key, value) {
  setState({
    data: {
      ...state.data,
      [key]: value,
    },
  });
}

/**
 * Registra um assinante para mudanças de estado.
 *
 * @param {string}   key      - Chave a observar, ou '*' para todas
 * @param {Function} callback - Função chamada com (newState, prevState)
 * @returns {Function}        - Função de cancelamento (unsubscribe)
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }

  subscribers.get(key).add(callback);

  // Retorna unsubscribe para facilitar limpeza
  return () => {
    subscribers.get(key)?.delete(callback);
  };
}

/**
 * Notifica assinantes das chaves que mudaram.
 *
 * @param {AppState} prev - Estado anterior
 * @param {AppState} next - Estado novo
 * @returns {void}
 */
function notifySubscribers(prev, next) {
  // Assinantes globais recebem todas as mudanças
  subscribers.get('*')?.forEach(cb => cb(next, prev));

  // Assinantes de chaves específicas
  for (const [key, callbacks] of subscribers) {
    if (key === '*') continue;
    if (prev[key] !== next[key]) {
      callbacks.forEach(cb => cb(next[key], prev[key]));
    }
  }
}

/* =========================================================
   CARREGAMENTO DE DADOS
   ========================================================= */

/**
 * Carrega um único arquivo JSON com fetch.
 * Retorna null em caso de erro (não lança exceção para não
 * bloquear o carregamento parcial dos outros JSONs).
 *
 * @param {string} path - Caminho relativo ao index.html
 * @returns {Promise<*|null>}
 */
async function fetchJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`[Alberti] Falha ao carregar ${path}: HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`[Alberti] Erro ao carregar ${path}:`, err.message);
    return null;
  }
}

/**
 * Carrega todos os JSONs de dados em paralelo.
 * Atualiza o estado ao completar.
 * Em caso de erro parcial, os dados disponíveis são usados.
 *
 * @returns {Promise<void>}
 */
export async function loadAllData() {
  setState({ loading: true, error: null });

  try {
    const entries = Object.entries(DATA_PATHS);
    const results = await Promise.all(
      entries.map(([key, path]) => fetchJSON(path).then(data => [key, data]))
    );

    const loadedData = {};
    for (const [key, data] of results) {
      if (data !== null) {
        loadedData[key] = data;
      } else {
        console.warn(`[Alberti] ${key} não carregado — usando fallback vazio`);
        loadedData[key] = [];
      }
    }

    setState({
      loading: false,
      data: { ...state.data, ...loadedData },
    });

  } catch (err) {
    setState({ loading: false, error: err.message });
    console.error('[Alberti] Erro crítico ao carregar dados:', err);
  }
}

/* =========================================================
   SELETORES
   Funções puras que extraem dados derivados do estado.
   ========================================================= */

/**
 * Retorna obra por ID.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
export function selectArtworkById(id) {
  return state.data.artworks.find(a => a.id === id);
}

/**
 * Retorna artista por ID.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
export function selectArtistById(id) {
  return state.data.artists.find(a => a.id === id);
}

/**
 * Retorna período por ID.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
export function selectPeriodById(id) {
  return state.data.periods.find(p => p.id === id);
}

/**
 * Retorna todas as obras de um artista.
 *
 * @param {string} artistId
 * @returns {Object[]}
 */
export function selectArtworksByArtist(artistId) {
  return state.data.artworks.filter(a => a.artist === artistId);
}

/**
 * Retorna todas as obras de um período.
 *
 * @param {string} periodId
 * @returns {Object[]}
 */
export function selectArtworksByPeriod(periodId) {
  return state.data.artworks.filter(a => a.period === periodId);
}

/**
 * Retorna obras que contêm um conceito específico.
 *
 * @param {string} concept
 * @returns {Object[]}
 */
export function selectArtworksByConcept(concept) {
  return state.data.artworks.filter(a =>
    Array.isArray(a.concepts) && a.concepts.includes(concept)
  );
}

/**
 * Retorna módulo por ID.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
export function selectModuleById(id) {
  return state.data.modules.find(m => m.id === id);
}

/**
 * Retorna lição por ID.
 *
 * @param {string} id
 * @returns {Object|undefined}
 */
export function selectLessonById(id) {
  return state.data.lessons.find(l => l.id === id);
}

/**
 * Retorna exercícios de uma lição.
 *
 * @param {string[]} exerciseIds
 * @returns {Object[]}
 */
export function selectExercisesByIds(exerciseIds) {
  return state.data.exercises.filter(e => exerciseIds.includes(e.id));
}

/**
 * Retorna os IDs das obras na comparação atual.
 *
 * @returns {string[]}
 */
export function selectComparisonIds() {
  return [...state.comparisonIds];
}

/**
 * Verifica se o sistema de dados está pronto (carregado).
 *
 * @returns {boolean}
 */
export function isDataReady() {
  return !state.loading && state.error === null;
}
