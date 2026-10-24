'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  ChevronRight, 
  Pin, 
  Sparkles, 
  Plus, 
  Link as LinkIcon, 
  BookOpen, 
  FolderTree, 
  Share2,
  Calendar
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { RemItem } from './RemItem';

export const RemEditor: React.FC = () => {
  const {
    activeRem,
    activeRemId,
    breadcrumbs,
    zoomIntoRem,
    updateRemText,
    createRem,
    togglePin,
    cards,
    currentTime,
    getBacklinksForRem,
    setStudyDeckId,
    setActiveView,
    rems,
  } = useRem();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(activeRem?.text || '');
  const [formattedDate, setFormattedDate] = useState('');

  // Keep title in sync when activeRem changes
  React.useEffect(() => {
    if (activeRem) {
      setTitleText(activeRem.text);
      setFormattedDate(new Date(activeRem.updatedAt).toLocaleDateString());
    }
  }, [activeRem]);

  if (!activeRem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
        <FolderTree className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700 animate-pulse" />
        <p className="text-base font-medium">Select or create a document to start writing</p>
      </div>
    );
  }

  // Count total cards in this document and all its descendants
  const getAllDescendantIds = (rootId: string): Set<string> => {
    const ids = new Set<string>([rootId]);
    const queue = [rootId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const r = rems.find((rem) => rem.id === curr);
      if (r && r.childrenIds) {
        for (const ch of r.childrenIds) {
          if (!ids.has(ch)) {
            ids.add(ch);
            queue.push(ch);
          }
        }
      }
    }
    return ids;
  };

  const documentDescendantIds = getAllDescendantIds(activeRem.id);
  const documentCards = cards.filter((c) => documentDescendantIds.has(c.remId));
  const dueCardsInDoc = documentCards.filter((c) => currentTime > 0 && c.nextPracticeDate <= currentTime);

  const { linked, unlinked } = getBacklinksForRem(activeRem.id);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleText !== activeRem.text) {
      updateRemText(activeRem.id, titleText);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      // Create first child if empty
      if (activeRem.childrenIds.length === 0) {
        createRem(activeRem.id, undefined, '', 'bullet');
      }
    }
  };

  const handleStudyDocument = () => {
    setStudyDeckId(activeRem.id);
    setActiveView('flashcards');
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-16 lg:px-24 max-w-5xl mx-auto w-full">
      {/* Breadcrumb Navigation Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-6 font-medium">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />}
              <button
                type="button"
                onClick={() => zoomIntoRem(crumb.id)}
                className={`truncate max-w-[200px] hover:text-blue-500 transition-colors cursor-pointer ${
                  isLast
                    ? 'text-zinc-900 dark:text-zinc-200 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {crumb.text.split('::')[0].trim() || 'Untitled'}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Document Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none pb-1"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight"
                title="Click to edit document title"
              >
                {activeRem.text || 'Untitled Document'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Study Deck Button */}
            {documentCards.length > 0 && (
              <button
                type="button"
                onClick={handleStudyDocument}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Practice flashcards from this document"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Practice {dueCardsInDoc.length > 0 ? `(${dueCardsInDoc.length} due)` : `(${documentCards.length})`}</span>
              </button>
            )}

            {/* Pin Document */}
            <button
              type="button"
              onClick={() => togglePin(activeRem.id)}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeRem.isPinned
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title={activeRem.isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Badges & Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
            <span>{documentCards.length} {documentCards.length === 1 ? 'card' : 'cards'} in deck</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formattedDate ? `Updated ${formattedDate}` : 'Recently updated'}</span>
          </div>

          {activeRem.tags && activeRem.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeRem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Hierarchical Outliner Tree */}
      <div className="space-y-1 pb-16">
        {activeRem.childrenIds && activeRem.childrenIds.length > 0 ? (
          activeRem.childrenIds.map((childId, idx) => (
            <RemItem
              key={childId}
              remId={childId}
              depth={0}
              isLastSibling={idx === activeRem.childrenIds.length - 1}
            />
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
            <p className="text-xs text-zinc-400">This document has no bullet points yet.</p>
            <button
              type="button"
              onClick={() => createRem(activeRem.id, undefined, '', 'bullet')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Rem
            </button>
          </div>
        )}

        {/* Add New Line Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => createRem(activeRem.id, undefined, '', 'bullet')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-blue-500 py-1 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add line (or press Enter)</span>
          </button>
        </div>
      </div>

      {/* Backlinks & Bidirectional References Section */}
      <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          <span>References & Backlinks</span>
        </div>

        {/* Linked References */}
        {linked.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Linked References ({linked.length})
            </h2>
            <div className="grid gap-2">
              {linked.map((rem) => (
                <div
                  key={rem.id}
                  onClick={() => zoomIntoRem(rem.id)}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-xs text-zinc-400">Referenced in:</div>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {rem.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 italic">
            No other documents link to this page yet. Use [[{activeRem.text.split('::')[0].trim()}]] in any note to link here.
          </div>
        )}

        {/* Unlinked References */}
        {unlinked.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Unlinked Mentions ({unlinked.length})
            </h2>
            <div className="grid gap-2">
              {unlinked.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4"
                >
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">
                    {rem.text}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const title = activeRem.text.split('::')[0].trim();
                      const regex = new RegExp(title, 'gi');
                      const updated = rem.text.replace(regex, `[[${title}]]`);
                      updateRemText(rem.id, updated);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                  >
                    Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
