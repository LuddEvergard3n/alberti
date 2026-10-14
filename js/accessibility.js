/**
 * accessibility.js
 * Alberti — Museu Interativo de Arte
 *
 * Funcionalidades de acessibilidade.
 *
 * Responsabilidades:
 *   - Controle de tamanho de fonte (A+ / A-)
 *   - Controle de alto contraste
 *   - Gerenciamento de foco em modais e painéis
 *   - Navegação por teclado nos viewers e grids
 *   - Anúncios de mudança de rota para leitores de tela
 *
 * Padrões seguidos: WCAG 2.1 AA
 */

import { setState, getState, subscribe } from './state.js';

/* =========================================================
   CONSTANTES
   ========================================================= */

/** Chave para persistir preferências no localStorage */
const STORAGE_KEY = 'alberti-a11y-prefs';

/** Tamanhos de fonte disponíveis */
const FONT_SIZES = ['small', 'normal', 'large'];

/* =========================================================
   PERSISTÊNCIA DE PREFERÊNCIAS
   ========================================================= */

/**
 * Salva preferências de acessibilidade no localStorage.
 * Se localStorage não estiver disponível, silencia o erro.
 *
 * @param {Object} prefs
 * @returns {void}
 */
function savePreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage pode não estar disponível (modo privado, etc.)
  }
}

/**
 * Carrega preferências salvas do localStorage.
 * Retorna objeto vazio se não houver preferências salvas.
 *
 * @returns {Object}
 */
function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* =========================================================
   TAMANHO DE FONTE
   ========================================================= */

/**
 * Aplica o tamanho de fonte ao elemento html.
 *
 * @param {string} size - 'small' | 'normal' | 'large'
 * @returns {void}
 */
function applyFontSize(size) {
  document.documentElement.dataset.fontSize = size;
}

/**
 * Incrementa o tamanho de fonte para o próximo na escala.
 *
 * @returns {void}
 */
function increaseFontSize() {
  const current = getState().fontSize;
  const idx     = FONT_SIZES.indexOf(current);
  if (idx < FONT_SIZES.length - 1) {
    const next = FONT_SIZES[idx + 1];
    setState({ fontSize: next });
    applyFontSize(next);
    savePreferences({ ...loadPreferences(), fontSize: next });
  }
}

/**
 * Decrementa o tamanho de fonte para o anterior na escala.
 *
 * @returns {void}
 */
function decreaseFontSize() {
  const current = getState().fontSize;
  const idx     = FONT_SIZES.indexOf(current);
  if (idx > 0) {
    const prev = FONT_SIZES[idx - 1];
    setState({ fontSize: prev });
    applyFontSize(prev);
    savePreferences({ ...loadPreferences(), fontSize: prev });
  }
}

/* =========================================================
   ALTO CONTRASTE
   ========================================================= */

/**
 * Aplica o modo de alto contraste ao elemento html.
 *
 * @param {boolean} enabled
 * @returns {void}
 */
function applyHighContrast(enabled) {
  document.documentElement.dataset.highContrast = String(enabled);
}

/**
 * Alterna o modo de alto contraste.
 *
 * @returns {void}
 */
function toggleHighContrast() {
  const enabled = !getState().highContrast;
  setState({ highContrast: enabled });
  applyHighContrast(enabled);

  const btn = document.getElementById('btn-contrast');
  btn?.setAttribute('aria-pressed', String(enabled));
  btn?.classList.toggle('active', enabled);

  savePreferences({ ...loadPreferences(), highContrast: enabled });
  announceToScreenReader(enabled ? 'Alto contraste ativado' : 'Alto contraste desativado');
}

/* =========================================================
   ANÚNCIOS PARA LEITORES DE TELA
   ========================================================= */

/**
 * @type {HTMLElement|null} Região aria-live para anúncios.
 */
let liveRegion = null;

/**
 * Cria a região aria-live para anúncios.
 * Chamado uma vez em initAccessibility().
 *
 * @returns {void}
 */
function createLiveRegion() {
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  document.body.appendChild(liveRegion);
}

/**
 * Anuncia uma mensagem para leitores de tela via aria-live.
 *
 * @param {string} message
 * @returns {void}
 */
export function announceToScreenReader(message) {
  if (!liveRegion) return;
  liveRegion.textContent = '';
  // setTimeout garante que o change seja percebido pelo AT
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 50);
}

/* =========================================================
   TRAP DE FOCO EM MODAIS E PAINÉIS
   ========================================================= */

/**
 * Elementos focáveis por teclado (seletores padrão).
 * @type {string}
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Retorna todos os elementos focáveis dentro de um container.
 *
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter(el => !el.closest('[aria-hidden="true"]'));
}

/**
 * Ativa trap de foco em um container (modal, painel).
 * Retorna função de cleanup para desativar.
 *
 * @param {HTMLElement} container
 * @returns {Function} cleanup
 */
export function trapFocus(container) {
  const handler = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener('keydown', handler);

  // Focar no primeiro elemento
  const focusable = getFocusableElements(container);
  focusable[0]?.focus();

  return () => container.removeEventListener('keydown', handler);
}

/* =========================================================
   NAVEGAÇÃO POR TECLADO EM GRIDS
   ========================================================= */

/**
 * Ativa navegação por teclado (setas) em um grid de cards.
 * Permite mover entre cards com ArrowLeft/ArrowRight/ArrowUp/ArrowDown.
 *
 * @param {HTMLElement} gridContainer
 * @param {string}      itemSelector - Seletor dos itens no grid
 * @returns {Function} cleanup
 */
export function enableGridKeyboardNav(gridContainer, itemSelector = '[role="listitem"], .card') {
  const handler = (e) => {
    const items   = Array.from(gridContainer.querySelectorAll(itemSelector));
    const focused = document.activeElement;
    const idx     = items.indexOf(focused.closest(itemSelector));

    if (idx === -1) return;

    // Estimar colunas pela posição Y do segundo item (suposição)
    const cols = estimateColumns(items);

    let nextIdx = idx;

    switch (e.key) {
      case 'ArrowRight': nextIdx = Math.min(idx + 1, items.length - 1); break;
      case 'ArrowLeft':  nextIdx = Math.max(idx - 1, 0);                break;
      case 'ArrowDown':  nextIdx = Math.min(idx + cols, items.length - 1); break;
      case 'ArrowUp':    nextIdx = Math.max(idx - cols, 0);                break;
      default: return;
    }

    if (nextIdx !== idx) {
      e.preventDefault();
      const nextItem = items[nextIdx];
      const focusable = getFocusableElements(nextItem)[0] || nextItem;
      focusable.focus();
    }
  };

  gridContainer.addEventListener('keydown', handler);
  return () => gridContainer.removeEventListener('keydown', handler);
}

/**
 * Estima o número de colunas de um grid pela posição top dos itens.
 * Suposição: itens na mesma linha têm o mesmo offsetTop.
 *
 * @param {HTMLElement[]} items
 * @returns {number}
 */
function estimateColumns(items) {
  if (items.length < 2) return 1;
  const topFirst = items[0].getBoundingClientRect().top;
  let cols = 1;
  for (let i = 1; i < items.length; i++) {
    if (Math.abs(items[i].getBoundingClientRect().top - topFirst) < 5) {
      cols++;
    } else {
      break;
    }
  }
  return cols;
}

/* =========================================================
   ANÚNCIOS DE MUDANÇA DE ROTA
   ========================================================= */

/**
 * Inicializa anúncio de mudança de rota para leitores de tela.
 * Ao mudar de rota, anuncia o novo título da página.
 *
 * @returns {void}
 */
function initRouteAnnouncements() {
  subscribe('route', (newRoute) => {
    const titleMap = {
      home:       'Início — Alberti',
      linguagem:  'Linguagem da Arte — Alberti',
      periodos:   'Períodos — Alberti',
      artistas:   'Artistas — Alberti',
      museu:      'Museu — Alberti',
      studio:     'Estúdio — Alberti',
      comparar:   'Comparar — Alberti',
      obra:       'Obra — Alberti',
      artista:    'Artista — Alberti',
    };

    const title = titleMap[newRoute] || `Alberti`;
    document.title = title;
    announceToScreenReader(`Navegou para ${title}`);
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa todos os recursos de acessibilidade.
 * Chamado uma vez em main.js.
 *
 * @returns {void}
 */
export function initAccessibility() {
  createLiveRegion();
  initRouteAnnouncements();

  // Restaurar preferências salvas
  const prefs = loadPreferences();

  if (prefs.fontSize && FONT_SIZES.includes(prefs.fontSize)) {
    setState({ fontSize: prefs.fontSize });
    applyFontSize(prefs.fontSize);
  }

  if (prefs.highContrast === true) {
    setState({ highContrast: true });
    applyHighContrast(true);
    const btn = document.getElementById('btn-contrast');
    btn?.setAttribute('aria-pressed', 'true');
    btn?.classList.add('active');
  }

  // Botões de controle de fonte
  document.getElementById('btn-font-increase')
    ?.addEventListener('click', increaseFontSize);

  document.getElementById('btn-font-decrease')
    ?.addEventListener('click', decreaseFontSize);

  // Botão de alto contraste
  document.getElementById('btn-contrast')
    ?.addEventListener('click', toggleHighContrast);
}
