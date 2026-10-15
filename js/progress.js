const STORAGE_KEY = 'alberti_state_v2';
const LEGACY_KEY = 'alberti-exercise-progress';

const emptyState = () => ({
  version: 2,
  visitedArtworks: [],
  favorites: [],
  completedLessons: [],
  exercises: {},
  lastRoute: '#/',
});

function uniqueStrings(value) {
  return Array.from(new Set(Array.isArray(value) ? value.filter(item => typeof item === 'string') : []));
}

function sanitize(value) {
  const base = emptyState();
  if (!value || typeof value !== 'object' || value.version > 2) return base;
  return {
    ...base,
    visitedArtworks: uniqueStrings(value.visitedArtworks),
    favorites: uniqueStrings(value.favorites),
    completedLessons: uniqueStrings(value.completedLessons),
    exercises: value.exercises && typeof value.exercises === 'object' ? value.exercises : {},
    lastRoute: typeof value.lastRoute === 'string' ? value.lastRoute : base.lastRoute,
  };
}

export function loadProgress() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return sanitize(JSON.parse(current));
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
    const migrated = sanitize({ version: 2, exercises: legacy });
    saveProgress(migrated);
    return migrated;
  } catch {
    return emptyState();
  }
}

export function saveProgress(progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(progress))); } catch {}
}

export function updateProgress(update) {
  const next = { ...loadProgress(), ...update };
  saveProgress(next);
  return next;
}

export function recordArtworkVisit(id) {
  const current = loadProgress();
  return updateProgress({ visitedArtworks: uniqueStrings([...current.visitedArtworks, id]) });
}

export function recordExerciseResult(id, result) {
  const current = loadProgress();
  return updateProgress({ exercises: { ...current.exercises, [id]: { ...result, completed: true } } });
}

export function resetStudyProgress() {
  const current = loadProgress();
  const next = emptyState();
  saveProgress({ ...next, favorites: current.favorites });
}
