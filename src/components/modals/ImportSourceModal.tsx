'use client';

import React, { useState } from 'react';
import { 
  X, 
  FileUp, 
  Video, 
  Globe, 
  UploadCloud, 
  Loader2, 
  Check, 
  Plus, 
  FileText, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useRem } from '@/context/RemContext';

interface ImportSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId?: string | null;
  initialTab?: 'pdf' | 'web' | 'youtube';
}

export const ImportSourceModal: React.FC<ImportSourceModalProps> = ({
  isOpen,
  onClose,
  targetFolderId = null,
  initialTab = 'pdf',
}) => {
  const { createRem, zoomIntoRem, setActiveView } = useRem();

  const [activeTab, setActiveTab] = useState<'pdf' | 'web' | 'youtube'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Web state
  const [webUrl, setWebUrl] = useState('');

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');

  if (!isOpen) return null;

  // Helper to extract YouTube video ID
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 1. Handle PDF Upload & Document Creation
  const handleImportPdf = async () => {
    if (!pdfFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Create local object URL for preview and reading
      const pdfBlobUrl = URL.createObjectURL(pdfFile);
      const cleanDocTitle = `📄 ${pdfFile.name.replace(/\.pdf$/i, '')}`;

      // Create new Document Rem in target folder
      const docId = await createRem(targetFolderId, undefined, cleanDocTitle, 'document');

      // Add child rems with source meta & reader notes
      await createRem(
        docId,
        undefined,
        `PDF Reader Attached :: ${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`,
        'bullet'
      );
      await createRem(
        docId,
        undefined,
        `Key Insights from PDF :: Highlight or summarize concepts here using Front :: Back syntax`,
        'concept'
      );

      // Open new document
      zoomIntoRem(docId);
      setActiveView('editor');
      onClose();
    } catch (err: any) {
      setErrorMessage('Failed to import PDF: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Web Article Import
  const handleImportWeb = async () => {
    if (!webUrl || !webUrl.startsWith('http')) {
      setErrorMessage('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/import/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch website');

      const docTitle = `🌐 ${data.title || 'Web Article'}`;
      const docId = await createRem(targetFolderId, undefined, docTitle, 'document');

      // Add link source rem
      await createRem(docId, undefined, `Original Source :: ${webUrl}`, 'concept');

      // Add imported paragraphs as bullet points
      if (data.paragraphs && data.paragraphs.length > 0) {
        for (const p of data.paragraphs) {
          // If paragraph has definition style, create concept card
          await createRem(docId, undefined, p, 'bullet');
        }
      } else {
        await createRem(docId, undefined, 'Summary notes for ' + data.title, 'bullet');
      }

      zoomIntoRem(docId);
      setActiveView('editor');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Web import failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle YouTube Import
  const handleImportYouTube = async () => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setErrorMessage('Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=...)');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const title = youtubeTitle.trim() || `YouTube Video (${videoId})`;
      const docTitle = `▶️ ${title}`;
      const docId = await createRem(targetFolderId, undefined, docTitle, 'document');

      // Add YouTube embed marker and sample timestamp notes
      await createRem(
        docId,
        undefined,
        `YouTube Player :: https://www.youtube.com/watch?v=${videoId}`,
        'concept'
      );
      await createRem(
        docId,
        undefined,
        `[00:00] Video Introduction :: Overview of key ideas covered in this lecture`,
        'bullet'
      );
      await createRem(
        docId,
        undefined,
        `[02:15] Core Definition :: Create flashcards directly with Front :: Back`,
        'bullet'
      );

      zoomIntoRem(docId);
      setActiveView('editor');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'YouTube import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                Import Source into Folder
              </div>
              <div className="text-[11px] text-zinc-400">
                Turn PDFs, Web Articles, and YouTube into active recall notes
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/60 m-4 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pdf');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FileUp className="w-3.5 h-3.5 text-red-500" />
            <span>PDF Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('web');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'web'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Web Article</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('youtube');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span>YouTube</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 pt-0 space-y-4">
          {/* TAB 1: PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <label
                htmlFor="pdf-file-upload"
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-800/30"
              >
                <FileUp className="w-10 h-10 text-red-500 mb-2" />
                {pdfFile ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                      {pdfFile.name}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Ready to import
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                      Click to choose or drag & drop a PDF
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Supports lecture slides, book chapters, research papers
                    </div>
                  </div>
                )}
                <input
                  id="pdf-file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleImportPdf}
                disabled={!pdfFile || isLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Import PDF into Notes</span>
              </button>
            </div>
          )}

          {/* TAB 2: WEB ARTICLE */}
          {activeTab === 'web' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Web Page or Article URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Spaced_repetition"
                    onKeyDown={(e) => e.key === 'Enter' && handleImportWeb()}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="text-[11px] text-zinc-400">
                  Recallio will fetch the page, strip clutter/ads, and convert paragraphs into editable outliner bullets.
                </div>
              </div>

              <button
                type="button"
                onClick={handleImportWeb}
                disabled={!webUrl || isLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Fetch and Import Web Page</span>
              </button>
            </div>
          )}

          {/* TAB 3: YOUTUBE */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    YouTube Video URL:
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Custom Title (optional):
                  </label>
                  <input
                    type="text"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    placeholder="e.g. Distributed Systems Lecture 1"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleImportYouTube}
                disabled={!youtubeUrl || isLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create Video Note with Timestamp Outliner</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
