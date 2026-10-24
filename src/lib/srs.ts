import { Card, SRSGrade, SRSIntervalPreview } from '@/types';

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

// Milliseconds constants
const ONE_MINUTE_MS = 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Format interval into human readable label like "< 10m", "1d", "4d", "2mo", "1y"
 */
export function formatInterval(days: number): string {
  if (days <= 0.007) return '< 10m';
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) {
    const months = (days / 30).toFixed(1).replace('.0', '');
    return `${months}mo`;
  }
  const years = (days / 365).toFixed(1).replace('.0', '');
  return `${years}y`;
}

/**
 * Returns the estimated intervals for each grade button
 */
export function getIntervalPreviews(card: Card): SRSIntervalPreview {
  const currentEase = card.easeFactor || DEFAULT_EASE_FACTOR;
  const currentInterval = card.interval || 0;
  const isNewOrLearning = card.state === 'new' || card.state === 'learning';

  if (isNewOrLearning) {
    return {
      again: '< 1m',
      hard: '< 10m',
      good: '1d',
      easy: '4d',
    };
  }

  // Card in review state
  const againDays = 0.007; // ~10 minutes
  const hardDays = Math.max(1, currentInterval * 1.2);
  const goodDays = Math.max(1, currentInterval * currentEase);
  const easyDays = Math.max(1, currentInterval * currentEase * 1.3);

  return {
    again: formatInterval(againDays),
    hard: formatInterval(hardDays),
    good: formatInterval(goodDays),
    easy: formatInterval(easyDays),
  };
}

/**
 * Calculates updated card SRS stats based on user grade (1: Again, 2: Hard, 3: Good, 4: Easy)
 */
export function calculateNextSRSState(
  card: Card,
  grade: SRSGrade,
  now: number = Date.now()
): Partial<Card> {
  let ease = card.easeFactor || DEFAULT_EASE_FACTOR;
  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let lapses = card.lapses || 0;
  let state = card.state;
  let nextPracticeDate: number;

  if (card.state === 'new' || card.state === 'learning') {
    switch (grade) {
      case 1: // Again
        interval = 0.001; // ~1.5 minutes
        nextPracticeDate = now + ONE_MINUTE_MS;
        state = 'learning';
        break;
      case 2: // Hard
        interval = 0.007; // ~10 minutes
        nextPracticeDate = now + TEN_MINUTES_MS;
        state = 'learning';
        break;
      case 3: // Good (Graduates to Review)
        interval = 1; // 1 day
        repetitions = 1;
        nextPracticeDate = now + ONE_DAY_MS;
        state = 'review';
        break;
      case 4: // Easy (Graduates with bonus)
        interval = 4; // 4 days
        repetitions = 1;
        ease += 0.15;
        nextPracticeDate = now + 4 * ONE_DAY_MS;
        state = 'review';
        break;
    }
  } else {
    // Review or Relearning
    switch (grade) {
      case 1: // Again (Lapse)
        lapses += 1;
        repetitions = 0;
        ease = Math.max(MIN_EASE_FACTOR, ease - 0.2);
        interval = 0.007; // ~10 min relearn
        nextPracticeDate = now + TEN_MINUTES_MS;
        state = 'relearning';
        break;

      case 2: // Hard
        ease = Math.max(MIN_EASE_FACTOR, ease - 0.15);
        interval = Math.max(1, Math.round(interval * 1.2));
        repetitions += 1;
        nextPracticeDate = now + interval * ONE_DAY_MS;
        state = 'review';
        break;

      case 3: // Good
        interval = Math.max(1, Math.round(interval * ease));
        repetitions += 1;
        nextPracticeDate = now + interval * ONE_DAY_MS;
        state = 'review';
        break;

      case 4: // Easy
        ease += 0.15;
        interval = Math.max(1, Math.round(interval * ease * 1.3));
        repetitions += 1;
        nextPracticeDate = now + interval * ONE_DAY_MS;
        state = 'review';
        break;
    }
  }

  const historyEntry = {
    date: now,
    grade,
    interval,
    easeFactor: ease,
  };

  const updatedHistory = card.history ? [...card.history, historyEntry] : [historyEntry];

  return {
    easeFactor: Number(ease.toFixed(2)),
    interval,
    repetitions,
    lapses,
    state,
    nextPracticeDate,
    lastPracticed: now,
    history: updatedHistory,
  };
}
