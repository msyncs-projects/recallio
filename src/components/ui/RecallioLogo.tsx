'use client';

import React from 'react';

interface RecallioLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const RecallioLogo: React.FC<RecallioLogoProps> = ({
  size = 32,
  className = '',
  showText = false,
  subtitle = 'Outliner & Active Recall',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek, Modern Minimalist Vector Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          <linearGradient id="rec-bg-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="rec-card-grad" x1="14" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Clean Squircle Chassis */}
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="9"
          fill="url(#rec-bg-grad)"
          className="stroke-zinc-800/80 dark:stroke-zinc-700/60"
          strokeWidth="1"
        />

        {/* Back Card Plane (Memory Trace / Outliner) */}
        <rect
          x="8.5"
          y="8"
          width="13"
          height="17"
          rx="3.5"
          stroke="#818cf8"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Front Card Plane (Active Recall Flashcard) */}
        <rect
          x="14"
          y="11"
          width="13.5"
          height="17"
          rx="3.5"
          fill="url(#rec-card-grad)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />

        {/* Minimalist Card Content Lines */}
        <line
          x1="17"
          y1="16"
          x2="24"
          y2="16"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="17"
          y1="20"
          x2="21.5"
          y2="20"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />

        {/* Synapse / Recall Pulse Node */}
        <circle cx="11" cy="21.5" r="1.75" fill="#60a5fa" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-0.5 leading-none">
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Recall
            </span>
            <span className="font-semibold text-sm tracking-tight text-blue-600 dark:text-blue-400">
              io
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-normal mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
