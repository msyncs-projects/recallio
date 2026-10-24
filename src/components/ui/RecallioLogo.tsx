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
      {/* Sleek Minimalist Geometric Vector Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Main Card Gradient */}
          <linearGradient id="rec-grad-primary" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Secondary Layer Gradient */}
          <linearGradient id="rec-grad-layer" x1="12" y1="6" x2="34" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
          </linearGradient>

          {/* Glow Shadow Filter */}
          <filter id="rec-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4F46E5" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle Background Container */}
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill="url(#rec-grad-primary)"
          filter="url(#rec-glow)"
        />

        {/* Back Flashcard Layer (Angled/Offset for Depth) */}
        <rect
          x="10"
          y="8"
          width="20"
          height="24"
          rx="5"
          fill="url(#rec-grad-layer)"
          transform="rotate(6 20 20)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.8"
        />

        {/* Front Flashcard / Active Recall Core (Geometric 'R' & Loop) */}
        <rect
          x="8.5"
          y="8.5"
          width="21"
          height="23"
          rx="5"
          fill="#FFFFFF"
          className="dark:fill-zinc-900"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="1"
        />

        {/* Modern Stylized Recall Loop / R Geometry */}
        <path
          d="M13.5 14H19.5C21.433 14 23 15.567 23 17.5C23 19.433 21.433 21 19.5 21H13.5V26"
          stroke="#4F46E5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-indigo-400"
        />

        {/* Precision Diagonal Kick */}
        <path
          d="M18 20.8L23 26"
          stroke="#4F46E5"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="dark:stroke-indigo-400"
        />

        {/* Active Recall Node (Luminous Spark Dot) */}
        <circle cx="24" cy="13.5" r="2.2" fill="#3B82F6" className="dark:fill-blue-400" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 leading-none">
            <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">
              Recall<span className="text-blue-600 dark:text-blue-400">io</span>
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
