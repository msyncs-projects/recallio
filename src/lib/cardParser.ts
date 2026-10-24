import { Rem, Card } from '@/types';

export interface ParsedCardDraft {
  idSuffix: string;
  type: Card['type'];
  front: string;
  back: string;
  clozeIndex?: number;
}

/**
 * Parses a Rem's text to detect flashcards (Concept::Definition, <-> Bidirectional, {{Cloze}})
 */
export function parseCardsFromText(remId: string, text: string): ParsedCardDraft[] {
  if (!text || text.trim().length === 0) return [];

  const drafts: ParsedCardDraft[] = [];

  // 1. Check for Cloze deletions: {{content}} or {{c1::content}}
  const clozeRegex = /\{\{(?:c\d+::)?([^}]+)\}\}/g;
  const clozeMatches = Array.from(text.matchAll(clozeRegex));

  if (clozeMatches.length > 0) {
    clozeMatches.forEach((match, index) => {
      const clozeContent = match[1];
      // Replace only this instance of cloze with [...]
      let matchIdx = 0;
      const frontWithCloze = text.replace(clozeRegex, (m, c) => {
        const isCurrent = matchIdx === index;
        matchIdx++;
        return isCurrent ? `[ ... ]` : c;
      });

      drafts.push({
        idSuffix: `cloze_${index}`,
        type: 'cloze',
        front: frontWithCloze.trim(),
        back: clozeContent.trim(),
        clozeIndex: index,
      });
    });
    return drafts;
  }

  // 2. Check for Bidirectional cards: ':::' followed by space (e.g. ' ::: ' or '::: ') or ' <-> '
  const biMatch = text.match(/^([\s\S]*?)(?:\s*:::\s+|\s+<->\s+)([\s\S]*)$/);
  if (biMatch) {
    const sideA = biMatch[1].trim();
    const sideB = biMatch[2].trim();
    if (sideA && sideB) {
      // Forward card
      drafts.push({
        idSuffix: 'bi_fwd',
        type: 'bidirectional',
        front: sideA,
        back: sideB,
      });

      // Reverse card
      drafts.push({
        idSuffix: 'bi_rev',
        type: 'bidirectional',
        front: sideB,
        back: sideA,
      });

      return drafts;
    }
  }

  // 3. Check for Concept-Descriptor: '::' followed by space (e.g. ' :: ' or ':: ')
  // Requires at least one space after '::' so C++ std::vector or URLs are never treated as cards
  const conceptMatch = text.match(/^([\s\S]*?)\s*::\s+([\s\S]*)$/);
  if (conceptMatch) {
    const front = conceptMatch[1].trim();
    const back = conceptMatch[2].trim();
    if (front && back) {
      drafts.push({
        idSuffix: 'concept',
        type: 'concept_descriptor',
        front,
        back,
      });

      return drafts;
    }
  }

  return drafts;
}

/**
 * Extracts references like [[Target Name]] or [[id|Target Name]] from text
 */
export function extractReferences(text: string): string[] {
  if (!text) return [];
  const refRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const references: string[] = [];
  let match;
  while ((match = refRegex.exec(text)) !== null) {
    references.push(match[1].trim());
  }
  return references;
}

/**
 * Extracts tags like #tag from text
 */
export function extractTags(text: string): string[] {
  if (!text) return [];
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
}

/**
 * Synchronizes cards for a given Rem, preserving existing card SRS history if card still matches
 */
export function syncCardsForRem(rem: Rem, existingCards: Card[]): Card[] {
  const drafts = parseCardsFromText(rem.id, rem.text);
  const now = Date.now();

  return drafts.map((draft) => {
    const cardId = `${rem.id}_${draft.idSuffix}`;
    const existing = existingCards.find((c) => c.id === cardId);

    if (existing) {
      // Preserve SRS state, update front/back in case of edits
      return {
        ...existing,
        front: draft.front,
        back: draft.back,
        type: draft.type,
        clozeIndex: draft.clozeIndex,
      };
    }

    // New card
    return {
      id: cardId,
      remId: rem.id,
      type: draft.type,
      front: draft.front,
      back: draft.back,
      clozeIndex: draft.clozeIndex,
      state: 'new',
      nextPracticeDate: now,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      history: [],
    };
  });
}
