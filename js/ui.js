/**
 * ui.js
 * Alberti — Museu Interativo de Arte
 *
 * Utilitários de interface.
 *
 * Responsabilidades:
 *   - Alternar entre views do SPA
 *   - Exibir e fechar notificações (toast)
 *   - Gerenciar painel do professor
 *   - Comportamento do header (scroll, mobile menu)
 *   - Helpers de criação de elementos DOM
 *   - Animações de entrada/saída
 */

/* =========================================================
   GERENCIAMENTO DE VIEWS
   ========================================================= */

/**
 * Mostra a view especificada e esconde todas as outras.
 * Views são identificadas pelo atributo data-view.
 *
 * @param {string} viewName - Nome da view (ex: 'home', 'museu')
 * @returns {void}
 */
export function showView(viewName) {
  const views = document.querySelectorAll('[data-view]');

  views.forEach(view => {
    const isTarget = view.dataset.view === viewName;
    view.classList.toggle('hidden', !isTarget);

    if (isTarget) {
      // Disparar animação de entrada
      view.classList.remove('fade-in');
      // Reflow forçado para reiniciar animação
      void view.offsetWidth;
      view.classList.add('fade-in');
    }
  });
}

/**
 * Retorna o elemento da view ativa.
 *
 * @returns {HTMLElement|null}
 */
export function getActiveViewElement() {
  return document.querySelector('[data-view]:not(.hidden)') || null;
}

/* =========================================================
   TOAST (NOTIFICAÇÕES)
   ========================================================= */

/** @type {HTMLElement|null} */
let toastContainer = null;

/**
 * Inicializa o container de toasts.
 * Deve ser chamado uma vez em main.js.
 *
 * @returns {void}
 */
export function initToastContainer() {
  toastContainer = document.getElementById('toast-container');
}

/**
 * Exibe uma notificação temporária (toast).
 *
 * @param {string}  message  - Texto da notificação
 * @param {number}  duration - Duração em ms (padrão: 3000)
 * @returns {void}
 */
export function showToast(message, duration = 3000) {
  if (!toastContainer) {
    console.warn('[UI] Toast container não inicializado');
    return;
  }

  const toast = createElement('div', { className: 'toast', role: 'alert' });
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* =========================================================
   PAINEL DO PROFESSOR
   ========================================================= */

/** @type {HTMLElement|null} */
let teacherPanel = null;

/**
 * Inicializa o painel do professor.
 * Configura os botões de abertura e fechamento.
 *
 * @returns {void}
 */
export function initTeacherPanel() {
  teacherPanel = document.getElementById('teacher-panel');
  const btnOpen         = document.getElementById('btn-teacher-mode');
  const btnOpenMobile   = document.getElementById('btn-teacher-mode-mobile');
  const btnClose        = document.getElementById('btn-close-teacher');

  if (!teacherPanel) return;

  const open = () => {
    teacherPanel.classList.add('open');
    teacherPanel.setAttribute('aria-hidden', 'false');
    btnClose?.focus();
  };

  const close = () => {
    teacherPanel.classList.remove('open');
    teacherPanel.setAttribute('aria-hidden', 'true');
    btnOpen?.focus();
  };

  btnOpen?.addEventListener('click', open);
  btnOpenMobile?.addEventListener('click', open);
  btnClose?.addEventListener('click', close);

  // Fechar com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && teacherPanel.classList.contains('open')) {
      close();
    }
  });
}

/**
 * Atualiza o conteúdo do painel do professor.
 * Chamado pelo lesson-engine ao mudar de lição.
 *
 * @param {Object} data - Dados para o painel do professor
 * @param {string} data.objective       - Objetivo da lição
 * @param {string} data.centralConcept  - Conceito formal central
 * @param {string} data.technique       - Técnica destacada
 * @param {string} data.context         - Contexto resumido
 * @param {string} data.mediation       - Mediação sugerida
 * @param {string} data.criteria        - Critério das atividades
 * @param {string} data.estimatedTime   - Tempo estimado
 * @returns {void}
 */
export function updateTeacherPanel(data) {
  const content = document.getElementById('teacher-panel-content');
  if (!content) return;

  const items = [
    { label: 'Objetivo',          value: data.objective      },
    { label: 'Conceito central',  value: data.centralConcept },
    { label: 'Técnica',           value: data.technique      },
    { label: 'Contexto',          value: data.context        },
    { label: 'Mediação',          value: data.mediation      },
    { label: 'Critério',          value: data.criteria       },
    { label: 'Tempo estimado',    value: data.estimatedTime  },
  ];

  content.innerHTML = items
    .filter(i => i.value)
    .map(i => `
      <div class="teacher-panel-item">
        <div class="teacher-item-label">${escapeHtml(i.label)}</div>
        <div class="teacher-item-content">${escapeHtml(i.value)}</div>
      </div>
    `)
    .join('');
}

/* =========================================================
   HEADER
   ========================================================= */

/**
 * Inicializa o comportamento do header.
 *
 * - Adiciona classe 'scrolled' ao fazer scroll
 * - Gerencia menu mobile
 *
 * @returns {void}
 */
export function initHeader() {
  const header  = document.getElementById('site-header');
  const btnMenu = document.getElementById('btn-menu');
  const drawer  = document.getElementById('nav-drawer');

  if (!header) return;

  // Scroll behavior
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  if (btnMenu && drawer) {
    const toggle = () => {
      const isOpen = drawer.classList.toggle('open');
      btnMenu.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));

      // Bloquear scroll do body quando drawer aberto
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    btnMenu.addEventListener('click', toggle);

    // Fechar ao clicar em link do drawer
    drawer.addEventListener('click', e => {
      if (e.target.matches('a[href]')) {
        drawer.classList.remove('open');
        btnMenu.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    // Fechar com Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        btnMenu.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        btnMenu.focus();
      }
    });
  }
}

/* =========================================================
   HELPERS DE CRIAÇÃO DE ELEMENTOS DOM
   ========================================================= */

/**
 * Cria um elemento HTML com atributos e filho(s) opcionais.
 * Helper para evitar verbosidade do DOM API.
 *
 * @param {string}  tag        - Tag HTML (ex: 'div', 'article')
 * @param {Object}  [attrs={}] - Atributos a setar (className, id, etc.)
 * @param {...(Node|string)} children - Filhos a inserir
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      el.setAttribute(key, val);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Insere HTML string em um elemento, substituindo o conteúdo.
 * Variante segura — não executa scripts embutidos.
 *
 * @param {HTMLElement} container - Elemento alvo
 * @param {string}      html      - HTML a inserir
 * @returns {void}
 */
export function setHTML(container, html) {
  container.innerHTML = html;
}

/**
 * Escapa caracteres especiais HTML para prevenção de XSS.
 *
 * @param {string} str - String a escapar
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================
   LAZY LOADING DE IMAGENS
   ========================================================= */

/**
 * Lazy loading de imagens.
 *
 * A partir da v1.0.6, todas as imagens usam src= direto com loading="lazy"
 * nativo do HTML. O loading nativo não passa pelo filtro OpaqueResponseBlocking
 * do Firefox, ao contrário de requests iniciados por JavaScript.
 *
 * Esta função é mantida para compatibilidade mas não faz nada com a
 * estratégia atual — loading="lazy" é gerenciado pelo browser.
 *
 * @returns {undefined}
 */
export function initLazyLoading() {
  // Noop: loading="lazy" nativo é suficiente e compatível com todos os
  // browsers alvo (Chrome 76+, Firefox 75+, Edge 79+, Opera 63+, Brave).
  return undefined;
}

/**
 * Stub de compatibilidade — não utilizado com loading="lazy" nativo.
 *
 * @returns {void}
 */
export function observeLazyImages() {
  // Noop: ver initLazyLoading().
}

/* =========================================================
   SKELETON LOADING
   ========================================================= */

/**
 * Gera HTML de skeleton para um grid de cards.
 *
 * @param {number} count  - Número de cards skeleton
 * @param {string} height - Altura do skeleton (ex: '280px')
 * @returns {string} HTML string
 */
export function createSkeletonGrid(count = 4, height = '280px') {
  return Array.from({ length: count })
    .map(() => `
      <div class="card" aria-hidden="true">
        <div class="skeleton" style="height: ${height};"></div>
        <div class="card-body">
          <div class="skeleton" style="height: 1rem; width: 40%; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 1.25rem; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 0.875rem; width: 80%;"></div>
        </div>
      </div>
    `)
    .join('');
}
