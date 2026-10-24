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
  AlertTriangle 
} from 'lucide-react';
import { useRem } from '@/context/RemContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { exportBackup, importBackup, resetToDefaults, rems } = useRem();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  // Export full JSON file
  const handleDownloadJSON = async () => {
    const jsonStr = await exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remnote-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all documents to combined Markdown
  const handleExportMarkdown = () => {
    let md = `# RemNote Knowledge Base Export\n\n`;
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
    a.download = `remnote-notes-${new Date().toISOString().split('T')[0]}.md`;
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
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden space-y-6 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Data Management & Backup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {/* Danger zone: Reset to defaults */}
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
    </div>
  );
};
