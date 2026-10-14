/**
 * viewer-engine.js
 * Alberti — Museu Interativo de Arte
 *
 * Engine do visualizador de obra.
 *
 * Responsabilidades:
 *   - Zoom progressivo via mouse/touch/botões
 *   - Pan na imagem quando ampliada
 *   - Gerenciar overlays SVG de composição
 *   - Navegação por teclado no viewer
 *   - Integração com hint-system
 */

import { getState, setState } from '../js/state.js';
import { HintSystem }         from './hint-system.js';

/** Fator de zoom por passo */
const ZOOM_STEP = 0.25;
/** Zoom máximo permitido */
const ZOOM_MAX  = 4.0;
/** Zoom mínimo (1 = 100%) */
const ZOOM_MIN  = 1.0;

/* =========================================================
   ESTADO INTERNO DO VIEWER
   Não persiste entre navegações — resetado em initViewer().
   ========================================================= */

/**
 * @typedef {Object} ViewerState
 * @property {string|null} artworkId
 * @property {number}      zoom
 * @property {number}      panX
 * @property {number}      panY
 * @property {boolean}     isPanning
 * @property {{x:number, y:number}} panStart
 * @property {{thirds:boolean, fuga:boolean, focal:boolean, highlight:boolean}} overlays
 * @property {HintSystem|null} hintSystem
 */

/** @type {ViewerState} */
let viewerState = createInitialViewerState(null);

/**
 * Cria um estado inicial limpo para o viewer.
 *
 * @param {string|null} artworkId
 * @returns {ViewerState}
 */
function createInitialViewerState(artworkId) {
  return {
    artworkId,
    zoom:      ZOOM_MIN,
    panX:      0,
    panY:      0,
    isPanning: false,
    panStart:  { x: 0, y: 0 },
    overlays:  { thirds: false, fuga: false, focal: false, highlight: false },
    hintSystem:null,
  };
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa o engine do viewer para uma obra específica.
 * Chamado por main.js após renderizar o HTML do viewer.
 *
 * @param {string} artworkId
 * @returns {void}
 */
export function initViewer(artworkId) {
  viewerState = createInitialViewerState(artworkId);

  const stage   = document.querySelector('.viewer-stage');
  const img     = document.querySelector('.viewer-img');
  const overlay = document.querySelector('.composition-overlay-svg');

  if (!stage || !img) {
    console.warn('[Viewer] Elementos não encontrados para:', artworkId);
    return;
  }

  bindZoomControls(stage, img);
  bindPanInteraction(stage, img);
  bindOverlayControls(overlay);
  bindKeyboardControls(stage, img);
  initHintSystem(artworkId);

  // Foco inicial no stage para acessibilidade por teclado
  stage.focus();
}

/* =========================================================
   ZOOM
   ========================================================= */

/**
 * Aplica zoom e pan à imagem via CSS transform.
 *
 * @param {HTMLElement} img
 * @returns {void}
 */
function applyTransform(img) {
  const { zoom, panX, panY } = viewerState;
  img.style.transform = `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`;
}

/**
 * Incrementa zoom por ZOOM_STEP, respeitando ZOOM_MAX.
 *
 * @param {HTMLElement} img
 * @returns {void}
 */
export function zoomIn(img) {
  viewerState.zoom = Math.min(viewerState.zoom + ZOOM_STEP, ZOOM_MAX);
  applyTransform(img);
  updateZoomedState(img.closest('.viewer-stage'));
}

/**
 * Decrementa zoom por ZOOM_STEP, respeitando ZOOM_MIN.
 * Reseta pan ao atingir zoom mínimo.
 *
 * @param {HTMLElement} img
 * @returns {void}
 */
export function zoomOut(img) {
  viewerState.zoom = Math.max(viewerState.zoom - ZOOM_STEP, ZOOM_MIN);
  if (viewerState.zoom === ZOOM_MIN) {
    viewerState.panX = 0;
    viewerState.panY = 0;
  }
  applyTransform(img);
  updateZoomedState(img.closest('.viewer-stage'));
}

/**
 * Reseta zoom e pan para os valores iniciais.
 *
 * @param {HTMLElement} img
 * @returns {void}
 */
export function resetZoom(img) {
  viewerState.zoom = ZOOM_MIN;
  viewerState.panX = 0;
  viewerState.panY = 0;
  applyTransform(img);
  updateZoomedState(img.closest('.viewer-stage'));
}

/**
 * Atualiza data-zoomed no stage para direcionar CSS de cursor e ARIA label.
 *
 * @param {HTMLElement|null} stage
 * @returns {void}
 */
function updateZoomedState(stage) {
  if (!stage) return;
  const isZoomed = viewerState.zoom > ZOOM_MIN;
  stage.dataset.zoomed = String(isZoomed);
  stage.setAttribute('aria-label',
    isZoomed ? 'Obra ampliada. Clique para reduzir.' : 'Obra. Clique para ampliar.'
  );
}

/**
 * Vincula clique no stage, botões explícitos e scroll da roda ao zoom.
 *
 * @param {HTMLElement} stage
 * @param {HTMLElement} img
 * @returns {void}
 */
function bindZoomControls(stage, img) {
  stage.dataset.zoomed = 'false';

  // Clique no stage alterna zoom
  stage.addEventListener('click', e => {
    if (e.target.closest('.viewer-controls')) return;
    if (viewerState.zoom > ZOOM_MIN) {
      resetZoom(img);
    } else {
      zoomIn(img);
    }
  });

  // Botões explícitos nos controles
  document.querySelector('[data-viewer-action="zoom-in"]')
    ?.addEventListener('click', e => { e.stopPropagation(); zoomIn(img);    });
  document.querySelector('[data-viewer-action="zoom-out"]')
    ?.addEventListener('click', e => { e.stopPropagation(); zoomOut(img);   });
  document.querySelector('[data-viewer-action="zoom-reset"]')
    ?.addEventListener('click', e => { e.stopPropagation(); resetZoom(img); });

  // Roda do mouse
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn(img); else zoomOut(img);
  }, { passive: false });
}

/* =========================================================
   PAN
   ========================================================= */

/**
 * Vincula interações de pan (arrastar) ao stage.
 * Pan só está ativo quando zoom > ZOOM_MIN.
 *
 * @param {HTMLElement} stage
 * @param {HTMLElement} img
 * @returns {void}
 */
function bindPanInteraction(stage, img) {
  // ---- Mouse ----
  stage.addEventListener('mousedown', e => {
    if (viewerState.zoom <= ZOOM_MIN)          return;
    if (e.target.closest('.viewer-controls'))  return;
    viewerState.isPanning = true;
    viewerState.panStart  = {
      x: e.clientX - viewerState.panX,
      y: e.clientY - viewerState.panY,
    };
    stage.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!viewerState.isPanning) return;
    viewerState.panX = e.clientX - viewerState.panStart.x;
    viewerState.panY = e.clientY - viewerState.panStart.y;
    applyTransform(img);
  });

  window.addEventListener('mouseup', () => {
    if (!viewerState.isPanning) return;
    viewerState.isPanning = false;
    stage.style.cursor    = viewerState.zoom > ZOOM_MIN ? 'grab' : '';
  });

  // ---- Touch ----
  /** @type {{x:number,y:number}|null} */
  let touchStart = null;

  stage.addEventListener('touchstart', e => {
    if (viewerState.zoom <= ZOOM_MIN || e.touches.length !== 1) return;
    touchStart = {
      x: e.touches[0].clientX - viewerState.panX,
      y: e.touches[0].clientY - viewerState.panY,
    };
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    if (!touchStart || e.touches.length !== 1) return;
    e.preventDefault();
    viewerState.panX = e.touches[0].clientX - touchStart.x;
    viewerState.panY = e.touches[0].clientY - touchStart.y;
    applyTransform(img);
  }, { passive: false });

  stage.addEventListener('touchend', () => { touchStart = null; });
}

/* =========================================================
   OVERLAYS SVG DE COMPOSIÇÃO
   ========================================================= */

/**
 * Vincula botões de ativação de overlays.
 * Cada botão deve ter data-overlay-type com o tipo do overlay.
 *
 * @param {SVGElement|null} overlaySvg
 * @returns {void}
 */
function bindOverlayControls(overlaySvg) {
  document.querySelectorAll('[data-overlay-type]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const type    = btn.dataset.overlayType;
      const enabled = !viewerState.overlays[type];
      viewerState.overlays[type] = enabled;

      btn.classList.toggle('active', enabled);

      if (overlaySvg) {
        const group = overlaySvg.querySelector(`#overlay-${type}`);
        if (group) group.style.display = enabled ? '' : 'none';
      }

      setState({ overlays: { ...getState().overlays, [type]: enabled } });
    });
  });
}

/* =========================================================
   CONTROLES DE TECLADO
   ========================================================= */

/**
 * Vincula atalhos de teclado ao viewer quando o stage está focado.
 *
 * Atalhos:
 *   + / =  → zoom in
 *   -      → zoom out
 *   0      → reset zoom
 *   T      → toggle overlay thirds
 *   F      → toggle overlay focal
 *   G      → toggle overlay fuga (linhas de fuga)
 *
 * @param {HTMLElement} stage
 * @param {HTMLElement} img
 * @returns {void}
 */
function bindKeyboardControls(stage, img) {
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('role', 'img');

  stage.addEventListener('keydown', e => {
    switch (e.key) {
      case '+': case '=': e.preventDefault(); zoomIn(img);                break;
      case '-':           e.preventDefault(); zoomOut(img);               break;
      case '0':           e.preventDefault(); resetZoom(img);             break;
      case 'T': case 't': triggerOverlayBtn('thirds');                    break;
      case 'F': case 'f': triggerOverlayBtn('focal');                     break;
      case 'G': case 'g': triggerOverlayBtn('fuga');                      break;
    }
  });
}

/**
 * Simula clique no botão de overlay pelo tipo.
 *
 * @param {string} type
 * @returns {void}
 */
function triggerOverlayBtn(type) {
  document.querySelector(`[data-overlay-type="${type}"]`)?.click();
}

/* =========================================================
   HINT SYSTEM
   ========================================================= */

/**
 * Inicializa o sistema de dicas contextuais para a obra.
 *
 * @param {string} artworkId
 * @returns {void}
 */
function initHintSystem(artworkId) {
  const { data } = getState();
  const artwork  = data.artworks.find(a => a.id === artworkId);
  if (!artwork) return;

  viewerState.hintSystem = new HintSystem(artwork);

  document.querySelector('[data-viewer-action="hint"]')
    ?.addEventListener('click', e => {
      e.stopPropagation();
      viewerState.hintSystem.showNext();
    });
}
