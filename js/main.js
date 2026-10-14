/**
 * main.js
 * Alberti — Museu Interativo de Arte
 *
 * Ponto de entrada da aplicação.
 *
 * Responsabilidades:
 *   - Inicializar todos os subsistemas em ordem correta
 *   - Registrar todas as rotas
 *   - Renderizar a home ao carregar dados
 *   - Conectar handlers de rota aos engines e componentes
 */

import { loadAllData, getState, subscribe, setState } from './state.js';
import { initRouter, registerRoute, setNotFoundHandler } from './router.js';
import {
  showView,
  initToastContainer,
  initHeader,
  initTeacherPanel,
  initLazyLoading,
  setHTML,
  createSkeletonGrid,
  showToast,
} from './ui.js';
import { initAccessibility } from './accessibility.js';

// Componentes
import { renderGalleryGrid }   from '../components/gallery-grid.js';
import { renderArtworkViewer } from '../components/artwork-viewer.js';
import { renderArtistCard }    from '../components/artist-card.js';
import { renderMuseumRoom }    from '../components/museum-room.js';
import { renderTimelineViewer }from '../components/timeline-viewer.js';
import { renderComparisonView }from '../components/comparison-view.js';
import { renderExerciseEngine }from '../components/exercise-engine.js';
import { renderTechniqueCard } from '../components/technique-card.js';

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

/**
 * Inicializa todos os subsistemas na ordem correta:
 * 1. UI shell (header, toast, painel professor)
 * 2. Acessibilidade
 * 3. Dados (async)
 * 4. Lazy loading de imagens
 * 5. Rotas
 *
 * @returns {Promise<void>}
 */
/**
 * Detecta se a página está sendo aberta via file:// e exibe aviso.
 * OpaqueResponseBlocking no Firefox bloqueia imagens cross-origin
 * de origens nulas (file://). A solução é servir via HTTP.
 *
 * @returns {boolean} true se estiver rodando via file://
 */
function checkFileProtocol() {
  if (window.location.protocol !== 'file:') return false;

  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
    'background:#6E4B2A', 'color:#FBF8F2',
    'padding:0.75rem 1.5rem',
    'font-family:ui-monospace,monospace', 'font-size:0.82rem',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'gap:1rem', 'flex-wrap:wrap',
  ].join(';');

  banner.innerHTML = `
    <span>
      <strong>Alberti precisa de um servidor HTTP.</strong>
      Abrir via file:// bloqueia imagens por segurança do browser.
      Use: <code style="background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:3px;">
        python3 -m http.server 8080
      </code>
      e acesse <code style="background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:3px;">
        http://localhost:8080
      </code>
    </span>
    <button onclick="this.parentElement.remove()"
            style="background:rgba(255,255,255,0.20);border:none;color:inherit;
                   padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.82rem;
                   font-family:inherit;flex-shrink:0;">
      Fechar
    </button>
  `;

  document.body.prepend(banner);
  return true;
}

async function init() {
  // Verificar protocolo — file:// bloqueia imagens cross-origin
  checkFileProtocol();

  // 1. UI shell
  initToastContainer();
  initHeader();
  initTeacherPanel();

  // 2. Acessibilidade
  initAccessibility();

  // 3. Mostrar skeletons enquanto dados carregam
  showSkeletons();

  // 4. Carregar dados
  await loadAllData();

  const { data, error } = getState();

  if (error) {
    showToast('Erro ao carregar dados. Verifique a conexão.');
    console.error('[Main] Erro ao carregar dados:', error);
    return;
  }

  // 5. Lazy loading — loading="lazy" nativo, sem IntersectionObserver JS
  initLazyLoading(); // noop: mantido para compatibilidade de interface

  // 6. Registrar rotas
  registerRoutes();

  // 7. Inicializar roteador (resolve rota atual)
  initRouter();
}

/* =========================================================
   SKELETONS
   ========================================================= */

/**
 * Exibe skeletons nos grids da home enquanto dados não chegam.
 *
 * @returns {void}
 */
function showSkeletons() {
  const targets = {
    'linguagem-grid':     { count: 4, height: '200px' },
    'periods-grid':       { count: 3, height: '240px' },
    'museum-rooms-grid':  { count: 3, height: '300px' },
    'artists-grid':       { count: 3, height: '320px' },
    'studio-grid':        { count: 3, height: '240px' },
  };

  for (const [id, opts] of Object.entries(targets)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = createSkeletonGrid(opts.count, opts.height);
  }
}

/* =========================================================
   REGISTRO DE ROTAS
   ========================================================= */

/**
 * Registra todas as rotas da aplicação.
 *
 * @returns {void}
 */
function registerRoutes() {
  const { data } = getState();

  // ---- HOME ----
  registerRoute('', () => {
    showView('home');
    renderHome(data);
  });

  // ---- LINGUAGEM DA ARTE ----
  registerRoute('linguagem', () => {
    showView('linguagem');
    const container = document.getElementById('linguagem-view-content');
    if (!container) return;

    const concepts = data.modules.filter(m => m.type === 'concept');
    container.innerHTML = renderLanguageView(concepts, data);
  });

  registerRoute('linguagem/:conceptId', ({ conceptId }) => {
    showView('linguagem');
    const container = document.getElementById('linguagem-view-content');
    if (!container) return;

    const concept = data.modules.find(m => m.id === conceptId);
    if (!concept) { container.innerHTML = renderNotFoundContent('Conceito'); return; }

    const artworks = data.artworks.filter(a =>
      Array.isArray(a.concepts) && a.concepts.includes(conceptId)
    );
    container.innerHTML = renderConceptDetail(concept, artworks, data);
  });

  // ---- PERÍODOS ----
  registerRoute('periodos', () => {
    showView('periodos');
    const container = document.getElementById('periodos-view-content');
    if (!container) return;
    container.innerHTML = renderPeriodsView(data);
  });

  registerRoute('periodos/:periodId', ({ periodId }) => {
    showView('periodos');
    const container = document.getElementById('periodos-view-content');
    if (!container) return;

    const period = data.periods.find(p => p.id === periodId);
    if (!period) { container.innerHTML = renderNotFoundContent('Período'); return; }

    const artworks = data.artworks.filter(a => a.period === periodId);
    container.innerHTML = renderPeriodDetail(period, artworks, data);
  });

  // ---- ARTISTAS ----
  registerRoute('artistas', () => {
    showView('artistas');
    const container = document.getElementById('artistas-view-content');
    if (!container) return;
    container.innerHTML = renderArtistsView(data);
  });

  registerRoute('artistas/:artistId', ({ artistId }) => {
    showView('artista');
    const container = document.getElementById('artista-view-content');
    if (!container) return;

    const artist   = data.artists.find(a => a.id === artistId);
    if (!artist) { container.innerHTML = renderNotFoundContent('Artista'); return; }

    const artworks = data.artworks.filter(a => a.artist === artistId);
    container.innerHTML = renderArtistDetail(artist, artworks, data);
  });

  // ---- MUSEU ----
  registerRoute('museu', () => {
    showView('museu');
    const container = document.getElementById('museu-view-content');
    if (!container) return;
    container.innerHTML = renderMuseumView(data);
  });

  registerRoute('museu/:roomId', ({ roomId }) => {
    showView('museu');
    const container = document.getElementById('museu-view-content');
    if (!container) return;

    const room = data.modules.find(m => m.id === roomId && m.type === 'room');
    if (!room) { container.innerHTML = renderNotFoundContent('Sala'); return; }

    container.innerHTML = renderRoomDetail(room, data);
  });

  // ---- OBRA INDIVIDUAL ----
  registerRoute('obra/:artworkId', ({ artworkId }) => {
    showView('obra');
    const container = document.getElementById('obra-view-content');
    if (!container) return;

    const artwork = data.artworks.find(a => a.id === artworkId);
    if (!artwork) { container.innerHTML = renderNotFoundContent('Obra'); return; }

    setState({ activeArtworkId: artworkId });
    container.innerHTML = renderArtworkViewer(artwork, data);

    // Inicializar engine do viewer após renderizar
    import('../engine/viewer-engine.js').then(m => m.initViewer(artworkId));
  });

  // ---- ESTÚDIO ----
  registerRoute('studio', () => {
    showView('studio');
    const container = document.getElementById('studio-view-content');
    if (!container) return;
    container.innerHTML = renderStudioView(data);
  });

  registerRoute('studio/:exerciseId', ({ exerciseId }) => {
    showView('studio');
    const container = document.getElementById('studio-view-content');
    if (!container) return;

    const exercise = data.exercises.find(e => e.id === exerciseId);
    if (!exercise) { container.innerHTML = renderNotFoundContent('Exercício'); return; }

    container.innerHTML = renderExerciseEngine(exercise, data);
    import('../engine/feedback-engine.js').then(m => m.initExercise(exerciseId));
  });

  // ---- COMPARAR ----
  registerRoute('comparar', () => {
    showView('comparar');
    const container = document.getElementById('comparar-view-content');
    if (!container) return;
    container.innerHTML = renderComparisonSelect(data);
  });

  registerRoute('comparar/:id1/:id2', ({ id1, id2 }) => {
    showView('comparar');
    const container = document.getElementById('comparar-view-content');
    if (!container) return;

    const a1 = data.artworks.find(a => a.id === id1);
    const a2 = data.artworks.find(a => a.id === id2);

    if (!a1 || !a2) { container.innerHTML = renderNotFoundContent('Comparação'); return; }

    setState({ comparisonIds: [id1, id2] });
    container.innerHTML = renderComparisonView(a1, a2, data);
    import('../engine/comparison-engine.js').then(m => m.initComparison(id1, id2));
  });

  // ---- 404 ----
  setNotFoundHandler(({ path }) => {
    const active = document.querySelector('[data-view]:not(.hidden)');
    if (active) {
      active.innerHTML = renderNotFoundContent(`Página "${path}"`);
    }
  });
}

/* =========================================================
   RENDERIZAÇÃO DA HOME
   ========================================================= */

/**
 * Popula os grids da home com dados reais após carregamento.
 *
 * @param {Object}                        data
 * @returns {void}
 */
function renderHome(data) {
  // Grid: Linguagem da Arte
  const linguagemGrid = document.getElementById('linguagem-grid');
  if (linguagemGrid) {
    const concepts = data.modules.filter(m => m.type === 'concept').slice(0, 6);
    linguagemGrid.innerHTML = concepts.map(c => renderConceptCard(c)).join('');
  }

  // Grid: Períodos
  const periodsGrid = document.getElementById('periods-grid');
  if (periodsGrid) {
    const featured = data.periods.filter(p => p.featured).slice(0, 3);
    periodsGrid.innerHTML = featured.map(p => renderPeriodCard(p, data)).join('');
  }

  // Timeline
  const timelineTrack = document.getElementById('timeline-track');
  if (timelineTrack) {
    timelineTrack.innerHTML = renderTimelineViewer(data.periods);
  }

  // Grid: Salas do Museu
  const roomsGrid = document.getElementById('museum-rooms-grid');
  if (roomsGrid) {
    const rooms = data.modules.filter(m => m.type === 'room').slice(0, 3);
    roomsGrid.innerHTML = rooms.map(r => renderMuseumRoom(r, data)).join('');
  }

  // Grid: Artistas
  const artistsGrid = document.getElementById('artists-grid');
  if (artistsGrid) {
    const featured = data.artists.filter(a => a.featured).slice(0, 3);
    artistsGrid.innerHTML = featured.map(a => renderArtistCard(a, data)).join('');
  }

  // Grid: Estúdio
  const studioGrid = document.getElementById('studio-grid');
  if (studioGrid) {
    const exercises = data.exercises.slice(0, 3);
    studioGrid.innerHTML = exercises.map(e => renderExerciseCard(e)).join('');
  }

  // loading="lazy" nativo — sem IntersectionObserver necessário
}

/* =========================================================
   RENDERIZAÇÃO DE VIEWS
   (Funções de template — retornam HTML string)
   ========================================================= */

function renderLanguageView(concepts, data) {
  return `
    <div class="section-header">
      <span class="section-eyebrow">Fundamentos</span>
      <h1 class="section-title">Linguagem da Arte</h1>
      <p class="section-description">Os elementos formais que constituem toda obra visual. Aprender a ver começa aqui.</p>
    </div>
    <div class="auto-grid-3 stagger">
      ${concepts.map(c => renderConceptCard(c)).join('')}
    </div>
  `;
}

function renderConceptDetail(concept, artworks, data) {
  return `
    <div style="margin-bottom: var(--space-5);">
      <a href="#/linguagem" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Linguagem da Arte</a>
    </div>
    <div class="section-header">
      <span class="section-eyebrow">Conceito Visual</span>
      <h1 class="section-title">${concept.title}</h1>
      <p class="section-description">${concept.description || ''}</p>
    </div>
    ${concept.content ? `<div class="container-reading" style="margin-inline:0; margin-bottom:var(--space-6);">${concept.content}</div>` : ''}
    ${artworks.length ? `
      <h2 style="font-family:var(--font-heading); font-size:var(--text-subsection); margin-bottom:var(--space-4);">Obras que exemplificam</h2>
      <div class="gallery-grid">
        ${artworks.map(a => renderArtworkCard(a, data)).join('')}
      </div>
    ` : ''}
  `;
}

function renderPeriodsView(data) {
  return `
    <div class="section-header">
      <span class="section-eyebrow">História da Arte</span>
      <h1 class="section-title">Períodos</h1>
      <p class="section-description">A história da arte como sequência de visões de mundo, não apenas de estilos.</p>
    </div>
    <div class="timeline-container" style="margin-bottom: var(--space-7);">
      <div class="timeline-line"></div>
      <div class="timeline-track">
        ${renderTimelineViewer(data.periods)}
      </div>
    </div>
    <div class="auto-grid-3 stagger">
      ${data.periods.map(p => renderPeriodCard(p, data)).join('')}
    </div>
  `;
}

function renderPeriodDetail(period, artworks, data) {
  return `
    <div style="margin-bottom: var(--space-5);">
      <a href="#/periodos" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Períodos</a>
    </div>
    <div class="section-header">
      <span class="section-eyebrow">${period.years || ''}</span>
      <h1 class="section-title">${period.title}</h1>
      <p class="section-description">${period.description || ''}</p>
    </div>
    ${artworks.length ? `
      <div class="gallery-grid">
        ${artworks.map(a => renderArtworkCard(a, data)).join('')}
      </div>
    ` : '<p style="color:var(--color-text-discrete);">Obras sendo adicionadas.</p>'}
  `;
}

function renderArtistsView(data) {
  return `
    <div class="section-header">
      <span class="section-eyebrow">Mestres</span>
      <h1 class="section-title">Artistas</h1>
      <p class="section-description">A linguagem formal de cada artista, suas escolhas técnicas e seu lugar na história.</p>
    </div>
    <div class="auto-grid-3 stagger">
      ${data.artists.map(a => renderArtistCard(a, data)).join('')}
    </div>
  `;
}

function renderArtistDetail(artist, artworks, data) {
  return `
    <div style="margin-bottom: var(--space-5);">
      <a href="#/artistas" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Artistas</a>
    </div>
    <div class="section-header">
      <span class="section-eyebrow">${artist.period_label || ''} — ${artist.nationality || ''}</span>
      <h1 class="section-title">${artist.name}</h1>
      <p class="section-description">${artist.tagline || ''}</p>
    </div>
    <div class="auto-grid-2" style="margin-bottom: var(--space-7);">
      <div>
        <p style="font-size:var(--text-body); color:var(--color-text-secondary); line-height:var(--leading-relaxed);">${artist.biography || ''}</p>
      </div>
      <div class="panel-dark">
        <div class="catalogue-meta">
          ${artist.born   ? `<div class="catalogue-row"><span class="catalogue-label">Nascimento</span><span class="catalogue-value">${artist.born}</span></div>` : ''}
          ${artist.died   ? `<div class="catalogue-row"><span class="catalogue-label">Morte</span><span class="catalogue-value">${artist.died}</span></div>` : ''}
          ${artist.period ? `<div class="catalogue-row"><span class="catalogue-label">Período</span><span class="catalogue-value">${artist.period_label || artist.period}</span></div>` : ''}
          ${artist.technique_primary ? `<div class="catalogue-row"><span class="catalogue-label">Técnica</span><span class="catalogue-value">${artist.technique_primary}</span></div>` : ''}
        </div>
      </div>
    </div>
    ${artworks.length ? `
      <h2 style="font-family:var(--font-heading); font-size:var(--text-subsection); margin-bottom:var(--space-4);">Obras</h2>
      <div class="gallery-grid">
        ${artworks.map(a => renderArtworkCard(a, data)).join('')}
      </div>
    ` : ''}
  `;
}

function renderMuseumView(data) {
  const rooms = data.modules.filter(m => m.type === 'room');
  return `
    <div class="section-header">
      <span class="section-eyebrow">Coleção</span>
      <h1 class="section-title">Museu</h1>
      <p class="section-description">Salas temáticas com curadoria. Cada percurso une obras, contexto e leitura guiada.</p>
    </div>
    <div class="auto-grid-3 stagger museum-rooms-grid">
      ${rooms.map(r => renderMuseumRoom(r, data)).join('')}
    </div>
  `;
}

function renderRoomDetail(room, data) {
  const artworks = (room.artwork_ids || [])
    .map(id => data.artworks.find(a => a.id === id))
    .filter(Boolean);

  return `
    <div style="margin-bottom: var(--space-5);">
      <a href="#/museu" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Museu</a>
    </div>
    <div class="section-header">
      <span class="section-eyebrow">Sala ${room.room_number || ''}</span>
      <h1 class="section-title">${room.title}</h1>
      <p class="section-description">${room.description || ''}</p>
    </div>
    <div class="gallery-grid">
      ${artworks.map(a => renderArtworkCard(a, data)).join('')}
    </div>
  `;
}

function renderStudioView(data) {
  return `
    <div class="section-header">
      <span class="section-eyebrow">Prática</span>
      <h1 class="section-title">Estúdio</h1>
      <p class="section-description">Leitura visual e construção formal. Análise como um curador faria.</p>
    </div>
    <div class="auto-grid-3 stagger">
      ${data.exercises.map(e => renderExerciseCard(e)).join('')}
    </div>
  `;
}

function renderComparisonSelect(data) {
  const artworks = data.artworks;
  return `
    <div class="section-header">
      <span class="section-eyebrow">Análise</span>
      <h1 class="section-title">Comparar Obras</h1>
      <p class="section-description">Coloque duas obras lado a lado e analise linguagem, técnica, composição e período.</p>
    </div>
    <p style="color:var(--color-text-secondary); margin-bottom:var(--space-5);">
      Selecione duas obras para comparar, ou explore as comparações preparadas:
    </p>
    <div class="auto-grid-2" style="margin-bottom: var(--space-6);">
      ${data.comparisons.map(c => renderComparisonCard(c, data)).join('')}
    </div>
    <div class="section-header" style="margin-top: var(--space-6);">
      <h2 class="section-title" style="font-size: var(--text-subsection);">Todas as obras</h2>
    </div>
    <div class="gallery-grid">
      ${artworks.map(a => renderArtworkCard(a, data, true)).join('')}
    </div>
  `;
}

/* =========================================================
   RENDERIZAÇÃO DE COMPONENTES INDIVIDUAIS
   (Templates de card/item sem estado próprio)
   ========================================================= */

function renderConceptCard(concept) {
  return `
    <article class="card card-concept" role="listitem">
      <a href="#/linguagem/${concept.id}" class="card-body-sm" style="text-decoration:none; display:flex; flex-direction:column; gap:var(--space-2);">
        <div class="card-eyebrow">${concept.eyebrow || 'Elemento visual'}</div>
        <h3 class="card-title">${concept.title}</h3>
        <p class="card-description">${concept.short_description || ''}</p>
        <span class="btn btn-ghost btn-sm" style="margin-top:auto; padding-left:0; color:var(--color-brand-accent);">
          Explorar &rarr;
        </span>
      </a>
    </article>
  `;
}

function renderPeriodCard(period, data) {
  const artworks = data.artworks.filter(a => a.period === period.id).slice(0, 1);
  const thumb    = artworks[0]?.thumbnail || artworks[0]?.image || '';

  return `
    <article class="card" role="listitem">
      ${thumb ? `
        <div class="card-image" style="aspect-ratio: 16/9;">
          <img src="" alt="${period.title}" loading="lazy">
        </div>
      ` : ''}
      <div class="card-body">
        <span class="card-eyebrow">${period.years || ''}</span>
        <h3 class="card-title">${period.title}</h3>
        <p class="card-description">${period.short_description || ''}</p>
      </div>
      <div class="card-footer">
        <span class="badge badge-period">${period.id}</span>
        <a href="#/periodos/${period.id}" class="btn btn-ghost btn-sm">Ver período &rarr;</a>
      </div>
    </article>
  `;
}

function renderArtworkCard(artwork, data, selectable = false) {
  const artist = data.artists.find(a => a.id === artwork.artist);
  const target = selectable ? `#/comparar` : `#/obra/${artwork.id}`;
  const dataset = selectable ? `data-artwork-id="${artwork.id}"` : '';

  return `
    <article class="gallery-item" role="listitem" ${dataset} style="aspect-ratio: 3/4; cursor:pointer;"
             onclick="window.location.hash='${target.replace('#', '')}'">
      <img
        src=""
        alt="${artwork.title}${artist ? ', ' + artist.name : ''}"
        loading="lazy"
        class="gallery-item-image"
        style="height:100%;"
      >
      <div class="gallery-item-overlay">
        <div class="gallery-item-title">${artwork.title}</div>
        <div class="gallery-item-meta">${artist?.name || ''} — ${artwork.year || ''}</div>
      </div>
    </article>
  `;
}

function renderExerciseCard(exercise) {
  return `
    <article class="card" role="listitem">
      <div class="card-body">
        <span class="card-eyebrow">${exercise.type || 'Exercício'}</span>
        <h3 class="card-title">${exercise.title}</h3>
        <p class="card-description">${exercise.short_description || ''}</p>
        <div class="flex gap-sm" style="margin-top: var(--space-3); flex-wrap:wrap;">
          ${(exercise.concepts || []).map(c => `<span class="badge badge-concept">${c}</span>`).join('')}
        </div>
      </div>
      <div class="card-footer">
        <span style="font-family:var(--font-mono); font-size:var(--text-small); color:var(--color-text-discrete);">
          ${exercise.estimated_minutes ? exercise.estimated_minutes + ' min' : ''}
        </span>
        <a href="#/studio/${exercise.id}" class="btn btn-accent btn-sm">Iniciar &rarr;</a>
      </div>
    </article>
  `;
}

function renderComparisonCard(comparison, data) {
  return `
    <article class="card">
      <div class="card-body">
        <span class="card-eyebrow">Comparação preparada</span>
        <h3 class="card-title">${comparison.title}</h3>
        <p class="card-description">${comparison.description || ''}</p>
      </div>
      <div class="card-footer">
        <a href="#/comparar/${comparison.artwork_ids[0]}/${comparison.artwork_ids[1]}"
           class="btn btn-secondary btn-sm">
          Comparar &rarr;
        </a>
      </div>
    </article>
  `;
}

function renderNotFoundContent(label) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">&#9634;</div>
      <p class="empty-state-text">${label} não encontrado.</p>
      <a href="#/" class="btn btn-secondary" style="margin-top: var(--space-4);">Voltar ao início</a>
    </div>
  `;
}

/* =========================================================
   INICIAR
   ========================================================= */

init();
