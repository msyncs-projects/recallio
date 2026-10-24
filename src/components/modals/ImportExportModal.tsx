'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  FileJson, 
  FileText, 
  Check, 
  AlertTriangle,
  Sparkles,
  Database,
  Keyboard,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { AiSettingsPanel } from '@/components/settings/AiSettingsPanel';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ai' | 'backup' | 'shortcuts';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'ai'
}) => {
  const { exportBackup, importBackup, resetToDefaults, rems } = useRem();
  const [activeTab, setActiveTab] = useState<'ai' | 'backup' | 'shortcuts'>(initialTab);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  // Export full JSON file
  const handleDownloadJSON = async () => {
    const jsonStr = await exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recallio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all documents to combined Markdown
  const handleExportMarkdown = () => {
    let md = `# Recallio Knowledge Base Export\n\n`;
    const rootDocs = rems.filter((r) => r.parentId === null);

    const renderMarkdownTree = (remId: string, level: number): string => {
      const r = rems.find((rem) => rem.id === remId);
      if (!r) return '';
      const indent = '  '.repeat(level);
      let line = `${indent}- ${r.text}\n`;

      if (r.childrenIds) {
        for (const chId of r.childrenIds) {
          line += renderMarkdownTree(chId, level + 1);
        }
      }
      return line;
    };

    for (const doc of rootDocs) {
      md += `## ${doc.text}\n\n`;
      if (doc.childrenIds) {
        for (const chId of doc.childrenIds) {
          md += renderMarkdownTree(chId, 0);
        }
      }
      md += `\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recallio-notes-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importBackup(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
          onClose();
          setImportStatus('idle');
        }, 1200);
      } else {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Settings & Workspace</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure personal AI models, manage backups, and review shortcuts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-6 gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>AI & Models (BYOK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Data & Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Keyboard className="w-4 h-4 text-purple-500" />
            <span>Shortcuts & Syntax</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: AI & BYOK */}
          {activeTab === 'ai' && (
            <div>
              <AiSettingsPanel />
            </div>
          )}

          {/* TAB 2: DATA & BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Export Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Export Knowledge Base
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 flex flex-col items-start gap-1 transition-all cursor-pointer group"
                  >
                    <Download className="w-4 h-4 text-blue-500 group-hover:translate-y-0.5 transition-transform" />
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      JSON Backup
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-left">
                      Full snapshot with notes, flashcards & SRS stats.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 flex flex-col items-start gap-1 transition-all cursor-pointer group"
                  >
                    <FileText className="w-4 h-4 text-purple-500 group-hover:translate-y-0.5 transition-transform" />
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Markdown (.md)
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-left">
                      Hierarchical outline formatted for Obsidian/Logseq.
                    </div>
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Restore / Import Backup
                </h3>
                <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-900/50">
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Click to upload a JSON backup file
                  </span>
                  <span className="text-[10px] text-zinc-400">Restores all notes & flashcard states</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {importStatus === 'success' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Backup restored successfully!
                  </div>
                )}
                {importStatus === 'error' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Failed to import backup. Please check file format.
                  </div>
                )}
              </div>

              {/* Reset to Defaults */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Reset to Defaults
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Reloads initial REA & Tutorial knowledge base.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Are you sure you want to reset? This will reload the default REA model and tutorial.')) {
                      await resetToDefaults();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SHORTCUTS & SYNTAX */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Flashcard Syntax</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        Concept :: Definition
                      </div>
                      <div className="text-[11px] text-zinc-500">Standard one-way flashcard (front ➔ back)</div>
                    </div>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium">Concept</span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                        Term ::: Counterpart
                      </div>
                      <div className="text-[11px] text-zinc-500">Two-way / bidirectional card (tests both directions)</div>
                    </div>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-medium">Two-Way</span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {`Memory is {{cloze deletions}} based`}
                      </div>
                      <div className="text-[11px] text-zinc-500">Cloze deletion (fill-in-the-blank during review)</div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">Cloze</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-amber-500" />
                  <span>Outliner & Editor Controls</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-800 dark:text-zinc-200">/</kbd>
                      <span>Slash Menu</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Open commands, to-dos, flashcards, or AI assistants.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-800 dark:text-zinc-200">Tab</kbd>
                      <span>Indent Rem</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Nest current bullet as child of previous item.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-800 dark:text-zinc-200">Shift + Tab</kbd>
                      <span>Outdent Rem</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Move bullet up one hierarchical level.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-800 dark:text-zinc-200">[[</kbd>
                      <span>Bidirectional Link</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Link to any existing concept or note in your graph.</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Drag & Drop hint */}
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sidebar Drag & Drop</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  Drag any document using the grab handle onto a folder to nest it. Drag documents back up to the &quot;Documents &amp; Folders&quot; header to move them out to the root level.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
