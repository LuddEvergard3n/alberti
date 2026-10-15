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
import { recordArtworkVisit } from './progress.js';
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
  escapeHtml,
} from './ui.js';
import { initAccessibility } from './accessibility.js';

// Componentes
import { renderGalleryGrid }   from '../components/gallery-grid.js';
import { renderArtworkViewer } from '../components/artwork-viewer.js';
import { renderArtistCard }    from '../components/artist-card.js?v=14';
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
        node server.js
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
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js?v=24').catch(error => console.warn('[Alberti] Service Worker indisponível:', error));
  }

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
    recordArtworkVisit(artworkId);
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

  registerRoute('aula/:lessonId', ({ lessonId }) => {
    showView('aula');
    const container = document.getElementById('aula-view-content');
    const lesson = data.lessons.find(item => item.id === lessonId);
    if (!container) return;
    if (!lesson) { container.innerHTML = renderNotFoundContent('Aula'); return; }
    container.innerHTML = renderLesson(lesson, data);
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

  // ---- PÁGINAS DE APOIO ----
  registerRoute('plano-aula', () => {
    showView('plano-aula');
    const container = document.getElementById('plano-aula-view-content');
    if (container) {
      container.innerHTML = renderLessonPlanView(data);
      initLessonPlanBuilder(data);
    }
  });

  registerRoute('sobre', () => {
    showView('sobre');
    const container = document.getElementById('sobre-view-content');
    if (container) container.innerHTML = renderAboutView();
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

function renderLesson(lesson, data) {
  const artworks = data.artworks.filter(artwork => lesson.artwork_ids.includes(artwork.id));
  const exercises = data.exercises.filter(exercise => lesson.exercise_ids.includes(exercise.id));
  return `
    <div style="margin-bottom: var(--space-5);"><a href="#/periodos" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Períodos</a></div>
    <div class="section-header">
      <span class="section-eyebrow">Aula guiada</span>
      <h1 class="section-title">${escapeHtml(lesson.title)}</h1>
      <p class="section-description">Observe as obras, formule uma hipótese e confira-a nas atividades propostas.</p>
    </div>
    <section class="container-reading" style="margin-inline:0; margin-bottom:var(--space-6);">
      <h2 style="font-family:var(--font-heading); font-size:var(--text-subsection);">Obras para observar</h2>
      <div class="gallery-grid">${artworks.map(artwork => renderArtworkCard(artwork, data)).join('')}</div>
    </section>
    <section style="margin-bottom:var(--space-6);">
      <h2 style="font-family:var(--font-heading); font-size:var(--text-subsection);">Prática guiada</h2>
      <div class="auto-grid-3">${exercises.map(renderExerciseCard).join('')}</div>
    </section>
    <p style="font-family:var(--font-mono);font-size:var(--text-small);color:var(--color-text-discrete);">Revisão editorial: ${escapeHtml(lesson.lastReviewed || 'pendente')}</p>
  `;
}

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
  const lessons = data.lessons.filter(lesson => lesson.artwork_ids.some(id => artworks.some(artwork => artwork.id === id)));
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
    ${lessons.length ? `<section class="section-block" aria-labelledby="period-lessons"><h2 id="period-lessons" class="section-subtitle">Aulas relacionadas</h2><div class="card-grid">${lessons.map(lesson => `<a class="card card--compact" href="#/aula/${encodeURIComponent(lesson.id)}"><span class="card-eyebrow">Aula</span><strong>${escapeHtml(lesson.title)}</strong></a>`).join('')}</div></section>` : ''}
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
  const isReference = Boolean(artist.catalogue_role);
  const profile = isReference ? `
    <div class="artist-reference-layout" style="margin-bottom:var(--space-7);">
      <figure class="artist-reference-portrait">
        <img src="${escapeHtml(artist.portrait)}" alt="Retrato de ${escapeHtml(artist.name)}">
      </figure>
      <div class="artist-reference-copy">
        <p style="font-size:var(--text-body);color:var(--color-text-secondary);line-height:var(--leading-relaxed);">${escapeHtml(artist.biography || '')}</p>
        <section class="artist-reference-note" aria-labelledby="artist-reference-title">
          <h2 id="artist-reference-title">Referência do museu</h2>
          <p>Alberti integra o catálogo por sua contribuição à reflexão sobre a imagem. Esta ficha aproxima seus conceitos das obras do acervo, sem transformá-lo artificialmente em pintor.</p>
          <p><a href="#/linguagem">Explorar Linguagem da Arte</a>${artist.source_page ? ` · <a href="${escapeHtml(artist.source_page)}" target="_blank" rel="noopener noreferrer">Ver retrato e registro no WikiArt</a>` : ''}</p>
        </section>
      </div>
      <aside class="panel-dark artist-reference-meta" aria-label="Dados biográficos de ${escapeHtml(artist.name)}">
        <div class="catalogue-meta">
          ${artist.born ? `<div class="catalogue-row"><span class="catalogue-label">Nascimento</span><span class="catalogue-value">${escapeHtml(artist.born)}</span></div>` : ''}
          ${artist.died ? `<div class="catalogue-row"><span class="catalogue-label">Morte</span><span class="catalogue-value">${escapeHtml(artist.died)}</span></div>` : ''}
          <div class="catalogue-row"><span class="catalogue-label">Período</span><span class="catalogue-value">${escapeHtml(artist.period_label || artist.period || '')}</span></div>
          <div class="catalogue-row"><span class="catalogue-label">Atuação</span><span class="catalogue-value">${escapeHtml(artist.catalogue_role)}</span></div>
          <div class="catalogue-row"><span class="catalogue-label">Campo</span><span class="catalogue-value">${escapeHtml(artist.technique_primary || '')}</span></div>
        </div>
      </aside>
    </div>` : `
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
    </div>`;
  return `
    <div style="margin-bottom: var(--space-5);">
      <a href="#/artistas" class="btn btn-ghost btn-sm" style="padding-left:0;">&larr; Artistas</a>
    </div>
    <div class="section-header">
      <span class="section-eyebrow">${artist.period_label || ''} — ${artist.nationality || ''}</span>
      <h1 class="section-title">${artist.name}</h1>
      <p class="section-description">${artist.tagline || ''}</p>
    </div>
    ${profile}
    ${artworks.length ? `
      <section class="artist-projects" aria-labelledby="artist-projects-title">
      <h2 id="artist-projects-title" style="font-family:var(--font-heading); font-size:var(--text-subsection); margin-bottom:var(--space-3);">${escapeHtml(artist.work_section_title || 'Obras')}</h2>
      ${artist.work_section_note ? `<p class="artist-projects-note">${escapeHtml(artist.work_section_note)}</p>` : ''}
      <div class="gallery-grid">
        ${artworks.map(a => renderArtworkCard(a, data)).join('')}
      </div>
      </section>` : ''}
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
  const lessons = data.lessons.filter(lesson => lesson.artwork_ids.some(id => (room.artwork_ids || []).includes(id)));

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
    ${lessons.length ? `<section class="section-block" aria-labelledby="room-lessons"><h2 id="room-lessons" class="section-subtitle">Percursos desta sala</h2><div class="card-grid">${lessons.map(lesson => `<a class="card card--compact" href="#/aula/${encodeURIComponent(lesson.id)}"><span class="card-eyebrow">Aula</span><strong>${escapeHtml(lesson.title)}</strong></a>`).join('')}</div></section>` : ''}
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

function renderLessonPlanView(data) {
  const rooms = data.modules.filter(module => module.type === 'room');
  const roomOptions = rooms.map(room => `<option value="${escapeHtml(room.id)}">${escapeHtml(`Sala ${room.room_number} — ${room.title}`)}</option>`).join('');
  const checklist = (id, title, items) => `
    <fieldset class="plan-checklist" id="plan-${id}">
      <legend class="catalogue-label">${title}</legend>
      ${items.map((item, index) => `<label class="plan-check-item"><input type="checkbox" value="${escapeHtml(item)}" ${index === 0 ? 'checked' : ''}> <span>${escapeHtml(item)}</span></label>`).join('')}
    </fieldset>`;
  return `
    <div class="section-header">
      <span class="section-eyebrow">Para docentes</span>
      <h1 class="section-title">Plano de Aula</h1>
      <p class="section-description">Monte, salve e imprima um plano local a partir de uma sala, obras do acervo e habilidades de Arte da BNCC.</p>
    </div>
    <div class="plan-builder-layout" style="margin-bottom:var(--space-6);">
      <section class="panel-dark plan-builder-controls" aria-labelledby="plan-builder-title">
        <h2 id="plan-builder-title" style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-4);">Montar plano</h2>
        <div style="display:grid;gap:var(--space-3);">
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Docente (opcional)</span><input id="plan-teacher" maxlength="120" placeholder="Nome de quem conduz a aula" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Escola (opcional)</span><input id="plan-school" maxlength="120" placeholder="Nome da escola ou rede" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Turma / contexto (opcional)</span><input id="plan-class" maxlength="120" placeholder="Ex.: 8º ano B" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Data</span><input id="plan-date" type="date" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Etapa</span><select id="plan-level" class="btn btn-secondary" style="width:100%;text-align:left;"><option value="Ensino Fundamental — anos finais">Ensino Fundamental — anos finais</option><option value="Ensino Médio">Ensino Médio</option></select></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Ano / série</span><select id="plan-grade" class="btn btn-secondary" style="width:100%;text-align:left;"></select></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Sala do Alberti</span><select id="plan-room" class="btn btn-secondary" style="width:100%;text-align:left;">${roomOptions}</select></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Foco de aprendizagem</span><select id="plan-skill" class="btn btn-secondary" style="width:100%;text-align:left;"></select></label>
          <div class="plan-duration-fields"><label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Número de aulas</span><select id="plan-lessons" class="btn btn-secondary"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option></select></label><label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Minutos por aula</span><select id="plan-minutes" class="btn btn-secondary"><option value="45">45</option><option value="50" selected>50</option><option value="60">60</option><option value="90">90</option></select></label></div>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Tema / recorte (opcional)</span><input id="plan-topic" maxlength="180" placeholder="Ex.: Luz, memória e transformação na arte" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Objetivo específico (opcional)</span><textarea id="plan-objective" rows="3" maxlength="280" placeholder="Ex.: Analisar como a perspectiva produz profundidade." style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></textarea></label>
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Questão para a turma (opcional)</span><textarea id="plan-question" rows="3" maxlength="280" placeholder="Ex.: Como a composição orienta nosso olhar?" style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></textarea></label>
          ${checklist('objects', 'Objetos de conhecimento', ['Elementos da linguagem visual', 'Contextos e matrizes estéticas', 'Materialidades e processos de criação', 'Museu, circulação e direitos de reprodução'])}
          ${checklist('objectives', 'Objetivos de aprendizagem', ['Descrever evidências visuais antes de interpretar', 'Relacionar forma, técnica e efeito', 'Comparar obras com argumentos sustentados', 'Reconhecer limites de uma reprodução digital'])}
          ${checklist('methods', 'Metodologias', ['Observação guiada', 'Comparação em dupla ou grupo', 'Roda de conversa com evidências', 'Produção de texto ou curadoria breve'])}
          ${checklist('resources', 'Recursos', ['Acervo e fichas do Alberti', 'Imagem projetada ou impressa', 'Caderno de observação', 'Descrição textual acessível'])}
          ${checklist('assessment', 'Avaliação', ['Argumento visual escrito', 'Comparação oral em dupla', 'Mapa de observação individual', 'Autoavaliação com critérios'])}
          <label style="display:grid;gap:var(--space-1);"><span class="catalogue-label">Referências e observações (opcional)</span><textarea id="plan-notes" rows="3" maxlength="500" placeholder="Adaptações, referências complementares ou combinações com o currículo da rede." style="padding:var(--space-2);border:1px solid var(--color-border-base);border-radius:var(--radius-sm);background:var(--color-bg-surface);"></textarea></label>
          <div class="plan-actions" style="display:flex;gap:var(--space-2);flex-wrap:wrap;"><button id="btn-generate-plan" class="btn btn-accent" type="button">Gerar plano</button><button id="btn-save-plan" class="btn btn-secondary" type="button">Salvar neste navegador</button><button id="btn-clear-plan" class="btn btn-ghost" type="button">Limpar</button></div>
        </div>
      </section>
      <section class="container-reading plan-builder-notes" style="margin-inline:0;">
        <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Como a BNCC entra</h2>
        <p>O gerador parte de habilidades de Artes Visuais para os anos finais do Ensino Fundamental. Os blocos de objetivo, metodologia, recurso e avaliação são selecionáveis para que o plano possa ser ajustado à escola e à turma, em vez de sair como receita fixa.</p>
        <p style="margin-top:var(--space-3);">Para o Ensino Médio, o resultado indica a área de Linguagens e suas Tecnologias; a escola deve selecionar as competências e o arranjo curricular adotados localmente.</p>
        <p style="margin-top:var(--space-3);font-size:var(--text-small);"><a href="https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf" target="_blank" rel="noopener noreferrer">Consultar BNCC — Arte, Ensino Fundamental</a></p>
      </section>
    </div>
    <section class="container-reading" style="margin-inline:0;" aria-live="polite">
      <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Prévia do plano</h2>
      <div id="plan-output" style="white-space:pre-line;color:var(--color-text-secondary);line-height:var(--leading-relaxed);">Escolha as opções e gere um plano para visualizar a proposta.</div>
      <div class="plan-actions" style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-4);"><button id="btn-copy-plan" class="btn btn-secondary" type="button">Copiar texto</button><button id="btn-print-plan" class="btn btn-secondary" type="button">Imprimir plano</button></div>
    </section>
  `;
}

function initLessonPlanBuilder(data) {
  const button = document.getElementById('btn-generate-plan');
  const output = document.getElementById('plan-output');
  if (!button || !output) return;

  const storageKey = 'alberti_lesson_plan_v1';
  const rooms = data.modules.filter(module => module.type === 'room');
  const skills = {
    EF69AR01: 'Pesquisar, apreciar e analisar formas distintas das artes visuais, tradicionais e contemporâneas, em obras de artistas brasileiros e estrangeiros de diferentes épocas e matrizes estéticas e culturais.',
    EF69AR02: 'Pesquisar e analisar diferentes estilos visuais, contextualizando-os no tempo e no espaço.',
    EF69AR04: 'Analisar os elementos constitutivos das artes visuais: ponto, linha, forma, direção, cor, tom, escala, dimensão, espaço e movimento.',
  };

  const field = id => document.getElementById(id);
  const skillField = field('plan-skill');
  const levelField = field('plan-level');
  const gradeField = field('plan-grade');
  const checkValues = id => [...document.querySelectorAll(`#plan-${id} input:checked`)].map(input => input.value);
  const setCheckValues = (id, values) => document.querySelectorAll(`#plan-${id} input`).forEach(input => { input.checked = values.includes(input.value); });
  const skillOptions = () => {
    if (levelField?.value === 'Ensino Médio') {
      skillField.innerHTML = '<option value="EM-LGG">Linguagens e suas Tecnologias — adequação curricular da rede</option>';
      return;
    }
    skillField.innerHTML = Object.keys(skills).map(id => `<option value="${id}">${id} — ${skills[id]}</option>`).join('');
  };
  const gradeOptions = () => {
    const grades = levelField?.value === 'Ensino Médio' ? ['1ª série', '2ª série', '3ª série'] : ['6º ano', '7º ano', '8º ano', '9º ano'];
    gradeField.innerHTML = grades.map(grade => `<option value="${grade}">${grade}</option>`).join('');
  };

  const readSaved = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return parsed && parsed.version === 1 && typeof parsed.values === 'object' ? parsed.values : null;
    } catch {
      return null;
    }
  };

  const readValues = () => ({
    teacher: field('plan-teacher')?.value.trim() || '',
    school: field('plan-school')?.value.trim() || '',
    className: field('plan-class')?.value.trim() || '',
    date: field('plan-date')?.value || '',
    level: levelField?.value || '',
    grade: gradeField?.value || '',
    roomId: field('plan-room')?.value || '',
    skill: skillField?.value || '',
    lessons: field('plan-lessons')?.value || '2',
    minutes: field('plan-minutes')?.value || '50',
    topic: field('plan-topic')?.value.trim() || '',
    objective: field('plan-objective')?.value.trim() || '',
    question: field('plan-question')?.value.trim() || '',
    notes: field('plan-notes')?.value.trim() || '',
    objects: checkValues('objects'), objectives: checkValues('objectives'), methods: checkValues('methods'), resources: checkValues('resources'), assessment: checkValues('assessment'),
  });

  const applyValues = values => {
    if (!values) return;
    const fieldKeys = {
      'plan-teacher': 'teacher', 'plan-school': 'school', 'plan-class': 'className', 'plan-date': 'date', 'plan-level': 'level', 'plan-room': 'roomId',
      'plan-lessons': 'lessons', 'plan-minutes': 'minutes', 'plan-topic': 'topic', 'plan-objective': 'objective', 'plan-question': 'question', 'plan-notes': 'notes',
    };
    for (const [id, key] of Object.entries(fieldKeys)) {
      const target = field(id);
      const value = values[key];
      if (target && typeof value === 'string') target.value = value;
    }
    skillOptions(); gradeOptions();
    if (skillField && typeof values.skill === 'string' && [...skillField.options].some(option => option.value === values.skill)) skillField.value = values.skill;
    if (gradeField && typeof values.grade === 'string' && [...gradeField.options].some(option => option.value === values.grade)) gradeField.value = values.grade;
    ['objects', 'objectives', 'methods', 'resources', 'assessment'].forEach(id => setCheckValues(id, Array.isArray(values[id]) ? values[id] : []));
  };

  const generate = () => {
    const values = readValues();
    const room = rooms.find(item => item.id === values.roomId);
    const artworks = (room?.artwork_ids || []).map(id => data.artworks.find(item => item.id === id)?.title).filter(Boolean);
    const reference = values.level === 'Ensino Médio'
      ? 'BNCC: Área de Linguagens e suas Tecnologias; selecionar as competências e habilidades previstas no currículo da rede.'
      : `BNCC: ${values.skill} — ${skills[values.skill]}`;
    const duration = `${values.lessons} aula${values.lessons === '1' ? '' : 's'} de ${values.minutes} minutos (${Number(values.lessons) * Number(values.minutes)} min no total)`;
    const date = values.date ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${values.date}T12:00:00`)) : '';
    const identification = [values.school && `Escola: ${values.school}`, values.teacher && `Docente: ${values.teacher}`, values.className && `Turma/contexto: ${values.className}`, date && `Data: ${date}`].filter(Boolean).join('\n');
    const list = values => values.length ? `\n${values.map(item => `• ${item}`).join('\n')}` : '\n• A definir com a turma.';

    output.textContent = `PLANO DE AULA — ALBERTI\n\n${identification ? `${identification}\n` : ''}Etapa: ${values.level} — ${values.grade}\nDuração: ${duration}\nSala: ${room ? `Sala ${room.room_number} — ${room.title}` : 'a definir'}\nObras sugeridas: ${artworks.join('; ') || 'a definir'}\n${reference}${values.topic ? `\n\nTEMA\n${values.topic}` : ''}\n\nOBJETOS DE CONHECIMENTO${list(values.objects)}\n\nOBJETIVOS DE APRENDIZAGEM${list(values.objectives)}${values.objective ? `\n• ${values.objective}` : ''}\n\nMETODOLOGIAS${list(values.methods)}\n\nRECURSOS${list(values.resources)}\n\nSEQUÊNCIA DIDÁTICA\n1. Observar: apresente uma obra sem a ficha e peça um inventário de elementos visíveis.\n2. Nomear: use Linguagem da Arte para relacionar linha, cor, forma, luz, composição e perspectiva ao efeito observado.\n3. Contextualizar: confronte a hipótese inicial com a ficha da obra, a autoria, a técnica e os limites das fontes.\n4. Argumentar: em dupla, compare duas obras e sustente uma leitura com ao menos duas evidências visuais.\n5. Consolidar: retome a questão norteadora e registre uma leitura fundamentada.\n\nAVALIAÇÃO${list(values.assessment)}\nCritérios: uso de vocabulário visual, interpretação sustentada em evidências e reconhecimento de limites ou incertezas da fonte.${values.question ? `\n\nQUESTÃO NORTEADORA\n${values.question}` : ''}${values.notes ? `\n\nREFERÊNCIAS E OBSERVAÇÕES\n${values.notes}` : ''}`;
  };

  const saved = readSaved();
  skillOptions(); gradeOptions();
  applyValues(saved);

  levelField?.addEventListener('change', () => { skillOptions(); gradeOptions(); });
  button.addEventListener('click', generate);
  field('btn-save-plan')?.addEventListener('click', () => {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, values: readValues() }));
    showToast('Plano salvo somente neste navegador.');
  });
  field('btn-clear-plan')?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    document.querySelectorAll('#plano-aula-view-content input, #plano-aula-view-content textarea, #plano-aula-view-content select').forEach(element => { if (element.type === 'checkbox') element.checked = false; else element.value = ''; });
    field('plan-level').value = 'Ensino Fundamental — anos finais';
    skillOptions(); gradeOptions();
    field('plan-lessons').value = '2';
    field('plan-minutes').value = '50';
    document.querySelectorAll('#plan-objects input, #plan-objectives input, #plan-methods input, #plan-resources input, #plan-assessment input').forEach((input, index) => { input.checked = index === 0; });
    output.textContent = 'Escolha as opções e gere um plano para visualizar a proposta.';
  });
  field('btn-copy-plan')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent || '');
      showToast('Plano copiado.');
    } catch {
      showToast('Não foi possível copiar automaticamente. Selecione o texto da prévia.');
    }
  });
  field('btn-print-plan')?.addEventListener('click', () => {
    document.body.classList.add('print-plan');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-plan'), { once: true });
    window.print();
  });
}

function renderAboutView() {
  return `
    <div class="section-header">
      <span class="section-eyebrow">Museu Interativo de Arte</span>
      <h1 class="section-title">Sobre o Alberti</h1>
      <p class="section-description">Um ambiente de estudo para ver, comparar e argumentar sobre obras de arte a partir de suas formas, contextos e fontes.</p>
    </div>
    <div class="auto-grid-2" style="margin-bottom:var(--space-6);">
      <section class="container-reading" style="margin-inline:0;">
        <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Por que Alberti?</h2>
        <p>O nome remete a Leon Battista Alberti (1404–1472), humanista, arquiteto e teórico do Renascimento. Em <em>De pictura</em> (1435), ele ajudou a formular uma linguagem para discutir composição, visão e perspectiva — questões que estruturam a proposta deste museu.</p>
        <p style="margin-top:var(--space-3);">Não é uma homenagem a uma suposta neutralidade renascentista: o Alberti usa esse ponto de partida para ensinar a observar e também para discutir o que uma narrativa de arte deixa de fora.</p>
        <p style="margin-top:var(--space-3);font-size:var(--text-small);"><a href="https://www.metmuseum.org/pt/perspectives/surface-depth-description-jabach" target="_blank" rel="noopener noreferrer">Fonte: The Metropolitan Museum of Art, sobre Alberti e <em>De pictura</em></a></p>
      </section>
      <section class="container-reading" style="margin-inline:0;">
        <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Como usar</h2>
        <p>O Alberti organiza o acervo por períodos, artistas e salas temáticas. A Linguagem da Arte oferece vocabulário para a observação; o Estúdio propõe práticas guiadas; Comparar aproxima obras sem reduzir a análise a uma resposta única.</p>
      </section>
      <section class="container-reading" style="margin-inline:0;">
        <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Compromisso editorial</h2>
        <p>As fichas distinguem dado documentado, descrição visual e interpretação. Reproduções e retratos locais têm crédito e procedência registrados no acervo; onde há incerteza, ela deve aparecer como limite, não como certeza histórica.</p>
      </section>
    </div>
    <section class="section-block" aria-labelledby="about-limits">
      <h2 id="about-limits" class="section-subtitle">Limites do museu digital</h2>
      <div class="auto-grid-3">
        <article class="card"><div class="card-body"><h3 class="card-title">Reprodução não é presença</h3><p class="card-description">Escala, textura, montagem, luz e espacialidade do objeto original não são plenamente substituídas por uma imagem digital.</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Leitura não é adivinhação</h3><p class="card-description">Uma interpretação deve ser apresentada como argumento sustentado, não como acesso automático à intenção de quem produziu a obra.</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Créditos importam</h3><p class="card-description">A obra, a fotografia e a reprodução podem ter condições de uso diferentes. Consulte a ficha e a instituição de origem antes de reutilizar uma imagem.</p></div></article>
      </div>
    </section>
    <section class="container-reading" style="margin-inline:0;margin-top:var(--space-6);">
      <h2 style="font-family:var(--font-heading);font-size:var(--text-subsection);margin-bottom:var(--space-3);">Tecnologia e privacidade</h2>
      <p>O Alberti é uma aplicação estática: funciona sem conta, não envia respostas de estudo a um servidor e mantém o progresso no próprio navegador. Recursos já visitados podem ficar disponíveis offline conforme o armazenamento do navegador.</p>
    </section>
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
  const artworks = data.artworks
    .filter(a => a.period === period.id && a.mediaStatus !== 'pending-faithful-reproduction')
    .slice(0, 1);
  const thumb    = artworks[0]?.thumbnail || artworks[0]?.image || '';

  return `
    <article class="card" role="listitem">
      ${thumb ? `
        <div class="card-image" style="aspect-ratio: 16/9;">
          <img src="${thumb}" alt="${period.title}" loading="lazy">
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
  const image = artwork.mediaStatus === 'pending-faithful-reproduction' ? '' : artwork.thumbnail || artwork.image || '';

  return `
    <article class="gallery-item" role="listitem" ${dataset} style="aspect-ratio: 3/4; cursor:pointer;"
             onclick="window.location.hash='${target.replace('#', '')}'">
      ${image ? `<img
        src="${image}"
        alt="${artwork.title}${artist ? ', ' + artist.name : ''}"
        loading="lazy"
        class="gallery-item-image"
        style="height:100%;"
      >` : '<span class="gallery-item-fallback">Reprodução em verificação</span>'}
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
      <p class="empty-state-text">${escapeHtml(label)} não encontrado.</p>
      <a href="#/" class="btn btn-secondary" style="margin-top: var(--space-4);">Voltar ao início</a>
    </div>
  `;
}

/* =========================================================
   INICIAR
   ========================================================= */

init();
