'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { RemProvider, useRem } from '@/context/RemContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { RemEditor } from '@/components/outliner/RemEditor';
import { FlashcardReview } from '@/components/flashcards/FlashcardReview';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { CommandPalette } from '@/components/search/CommandPalette';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { AuthModal } from '@/components/auth/AuthModal';

function MainApp() {
  const { isInitialized, activeView } = useRem();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
            Initializing MnemoFlow Knowledge Base...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
            MnemoFlow
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="text-xs font-semibold text-blue-500"
          >
            Search
          </button>
        </div>

        {/* Dynamic View Rendering */}
        {activeView === 'editor' && <RemEditor />}
        {activeView === 'flashcards' && <FlashcardReview />}
        {activeView === 'graph' && <KnowledgeGraph />}
      </main>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenImportExport={() => {
          setIsSearchOpen(false);
          setIsImportExportOpen(true);
        }}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <RemProvider>
      <MainApp />
    </RemProvider>
  );
}
