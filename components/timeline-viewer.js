/**
 * timeline-viewer.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de linha do tempo de períodos.
 * Visual: linha curatorial elegante, não timeline de dashboard.
 *
 * @param {Object[]} periods - Array de períodos ordenados cronologicamente
 * @returns {string}         - HTML string dos itens do timeline-track
 */
export function renderTimelineViewer(periods) {
  if (!periods || periods.length === 0) return '';

  return periods.map((period, i) => `
    <div class="timeline-period" role="listitem" tabindex="0"
         onclick="window.location.hash='/periodos/${period.id}'"
         onkeydown="if(event.key==='Enter'||event.key===' ')window.location.hash='/periodos/${period.id}'"
         aria-label="${period.title}${period.years ? ', ' + period.years : ''}">
      <div class="timeline-node" aria-hidden="true"></div>
      <div class="timeline-year">${period.years || ''}</div>
      <div class="timeline-label">${period.title}</div>
    </div>
  `).join('');
}
