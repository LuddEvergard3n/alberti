/**
 * hint-system.js
 * Alberti — Museu Interativo de Arte
 *
 * Sistema de dicas visuais contextuais.
 *
 * Filosofia:
 *   A dica deve ensinar o aluno a VER melhor, não entregar a resposta pronta.
 *   Cada dica é orientada ao olhar: destaca área, cor, linha ou forma.
 *
 * Responsabilidades:
 *   - Renderizar painel de dica contextual
 *   - Sequenciar dicas de uma obra
 *   - Ativar highlights visuais correspondentes à dica
 *   - Integrar com overlays SVG do viewer
 */

import { escapeHtml } from '../js/ui.js';

/**
 * @typedef {Object} Hint
 * @property {string}  text        - Texto da dica
 * @property {string}  [overlay]   - Tipo de overlay a ativar: 'thirds' | 'fuga' | 'focal'
 * @property {string}  [highlight] - Área a destacar: 'top' | 'center' | 'bottom' | 'left' | 'right'
 * @property {string}  [concept]   - Conceito relacionado (ex: 'perspectiva')
 */

/** ID do container de dicas no DOM */
const HINT_CONTAINER_ID = 'hint-panel-container';

export class HintSystem {
  /**
   * @param {Object} artwork - Objeto de obra do JSON
   */
  constructor(artwork) {
    /** @type {Object} */
    this.artwork = artwork;
    /** @type {Hint[]} */
    this.hints   = this._buildHints(artwork);
    /** @type {number} Índice da dica atual */
    this.index   = -1;
    /** @type {HTMLElement|null} */
    this.container = null;

    this._ensureContainer();
  }

  /**
   * Exibe a próxima dica na sequência.
   * Volta ao início ao atingir o fim.
   *
   * @returns {void}
   */
  showNext() {
    if (this.hints.length === 0) return;
    this.index = (this.index + 1) % this.hints.length;
    this._renderHint(this.hints[this.index]);
  }

  /**
   * Esconde o painel de dica.
   *
   * @returns {void}
   */
  hide() {
    if (this.container) this.container.innerHTML = '';
    this.index = -1;
  }

  /**
   * Garante que o container de dicas existe no DOM.
   * Cria-o abaixo do viewer-sidebar se não existir.
   *
   * @returns {void}
   * @private
   */
  _ensureContainer() {
    this.container = document.getElementById(HINT_CONTAINER_ID);
    if (this.container) return;

    const sidebar = document.querySelector('.viewer-sidebar');
    if (!sidebar) return;

    this.container = document.createElement('div');
    this.container.id = HINT_CONTAINER_ID;
    sidebar.appendChild(this.container);
  }

  /**
   * Renderiza uma dica no painel.
   *
   * @param {Hint} hint
   * @returns {void}
   * @private
   */
  _renderHint(hint) {
    if (!this.container) return;

    const total   = this.hints.length;
    const current = this.index + 1;

    this.container.innerHTML = `
      <div class="hint-panel" role="status" aria-live="polite">
        <div class="hint-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 6v4M7 4.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:var(--space-2);">
            <span style="font-family:var(--font-mono); font-size:var(--text-small); color:var(--color-brand-accent); letter-spacing:var(--tracking-wide);">
              DICA ${current}/${total}${hint.concept ? ' — ' + hint.concept.toUpperCase() : ''}
            </span>
            <button onclick="document.getElementById('${HINT_CONTAINER_ID}').innerHTML=''"
                    style="font-size:var(--text-small); color:var(--color-text-discrete); background:none; border:none; cursor:pointer;"
                    aria-label="Fechar dica">
              &times;
            </button>
          </div>
          <p class="hint-text">${escapeHtml(hint.text)}</p>
        </div>
      </div>
    `;

    // Ativar overlay relacionado, se especificado
    if (hint.overlay) {
      const btn = document.querySelector(`[data-overlay-type="${hint.overlay}"]`);
      if (btn && !btn.classList.contains('active')) btn.click();
    }
  }

  /**
   * Constrói sequência de dicas para a obra.
   * Usa hints definidos no JSON da obra, com fallback genérico.
   *
   * @param {Object} artwork
   * @returns {Hint[]}
   * @private
   */
  _buildHints(artwork) {
    // Dicas explícitas no JSON têm prioridade
    if (Array.isArray(artwork.hints) && artwork.hints.length > 0) {
      return artwork.hints;
    }

    // Fallback genérico baseado nos conceitos da obra
    const fallbacks = [];

    if (artwork.concepts?.includes('composição')) {
      fallbacks.push({
        text: 'Observe como o artista organiza os elementos. Existe uma hierarquia visual clara? Onde seu olhar vai primeiro?',
        overlay: 'thirds',
        concept: 'composição',
      });
    }

    if (artwork.concepts?.includes('perspectiva')) {
      fallbacks.push({
        text: 'Identifique as linhas de fuga. Para onde convergem? Qual ponto focal elas indicam?',
        overlay: 'fuga',
        concept: 'perspectiva',
      });
    }

    if (artwork.concepts?.includes('luz')) {
      fallbacks.push({
        text: 'Localize a fonte de luz. De onde ela vem? Quais áreas ficam em sombra? A luz dirige o olhar?',
        concept: 'luz',
      });
    }

    if (artwork.concepts?.includes('cor')) {
      fallbacks.push({
        text: 'Quais cores dominam? Existe contraste quente/frio? As cores criam zonas de tensão ou harmonia?',
        concept: 'cor',
      });
    }

    if (artwork.concepts?.includes('equilíbrio')) {
      fallbacks.push({
        text: 'Divida a obra ao meio. Os dois lados têm peso visual semelhante? O equilíbrio é simétrico ou dinâmico?',
        overlay: 'thirds',
        concept: 'equilíbrio',
      });
    }

    // Dica genérica mínima se nenhum conceito mapeado
    if (fallbacks.length === 0) {
      fallbacks.push({
        text: 'Observe a obra com calma. O que chama atenção primeiro? Por que seu olhar vai até lá?',
      });
    }

    return fallbacks;
  }
}
