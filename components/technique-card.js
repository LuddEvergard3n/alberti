/**
 * technique-card.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de card de técnica artística.
 * Exibe nome da técnica, descrição curta e exemplos de obras.
 *
 * @param {Object} technique - Objeto de técnica
 * @param {Object} data      - Dados globais
 * @returns {string}         - HTML string
 */
export function renderTechniqueCard(technique, data) {
  const examples = data.artworks
    ?.filter(a => a.technique === technique.id)
    .slice(0, 2) || [];

  return `
    <article class="card" role="listitem">
      <div class="card-body">
        <span class="card-eyebrow">${technique.category || 'Técnica'}</span>
        <h3 class="card-title">${technique.title}</h3>
        <p class="card-description">${technique.short_description || ''}</p>
        ${examples.length ? `
          <div style="margin-top:var(--space-3);">
            <span style="font-family:var(--font-mono); font-size:var(--text-small);
                         color:var(--color-text-discrete); letter-spacing:var(--tracking-wide);">
              EXEMPLOS
            </span>
            ${examples.map(a => `
              <a href="#/obra/${a.id}"
                 style="display:block; font-size:var(--text-caption);
                        color:var(--color-brand-primary); margin-top:var(--space-1);">
                ${a.title}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="card-footer">
        <span class="badge badge-technique">${technique.id}</span>
      </div>
    </article>
  `;
}
