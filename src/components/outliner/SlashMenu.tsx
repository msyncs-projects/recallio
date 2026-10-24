'use client';

import React, { useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Layers, 
  EyeOff, 
  Heading1, 
  Heading2, 
  CheckSquare, 
  Code, 
  Sigma, 
  ExternalLink 
} from 'lucide-react';
import { RemType } from '@/types';

export interface SlashAction {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SlashMenuProps {
  position: { top: number; left: number };
  onClose: () => void;
  onInsertText: (textToInsert: string) => void;
  onSetRemType: (type: RemType) => void;
  onToggleTodo: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  position,
  onClose,
  onInsertText,
  onSetRemType,
  onToggleTodo,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const items: SlashAction[] = [
    {
      id: 'concept',
      label: 'Concept Flashcard',
      detail: 'Creates Front :: Back flashcard',
      icon: <CreditCard className="w-4 h-4 text-sky-500" />,
      action: () => {
        onInsertText(' :: ');
        onClose();
      },
    },
    {
      id: 'bidirectional',
      label: 'Bidirectional Card',
      detail: 'Practices both sides ::: ',
      icon: <Layers className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onInsertText(' ::: ');
        onClose();
      },
    },
    {
      id: 'cloze',
      label: 'Cloze Deletion',
      detail: 'Fill-in-the-blank {{card}}',
      icon: <EyeOff className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onInsertText('{{}}');
        onClose();
      },
    },
    {
      id: 'todo',
      label: 'To-Do Checkbox',
      detail: 'Add interactive task checkbox',
      icon: <CheckSquare className="w-4 h-4 text-amber-500" />,
      action: () => {
        onToggleTodo();
        onClose();
      },
    },
    {
      id: 'h1',
      label: 'Header 1',
      detail: 'Large section heading',
      icon: <Heading1 className="w-4 h-4 text-rose-500" />,
      action: () => {
        onSetRemType('header1');
        onClose();
      },
    },
    {
      id: 'h2',
      label: 'Header 2',
      detail: 'Medium subsection heading',
      icon: <Heading2 className="w-4 h-4 text-purple-500" />,
      action: () => {
        onSetRemType('header2');
        onClose();
      },
    },
    {
      id: 'code',
      label: 'Code Snippet',
      detail: 'Monospace code `snippet`',
      icon: <Code className="w-4 h-4 text-zinc-400" />,
      action: () => {
        onInsertText('`code`');
        onClose();
      },
    },
    {
      id: 'math',
      label: 'LaTeX Math Formula',
      detail: 'Insert $$math$$ expression',
      icon: <Sigma className="w-4 h-4 text-teal-500" />,
      action: () => {
        onInsertText('$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
        onClose();
      },
    },
    {
      id: 'link',
      label: 'Link to Rem',
      detail: 'Reference another document [[link]]',
      icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
      action: () => {
        onInsertText('[[]]');
        onClose();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top + 24}px`,
        left: `${Math.min(position.left, window.innerWidth - 320)}px`,
      }}
      className="fixed z-50 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        RemNote Formatting & Tools
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            type="button"
            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors group cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {item.label}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {item.detail}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
