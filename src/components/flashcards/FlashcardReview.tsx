'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  RotateCw, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Flame, 
  Award, 
  Clock, 
  Layers, 
  BookOpen 
} from 'lucide-react';
import { Card, SRSGrade } from '@/types';
import { useRem } from '@/context/RemContext';
import { getIntervalPreviews } from '@/lib/srs';

export const FlashcardReview: React.FC = () => {
  const {
    cards,
    dueCards,
    rateCard,
    setActiveView,
    studyDeckId,
    setStudyDeckId,
    rems,
    stats,
  } = useRem();

  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [studyAheadMode, setStudyAheadMode] = useState(false);
  const [sessionCardsCount, setSessionCardsCount] = useState(0);

  // Initialize review queue
  useEffect(() => {
    let targetCards: Card[] = [];

    if (studyAheadMode) {
      // Study all cards regardless of due date
      targetCards = studyDeckId
        ? cards.filter((c) => {
            const r = rems.find((rem) => rem.id === c.remId);
            return r?.id === studyDeckId || r?.parentId === studyDeckId;
          })
        : cards;
    } else {
      // Study only due cards
      targetCards = dueCards;
    }

    setQueue(targetCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(targetCards.length === 0);
  }, [dueCards, cards, studyAheadMode, studyDeckId, rems]);

  const currentCard: Card | undefined = queue[currentIndex];

  // Trigger celebratory confetti when session finishes
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
    });
  }, []);

  // Handle grading
  const handleGrade = async (grade: SRSGrade) => {
    if (!currentCard) return;

    await rateCard(currentCard.id, grade);
    setSessionCardsCount((prev) => prev + 1);

    if (currentIndex + 1 < queue.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      triggerConfetti();
    }
  };

  // Keyboard shortcut listener: Space to flip, 1-4 to grade
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionCompleted || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(4);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionCompleted, currentCard]);

  // Queue category counters
  const newCount = queue.filter((c) => c.state === 'new').length;
  const learningCount = queue.filter((c) => c.state === 'learning' || c.state === 'relearning').length;
  const reviewCount = queue.filter((c) => c.state === 'review').length;

  const currentRem = currentCard ? rems.find((r) => r.id === currentCard.remId) : undefined;
  const intervalPreviews = currentCard ? getIntervalPreviews(currentCard) : null;

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
      {/* Top Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Return to Notes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>Spaced Repetition Queue</span>
              {studyDeckId && (
                <span className="text-xs font-normal text-blue-500 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  Filtered Deck
                </span>
              )}
            </div>
            {studyDeckId && (
              <button
                onClick={() => setStudyDeckId(null)}
                className="text-[11px] text-zinc-400 hover:text-blue-500 underline"
              >
                Clear filter (Study all decks)
              </button>
            )}
          </div>
        </div>

        {/* Queue Status Pills */}
        {!sessionCompleted && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {newCount} New
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {learningCount} Learn
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {reviewCount} Review
            </span>
          </div>
        )}
      </div>

      {/* Main Study Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {sessionCompleted ? (
          /* Finished State */
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                Queue Completed!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You’re all caught up on your spaced repetition cards for now.
              </p>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center justify-center text-amber-500">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.streak}d
                </div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Streak</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center text-blue-500">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.cardsStudiedToday}
                </div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Today</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center text-emerald-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.retentionRate}%
                </div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Retention</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setActiveView('editor')}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
              >
                Return to Notes
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudyAheadMode(true);
                  setSessionCompleted(false);
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Study Ahead (Practice all cards)
              </button>
            </div>
          </div>
        ) : (
          /* Active Card Review */
          <div className="max-w-2xl w-full flex flex-col space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
              <span>Card {currentIndex + 1} of {queue.length}</span>
              <span className="capitalize">{currentCard?.state}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Box */}
            <div
              onClick={() => !isFlipped && setIsFlipped(true)}
              className="min-h-[300px] md:min-h-[360px] rounded-3xl p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col justify-between transition-all cursor-pointer relative group"
            >
              {/* Card Context / Origin */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium truncate max-w-sm">
                    {currentRem?.text?.split('::')[0].trim() || 'Knowledge Card'}
                  </span>
                </span>
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                  {currentCard?.type}
                </span>
              </div>

              {/* Question Side */}
              <div className="py-6 flex-1 flex flex-col justify-center text-center">
                <div className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {currentCard?.front}
                </div>
              </div>

              {/* Answer Side (when revealed) */}
              {isFlipped ? (
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200 text-center">
                  <div className="text-xs uppercase tracking-wider font-semibold text-blue-500 mb-2">
                    Answer
                  </div>
                  <div className="text-base md:text-xl font-medium text-emerald-600 dark:text-emerald-400 leading-relaxed">
                    {currentCard?.back}
                  </div>
                </div>
              ) : (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Show Answer</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                      Space
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* SRS Rating Actions (Visible when flipped) */}
            {isFlipped && intervalPreviews && (
              <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* 1. Again */}
                <button
                  type="button"
                  onClick={() => handleGrade(1)}
                  className="py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    Again <span className="font-mono text-[10px] opacity-70">[1]</span>
                  </span>
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                    {intervalPreviews.again}
                  </span>
                </button>

                {/* 2. Hard */}
                <button
                  type="button"
                  onClick={() => handleGrade(2)}
                  className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    Hard <span className="font-mono text-[10px] opacity-70">[2]</span>
                  </span>
                  <span className="text-[11px] text-amber-500 dark:text-amber-400 font-medium mt-0.5">
                    {intervalPreviews.hard}
                  </span>
                </button>

                {/* 3. Good */}
                <button
                  type="button"
                  onClick={() => handleGrade(3)}
                  className="py-3 px-2 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    Good <span className="font-mono text-[10px] opacity-70">[3]</span>
                  </span>
                  <span className="text-[11px] text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                    {intervalPreviews.good}
                  </span>
                </button>

                {/* 4. Easy */}
                <button
                  type="button"
                  onClick={() => handleGrade(4)}
                  className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    Easy <span className="font-mono text-[10px] opacity-70">[4]</span>
                  </span>
                  <span className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium mt-0.5">
                    {intervalPreviews.easy}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
