'use client';

import React, { useState } from 'react';
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
  LogIn
} from 'lucide-react';
import { useRem } from '@/context/RemContext';

interface SidebarProps {
  onOpenSearch: () => void;
  onOpenImportExport: () => void;
  onOpenAuth: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSearch,
  onOpenImportExport,
  onOpenAuth,
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
    user,
    syncStatus,
    syncWithCloud,
    logout,
  } = useRem();

  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set(['doc-rea', 'doc-welcome']));

  // Root documents
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

  const handleCreateNewDoc = async () => {
    const newId = await createRem(null, undefined, 'Untitled Note', 'document');
    zoomIntoRem(newId);
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
                <span>MnemoFlow</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5 text-emerald-500" />
                <span>Outliner & Spaced Repetition</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateNewDoc}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Create New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
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
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{doc.text.split('::')[0].trim() || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents Tree Hierarchy */}
          <div className="space-y-1 pt-3">
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Documents ({rootDocuments.length})</span>
              <button
                type="button"
                onClick={handleCreateNewDoc}
                className="hover:text-blue-500 transition-colors"
                title="Add Document"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {rootDocuments.map((doc) => {
                const isExpanded = expandedDocIds.has(doc.id);
                const hasChildren = doc.childrenIds && doc.childrenIds.length > 0;
                const isCurrent = activeRemId === doc.id && activeView === 'editor';

                return (
                  <div key={doc.id} className="space-y-0.5">
                    <div
                      onClick={() => {
                        zoomIntoRem(doc.id);
                        setActiveView('editor');
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate flex items-center justify-between group transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => toggleDocExpand(doc.id, e)}
                            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400"
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
                        <span className="truncate">
                          {doc.text.split('::')[0].trim() || 'Untitled'}
                        </span>
                      </div>
                    </div>

                    {/* Sub-children previews when expanded */}
                    {isExpanded && hasChildren && (
                      <div className="pl-6 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 ml-3">
                        {doc.childrenIds.slice(0, 5).map((childId) => {
                          const childRem = rems.find((r) => r.id === childId);
                          if (!childRem) return null;
                          return (
                            <button
                              key={childId}
                              type="button"
                              onClick={() => {
                                zoomIntoRem(childId);
                                setActiveView('editor');
                                if (isOpenMobile) onCloseMobile();
                              }}
                              className="w-full text-left px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white truncate block rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              • {childRem.text.split('::')[0].trim() || 'Untitled'}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              title="Backup and Restore Data"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Data & Backup</span>
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
