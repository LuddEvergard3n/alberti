/**
 * comparison-engine.js
 * Alberti — Museu Interativo de Arte
 *
 * Engine de comparação entre duas obras.
 *
 * Responsabilidades:
 *   - Inicializar o slider de divisão visual
 *   - Sincronizar overlays entre os painéis
 *   - Gerar observações comparativas automáticas
 *   - Gerenciar interação por teclado no comparador
 */

import { getState } from '../js/state.js';

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa o engine de comparação.
 * Chamado por main.js após renderizar o HTML da comparação.
 *
 * @param {string} id1 - ID da primeira obra
 * @param {string} id2 - ID da segunda obra
 * @returns {void}
 */
export function initComparison(id1, id2) {
  initComparisonSlider();
  initSyncOverlays();
  generateComparativeNotes(id1, id2);
}

/* =========================================================
   SLIDER DE DIVISÃO
   ========================================================= */

/**
 * Inicializa o slider interativo de divisão between duas imagens.
 * O slider permite revelar uma imagem sobre a outra arrastando.
 *
 * @returns {void}
 */
function initComparisonSlider() {
  const slider = document.querySelector('.comparison-slider');
  if (!slider) return;

  const handle    = slider.querySelector('.comparison-slider-handle');
  const rightPane = slider.querySelector('.comparison-slider-right');
  if (!handle || !rightPane) return;

  let isDragging = false;

  const setPosition = (clientX) => {
    const rect   = slider.getBoundingClientRect();
    const relX   = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct    = (relX / rect.width) * 100;

    handle.style.left       = `${pct}%`;
    rightPane.style.left    = `${pct}%`;
    rightPane.style.width   = `${100 - pct}%`;
  };

  // Mouse
  handle.addEventListener('mousedown', () => { isDragging = true; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    setPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  handle.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  // Teclado no handle
  handle.setAttribute('tabindex', '0');
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-label', 'Divisor de comparação');
  handle.setAttribute('aria-valuenow', '50');
  handle.setAttribute('aria-valuemin', '0');
  handle.setAttribute('aria-valuemax', '100');

  handle.addEventListener('keydown', e => {
    const rect     = slider.getBoundingClientRect();
    const currentX = (parseFloat(handle.style.left) / 100) * rect.width + rect.left;
    const step     = rect.width * 0.05; // 5% por passo

    if (e.key === 'ArrowLeft')  { e.preventDefault(); setPosition(currentX - step); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPosition(currentX + step); }
  });
}

/* =========================================================
   SINCRONIZAÇÃO DE OVERLAYS
   ========================================================= */

/**
 * Sincroniza overlays entre os dois painéis de comparação.
 * Quando um overlay é ativado em um painel, reflete no outro.
 *
 * @returns {void}
 */
function initSyncOverlays() {
  const panels = document.querySelectorAll('.comparison-panel');
  if (panels.length < 2) return;

  panels.forEach((panel, panelIdx) => {
    panel.querySelectorAll('[data-overlay-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type       = btn.dataset.overlayType;
        const otherPanel = panels[panelIdx === 0 ? 1 : 0];
        const mirror     = otherPanel.querySelector(`[data-overlay-type="${type}"]`);

        // Espelhar estado no painel oposto
        if (mirror && btn.classList.contains('active') !== mirror.classList.contains('active')) {
          mirror.click();
        }
      });
    });
  });
}

/* =========================================================
   NOTAS COMPARATIVAS AUTOMÁTICAS
   ========================================================= */

/**
 * Gera observações comparativas automáticas entre duas obras.
 * Analisa período, técnica, conceitos e artista.
 * Insere o resultado no container .comparison-notes-content.
 *
 * @param {string} id1
 * @param {string} id2
 * @returns {void}
 */
function generateComparativeNotes(id1, id2) {
  const container = document.querySelector('.comparison-notes-content');
  if (!container) return;

  const { data } = getState();
  const a1 = data.artworks.find(a => a.id === id1);
  const a2 = data.artworks.find(a => a.id === id2);

  if (!a1 || !a2) return;

  const notes = [];

  // Período
  if (a1.period !== a2.period) {
    const p1 = data.periods.find(p => p.id === a1.period);
    const p2 = data.periods.find(p => p.id === a2.period);
    notes.push(`Períodos distintos: <strong>${p1?.title || a1.period}</strong> e <strong>${p2?.title || a2.period}</strong>. Observe as diferenças de linguagem visual entre os dois contextos.`);
  } else {
    const p = data.periods.find(p => p.id === a1.period);
    notes.push(`Ambas as obras pertencem ao mesmo período: <strong>${p?.title || a1.period}</strong>. Compare as diferenças dentro de uma mesma visão de mundo.`);
  }

  // Técnica
  if (a1.technique !== a2.technique) {
    notes.push(`Técnicas diferentes: <em>${a1.technique}</em> e <em>${a2.technique}</em>. Como a técnica influencia a superfície, a cor e a textura visíveis?`);
  }

  // Conceitos compartilhados
  const shared = (a1.concepts || []).filter(c => (a2.concepts || []).includes(c));
  if (shared.length > 0) {
    notes.push(`Conceitos comuns: <strong>${shared.join(', ')}</strong>. Como cada obra aborda esses elementos de forma diferente?`);
  }

  // Artista
  if (a1.artist !== a2.artist) {
    const ar1 = data.artists.find(a => a.id === a1.artist);
    const ar2 = data.artists.find(a => a.id === a2.artist);
    if (ar1 && ar2 && ar1.period === ar2.period) {
      notes.push(`Artistas diferentes no mesmo período. Compare as escolhas formais individuais de <strong>${ar1.name}</strong> e <strong>${ar2.name}</strong>.`);
    }
  }

  if (notes.length === 0) {
    notes.push('Observe atentamente as duas obras. O que as aproxima? O que as diferencia?');
  }

  container.innerHTML = notes
    .map(n => `<p style="font-size:var(--text-caption); color:var(--color-text-secondary); line-height:var(--leading-relaxed); margin-bottom:var(--space-3);">${n}</p>`)
    .join('');
}
