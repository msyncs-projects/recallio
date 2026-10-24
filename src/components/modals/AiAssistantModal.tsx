'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CreditCard, 
  Wand2, 
  Brain, 
  MessageSquare, 
  Check, 
  Copy, 
  Plus, 
  Key, 
  Loader2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useRem } from '@/context/RemContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRemId?: string;
  initialMode?: 'flashcards' | 'summary' | 'expand' | 'qa';
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  targetRemId,
  initialMode = 'flashcards',
}) => {
  const { rems, activeRem, createRem, updateRemText } = useRem();

  const [activeTab, setActiveTab] = useState<'flashcards' | 'summary' | 'expand' | 'qa' | 'settings'>(initialMode);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');

  // Results state
  const [generatedCards, setGeneratedCards] = useState<Array<{
    front: string;
    back: string;
    type: 'concept' | 'bidirectional' | 'cloze';
    textFormat: string;
    selected: boolean;
  }>>([]);
  const [generatedSummary, setGeneratedSummary] = useState<{ summary: string; bullets: string[] } | null>(null);
  const [generatedExpand, setGeneratedExpand] = useState<{ expanded: string; bullets: string[] } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Determine target text context
  const currentRem = targetRemId ? rems.find((r) => r.id === targetRemId) || activeRem : activeRem;

  const gatherDocumentText = (): string => {
    if (!currentRem) return '';
    // If targeted a single rem, return its text and direct children
    if (targetRemId && targetRemId !== activeRem?.id) {
      const childTexts = (currentRem.childrenIds || [])
        .map((cid) => rems.find((r) => r.id === cid)?.text)
        .filter(Boolean);
      return [currentRem.text, ...childTexts].join('\n');
    }

    // Entire document text
    const queue = [currentRem.id];
    const texts: string[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const r = rems.find((rem) => rem.id === id);
      if (r) {
        if (r.text) texts.push(r.text);
        if (r.childrenIds) queue.push(...r.childrenIds);
      }
    }
    return texts.join('\n');
  };

  const handleGenerate = async (mode: 'flashcards' | 'summary' | 'expand' | 'qa') => {
    setIsLoading(true);
    setStatusMessage('');

    const contextText = gatherDocumentText();
    const docTitle = currentRem?.text.split('::')[0].trim() || 'Document';

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: contextText,
          documentTitle: docTitle,
          mode,
          prompt: mode === 'qa' ? qaQuestion : undefined,
          userApiKey: apiKey.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      if (mode === 'flashcards' && data.data?.cards) {
        setGeneratedCards(
          data.data.cards.map((c: any) => ({
            ...c,
            selected: true,
          }))
        );
      } else if (mode === 'summary' && data.data) {
        setGeneratedSummary(data.data);
      } else if (mode === 'expand' && data.data) {
        setGeneratedExpand(data.data);
      } else if (mode === 'qa' && data.data?.answer) {
        setQaAnswer(data.data.answer);
      }

      setStatusMessage(`Generated with ${data.provider === 'gemini' ? 'Google Gemini' : 'Recallio AI Engine'}`);
    } catch (err: any) {
      setStatusMessage('Error: ' + (err.message || 'Generation failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Add selected flashcards into the active document
  const handleInsertCardsIntoDoc = async () => {
    if (!currentRem) return;
    const selected = generatedCards.filter((c) => c.selected);
    if (selected.length === 0) return;

    for (const card of selected) {
      await createRem(currentRem.id, undefined, card.textFormat, 'bullet');
    }
    onClose();
  };

  // Insert summary bullets into the active document
  const handleInsertSummaryIntoDoc = async () => {
    if (!currentRem || !generatedSummary) return;
    const headingId = await createRem(currentRem.id, undefined, 'Summary & Key Concepts', 'header2');
    for (const bullet of generatedSummary.bullets) {
      await createRem(headingId, undefined, bullet, 'bullet');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Recallio AI Suite</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Target: {currentRem?.text.slice(0, 35) || 'Current Note'}...
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

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800 gap-1 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'flashcards'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>AI Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Summarize</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expand')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'expand'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Expand & Analogies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'qa'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI Tutor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-start justify-between gap-3">
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-0.5">
                  <div className="font-bold">Automated High-Yield Flashcard Extraction</div>
                  <div className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                    Extracts definitions (<code className="font-mono">::</code>), bidirectional terms (<code className="font-mono">:::</code>), and fill-in-the-blanks (<code className="font-mono">{`{{cloze}}`}</code>) from your notes.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerate('flashcards')}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Cards</span>
                </button>
              </div>

              {generatedCards.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Generated Cards ({generatedCards.filter((c) => c.selected).length}/{generatedCards.length})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setGeneratedCards((prev) =>
                          prev.map((c) => ({ ...c, selected: !prev.every((p) => p.selected) }))
                        )
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Toggle All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {generatedCards.map((card, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setGeneratedCards((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c))
                          )
                        }
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          card.selected
                            ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                            : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={card.selected}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                            {card.textFormat}
                          </div>
                          <div className="text-[10px] text-zinc-400 capitalize">
                            Type: {card.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleInsertCardsIntoDoc}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Selected Cards to Note</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-start justify-between gap-3">
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                  <div className="font-bold">Executive Summary & Outline</div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Distills this document into structured, high-retention bullet points.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerate('summary')}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>Summarize</span>
                </button>
              </div>

              {generatedSummary && (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {generatedSummary.summary}
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Key Takeaways:</div>
                    {generatedSummary.bullets.map((b, i) => (
                      <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleInsertSummaryIntoDoc}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Insert Summary into Note</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPAND */}
          {activeTab === 'expand' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 flex items-start justify-between gap-3">
                <div className="text-xs text-purple-900 dark:text-purple-200 space-y-0.5">
                  <div className="font-bold">Concept Elaborator & Mnemonics</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                    Generates concrete real-world analogies and memory tricks for hard concepts.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerate('expand')}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  <span>Elaborate</span>
                </button>
              </div>

              {generatedExpand && (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {generatedExpand.expanded}
                  </p>
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    {generatedExpand.bullets.map((b, i) => (
                      <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60">
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASK AI TUTOR */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Ask a question about this document or concept:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="e.g. What is the difference between Duality and Claims in REA?"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate('qa')}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerate('qa')}
                    disabled={isLoading || !qaQuestion.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>Ask</span>
                  </button>
                </div>
              </div>

              {qaAnswer && (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    AI Tutor Answer:
                  </div>
                  <div className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {qaAnswer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Custom Google Gemini API Key (Optional)</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Recallio includes a fast built-in local NLP engine that works out of the box without any keys. If you wish to use Google&apos;s Gemini 1.5/2.0 LLM for advanced deep reasoning, you can provide your free Google Gemini API key below.
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="text-[11px] text-zinc-400 italic text-center pt-2">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
