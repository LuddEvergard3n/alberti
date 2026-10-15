/**
 * exercise-engine.js
 * Alberti — Museu Interativo de Arte
 *
 * Componente de renderização de exercício do Estúdio.
 * Renderiza o HTML inicial do exercício; a avaliação é feita pelo feedback-engine.
 *
 * @param {Object} exercise - Objeto de exercício
 * @param {Object} data     - Dados globais
 * @returns {string}        - HTML string
 */
export function renderExerciseEngine(exercise, data) {
  const artwork = exercise.artwork_id
    ? data.artworks?.find(a => a.id === exercise.artwork_id)
    : null;
  const artist  = artwork ? data.artists?.find(a => a.id === artwork.artist) : null;
  const reproductionReady = artwork?.mediaStatus !== 'pending-faithful-reproduction';

  return `
    <!-- Cabeçalho do exercício -->
    <div style="margin-bottom: var(--space-5);">
      <a href="#/studio" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Estúdio</a>
    </div>

    <div class="studio-exercise" data-exercise-root>
      <div class="studio-exercise-header">
        <div>
          <div class="studio-exercise-type">${exercise.type || 'Exercício visual'}</div>
          <h1 class="studio-exercise-title">${exercise.title}</h1>
        </div>
        ${exercise.estimated_minutes ? `
          <span style="font-family:var(--font-mono); font-size:var(--text-small);
                       color:var(--color-text-discrete); margin-left:auto; flex-shrink:0;">
            ~${exercise.estimated_minutes} min
          </span>
        ` : ''}
      </div>

      <div class="studio-exercise-body">

        <!-- Instrução -->
        <p class="studio-exercise-instruction">${exercise.instruction || exercise.short_description || ''}</p>

        <!-- Imagem de referência com canvas de interação -->
        ${artwork ? `
          <div style="margin-bottom: var(--space-5);">
            <div class="studio-canvas-wrap" style="position:relative;">
              ${reproductionReady ? `<img
                src="${artwork.image || ''}"
                alt="${artwork.title}${artist ? ', ' + artist.name : ''}"
                style="width:100%; max-height:480px; object-fit:contain; display:block;"
                loading="eager"
              >` : `<p class="viewer-image-unavailable">A reprodução desta atividade está em verificação. Escolha outra atividade enquanto o acervo é concluído.</p>`}
              ${reproductionReady && exercise.type === 'identification' ? `
                <canvas class="studio-canvas"
                        width="800" height="600"
                        style="position:absolute; inset:0; width:100%; height:100%;"
                        aria-label="Clique na área que indica ${exercise.target_label || 'o elemento pedido'}">
                </canvas>
              ` : ''}
            </div>
            <div class="artwork-caption" style="max-width:100%;">
              <div class="artwork-caption-title">${artwork.title}</div>
              <div class="artwork-caption-artist">${artist?.name || ''}${artwork.year ? ', ' + artwork.year : ''}</div>
            </div>
          </div>
        ` : ''}

        <!-- Opções de classificação -->
        ${exercise.type === 'classification' && exercise.options ? `
          <div style="display:flex; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-5);" role="group"
               aria-label="Selecione uma opção">
            ${exercise.options.map(opt => `
              <button class="filter-pill" data-option="${opt.value}"
                      aria-pressed="false">
                ${opt.label}
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${exercise.type === 'reflection' ? `
          <label class="sr-only" for="exercise-response-${exercise.id}">Sua observação</label>
          <textarea id="exercise-response-${exercise.id}" class="exercise-response"
                    data-exercise-response rows="6"
                    placeholder="Registre sua observação apoiando-se nos elementos visíveis da obra."></textarea>
        ` : ''}

        <!-- Ações -->
        <div class="studio-exercise-actions">
          <button class="btn btn-primary" data-exercise-action="submit">
            Verificar observação
          </button>
          <button class="btn btn-ghost" data-exercise-action="reset"
                  aria-label="Limpar e recomeçar">
            Recomeçar
          </button>
        </div>

        <!-- Container de feedback — preenchido pelo feedback-engine -->
        <div class="exercise-feedback" aria-live="polite" aria-atomic="true"></div>

        <!-- Indicador de conclusão (oculto até completar) -->
        <div class="exercise-completed-indicator"
             style="display:none; margin-top:var(--space-4); padding:var(--space-3);
                    background:rgba(167,120,61,0.08); border-radius:var(--radius-md);
                    font-size:var(--text-caption); color:var(--color-brand-primary);">
          Este exercício foi concluído anteriormente.
        </div>

      </div><!-- /studio-exercise-body -->
    </div><!-- /studio-exercise -->

    <!-- Critérios (Modo Professor — visível via painel) -->
    <template id="teacher-data"
              data-objective="${exercise.teacher?.objective || ''}"
              data-concept="${exercise.teacher?.central_concept || ''}"
              data-technique="${exercise.teacher?.technique || ''}"
              data-context="${exercise.teacher?.context || ''}"
              data-mediation="${exercise.teacher?.mediation || ''}"
              data-criteria="${exercise.teacher?.criteria || ''}"
              data-time="${exercise.estimated_minutes ? exercise.estimated_minutes + ' minutos' : ''}">
    </template>
  `;
}
