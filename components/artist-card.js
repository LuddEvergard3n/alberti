/**
 * artist-card.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de card de artista.
 * Visual: catálogo resumido com retrato, nome, período e linguagem.
 *
 * @param {Object} artist - Objeto de artista
 * @param {Object} data   - Dados globais
 * @returns {string}      - HTML string
 */
export function renderArtistCard(artist, data) {
  const artworkCount = data.artworks?.filter(a => a.artist === artist.id).length || 0;
  const period       = data.periods?.find(p => p.id === artist.period);

  return `
    <article class="card card-artist" role="listitem" style="position:relative;">
      <!-- display:contents em <a> tem comportamento inconsistente no Firefox.
           Usamos position:absolute para cobrir o card sem quebrar a estrutura. -->
      <a href="#/artistas/${artist.id}"
         aria-label="Ver artista: ${artist.name}"
         style="position:absolute; inset:0; z-index:1; border-radius:var(--radius-md);"
         tabindex="0"></a>
      <div class="card-image" style="aspect-ratio:1/1;">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
            alt="Retrato de ${artist.name}"
            loading="lazy"
          >
          ${!artist.portrait ? `
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                        background:var(--color-bg-deep); color:var(--color-text-discrete);">
              <span style="font-family:var(--font-display); font-size:3rem; font-weight:300;">
                ${artist.name.charAt(0)}
              </span>
            </div>
          ` : ''}
        </div>
        <div class="card-body">
          <span class="card-eyebrow">${period?.title || artist.period_label || ''}</span>
          <h3 class="card-title">${artist.name}</h3>
          <p class="card-description">${artist.tagline || ''}</p>
        </div>
        <div class="card-footer">
          <span class="badge badge-period">${artist.nationality || ''}</span>
          <span style="font-family:var(--font-mono); font-size:var(--text-small); color:var(--color-text-discrete);">
            ${artworkCount} ${artworkCount === 1 ? 'obra' : 'obras'}
          </span>
        </div>
          </article>
  `;
}
