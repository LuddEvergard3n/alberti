/**
 * comparison-view.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de comparação lado a lado entre duas obras.
 * Visual: mesa de observação, dados mínimos, espaço para análise guiada.
 *
 * @param {Object} a1   - Primeira obra
 * @param {Object} a2   - Segunda obra
 * @param {Object} data - Dados globais
 * @returns {string}    - HTML string
 */
export function renderComparisonView(a1, a2, data) {
  const artist1 = data.artists?.find(a => a.id === a1.artist);
  const artist2 = data.artists?.find(a => a.id === a2.artist);
  const period1 = data.periods?.find(p => p.id === a1.period);
  const period2 = data.periods?.find(p => p.id === a2.period);
  const image1 = a1.mediaStatus === 'pending-faithful-reproduction' ? '' : a1.image || '';
  const image2 = a2.mediaStatus === 'pending-faithful-reproduction' ? '' : a2.image || '';

  return `
    <div class="section-header">
      <span class="section-eyebrow">Análise comparativa</span>
      <h1 class="section-title">Comparação</h1>
    </div>

    <!-- Grade de comparação -->
    <div class="comparison-view">

      <!-- Painel esquerdo -->
      <div class="comparison-panel">
        <div class="comparison-panel-label" data-panel="Obra A">Obra A</div>
        ${image1 ? `<img
          src="${image1}"
          alt="${a1.title}${artist1 ? ', ' + artist1.name : ''}"
          class="comparison-panel-image"
          loading="eager"
        >` : `<p class="viewer-image-unavailable">Reprodução em verificação.</p>`}
        <div class="artwork-caption">
          <div class="artwork-caption-title">${a1.title}</div>
          <div class="artwork-caption-artist">${artist1?.name || ''}${a1.year ? ', ' + a1.year : ''}</div>
          <div class="artwork-caption-meta">${a1.technique || ''}${period1 ? ' — ' + period1.title : ''}</div>
        </div>
        <div class="viewer-concepts">
          ${(a1.concepts || []).map(c => `<span class="badge badge-concept">${c}</span>`).join('')}
        </div>
      </div>

      <!-- Painel direito -->
      <div class="comparison-panel">
        <div class="comparison-panel-label" data-panel="Obra B">Obra B</div>
        ${image2 ? `<img
          src="${image2}"
          alt="${a2.title}${artist2 ? ', ' + artist2.name : ''}"
          class="comparison-panel-image"
          loading="eager"
        >` : `<p class="viewer-image-unavailable">Reprodução em verificação.</p>`}
        <div class="artwork-caption">
          <div class="artwork-caption-title">${a2.title}</div>
          <div class="artwork-caption-artist">${artist2?.name || ''}${a2.year ? ', ' + a2.year : ''}</div>
          <div class="artwork-caption-meta">${a2.technique || ''}${period2 ? ' — ' + period2.title : ''}</div>
        </div>
        <div class="viewer-concepts">
          ${(a2.concepts || []).map(c => `<span class="badge badge-concept">${c}</span>`).join('')}
        </div>
      </div>

    </div><!-- /comparison-view -->

    <!-- Notas comparativas geradas pelo comparison-engine -->
    <div class="comparison-notes" style="margin-top: var(--space-6);">
      <div class="comparison-notes-title">Observações comparativas</div>
      <div class="comparison-notes-content">
        <p style="color:var(--color-text-discrete); font-size:var(--text-caption);">Carregando análise…</p>
      </div>
    </div>

    <!-- Ações -->
    <div class="flex gap-md" style="margin-top: var(--space-5);">
      <a href="#/comparar" class="btn btn-secondary">&larr; Escolher outra comparação</a>
      <a href="#/obra/${a1.id}" class="btn btn-ghost">Ver ${a1.title} em detalhe</a>
      <a href="#/obra/${a2.id}" class="btn btn-ghost">Ver ${a2.title} em detalhe</a>
    </div>
  `;
}
