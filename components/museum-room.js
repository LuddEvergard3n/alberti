/**
 * museum-room.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de sala do museu.
 * Visual: exposição temática com número de sala, título e grade de miniaturas.
 *
 * @param {Object} room - Objeto de módulo do tipo 'room'
 * @param {Object} data - Dados globais
 * @returns {string}    - HTML string
 */
export function renderMuseumRoom(room, data) {
  const artworks = (room.artwork_ids || [])
    .map(id => data.artworks?.find(a => a.id === id))
    .filter(Boolean)
    .slice(0, 6);

  const thumbCount = artworks.length;

  return `
    <article class="museum-room" role="listitem" style="position:relative;">
      <!-- Link cobre o card inteiro sem display:contents (inconsistente no Firefox) -->
      <a href="#/museu/${room.id}"
         aria-label="Entrar na sala: ${room.title}"
         style="position:absolute; inset:0; z-index:1; border-radius:var(--radius-lg);"
         tabindex="0"></a>

        <div class="museum-room-header">
          <span class="museum-room-number" aria-hidden="true">
            ${String(room.room_number || '01').padStart(2, '0')}
          </span>
          <div class="museum-room-info">
            <h3 class="museum-room-title">${room.title}</h3>
            <span class="museum-room-curator">${room.curator_note || room.description?.slice(0, 80) + '…' || ''}</span>
          </div>
        </div>

        ${thumbCount > 0 ? `
          <div class="museum-room-gallery"
               style="grid-template-columns: repeat(${Math.min(thumbCount, 3)}, 1fr);"
               aria-hidden="true">
            ${artworks.slice(0, 3).map(a => `
              <div class="museum-room-thumb">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
                  alt="${a.title}"
                  loading="lazy"
                >
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="height:120px; background:var(--color-bg-deep);
                      display:flex; align-items:center; justify-content:center;
                      color:var(--color-text-discrete); font-size:var(--text-small);
                      font-family:var(--font-mono);">
            Obras sendo adicionadas
          </div>
        `}

        <div class="museum-room-footer">
          <span class="museum-room-count">
            ${thumbCount} ${thumbCount === 1 ? 'obra' : 'obras'}
          </span>
          <span class="btn btn-ghost btn-sm" style="color:var(--color-brand-accent);">
            Entrar na sala &rarr;
          </span>
        </div>

    </article>
  `;
}
