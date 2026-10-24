'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Rem, Card, RemType, SRSGrade, BreadcrumbItem, SearchResult, StudyStats } from '@/types';
import { db, initializeDatabase, resetDatabase, exportDatabaseToJSON, importDatabaseFromJSON } from '@/lib/db';
import { syncCardsForRem, extractReferences, extractTags } from '@/lib/cardParser';
import { calculateNextSRSState } from '@/lib/srs';

export type ActiveView = 'editor' | 'flashcards' | 'graph' | 'all-notes' | 'settings';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  totalRems?: number;
  totalCards?: number;
}

interface RemContextType {
  isInitialized: boolean;
  rems: Rem[];
  cards: Card[];
  activeRemId: string;
  activeRem: Rem | null;
  activeView: ActiveView;
  studyDeckId: string | null;
  dueCards: Card[];
  currentTime: number;
  stats: StudyStats;
  breadcrumbs: BreadcrumbItem[];
  theme: 'dark' | 'light';
  
  // User & Cloud Sync
  user: UserProfile | null;
  syncStatus: SyncStatus;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithCloud: () => Promise<boolean>;
  
  // Navigation
  setActiveRemId: (id: string) => void;
  setActiveView: (view: ActiveView) => void;
  setStudyDeckId: (id: string | null) => void;
  zoomIntoRem: (id: string) => void;
  zoomOut: () => void;
  toggleTheme: () => void;

  // Rem Operations
  updateRemText: (id: string, text: string) => Promise<void>;
  updateRemType: (id: string, type: RemType) => Promise<void>;
  createRem: (parentId: string | null, afterRemId?: string, text?: string, type?: RemType) => Promise<string>;
  deleteRem: (id: string) => Promise<void>;
  indentRem: (id: string) => Promise<boolean>;
  outdentRem: (id: string) => Promise<boolean>;
  moveRem: (sourceId: string, targetParentId: string | null, targetIndex?: number) => Promise<boolean>;
  toggleCollapse: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  
  // Flashcard Operations
  rateCard: (cardId: string, grade: SRSGrade) => Promise<void>;
  getCardsForRem: (remId: string) => Card[];

  // Search & References
  searchRems: (query: string) => SearchResult[];
  getBacklinksForRem: (remId: string) => { linked: Rem[]; unlinked: Rem[] };

  // Data management
  resetToDefaults: () => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<boolean>;
}

const RemContext = createContext<RemContextType | null>(null);

export function RemProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [rems, setRems] = useState<Rem[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeRemId, setActiveRemId] = useState<string>('doc-rea');
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [stats, setStats] = useState<StudyStats>({
    streak: 3,
    cardsStudiedToday: 0,
    totalCards: 0,
    dueCardsCount: 0,
    retentionRate: 94,
  });

  // Pull cloud notes and update local DB
  const pullCloudData = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.rems && data.rems.length > 0) {
          await db.transaction('rw', db.rems, db.cards, async () => {
            await db.rems.clear();
            await db.cards.clear();
            await db.rems.bulkAdd(data.rems);
            if (data.cards) await db.cards.bulkAdd(data.cards);
          });
          setRems(data.rems);
          setCards(data.cards || []);
        }
        setSyncStatus('synced');
      } else {
        setSyncStatus('idle');
      }
    } catch {
      setSyncStatus('error');
    }
  }, []);

  // Push local notes to cloud
  const pushCloudData = useCallback(async (currentRems: Rem[], currentCards: Card[]) => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rems: currentRems, cards: currentCards }),
      });
      if (res.ok) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
  }, []);

  const syncWithCloud = useCallback(async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      // If client has notes, push them; also pull
      const localRems = await db.rems.toArray();
      const localCards = await db.cards.toArray();
      
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rems: localRems, cards: localCards }),
      });
      if (res.ok) {
        setSyncStatus('synced');
        return true;
      }
      setSyncStatus('error');
      return false;
    } catch {
      setSyncStatus('error');
      return false;
    }
  }, []);

  // Check active user session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            pullCloudData();
          }
        }
      } catch {
        // Guest mode / offline
      }
    }
    checkAuth();
  }, [pullCloudData]);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      await pullCloudData();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  }, [pullCloudData]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setUser(data.user);
      await pullCloudData();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    }
  }, [pullCloudData]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setSyncStatus('idle');
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, []);

  // Load database on mount
  const refreshFromDB = useCallback(async () => {
    try {
      const now = Date.now();
      setCurrentTime(now);
      await initializeDatabase();
      const allRems = await db.rems.toArray();
      const allCards = await db.cards.toArray();
      const storedStats = await db.settings.get('stats');

      setRems(allRems);
      setCards(allCards);

      const due = allCards.filter((c) => c.nextPracticeDate <= now);
      if (storedStats && storedStats.value) {
        setStats({
          ...(storedStats.value as StudyStats),
          totalCards: allCards.length,
          dueCardsCount: due.length,
        });
      } else {
        setStats({
          streak: 1,
          cardsStudiedToday: 0,
          totalCards: allCards.length,
          dueCardsCount: due.length,
          retentionRate: 90,
        });
      }
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing RemNote DB:', err);
    }
  }, []);

  useEffect(() => {
    refreshFromDB();
  }, [refreshFromDB]);

  // Handle dark mode class on HTML document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Map for fast lookups
  const remMap = useMemo(() => {
    const map = new Map<string, Rem>();
    for (const rem of rems) {
      map.set(rem.id, rem);
    }
    return map;
  }, [rems]);

  const activeRem = useMemo(() => {
    return remMap.get(activeRemId) || rems.find((r) => r.parentId === null) || null;
  }, [remMap, activeRemId, rems]);

  // Compute breadcrumbs for activeRem
  const breadcrumbs = useMemo(() => {
    if (!activeRem) return [];
    const trail: BreadcrumbItem[] = [];
    let curr: Rem | undefined = activeRem;
    while (curr) {
      trail.unshift({ id: curr.id, text: curr.text || 'Untitled' });
      curr = curr.parentId ? remMap.get(curr.parentId) : undefined;
    }
    return trail;
  }, [activeRem, remMap]);

  // Compute due cards (filter by deck if studyDeckId is provided)
  const dueCards = useMemo(() => {
    if (currentTime === 0) return [];
    const now = currentTime;
    let relevantCards = cards.filter((c) => c.nextPracticeDate <= now);

    if (studyDeckId) {
      // Find all descendant IDs of studyDeckId
      const descendantIds = new Set<string>([studyDeckId]);
      const queue = [studyDeckId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        const r = remMap.get(id);
        if (r && r.childrenIds) {
          for (const chId of r.childrenIds) {
            if (!descendantIds.has(chId)) {
              descendantIds.add(chId);
              queue.push(chId);
            }
          }
        }
      }
      relevantCards = relevantCards.filter((c) => descendantIds.has(c.remId));
    }

    return relevantCards;
  }, [cards, studyDeckId, remMap]);

  // Zoom helpers
  const zoomIntoRem = useCallback((id: string) => {
    setActiveRemId(id);
    setActiveView('editor');
  }, []);

  const zoomOut = useCallback(() => {
    if (activeRem && activeRem.parentId) {
      setActiveRemId(activeRem.parentId);
    }
  }, [activeRem]);

  // Update Rem text and synchronize its cards & tags
  const updateRemText = useCallback(
    async (id: string, text: string) => {
      const rem = remMap.get(id);
      if (!rem) return;

      const updatedTags = extractTags(text);
      const updatedRem: Rem = {
        ...rem,
        text,
        tags: Array.from(new Set([...rem.tags, ...updatedTags])),
        updatedAt: Date.now(),
      };

      // Synchronize cards for this rem
      const existingRemCards = cards.filter((c) => c.remId === id);
      const synchronizedCards = syncCardsForRem(updatedRem, existingRemCards);

      // Save to Dexie
      await db.rems.put(updatedRem);

      // Update cards in DB: remove obsolete cards, add/update new cards
      const synchedIds = new Set(synchronizedCards.map((c) => c.id));
      const obsoleteCardIds = existingRemCards.filter((c) => !synchedIds.has(c.id)).map((c) => c.id);

      if (obsoleteCardIds.length > 0) {
        await db.cards.bulkDelete(obsoleteCardIds);
      }
      if (synchronizedCards.length > 0) {
        await db.cards.bulkPut(synchronizedCards);
      }

      // Update local state
      setRems((prev) => prev.map((r) => (r.id === id ? updatedRem : r)));
      setCards((prev) => {
        const filtered = prev.filter((c) => c.remId !== id);
        return [...filtered, ...synchronizedCards];
      });
    },
    [remMap, cards]
  );

  // Update Rem type (e.g. concept, header, document)
  const updateRemType = useCallback(
    async (id: string, type: RemType) => {
      const rem = remMap.get(id);
      if (!rem) return;

      const updatedRem: Rem = {
        ...rem,
        type,
        updatedAt: Date.now(),
      };

      await db.rems.put(updatedRem);
      setRems((prev) => prev.map((r) => (r.id === id ? updatedRem : r)));
    },
    [remMap]
  );

  // Create a new Rem
  const createRem = useCallback(
    async (
      parentId: string | null,
      afterRemId?: string,
      initialText: string = '',
      type: RemType = 'bullet'
    ): Promise<string> => {
      const newId = `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();

      const newRem: Rem = {
        id: newId,
        text: initialText,
        parentId,
        childrenIds: [],
        type,
        isCollapsed: false,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      await db.rems.put(newRem);

      if (parentId) {
        const parent = remMap.get(parentId);
        if (parent) {
          const children = [...parent.childrenIds];
          if (afterRemId) {
            const index = children.indexOf(afterRemId);
            if (index !== -1) {
              children.splice(index + 1, 0, newId);
            } else {
              children.push(newId);
            }
          } else {
            children.push(newId);
          }

          const updatedParent: Rem = {
            ...parent,
            childrenIds: children,
            updatedAt: now,
          };

          await db.rems.put(updatedParent);
          setRems((prev) => [...prev.map((r) => (r.id === parentId ? updatedParent : r)), newRem]);
          return newId;
        }
      }

      setRems((prev) => [...prev, newRem]);
      return newId;
    },
    [remMap]
  );

  // Delete a Rem and its subtree recursively
  const deleteRem = useCallback(
    async (id: string) => {
      const toDeleteIds: string[] = [];
      const queue = [id];

      while (queue.length > 0) {
        const currId = queue.shift()!;
        toDeleteIds.push(currId);
        const curr = remMap.get(currId);
        if (curr && curr.childrenIds) {
          queue.push(...curr.childrenIds);
        }
      }

      const rem = remMap.get(id);
      if (rem && rem.parentId) {
        const parent = remMap.get(rem.parentId);
        if (parent) {
          const updatedParent: Rem = {
            ...parent,
            childrenIds: parent.childrenIds.filter((chId) => chId !== id),
            updatedAt: Date.now(),
          };
          await db.rems.put(updatedParent);
        }
      }

      await db.rems.bulkDelete(toDeleteIds);
      const cardsToDelete = cards.filter((c) => toDeleteIds.includes(c.remId)).map((c) => c.id);
      if (cardsToDelete.length > 0) {
        await db.cards.bulkDelete(cardsToDelete);
      }

      setRems((prev) =>
        prev
          .filter((r) => !toDeleteIds.includes(r.id))
          .map((r) =>
            rem?.parentId && r.id === rem.parentId
              ? { ...r, childrenIds: r.childrenIds.filter((chId) => chId !== id) }
              : r
          )
      );
      setCards((prev) => prev.filter((c) => !toDeleteIds.includes(c.remId)));
    },
    [remMap, cards]
  );

  // Indent Rem (Tab key): Make this Rem the child of its previous sibling
  const indentRem = useCallback(
    async (id: string): Promise<boolean> => {
      const rem = remMap.get(id);
      if (!rem || !rem.parentId) return false;

      const parent = remMap.get(rem.parentId);
      if (!parent) return false;

      const currentIndex = parent.childrenIds.indexOf(id);
      if (currentIndex <= 0) return false; // cannot indent the first child

      const prevSiblingId = parent.childrenIds[currentIndex - 1];
      const prevSibling = remMap.get(prevSiblingId);
      if (!prevSibling) return false;

      // Remove from current parent
      const updatedParent: Rem = {
        ...parent,
        childrenIds: parent.childrenIds.filter((chId) => chId !== id),
        updatedAt: Date.now(),
      };

      // Add to new parent (prevSibling)
      const updatedPrevSibling: Rem = {
        ...prevSibling,
        childrenIds: [...prevSibling.childrenIds, id],
        isCollapsed: false, // auto uncollapse so user sees it indented
        updatedAt: Date.now(),
      };

      const updatedRem: Rem = {
        ...rem,
        parentId: prevSiblingId,
        updatedAt: Date.now(),
      };

      await db.rems.bulkPut([updatedParent, updatedPrevSibling, updatedRem]);

      setRems((prev) =>
        prev.map((r) => {
          if (r.id === parent.id) return updatedParent;
          if (r.id === prevSibling.id) return updatedPrevSibling;
          if (r.id === rem.id) return updatedRem;
          return r;
        })
      );

      return true;
    },
    [remMap]
  );

  // Outdent Rem (Shift + Tab): Move Rem up to become sibling of its current parent
  const outdentRem = useCallback(
    async (id: string): Promise<boolean> => {
      const rem = remMap.get(id);
      if (!rem || !rem.parentId) return false;

      const parent = remMap.get(rem.parentId);
      if (!parent || !parent.parentId) return false; // cannot outdent past document level

      const grandParent = remMap.get(parent.parentId);
      if (!grandParent) return false;

      // Remove from parent
      const updatedParent: Rem = {
        ...parent,
        childrenIds: parent.childrenIds.filter((chId) => chId !== id),
        updatedAt: Date.now(),
      };

      // Insert into grandParent right after parent
      const parentIdx = grandParent.childrenIds.indexOf(parent.id);
      const newGrandChildren = [...grandParent.childrenIds];
      if (parentIdx !== -1) {
        newGrandChildren.splice(parentIdx + 1, 0, id);
      } else {
        newGrandChildren.push(id);
      }

      const updatedGrandParent: Rem = {
        ...grandParent,
        childrenIds: newGrandChildren,
        updatedAt: Date.now(),
      };

      const updatedRem: Rem = {
        ...rem,
        parentId: grandParent.id,
        updatedAt: Date.now(),
      };

      await db.rems.bulkPut([updatedParent, updatedGrandParent, updatedRem]);

      setRems((prev) =>
        prev.map((r) => {
          if (r.id === parent.id) return updatedParent;
          if (r.id === grandParent.id) return updatedGrandParent;
          if (r.id === rem.id) return updatedRem;
          return r;
        })
      );

      return true;
    },
    [remMap]
  );

  // Move a Rem or Document into another parent (e.g. dragging document into a folder)
  const moveRem = useCallback(
    async (sourceId: string, targetParentId: string | null, targetIndex?: number): Promise<boolean> => {
      if (sourceId === targetParentId) return false;

      const sourceRem = remMap.get(sourceId);
      if (!sourceRem) return false;

      // Prevent cyclical loops: cannot move a folder into its own descendants
      if (targetParentId) {
        let curr: Rem | undefined = remMap.get(targetParentId);
        while (curr) {
          if (curr.id === sourceId) return false; // Cycle detected
          curr = curr.parentId ? remMap.get(curr.parentId) : undefined;
        }
      }

      // If already in the target parent and no target index specified, no-op
      if (sourceRem.parentId === targetParentId && targetIndex === undefined) {
        return false;
      }

      const now = Date.now();
      const updates: Rem[] = [];

      // 1. Remove from old parent's childrenIds if it had a parent
      if (sourceRem.parentId) {
        const oldParent = remMap.get(sourceRem.parentId);
        if (oldParent) {
          const updatedOldParent: Rem = {
            ...oldParent,
            childrenIds: oldParent.childrenIds.filter((cid) => cid !== sourceId),
            updatedAt: now,
          };
          updates.push(updatedOldParent);
        }
      }

      // 2. Add to new target parent's childrenIds
      if (targetParentId) {
        const targetParent = updates.find((u) => u.id === targetParentId) || remMap.get(targetParentId);
        if (targetParent) {
          const newChildren = [...targetParent.childrenIds.filter((cid) => cid !== sourceId)];
          if (typeof targetIndex === 'number' && targetIndex >= 0) {
            newChildren.splice(targetIndex, 0, sourceId);
          } else {
            newChildren.push(sourceId);
          }
          const updatedTargetParent: Rem = {
            ...targetParent,
            childrenIds: newChildren,
            isCollapsed: false, // auto-expand folder so the moved item is immediately visible
            updatedAt: now,
          };
          const existingIdx = updates.findIndex((u) => u.id === targetParentId);
          if (existingIdx !== -1) {
            updates[existingIdx] = updatedTargetParent;
          } else {
            updates.push(updatedTargetParent);
          }
        }
      }

      // 3. Update source Rem's parentId
      const updatedSourceRem: Rem = {
        ...sourceRem,
        parentId: targetParentId,
        updatedAt: now,
      };
      updates.push(updatedSourceRem);

      // Persist to Dexie
      await db.rems.bulkPut(updates);

      // Update React state
      setRems((prev) => {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        return prev.map((r) => updateMap.get(r.id) || r);
      });

      return true;
    },
    [remMap]
  );

  // Toggle Collapse
  const toggleCollapse = useCallback(
    async (id: string) => {
      const rem = remMap.get(id);
      if (!rem) return;

      const updated: Rem = {
        ...rem,
        isCollapsed: !rem.isCollapsed,
        updatedAt: Date.now(),
      };

      await db.rems.put(updated);
      setRems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [remMap]
  );

  // Toggle Pin
  const togglePin = useCallback(
    async (id: string) => {
      const rem = remMap.get(id);
      if (!rem) return;

      const updated: Rem = {
        ...rem,
        isPinned: !rem.isPinned,
        updatedAt: Date.now(),
      };

      await db.rems.put(updated);
      setRems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [remMap]
  );

  // Toggle ToDo
  const toggleTodo = useCallback(
    async (id: string) => {
      const rem = remMap.get(id);
      if (!rem) return;

      const updated: Rem = {
        ...rem,
        isCompleted: !rem.isCompleted,
        updatedAt: Date.now(),
      };

      await db.rems.put(updated);
      setRems((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [remMap]
  );

  // Rate a card in Flashcard Review mode
  const rateCard = useCallback(
    async (cardId: string, grade: SRSGrade) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const updates = calculateNextSRSState(card, grade);
      const updatedCard: Card = {
        ...card,
        ...updates,
      };

      await db.cards.put(updatedCard);

      // Update study stats
      const newStudiedCount = stats.cardsStudiedToday + 1;
      const updatedStats: StudyStats = {
        ...stats,
        cardsStudiedToday: newStudiedCount,
        dueCardsCount: Math.max(0, stats.dueCardsCount - 1),
      };

      await db.settings.put({ key: 'stats', value: updatedStats });
      setStats(updatedStats);

      setCards((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));
    },
    [cards, stats]
  );

  // Get all cards generated by a specific Rem
  const getCardsForRem = useCallback(
    (remId: string) => {
      return cards.filter((c) => c.remId === remId);
    },
    [cards]
  );

  // Search Rems
  const searchRems = useCallback(
    (query: string): SearchResult[] => {
      if (!query || query.trim().length === 0) return [];
      const q = query.toLowerCase().trim();

      const results: SearchResult[] = [];
      for (const rem of rems) {
        const text = rem.text.toLowerCase();
        let matchType: SearchResult['matchType'] | null = null;

        if (rem.parentId === null && text.includes(q)) {
          matchType = 'title';
        } else if (text.includes(q)) {
          matchType = 'content';
        } else if (rem.tags.some((t) => t.toLowerCase().includes(q))) {
          matchType = 'tag';
        }

        if (matchType) {
          // Find root document title
          let docTitle = 'Root';
          let curr: Rem | undefined = rem;
          while (curr && curr.parentId) {
            curr = remMap.get(curr.parentId);
          }
          if (curr) docTitle = curr.text || 'Untitled';

          results.push({
            rem,
            documentTitle: docTitle,
            matchType,
          });
        }
      }

      return results;
    },
    [rems, remMap]
  );

  // Get Backlinks (Linked references and Unlinked references)
  const getBacklinksForRem = useCallback(
    (remId: string) => {
      const targetRem = remMap.get(remId);
      if (!targetRem) return { linked: [], unlinked: [] };

      const targetTitle = targetRem.text.toLowerCase().trim();
      const linked: Rem[] = [];
      const unlinked: Rem[] = [];

      if (!targetTitle) return { linked, unlinked };

      for (const rem of rems) {
        if (rem.id === remId) continue;

        const refs = extractReferences(rem.text);
        const isExplicitlyLinked = refs.some(
          (ref) => ref.toLowerCase() === targetTitle || ref === targetRem.id
        );

        if (isExplicitlyLinked) {
          linked.push(rem);
        } else if (rem.text.toLowerCase().includes(targetTitle)) {
          unlinked.push(rem);
        }
      }

      return { linked, unlinked };
    },
    [rems, remMap]
  );

  // Backup and restore
  const resetToDefaults = useCallback(async () => {
    await resetDatabase();
    await refreshFromDB();
  }, [refreshFromDB]);

  const exportBackup = useCallback(async () => {
    return await exportDatabaseToJSON();
  }, []);

  const importBackup = useCallback(
    async (json: string) => {
      const success = await importDatabaseFromJSON(json);
      if (success) {
        await refreshFromDB();
      }
      return success;
    },
    [refreshFromDB]
  );

  return (
    <RemContext.Provider
      value={{
        isInitialized,
        user,
        syncStatus,
        login,
        register,
        logout,
        syncWithCloud,
        rems,
        cards,
        activeRemId,
        activeRem,
        activeView,
        studyDeckId,
        dueCards,
        currentTime,
        stats,
        breadcrumbs,
        theme,
        setActiveRemId,
        setActiveView,
        setStudyDeckId,
        zoomIntoRem,
        zoomOut,
        toggleTheme,
        updateRemText,
        updateRemType,
        createRem,
        deleteRem,
        indentRem,
        outdentRem,
        moveRem,
        toggleCollapse,
        togglePin,
        toggleTodo,
        rateCard,
        getCardsForRem,
        searchRems,
        getBacklinksForRem,
        resetToDefaults,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </RemContext.Provider>
  );
}

export function useRem() {
  const context = useContext(RemContext);
  if (!context) {
    throw new Error('useRem must be used within a RemProvider');
  }
  return context;
}
