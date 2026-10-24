'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  CreditCard, 
  Layers, 
  Plus, 
  Calendar, 
  Tag, 
  Sparkles,
  ArrowRight,
  Folder
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { SearchResult } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImportExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenImportExport,
}) => {
  const {
    searchRems,
    zoomIntoRem,
    createRem,
    setActiveView,
    rems,
  } = useRem();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const searchResults = query.trim() ? searchRems(query).slice(0, 8) : [];

  // Default Quick Actions when query is empty
  const defaultActions = [
    {
      id: 'action-new-doc',
      title: 'Create New Document',
      subtitle: 'Start a blank note at the root level',
      icon: <Plus className="w-4 h-4 text-blue-500" />,
      action: async () => {
        const id = await createRem(null, undefined, 'Untitled Note', 'document');
        zoomIntoRem(id);
        onClose();
      },
    },
    {
      id: 'action-new-folder',
      title: 'Create New Folder',
      subtitle: 'Organize documents and subfolders',
      icon: <Folder className="w-4 h-4 text-amber-500" />,
      action: async () => {
        const id = await createRem(null, undefined, 'New Folder', 'folder');
        zoomIntoRem(id);
        onClose();
      },
    },
    {
      id: 'action-study',
      title: 'Practice Flashcard Queue',
      subtitle: 'Review due cards with spaced repetition',
      icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setActiveView('flashcards');
        onClose();
      },
    },
    {
      id: 'action-graph',
      title: 'Open Knowledge Graph',
      subtitle: 'Explore 2D visual network of concepts',
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      action: () => {
        setActiveView('graph');
        onClose();
      },
    },
    {
      id: 'action-today',
      title: "Today's Daily Note",
      subtitle: 'Journal entry for today',
      icon: <Calendar className="w-4 h-4 text-amber-500" />,
      action: async () => {
        const todayTitle = `Daily Note: ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        let todayRem = rems.find((r) => r.text.startsWith('Daily Note') || r.text === todayTitle);
        if (!todayRem) {
          const id = await createRem(null, undefined, todayTitle, 'document');
          zoomIntoRem(id);
        } else {
          zoomIntoRem(todayRem.id);
        }
        onClose();
      },
    },
  ];

  const totalItems = query.trim() ? searchResults.length : defaultActions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && searchResults[selectedIndex]) {
        zoomIntoRem(searchResults[selectedIndex].rem.id);
        onClose();
      } else if (!query.trim() && defaultActions[selectedIndex]) {
        defaultActions[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, flashcards, tags, or type a command..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-100 dark:divide-zinc-800/40">
          {query.trim() ? (
            searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <div
                  key={res.rem.id}
                  onClick={() => {
                    zoomIntoRem(res.rem.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                    selectedIndex === idx
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      res.rem.type === 'folder' 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {res.rem.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {res.rem.text || 'Untitled'}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        In: {res.documentTitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-zinc-400">
                No matching notes found. Press Enter to create a new note with this title.
              </div>
            )
          ) : (
            defaultActions.map((act, idx) => (
              <div
                key={act.id}
                onClick={act.action}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {act.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{act.title}</div>
                    <div className="text-[11px] text-zinc-400">{act.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>RemNote Workspace Search</span>
        </div>
      </div>
    </div>
  );
};
