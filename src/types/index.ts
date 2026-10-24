export type RemType = 'document' | 'concept' | 'descriptor' | 'bullet' | 'header1' | 'header2' | 'header3';

export interface Rem {
  id: string;
  text: string;
  parentId: string | null;
  childrenIds: string[];
  type: RemType;
  isCollapsed: boolean;
  tags: string[]; // array of Rem IDs or tag strings
  isPinned?: boolean;
  isTodo?: boolean;
  isCompleted?: boolean;
  codeLanguage?: string; // if code block
  portalRemId?: string; // if embedding another Rem
  createdAt: number;
  updatedAt: number;
}

export type CardType = 'concept_descriptor' | 'bidirectional' | 'cloze' | 'list';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type SRSGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Card {
  id: string;
  remId: string;
  type: CardType;
  front: string;
  back: string;
  clozeIndex?: number;
  
  // SRS properties (SM-2 / FSRS inspired)
  state: CardState;
  nextPracticeDate: number; // timestamp in ms
  interval: number; // in days (or fractions for learning steps)
  easeFactor: number; // default 2.5
  repetitions: number;
  lapses: number;
  lastPracticed?: number;
  history?: Array<{
    date: number;
    grade: SRSGrade;
    interval: number;
    easeFactor: number;
  }>;
}

export interface SRSIntervalPreview {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export interface BreadcrumbItem {
  id: string;
  text: string;
}

export interface SearchResult {
  rem: Rem;
  documentTitle?: string;
  matchType: 'title' | 'content' | 'tag';
}

export interface GraphNode {
  id: string;
  text: string;
  type: RemType;
  cardCount: number;
  isCurrent?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'hierarchy' | 'reference' | 'tag';
}

export interface StudyStats {
  streak: number;
  cardsStudiedToday: number;
  totalCards: number;
  dueCardsCount: number;
  retentionRate: number;
  lastStudiedDate?: string;
}
