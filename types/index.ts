export type DocKind = 'guideline' | 'notice' | 'task';

export const DOC_LABELS: Record<DocKind, string> = {
  guideline: '공모지침서',
  notice: '공고문',
  task: '과업지시서',
};

export type Source = DocKind | 'ai';

export interface DocumentMeta {
  kind: DocKind;
  fileName: string;
  pageCount: number;
  charCount: number;
  uploadedAt: string;
}

export interface DocumentExtract extends DocumentMeta {
  text: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  client: string;
  finalDeadline: string;
  createdAt: string;
  updatedAt: string;
  hasAnalysis: boolean;
}

export interface SummaryItem {
  label: string;
  value: string;
  source: Source;
  conflict?: { sources: Source[]; values: string[] } | null;
  note?: string;
}

export interface SummaryCategory {
  category: string;
  items: SummaryItem[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  type: 'official' | 'internal';
  category: string;
  source: Source;
  note?: string;
}

export interface DesignConcept {
  id: string;
  category: string;
  nameKo: string;
  nameEn: string;
  oneLiner: string;
  rationale: string;
  spatialStrategy: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
  source: Source;
  starred?: boolean;
}

export interface Submittable {
  id: string;
  name: string;
  spec: string;
  format: string;
  copies: string;
  method: string;
  required: boolean;
  source: Source;
  done?: boolean;
  note?: string;
}

export interface ProgramArea {
  id: string;
  name: string;
  area: string;
  count: string;
  notes: string;
  source: Source;
}

export type RelationKind = 'adjacent' | 'separated' | 'visual' | 'secure';

export interface ProgramRelation {
  fromId: string;
  toId: string;
  kind: RelationKind;
  source: Source;
}

export interface AnalysisResult {
  generatedAt: string;
  model: string;
  documents: DocumentMeta[];
  summary: SummaryCategory[];
  schedule: ScheduleEvent[];
  concepts: DesignConcept[];
  submittables: Submittable[];
  programs: ProgramArea[];
  relations: ProgramRelation[];
}

export interface ProjectState extends ProjectMeta {
  documents: Record<DocKind, DocumentExtract | null>;
  analysis: AnalysisResult | null;
  memo: string;
  starredConceptIds: string[];
  checkedSubmittableIds: string[];
}
