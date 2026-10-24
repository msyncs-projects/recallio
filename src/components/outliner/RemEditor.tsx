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
  Calendar,
  Folder,
  FolderOpen,
  FileText,
  UploadCloud,
  Video,
  FileUp,
  Globe,
  Wand2,
  Trash2
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { Rem } from '@/types';
import { RemItem } from './RemItem';
import { AiAssistantModal } from '@/components/modals/AiAssistantModal';
import { ImportSourceModal } from '@/components/modals/ImportSourceModal';

export const RemEditor: React.FC = () => {
  const {
    activeRem,
    activeRemId,
    setActiveRemId,
    breadcrumbs,
    zoomIntoRem,
    updateRemText,
    createRem,
    deleteRem,
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

  // AI & Import Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<'flashcards' | 'summary' | 'expand' | 'qa'>('flashcards');
  const [aiTargetRemId, setAiTargetRemId] = useState<string | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalTab, setImportModalTab] = useState<'pdf' | 'web' | 'youtube'>('pdf');

  // Multi-select state for bulk actions (select multiple Rems to delete or move)
  const [selectedRemIds, setSelectedRemIds] = useState<Set<string>>(new Set());

  // Keep title in sync and clear multi-selection when activeRem changes
  React.useEffect(() => {
    setSelectedRemIds(new Set());
    if (activeRem) {
      setTitleText(activeRem.text);
      setFormattedDate(new Date(activeRem.updatedAt).toLocaleDateString());
    }
  }, [activeRem]);

  // Bulk delete selected rems
  const handleBulkDelete = async () => {
    if (selectedRemIds.size === 0) return;
    const count = selectedRemIds.size;
    if (window.confirm(`Möchtest du die ${count} ausgewählten Notizen wirklich löschen?`)) {
      for (const id of Array.from(selectedRemIds)) {
        await deleteRem(id);
      }
      setSelectedRemIds(new Set());
    }
  };

  // Keyboard shortcut listener for multi-select (Escape to clear, Delete/Backspace to delete)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedRemIds.size === 0) return;
      if (e.key === 'Escape') {
        setSelectedRemIds(new Set());
      } else if (e.key === 'Delete' || (e.key === 'Backspace' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT')) {
        handleBulkDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRemIds]);

  if (!activeRem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2 shadow-inner">
          <FolderTree className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Kein Dokument ausgewählt</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Wähle ein Dokument aus der Seitenleiste oder erstelle direkt ein neues Dokument oder einen Ordner, um Notizen zu erfassen.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 w-full justify-center">
          <button
            type="button"
            onClick={async () => {
              const newId = await createRem(null, undefined, 'Neues Dokument', 'document');
              setActiveRemId(newId);
            }}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Neues Dokument</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              const newId = await createRem(null, undefined, 'Neuer Ordner', 'folder');
              setActiveRemId(newId);
            }}
            className="px-4 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>Neuer Ordner</span>
          </button>
        </div>
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

  const isFolder = activeRem.type === 'folder';
  const childRems = (activeRem.childrenIds || [])
    .map((id) => rems.find((r) => r.id === id))
    .filter(Boolean) as Rem[];
  const childDocsAndFolders = childRems.filter((r) => r.type === 'document' || r.type === 'folder');
  const childBullets = childRems.filter((r) => r.type !== 'document' && r.type !== 'folder');

  // Detect embedded YouTube video
  const youtubeVideoId = React.useMemo(() => {
    const fullText = (activeRem?.text || '') + ' ' + childRems.map((r) => r.text).join(' ');
    const match = fullText.match(/(?:youtu\.be\/|watch\?v=|embed\/)([a-zA-Z0-9_\-]{11})/);
    return match ? match[1] : null;
  }, [activeRem, childRems]);

  const saveTitle = async () => {
    setIsEditingTitle(false);
    const trimmed = titleText.trim();
    if (trimmed && activeRem && trimmed !== activeRem.text) {
      await updateRemText(activeRem.id, trimmed);
    }
  };

  const handleTitleBlur = () => {
    saveTitle();
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (activeRem) setTitleText(activeRem.text);
      setIsEditingTitle(false);
    }
  };

  const handleStudyDocument = () => {
    setStudyDeckId(activeRem.id);
    setActiveView('flashcards');
  };

  const handleDeleteActiveRem = async () => {
    if (!activeRem) return;
    const isFolder = activeRem.type === 'folder';
    const typeLabel = isFolder ? 'Ordner' : 'Dokument';
    const name = activeRem.text.split('::')[0].trim() || (isFolder ? 'Unbenannter Ordner' : 'Unbenanntes Dokument');
    const hasChildren = activeRem.childrenIds && activeRem.childrenIds.length > 0;
    const confirmMsg = hasChildren
      ? `Möchtest du den ${typeLabel} "${name}" und alle darin enthaltenen Notizen & Karteikarten wirklich löschen?`
      : `Möchtest du das ${typeLabel} "${name}" wirklich löschen?`;

    if (window.confirm(confirmMsg)) {
      await deleteRem(activeRem.id);
    }
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

      {/* Document / Folder Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex items-start gap-3">
            {isFolder && (
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Folder className="w-6 h-6" />
              </div>
            )}
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
                  title="Click to edit title"
                >
                  {activeRem.text || (isFolder ? 'Untitled Folder' : 'Untitled Document')}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={() => {
                setAiModalMode('flashcards');
                setAiTargetRemId(activeRem.id);
                setIsAiModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Auto-Generate Flashcards & Summaries with AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Import Source Button */}
            <button
              type="button"
              onClick={() => {
                setImportModalTab('pdf');
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              title="Import PDF, Web Page or YouTube Video"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Folder Actions */}
            {isFolder && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const newId = await createRem(activeRem.id, undefined, 'Untitled Note', 'document');
                    setActiveRemId(newId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Create a new document inside this folder"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Document</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const newId = await createRem(activeRem.id, undefined, 'New Folder', 'folder');
                    setActiveRemId(newId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Create a new subfolder inside this folder"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Subfolder</span>
                </button>
              </>
            )}

            {/* Study Deck Button */}
            {documentCards.length > 0 && (
              <button
                type="button"
                onClick={handleStudyDocument}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                title="Practice flashcards from this document"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Practice {dueCardsInDoc.length > 0 ? `(${dueCardsInDoc.length} due)` : `(${documentCards.length})`}</span>
              </button>
            )}

            {/* Pin Item */}
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

            {/* Delete Document or Folder */}
            <button
              type="button"
              onClick={handleDeleteActiveRem}
              className="p-2 rounded-lg text-xs text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={isFolder ? 'Diesen Ordner löschen' : 'Dieses Dokument löschen'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Badges & Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${
            isFolder
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
          }`}>
            {isFolder ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            <span className="capitalize">{activeRem.type}</span>
          </span>

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

      {/* If Folder: Display Contained Documents & Subfolders Grid */}
      {isFolder && (
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Contents ({childDocsAndFolders.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalTab('pdf');
                  setIsImportModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Import Source</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAiModalMode('flashcards');
                  setAiTargetRemId(activeRem.id);
                  setIsAiModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Cards from Folder</span>
              </button>
            </div>
          </div>

          {childDocsAndFolders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {childDocsAndFolders.map((child) => {
                const isChildFolder = child.type === 'folder';
                const childCardsCount = cards.filter((c) => c.remId === child.id).length;
                return (
                  <div
                    key={child.id}
                    onClick={() => zoomIntoRem(child.id)}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isChildFolder
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        }`}>
                          {isChildFolder ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                            {child.text.split('::')[0].trim() || (isChildFolder ? 'Untitled Folder' : 'Untitled Note')}
                          </div>
                          <div className="text-[11px] text-zinc-400 capitalize">
                            {child.type}
                          </div>
                        </div>
                      </div>

                      {/* Delete child button on hover */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const childName = child.text.split('::')[0].trim() || (isChildFolder ? 'Ordner' : 'Dokument');
                          const childHasChildren = child.childrenIds && child.childrenIds.length > 0;
                          const confirmMsg = childHasChildren
                            ? `Möchtest du "${childName}" und alle Unterelemente wirklich löschen?`
                            : `Möchtest du "${childName}" wirklich löschen?`;
                          if (window.confirm(confirmMsg)) {
                            await deleteRem(child.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0"
                        title={isChildFolder ? 'Ordner löschen' : 'Dokument löschen'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {childCardsCount > 0 && (
                      <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-500" />
                        <span>{childCardsCount} cards</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
              <Folder className="w-8 h-8 mx-auto text-amber-400/60" />
              <p className="text-xs text-zinc-400">This folder is currently empty.</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    const newId = await createRem(activeRem.id, undefined, 'Untitled Note', 'document');
                    setActiveRemId(newId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Create Document</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const newId = await createRem(activeRem.id, undefined, 'New Folder', 'folder');
                    setActiveRemId(newId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Create Subfolder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportModalTab('pdf');
                    setIsImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Import Source</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded YouTube Player (if YouTube document) */}
      {youtubeVideoId && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-xl">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title="YouTube Video Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-semibold">Interactive Video Note</span>
            </div>
            <button
              type="button"
              onClick={() => createRem(activeRem.id, undefined, '[00:00] Note :: Definition', 'bullet')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>Add Timestamp Note</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Hierarchical Outliner Tree (Notes / Bullets) */}
      <div className="space-y-1 pb-16">
        {isFolder && (
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Notes & Outline
          </h2>
        )}
        {activeRem.childrenIds && activeRem.childrenIds.length > 0 ? (
          activeRem.childrenIds
            .filter((childId) => !isFolder || childBullets.some((b) => b.id === childId))
            .map((childId, idx, arr) => (
              <RemItem
                key={childId}
                remId={childId}
                depth={0}
                isLastSibling={idx === arr.length - 1}
                isSelected={selectedRemIds.has(childId)}
                onToggleSelect={(id) => {
                  setSelectedRemIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                onOpenAiModal={(mode, id) => {
                  setAiModalMode(mode);
                  setAiTargetRemId(id || activeRem.id);
                  setIsAiModalOpen(true);
                }}
                onOpenImportModal={(type) => {
                  setImportModalTab(type);
                  setIsImportModalOpen(true);
                }}
              />
            ))
        ) : null}

        {/* Add New Line / Bullet */}
        <div className="pt-2">
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

      {/* Floating Multi-Select Actions Bar */}
      {selectedRemIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 dark:bg-zinc-800/95 text-white shadow-2xl rounded-2xl border border-zinc-700/80 px-4 py-2.5 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
              {selectedRemIds.size}
            </span>
            <span>{selectedRemIds.size === 1 ? 'Rem selected' : 'Rems selected'}</span>
          </div>

          <div className="h-4 w-px bg-zinc-700" />

          {/* Select All Children */}
          <button
            type="button"
            onClick={() => {
              const allChildIds = (activeRem.childrenIds || []).filter(
                (cid) => !isFolder || childBullets.some((b) => b.id === cid)
              );
              setSelectedRemIds(new Set(allChildIds));
            }}
            className="text-xs text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Select All
          </button>

          {/* Delete Selected (Bulk Delete) */}
          <button
            type="button"
            onClick={handleBulkDelete}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => setSelectedRemIds(new Set())}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

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

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        targetRemId={aiTargetRemId}
        initialMode={aiModalMode}
      />

      {/* Import Source Modal (PDF, Web, YouTube) */}
      <ImportSourceModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetFolderId={isFolder ? activeRem.id : activeRem.parentId}
        initialTab={importModalTab}
      />
    </div>
  );
};
