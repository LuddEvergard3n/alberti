/**
 * gallery-grid.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de grade de galeria de obras.
 * Renderiza um grid de miniaturas clicáveis com overlay de legenda.
 *
 * @param {Object[]} artworks - Array de objetos de obra
 * @param {Object}   data     - Dados globais (para resolver artista)
 * @returns {string}          - HTML string para inserção via innerHTML
 */
export function renderGalleryGrid(artworks, data) {
  if (!artworks || artworks.length === 0) {
    return `<p style="color:var(--color-text-discrete);">Nenhuma obra disponível.</p>`;
  }

  return `
    <div class="gallery-grid">
      ${artworks.map(artwork => renderGalleryItem(artwork, data)).join('')}
    </div>
  `;
}

/**
 * Renderiza um item individual da galeria.
 *
 * @param {Object} artwork
 * @param {Object} data
 * @returns {string}
 */
function renderGalleryItem(artwork, data) {
  const artist = data.artists?.find(a => a.id === artwork.artist);
  const image = artwork.mediaStatus === 'pending-faithful-reproduction' ? '' : artwork.thumbnail || artwork.image || '';
  return `
    <article class="gallery-item" role="listitem" style="aspect-ratio: 3/4;"
             onclick="window.location.hash='/obra/${artwork.id}'"
             tabindex="0"
             onkeydown="if(event.key==='Enter'||event.key===' ')window.location.hash='/obra/${artwork.id}'"
             aria-label="${artwork.title}${artist ? ', ' + artist.name : ''}">
      ${image ? `<img
        src="${image}"
        alt="${artwork.title}${artist ? ', ' + artist.name : ''}"
        class="gallery-item-image"
        style="height:100%;"
        loading="lazy"
      >` : '<span class="gallery-item-fallback">Reprodução em verificação</span>'}
      <div class="gallery-item-overlay" aria-hidden="true">
        <div class="gallery-item-title">${artwork.title}</div>
        <div class="gallery-item-meta">${artist?.name || ''}${artwork.year ? ' — ' + artwork.year : ''}</div>
      </div>
    </article>
  `;
}
