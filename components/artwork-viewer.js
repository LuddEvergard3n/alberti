/**
 * artwork-viewer.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente central do sistema: visualizador de obra.
 *
 * Renderiza o layout completo de visualização:
 *   - Stage com imagem e overlay SVG de composição
 *   - Controles de zoom e overlay
 *   - Sidebar com título, artista, ficha técnica, análise formal
 *   - Painel de dica e navegação entre obras
 *
 * @param {Object} artwork - Objeto de obra
 * @param {Object} data    - Dados globais
 * @returns {string}       - HTML string
 */
export function renderArtworkViewer(artwork, data) {
  const artist = data.artists?.find(a => a.id === artwork.artist);
  const period = data.periods?.find(p => p.id === artwork.period);

  // Obras do mesmo artista para navegação
  const artistArtworks = data.artworks?.filter(a => a.artist === artwork.artist) || [];
  const currentIdx     = artistArtworks.findIndex(a => a.id === artwork.id);
  const prev           = artistArtworks[currentIdx - 1];
  const next           = artistArtworks[currentIdx + 1];
  const reproductionReady = artwork.mediaStatus !== 'pending-faithful-reproduction';

  return `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" style="margin-bottom:var(--space-5);" aria-label="Localização">
      <span class="breadcrumb-item">
        <a href="#/" class="breadcrumb-link">Início</a>
        <span class="breadcrumb-separator" aria-hidden="true">&#8250;</span>
      </span>
      ${artist ? `
        <span class="breadcrumb-item">
          <a href="#/artistas/${artist.id}" class="breadcrumb-link">${artist.name}</a>
          <span class="breadcrumb-separator" aria-hidden="true">&#8250;</span>
        </span>
      ` : ''}
      <span class="breadcrumb-item">
        <span class="breadcrumb-current">${artwork.title}</span>
      </span>
    </nav>

    <!-- Viewer principal -->
    <div class="artwork-viewer">

      <!-- Stage da imagem -->
      <div class="viewer-stage" data-zoomed="false" aria-label="Obra: ${artwork.title}">
        <div class="viewer-image-wrap">
          ${reproductionReady ? `<img
            src="${artwork.image || ''}"
            alt="${artwork.title}${artist ? ', ' + artist.name : ''}"
            class="viewer-img"
            loading="eager"
          >` : `<p class="viewer-image-unavailable">A reprodução de leitura está em verificação. A ficha e a análise continuam disponíveis.</p>`}
        </div>

        <!-- Overlay SVG de composição -->
        <svg class="composition-overlay-svg" viewBox="0 0 400 300"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Grade de terços — visível quando overlay-thirds ativo -->
          <g id="overlay-thirds" style="display:none;">
            <line x1="133" y1="0"   x2="133" y2="300" class="overlay-thirds"/>
            <line x1="267" y1="0"   x2="267" y2="300" class="overlay-thirds"/>
            <line x1="0"   y1="100" x2="400" y2="100" class="overlay-thirds"/>
            <line x1="0"   y1="200" x2="400" y2="200" class="overlay-thirds"/>
          </g>

          <!-- Linhas de fuga — visível quando overlay-fuga ativo -->
          <g id="overlay-fuga" style="display:none;">
            ${renderFugaLines(artwork.fuga_lines)}
          </g>

          <!-- Ponto focal — visível quando overlay-focal ativo -->
          <g id="overlay-focal" style="display:none;">
            ${renderFocalPoint(artwork.focal_point)}
          </g>

          <!-- Área de destaque — visível quando overlay-highlight ativo -->
          <g id="overlay-highlight" style="display:none;">
            ${renderHighlightArea(artwork.highlight_area)}
          </g>
        </svg>

        <!-- Controles do viewer -->
        <div class="viewer-controls" role="toolbar" aria-label="Controles do visualizador">
          <button class="viewer-ctrl-btn" data-viewer-action="zoom-in"
                  aria-label="Ampliar" title="Ampliar (+)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="viewer-ctrl-btn" data-viewer-action="zoom-out"
                  aria-label="Reduzir" title="Reduzir (-)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M4.5 7h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="viewer-ctrl-btn" data-viewer-action="zoom-reset"
                  aria-label="Resetar zoom" title="Resetar zoom (0)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 7A5 5 0 0 1 12 4M14 9A5 5 0 0 1 4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="viewer-ctrl-divider" aria-hidden="true"></div>

          <!-- Overlays -->
          <button class="viewer-ctrl-btn" data-overlay-type="thirds"
                  aria-label="Grade de terços" title="Grade de terços (T)" aria-pressed="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" stroke-width="1"/>
              <line x1="10.5" y1="1" x2="10.5" y2="15" stroke="currentColor" stroke-width="1"/>
              <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="currentColor" stroke-width="1"/>
              <line x1="1" y1="10.5" x2="15" y2="10.5" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button class="viewer-ctrl-btn" data-overlay-type="fuga"
                  aria-label="Linhas de fuga" title="Linhas de fuga (G)" aria-pressed="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 8L1 1M8 8L15 1M8 8l-7 7M8 8l7 7" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="viewer-ctrl-btn" data-overlay-type="focal"
                  aria-label="Ponto focal" title="Ponto focal (F)" aria-pressed="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>

          <div class="viewer-ctrl-divider" aria-hidden="true"></div>

          <!-- Dica -->
          <button class="viewer-ctrl-btn" data-viewer-action="hint"
                  aria-label="Mostrar dica visual" title="Dica">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 11V7.5M8 5.5V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div><!-- /viewer-stage -->

      <!-- Sidebar de informações -->
      <aside class="viewer-sidebar" aria-label="Informações da obra">

        <!-- Título e artista -->
        <div>
          <h1 class="viewer-title">${artwork.title}</h1>
          ${artist ? `
            <a href="#/artistas/${artist.id}" class="viewer-artist"
               aria-label="Ver artista: ${artist.name}">
              ${artist.name}
            </a>
          ` : ''}
        </div>

        <!-- Ficha técnica -->
        <div class="catalogue-meta panel-dark">
          ${artwork.year      ? `<div class="catalogue-row"><span class="catalogue-label">Ano</span><span class="catalogue-value">${artwork.year}</span></div>` : ''}
          ${artwork.technique ? `<div class="catalogue-row"><span class="catalogue-label">Técnica</span><span class="catalogue-value">${artwork.technique}</span></div>` : ''}
          ${period            ? `<div class="catalogue-row"><span class="catalogue-label">Período</span><span class="catalogue-value">${period.title}</span></div>` : ''}
          ${artwork.location  ? `<div class="catalogue-row"><span class="catalogue-label">Local</span><span class="catalogue-value">${artwork.location}</span></div>` : ''}
          ${artwork.dimensions? `<div class="catalogue-row"><span class="catalogue-label">Dimensões</span><span class="catalogue-value">${artwork.dimensions}</span></div>` : ''}
        </div>

        <!-- Descrição / análise formal -->
        ${artwork.description ? `
          <div class="viewer-analysis">
            <div class="viewer-analysis-title">Leitura formal</div>
            <p class="viewer-analysis-text">${artwork.description}</p>
          </div>
        ` : ''}

        <!-- Conceitos visuais -->
        ${artwork.concepts?.length ? `
          <div>
            <div class="viewer-analysis-title" style="margin-bottom:var(--space-2);">Conceitos</div>
            <div class="viewer-concepts">
              ${artwork.concepts.map(c => `
                <a href="#/linguagem/${c}" class="badge badge-concept">${c}</a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Navegação entre obras do artista -->
        ${(prev || next) ? `
          <div class="viewer-nav">
            ${prev ? `
              <a href="#/obra/${prev.id}" class="btn btn-ghost btn-sm" aria-label="Obra anterior: ${prev.title}">
                &larr; ${prev.title.length > 20 ? prev.title.slice(0, 20) + '…' : prev.title}
              </a>
            ` : '<span></span>'}
            ${next ? `
              <a href="#/obra/${next.id}" class="btn btn-ghost btn-sm" aria-label="Próxima obra: ${next.title}">
                ${next.title.length > 20 ? next.title.slice(0, 20) + '…' : next.title} &rarr;
              </a>
            ` : ''}
          </div>
        ` : ''}

        <!-- Ação de comparação -->
        <div>
          <a href="#/comparar" class="btn btn-secondary" style="width:100%; justify-content:center;"
             aria-label="Comparar com outra obra">
            Comparar com outra obra
          </a>
        </div>

      </aside><!-- /viewer-sidebar -->

    </div><!-- /artwork-viewer -->
  `;
}

/**
 * Renderiza linhas de fuga no SVG.
 * Usa pontos definidos em artwork.fuga_lines ou fallback padrão.
 *
 * @param {Object[]|undefined} lines - Array de {x1,y1,x2,y2} em 0-400/0-300
 * @returns {string}
 */
function renderFugaLines(lines) {
  if (lines && Array.isArray(lines)) {
    return lines.map(l =>
      `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" class="overlay-line-fuga"/>`
    ).join('');
  }
  return '';
}

/**
 * Renderiza o ponto focal no SVG.
 * Usa coordenada definida em artwork.focal_point ou fallback central.
 *
 * @param {{x:number,y:number}|undefined} point
 * @returns {string}
 */
function renderFocalPoint(point) {
  if (!point) return '';
  const cx = point.x;
  const cy = point.y;
  return `
    <circle cx="${cx}" cy="${cy}" r="20" class="overlay-focal"/>
    <circle cx="${cx}" cy="${cy}" r="5"  fill="rgba(167,120,61,0.6)"/>
    <line x1="${cx - 30}" y1="${cy}" x2="${cx - 24}" y2="${cy}" class="overlay-line" style="stroke-dasharray:none; opacity:0.5;"/>
    <line x1="${cx + 24}" y1="${cy}" x2="${cx + 30}" y2="${cy}" class="overlay-line" style="stroke-dasharray:none; opacity:0.5;"/>
    <line x1="${cx}" y1="${cy - 30}" x2="${cx}" y2="${cy - 24}" class="overlay-line" style="stroke-dasharray:none; opacity:0.5;"/>
    <line x1="${cx}" y1="${cy + 24}" x2="${cx}" y2="${cy + 30}" class="overlay-line" style="stroke-dasharray:none; opacity:0.5;"/>
  `;
}

/**
 * Renderiza uma área de destaque retangular no SVG.
 *
 * @param {{x:number,y:number,w:number,h:number}|undefined} area
 * @returns {string}
 */
function renderHighlightArea(area) {
  if (!area) return '';
  return `<rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}" class="overlay-highlight"/>`;
}
