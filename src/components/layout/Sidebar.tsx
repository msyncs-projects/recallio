'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CreditCard, 
  Layers, 
  Calendar, 
  Search, 
  Plus, 
  Pin, 
  Tag, 
  Sun, 
  Moon, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  HardDrive, 
  Sparkles,
  BookOpen,
  Cloud,
  LogOut,
  RefreshCw,
  User as UserIcon,
  LogIn,
  Folder,
  FolderOpen,
  UploadCloud,
  GripVertical,
  Trash2
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { Rem } from '@/types';

interface SidebarProps {
  onOpenSearch: () => void;
  onOpenImportExport: () => void;
  onOpenAuth: () => void;
  onOpenImportSource?: (folderId?: string | null) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSearch,
  onOpenImportExport,
  onOpenAuth,
  onOpenImportSource,
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    rems,
    activeRemId,
    activeView,
    dueCards,
    theme,
    toggleTheme,
    setActiveView,
    zoomIntoRem,
    createRem,
    moveRem,
    deleteRem,
    user,
    syncStatus,
    syncWithCloud,
    logout,
  } = useRem();

  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set(['doc-rea', 'doc-welcome']));
  // Dropdown menu state: 'header' | 'docs' | 'folder-[id]' | null
  const [openMenuTarget, setOpenMenuTarget] = useState<string | null>(null);

  const handleDeleteItem = async (e: React.MouseEvent, doc: Rem) => {
    e.stopPropagation();
    const isFolder = doc.type === 'folder';
    const typeLabel = isFolder ? 'Ordner' : 'Dokument';
    const name = doc.text.split('::')[0].trim() || (isFolder ? 'Unbenannter Ordner' : 'Unbenanntes Dokument');
    const hasChildren = doc.childrenIds && doc.childrenIds.length > 0;
    const confirmMsg = hasChildren
      ? `Möchtest du den ${typeLabel} "${name}" und alle darin enthaltenen Notizen & Karteikarten wirklich löschen?`
      : `Möchtest du das ${typeLabel} "${name}" wirklich löschen?`;

    if (window.confirm(confirmMsg)) {
      await deleteRem(doc.id);
    }
  };

  // Drag and drop states for moving documents into folders
  const [draggedRemId, setDraggedRemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isRootDropTarget, setIsRootDropTarget] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.create-dropdown-container')) {
        setOpenMenuTarget(null);
      }
    };
    if (openMenuTarget) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuTarget]);

  // Root documents and folders
  const rootDocuments = rems.filter((r) => r.parentId === null);
  const pinnedDocuments = rems.filter((r) => r.isPinned);

  // Extract all unique tags
  const allTags = Array.from(new Set(rems.flatMap((r) => r.tags || []))).slice(0, 8);

  const toggleDocExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateItem = async (type: 'document' | 'folder', parentId: string | null = null) => {
    setOpenMenuTarget(null);
    const defaultTitle = type === 'folder' ? 'New Folder' : 'Untitled Note';
    const newId = await createRem(parentId, undefined, defaultTitle, type);
    if (parentId) {
      setExpandedDocIds((prev) => new Set(prev).add(parentId));
    }
    zoomIntoRem(newId);
    setActiveView('editor');
    if (isOpenMobile) onCloseMobile();
  };

  const handleOpenDailyNote = async () => {
    const todayTitle = `Daily Note: ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    let todayRem = rems.find((r) => r.text.startsWith('Daily Note') || r.text === todayTitle);
    if (!todayRem) {
      const id = await createRem(null, undefined, todayTitle, 'document');
      zoomIntoRem(id);
    } else {
      zoomIntoRem(todayRem.id);
    }
    setActiveView('editor');
    if (isOpenMobile) onCloseMobile();
  };

  // Reusable Dropdown for creating Document vs Folder
  const CreateDropdown: React.FC<{
    parentId?: string | null;
    align?: 'left' | 'right';
  }> = ({ parentId = null, align = 'right' }) => (
    <div
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 w-48 bg-white dark:bg-zinc-850 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        {parentId ? 'Add to Folder' : 'Create New'}
      </div>
      <button
        type="button"
        onClick={() => handleCreateItem('document', parentId)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">New Document</div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Outliner note & cards</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => handleCreateItem('folder', parentId)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Folder className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">New Folder</div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Organize documents</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          setOpenMenuTarget(null);
          onOpenImportSource?.(parentId);
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UploadCloud className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">Import Source...</div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">PDF, Web, YouTube</div>
        </div>
      </button>
    </div>
  );

  // Recursive Tree Item Renderer for Documents & Folders with Drag & Drop
  const renderTreeItem = (doc: Rem, depth = 0): React.ReactNode => {
    const isFolder = doc.type === 'folder';
    const isExpanded = expandedDocIds.has(doc.id);
    const childRems = doc.childrenIds
      ? (doc.childrenIds.map((cid) => rems.find((r) => r.id === cid)).filter(Boolean) as Rem[])
      : [];
    const hasChildren = childRems.length > 0;
    const isCurrent = activeRemId === doc.id && activeView === 'editor';
    const menuKey = `folder-${doc.id}`;

    const isDraggingThis = draggedRemId === doc.id;
    const isDropTargetThis = dropTargetId === doc.id;

    return (
      <div
        key={doc.id}
        className={`space-y-0.5 transition-all ${
          isDraggingThis ? 'opacity-30 scale-95' : ''
        }`}
      >
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', doc.id);
            e.dataTransfer.effectAllowed = 'move';
            setDraggedRemId(doc.id);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            setDraggedRemId(null);
            setDropTargetId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (draggedRemId && draggedRemId !== doc.id && dropTargetId !== doc.id) {
              setDropTargetId(doc.id);
            }
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            if (dropTargetId === doc.id) {
              setDropTargetId(null);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer.getData('text/plain') || draggedRemId;
            setDropTargetId(null);
            setDraggedRemId(null);

            if (!sourceId || sourceId === doc.id) return;

            // If dropping onto a folder: move INSIDE that folder!
            // If dropping onto a document: move into that document's parent!
            const targetParentId = isFolder ? doc.id : doc.parentId;
            const success = await moveRem(sourceId, targetParentId);
            if (success) {
              setExpandedDocIds((prev) => new Set(prev).add(isFolder ? doc.id : (doc.parentId || '')));
            }
          }}
          onClick={() => {
            zoomIntoRem(doc.id);
            setActiveView('editor');
            if (isOpenMobile) onCloseMobile();
          }}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate flex items-center justify-between group transition-all cursor-pointer ${
            isDropTargetThis
              ? isFolder
                ? 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-950/80 scale-[1.02] shadow-md z-10'
                : 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-950/80 shadow-md z-10'
              : isCurrent
              ? isFolder
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Drag Handle Grip Icon on hover */}
            <GripVertical className="w-3 h-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0 -ml-1" />

            {/* Expand / Collapse Chevron */}
            {hasChildren || isFolder ? (
              <button
                type="button"
                onClick={(e) => toggleDocExpand(doc.id, e)}
                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-3 h-3" />
            )}

            {/* Icon */}
            {isFolder ? (
              isExpanded || isDropTargetThis ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )
            ) : (
              <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 shrink-0" />
            )}

            {/* Title */}
            <span className="truncate">
              {doc.text.split('::')[0].trim() || (isFolder ? 'Untitled Folder' : 'Untitled Note')}
            </span>
          </div>

          {/* Action buttons on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            {isFolder && (
              <div className="relative create-dropdown-container">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuTarget(openMenuTarget === menuKey ? null : menuKey);
                  }}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-amber-600 rounded transition-all cursor-pointer"
                  title="Dokument oder Unterordner hinzufügen"
                >
                  <Plus className="w-3 h-3" />
                </button>
                {openMenuTarget === menuKey && (
                  <CreateDropdown parentId={doc.id} />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={(e) => handleDeleteItem(e, doc)}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all cursor-pointer"
              title={isFolder ? 'Ordner löschen' : 'Dokument löschen'}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children indented */}
        {isExpanded && hasChildren && (
          <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800/80 ml-3">
            {childRems.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Recallio</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5 text-emerald-500" />
                <span>Outliner & Spaced Repetition</span>
              </div>
            </div>
          </div>

          <div className="relative create-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenMenuTarget(openMenuTarget === 'header' ? null : 'header')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                openMenuTarget === 'header'
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Create Document or Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
            {openMenuTarget === 'header' && (
              <CreateDropdown align="right" />
            )}
          </div>
        </div>

        {/* Global Search Shortcut Button */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
              <span>Search workspace...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Core Navigation Views */}
        <div className="p-3 space-y-1">
          {/* Notes / Outliner */}
          <button
            type="button"
            onClick={() => {
              setActiveView('editor');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'editor'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Notes & Outliner</span>
            </div>
          </button>

          {/* Flashcards Queue */}
          <button
            type="button"
            onClick={() => {
              setActiveView('flashcards');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'flashcards'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Flashcard Queue</span>
            </div>
            {dueCards.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white shadow-2xs">
                {dueCards.length}
              </span>
            )}
          </button>

          {/* Knowledge Graph */}
          <button
            type="button"
            onClick={() => {
              setActiveView('graph');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'graph'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Knowledge Graph</span>
            </div>
          </button>

          {/* Today's Daily Note */}
          <button
            type="button"
            onClick={handleOpenDailyNote}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Daily Note</span>
            </div>
          </button>
        </div>

        {/* Scrollable Tree & Lists */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 divide-y divide-zinc-100 dark:divide-zinc-800/40">
          {/* Pinned Documents */}
          {pinnedDocuments.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-amber-500" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">
                {pinnedDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      zoomIntoRem(doc.id);
                      setActiveView('editor');
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate flex items-center gap-2 transition-colors cursor-pointer ${
                      activeRemId === doc.id && activeView === 'editor'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {doc.type === 'folder' ? (
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className="truncate">{doc.text.split('::')[0].trim() || (doc.type === 'folder' ? 'Untitled Folder' : 'Untitled Note')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents & Folders Tree Hierarchy with Root Drop Target */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (draggedRemId && !isRootDropTarget) {
                setIsRootDropTarget(true);
              }
            }}
            onDragLeave={() => setIsRootDropTarget(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsRootDropTarget(false);
              const sourceId = e.dataTransfer.getData('text/plain') || draggedRemId;
              setDraggedRemId(null);
              setDropTargetId(null);
              if (sourceId) {
                await moveRem(sourceId, null); // Moves out to root level
              }
            }}
            className={`space-y-1 pt-3 transition-colors rounded-xl p-1 ${
              isRootDropTarget ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-dashed ring-blue-500' : ''
            }`}
          >
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Documents & Folders ({rootDocuments.length})</span>
              <div className="relative create-dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenMenuTarget(openMenuTarget === 'docs' ? null : 'docs')}
                  className={`p-1 rounded hover:text-blue-500 transition-colors cursor-pointer ${
                    openMenuTarget === 'docs' ? 'text-blue-500 bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                  title="Create Document or Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {openMenuTarget === 'docs' && (
                  <CreateDropdown align="right" />
                )}
              </div>
            </div>
            <div className="space-y-0.5">
              {rootDocuments.length > 0 ? (
                rootDocuments.map((doc) => renderTreeItem(doc, 0))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  No documents yet. Click + to create one!
                </div>
              )}
            </div>

            {/* Drop Indicator to move to Root */}
            {draggedRemId && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const sourceId = e.dataTransfer.getData('text/plain') || draggedRemId;
                  setDraggedRemId(null);
                  setDropTargetId(null);
                  setIsRootDropTarget(false);
                  if (sourceId) {
                    await moveRem(sourceId, null);
                  }
                }}
                className="mt-2 p-2 rounded-xl border-2 border-dashed border-blue-400 text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 animate-pulse cursor-pointer"
              >
                Drop here to move out to Root Level
              </div>
            )}
          </div>

          {/* Tags explorer */}
          {allTags.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1 px-1">
                {allTags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-500 cursor-default"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account & Cloud Sync Section */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          {user ? (
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sync status badge & sync trigger */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50 text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <span>{syncStatus === 'syncing' ? 'Syncing...' : 'PostgreSQL Cloud'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => syncWithCloud()}
                  disabled={syncStatus === 'syncing'}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                  title="Synchronize with Cloud DB"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Sign In / Register</div>
                  <div className="text-[10px] text-blue-500/80">Enable Cloud DB & Sync</div>
                </div>
              </div>
              <LogIn className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Bottom Settings & Theme Controls */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <button
              type="button"
              onClick={onOpenImportExport}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Settings, AI Models & Data Backup"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Einstellungen & KI</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
