export type Difficulty = 'easy' | 'medium' | 'hard';

export type ReviewStatus = 'unreviewed' | 'community-reviewed' | 'verified';

export type ContentType =
  | 'question'
  | 'concept'
  | 'comparison'
  | 'challenge'
  | 'gotcha'
  | 'cheat-sheet';

export type CategoryStatus = 'live' | 'planned';

export interface Category {
  id: string;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  order: number;
  status: CategoryStatus;
}

export interface CodeExample {
  language: string;
  code: string;
  filename?: string;
  caption?: string;
}

export interface Source {
  label: string;
  url?: string;
}

export interface BaseItem {
  id: string;
  slug: string;
  category: string;
  type: ContentType;
  title: string;
  summary: string;
  difficulty?: Difficulty;
  tags?: string[];
  related?: string[];
  sources?: Source[];
  reviewStatus?: ReviewStatus;
  generated?: boolean;
  featured?: boolean;
  updated?: string;
}

export interface QuestionItem extends BaseItem {
  type: 'question';
  shortAnswer: string;
  explanation?: string[];
  keyPoints?: string[];
  example?: CodeExample;
  commonMistakes?: string[];
  followUps?: string[];
  realWorld?: string;
}

export interface ConceptItem extends BaseItem {
  type: 'concept';
  definition: string;
  explanation?: string[];
  keyPoints?: string[];
  example?: CodeExample;
  commonMistakes?: string[];
  followUps?: string[];
}

export interface ComparisonRow {
  label: string;
  values: string[];
}

export interface ComparisonOption {
  name: string;
  summary?: string;
}

export interface ComparisonItem extends BaseItem {
  type: 'comparison';
  options: ComparisonOption[];
  rows: ComparisonRow[];
  verdict?: string;
  pickWhen?: { option: string; guidance: string }[];
  example?: CodeExample;
}

export interface ChallengeSolution {
  code: CodeExample;
  explanation?: string[];
}

export interface ChallengeItem extends BaseItem {
  type: 'challenge';
  prompt: string;
  constraints?: string[];
  hints?: string[];
  starterCode?: CodeExample;
  solution: ChallengeSolution;
}

export interface GotchaItem extends BaseItem {
  type: 'gotcha';
  scenario: string;
  problem: string;
  example?: CodeExample;
  fix?: string;
  explanation?: string[];
  keyPoints?: string[];
}

export interface CheatSheetEntry {
  label: string;
  value?: string;
  note?: string;
  code?: string;
  language?: string;
}

export interface CheatSheetSection {
  title: string;
  items: CheatSheetEntry[];
}

export interface CheatSheetItem extends BaseItem {
  type: 'cheat-sheet';
  description?: string;
  sections: CheatSheetSection[];
}

export type ContentItem =
  | QuestionItem
  | ConceptItem
  | ComparisonItem
  | ChallengeItem
  | GotchaItem
  | CheatSheetItem;

export interface RevisionEntry {
  id: string;
  category: string;
  term: string;
  short: string;
  medium?: string;
  detail?: string;
  related?: string;
  tags?: string[];
}

export interface RevisionFile {
  category: string;
  intro?: string;
  entries: RevisionEntry[];
}

export interface ResolvedMeta {
  href: string;
  categoryName: string;
  categoryShortName: string;
  accent: string;
}

export type ResolvedItem = ContentItem & ResolvedMeta;
