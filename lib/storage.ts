import type { ProjectState, ProjectMeta } from '@/types';

const INDEX_KEY = 'projects:index';
const PROJECT_PREFIX = 'project:';

export function listProjects(): ProjectMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ProjectMeta[];
    return arr.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

function saveIndex(items: ProjectMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(items));
}

export function getProject(id: string): ProjectState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectState;
  } catch {
    return null;
  }
}

export function saveProject(p: ProjectState) {
  if (typeof window === 'undefined') return;
  p.updatedAt = new Date().toISOString();
  p.hasAnalysis = !!p.analysis;
  localStorage.setItem(PROJECT_PREFIX + p.id, JSON.stringify(p));

  const idx = listProjects();
  const meta: ProjectMeta = {
    id: p.id,
    name: p.name,
    client: p.client,
    finalDeadline: p.finalDeadline,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    hasAnalysis: p.hasAnalysis,
  };
  const next = [meta, ...idx.filter((x) => x.id !== p.id)];
  saveIndex(next);
}

export function deleteProject(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROJECT_PREFIX + id);
  saveIndex(listProjects().filter((p) => p.id !== id));
}

export function createProject(input: {
  id: string;
  name: string;
  client: string;
  finalDeadline: string;
}): ProjectState {
  const now = new Date().toISOString();
  const p: ProjectState = {
    id: input.id,
    name: input.name,
    client: input.client,
    finalDeadline: input.finalDeadline,
    createdAt: now,
    updatedAt: now,
    hasAnalysis: false,
    documents: { guideline: null, notice: null, task: null },
    analysis: null,
    memo: '',
    starredConceptIds: [],
    checkedSubmittableIds: [],
  };
  saveProject(p);
  return p;
}
