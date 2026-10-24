import Dexie, { type Table } from 'dexie';
import { Rem, Card, StudyStats } from '@/types';
import { syncCardsForRem } from './cardParser';

export class RemNoteDatabase extends Dexie {
  rems!: Table<Rem, string>;
  cards!: Table<Card, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('RemNoteDB');
    this.version(1).stores({
      rems: 'id, parentId, type, isPinned, createdAt, updatedAt',
      cards: 'id, remId, type, state, nextPracticeDate',
      settings: 'key',
    });
  }
}

export const db = new RemNoteDatabase();

// Default seed data with rich content including REA Ontology & RemNote Guide
export function getInitialSeedData(): { rems: Rem[]; cards: Card[] } {
  const now = Date.now();

  const rems: Rem[] = [
    // -------------------------------------------------------------------------
    // 1. REA Enterprise Ontology & Accounting (Top-level Document)
    // -------------------------------------------------------------------------
    {
      id: 'doc-rea',
      text: 'REA Enterprise Ontology & Accounting Framework',
      parentId: null,
      childrenIds: ['rea-intro', 'rea-core', 'rea-duality', 'rea-claims'],
      type: 'document',
      isCollapsed: false,
      tags: ['accounting', 'ontology', 'database'],
      isPinned: true,
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-intro',
      text: 'Introduction to REA :: An accounting information systems and enterprise model proposed by William E. McCarthy (1982) based on real economic phenomena rather than debits/credits.',
      parentId: 'doc-rea',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting', 'ontology'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-core',
      text: 'Core Components of REA',
      parentId: 'doc-rea',
      childrenIds: ['rea-res', 'rea-ev', 'rea-ag'],
      type: 'header1',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-res',
      text: 'Economic Resource :: Things that have economic value, are scarce, and are under the control of the enterprise (e.g. Cash, Raw Materials, Finished Goods).',
      parentId: 'rea-core',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-ev',
      text: 'Economic Event :: An activity that changes the quantity or value of economic resources (e.g. Sales, Purchases, Cash Disbursements).',
      parentId: 'rea-core',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-ag',
      text: 'Economic Agent :: Individuals or organizations participating in economic events (e.g. Customers, Suppliers, Employees).',
      parentId: 'rea-core',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-duality',
      text: 'Economic Duality (Give-to-Get) ::: Every increment event (get) must eventually be paired with a decrement event (give) in an economic exchange.',
      parentId: 'doc-rea',
      childrenIds: ['rea-duality-ex'],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-duality-ex',
      text: 'In a retail sales process, {{Sale of Goods}} is the give event, and {{Cash Receipt}} is the get event.',
      parentId: 'rea-duality',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },
    {
      id: 'rea-claims',
      text: 'Commitments & Claims in REA :: Future commitments (e.g. Purchase Orders) track promises, while imbalances between give and get events materialize as {{economic claims}} (Receivables and Payables).',
      parentId: 'doc-rea',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['accounting'],
      createdAt: now - 3600000 * 24,
      updatedAt: now,
    },

    // -------------------------------------------------------------------------
    // 2. Welcome to RemNote Clone (Tutorial & Outliner Guide)
    // -------------------------------------------------------------------------
    {
      id: 'doc-welcome',
      text: 'Welcome to RemNote Clone 🚀',
      parentId: null,
      childrenIds: ['wel-intro', 'wel-cards', 'wel-keys', 'wel-features'],
      type: 'document',
      isCollapsed: false,
      tags: ['tutorial', 'guide'],
      isPinned: true,
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'wel-intro',
      text: 'RemNote combines hierarchical outliner notes with automatic spaced-repetition flashcards.',
      parentId: 'doc-welcome',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: ['tutorial'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'wel-cards',
      text: 'How to create flashcards automatically from your notes',
      parentId: 'doc-welcome',
      childrenIds: ['card-syntax-1', 'card-syntax-2', 'card-syntax-3'],
      type: 'header1',
      isCollapsed: false,
      tags: ['tutorial', 'flashcards'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'card-syntax-1',
      text: 'Concept-Definition Card :: Type double colons (::) between front and back to create a forward flashcard.',
      parentId: 'wel-cards',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['flashcards'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'card-syntax-2',
      text: 'Bidirectional Card ::: Use triple colons (:::), <-> or == to practice both front->back and back->front.',
      parentId: 'wel-cards',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['flashcards'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'card-syntax-3',
      text: 'Cloze Deletions: Wrap any word in {{double curly brackets}} to create fill-in-the-blank cards.',
      parentId: 'wel-cards',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: ['flashcards'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'wel-keys',
      text: 'Keyboard Shortcuts & Navigation',
      parentId: 'doc-welcome',
      childrenIds: ['key-enter', 'key-tab', 'key-shifttab', 'key-zoom'],
      type: 'header1',
      isCollapsed: false,
      tags: ['tutorial'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'key-enter',
      text: 'Press Enter to create a new sibling Rem immediately below.',
      parentId: 'wel-keys',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: [],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'key-tab',
      text: 'Press Tab to indent (make this Rem a child of the one above it).',
      parentId: 'wel-keys',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: [],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'key-shifttab',
      text: 'Press Shift + Tab to outdent (move this Rem one level up).',
      parentId: 'wel-keys',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: [],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'key-zoom',
      text: 'Click on any bullet point dot to Zoom Into that Rem as its own focused document page.',
      parentId: 'wel-keys',
      childrenIds: [],
      type: 'bullet',
      isCollapsed: false,
      tags: [],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },
    {
      id: 'wel-features',
      text: 'Knowledge Graph & Backlinks :: Connect notes using [[links]] and visualize your knowledge network in the 2D Graph view.',
      parentId: 'doc-welcome',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['graph'],
      createdAt: now - 3600000 * 12,
      updatedAt: now,
    },

    // -------------------------------------------------------------------------
    // 3. Spaced Repetition & Cognitive Science
    // -------------------------------------------------------------------------
    {
      id: 'doc-srs',
      text: 'Spaced Repetition & Memory Science',
      parentId: null,
      childrenIds: ['srs-ebbinghaus', 'srs-sm2', 'srs-recall'],
      type: 'document',
      isCollapsed: false,
      tags: ['cognition', 'srs', 'learning'],
      isPinned: false,
      createdAt: now - 3600000 * 48,
      updatedAt: now,
    },
    {
      id: 'srs-ebbinghaus',
      text: 'The Ebbinghaus Forgetting Curve :: Demonstrates that memory retention halves within days without active review, but each spaced review flattens the decay curve exponentially.',
      parentId: 'doc-srs',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['srs'],
      createdAt: now - 3600000 * 48,
      updatedAt: now,
    },
    {
      id: 'srs-sm2',
      text: 'SuperMemo SM-2 Algorithm :: Calculates the next review date using Ease Factor: {{Interval_n = Interval_{n-1} * EaseFactor}}.',
      parentId: 'doc-srs',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['srs', 'algorithms'],
      createdAt: now - 3600000 * 48,
      updatedAt: now,
    },
    {
      id: 'srs-recall',
      text: 'Active Recall vs Passive Review ::: Active recall forces neural pathway retrieval, yielding significantly higher long-term retention than re-reading.',
      parentId: 'doc-srs',
      childrenIds: [],
      type: 'concept',
      isCollapsed: false,
      tags: ['srs'],
      createdAt: now - 3600000 * 48,
      updatedAt: now,
    },
  ];

  // Generate cards from all initial rems
  let cards: Card[] = [];
  for (const rem of rems) {
    const generated = syncCardsForRem(rem, []);
    cards = [...cards, ...generated];
  }

  return { rems, cards };
}

/**
 * Ensures the database is initialized with seed data if empty
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.rems.count();
  if (count === 0) {
    const { rems, cards } = getInitialSeedData();
    await db.rems.bulkAdd(rems);
    await db.cards.bulkAdd(cards);
    await db.settings.put({
      key: 'stats',
      value: {
        streak: 3,
        cardsStudiedToday: 0,
        totalCards: cards.length,
        dueCardsCount: cards.length,
        retentionRate: 94,
        lastStudiedDate: new Date().toISOString().split('T')[0],
      } as StudyStats,
    });
  }
}

/**
 * Export full database to JSON string
 */
export async function exportDatabaseToJSON(): Promise<string> {
  const rems = await db.rems.toArray();
  const cards = await db.cards.toArray();
  const settings = await db.settings.toArray();

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      rems,
      cards,
      settings,
    },
    null,
    2
  );
}

/**
 * Import database from JSON string
 */
export async function importDatabaseFromJSON(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.rems || !Array.isArray(data.rems)) {
      throw new Error('Invalid RemNote backup file.');
    }

    await db.transaction('rw', db.rems, db.cards, db.settings, async () => {
      await db.rems.clear();
      await db.cards.clear();
      await db.rems.bulkAdd(data.rems);
      if (data.cards && Array.isArray(data.cards)) {
        await db.cards.bulkAdd(data.cards);
      }
      if (data.settings && Array.isArray(data.settings)) {
        for (const item of data.settings) {
          await db.settings.put(item);
        }
      }
    });
    return true;
  } catch (err) {
    console.error('Failed to import database:', err);
    return false;
  }
}

/**
 * Reset to default initial state
 */
export async function resetDatabase(): Promise<void> {
  await db.transaction('rw', db.rems, db.cards, db.settings, async () => {
    await db.rems.clear();
    await db.cards.clear();
    await db.settings.clear();
  });
  await initializeDatabase();
}
