'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { 
  CreditCard, 
  Layers, 
  EyeOff, 
  Heading1, 
  Heading2, 
  CheckSquare, 
  Code, 
  Sigma, 
  ExternalLink,
  Sparkles,
  Wand2,
  Brain,
  FileUp,
  Video,
  Globe,
  List
} from 'lucide-react';

export interface SlashActionItem {
  id: string;
  category: 'Flashcards' | 'Formatting' | 'AI Assistant' | 'Sources & Imports';
  label: string;
  detail: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SlashMenuProps {
  position: { top: number; left: number };
  query: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
  onInsertText: (textToInsert: string) => void;
  onSetRemType: (type: 'bullet' | 'header1' | 'header2') => void;
  onToggleTodo: () => void;
  onTriggerAi: (mode: 'flashcards' | 'summary' | 'expand') => void;
  onTriggerImport: (type: 'pdf' | 'web' | 'youtube') => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  position,
  query,
  selectedIndex,
  onSelectIndex,
  onClose,
  onInsertText,
  onSetRemType,
  onToggleTodo,
  onTriggerAi,
  onTriggerImport,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const allItems: SlashActionItem[] = useMemo(() => [
    // 1. Rem Types & Formatting
    {
      id: 'todo',
      category: 'Formatting',
      label: 'To-Do Checkbox',
      detail: 'Add interactive task checkbox',
      shortcut: '[]',
      icon: <CheckSquare className="w-4 h-4 text-amber-500" />,
      action: () => {
        onToggleTodo();
        onClose();
      },
    },
    {
      id: 'h1',
      category: 'Formatting',
      label: 'Heading 1',
      detail: 'Large section heading',
      shortcut: '#',
      icon: <Heading1 className="w-4 h-4 text-rose-500" />,
      action: () => {
        onSetRemType('header1');
        onClose();
      },
    },
    {
      id: 'h2',
      category: 'Formatting',
      label: 'Heading 2',
      detail: 'Medium subsection heading',
      shortcut: '##',
      icon: <Heading2 className="w-4 h-4 text-purple-500" />,
      action: () => {
        onSetRemType('header2');
        onClose();
      },
    },
    {
      id: 'bullet',
      category: 'Formatting',
      label: 'Standard Bullet',
      detail: 'Reset to regular note bullet',
      shortcut: '-',
      icon: <List className="w-4 h-4 text-zinc-400" />,
      action: () => {
        onSetRemType('bullet');
        onClose();
      },
    },

    // 2. Flashcards & SRS
    {
      id: 'concept',
      category: 'Flashcards',
      label: 'Concept Flashcard',
      detail: 'Creates Front :: Back flashcard',
      shortcut: '::',
      icon: <CreditCard className="w-4 h-4 text-sky-500" />,
      action: () => {
        onInsertText(' :: ');
        onClose();
      },
    },
    {
      id: 'bidirectional',
      category: 'Flashcards',
      label: 'Bidirectional Card',
      detail: 'Practices in both directions ::: ',
      shortcut: ':::',
      icon: <Layers className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onInsertText(' ::: ');
        onClose();
      },
    },
    {
      id: 'cloze',
      category: 'Flashcards',
      label: 'Cloze Deletion',
      detail: 'Fill-in-the-blank {{card}}',
      shortcut: '{{}}',
      icon: <EyeOff className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onInsertText('{{}}');
        onClose();
      },
    },

    // 3. AI Assistant
    {
      id: 'ai-cards',
      category: 'AI Assistant',
      label: 'AI: Generate Flashcards',
      detail: 'Extract high-yield cards from this note',
      shortcut: 'AI',
      icon: <Sparkles className="w-4 h-4 text-blue-500" />,
      action: () => {
        onTriggerAi('flashcards');
        onClose();
      },
    },
    {
      id: 'ai-summary',
      category: 'AI Assistant',
      label: 'AI: Summarize Note',
      detail: 'Generate structured key insights',
      shortcut: 'AI',
      icon: <Wand2 className="w-4 h-4 text-amber-500" />,
      action: () => {
        onTriggerAi('summary');
        onClose();
      },
    },
    {
      id: 'ai-expand',
      category: 'AI Assistant',
      label: 'AI: Expand & Examples',
      detail: 'Elaborate concept with concrete analogies',
      shortcut: 'AI',
      icon: <Brain className="w-4 h-4 text-purple-500" />,
      action: () => {
        onTriggerAi('expand');
        onClose();
      },
    },

    // 4. Sources & Media
    {
      id: 'youtube',
      category: 'Sources & Imports',
      label: 'Embed YouTube Video',
      detail: 'Watch video & write timestamped notes',
      icon: <Video className="w-4 h-4 text-rose-500" />,
      action: () => {
        onTriggerImport('youtube');
        onClose();
      },
    },
    {
      id: 'pdf',
      category: 'Sources & Imports',
      label: 'Import PDF Document',
      detail: 'Embed PDF reader & extract notes',
      icon: <FileUp className="w-4 h-4 text-red-500" />,
      action: () => {
        onTriggerImport('pdf');
        onClose();
      },
    },
    {
      id: 'web',
      category: 'Sources & Imports',
      label: 'Import Web Article',
      detail: 'Fetch and convert web page into notes',
      icon: <Globe className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onTriggerImport('web');
        onClose();
      },
    },
    {
      id: 'code',
      category: 'Formatting',
      label: 'Code Snippet',
      detail: 'Monospace code `snippet`',
      shortcut: '`',
      icon: <Code className="w-4 h-4 text-zinc-400" />,
      action: () => {
        onInsertText('`code`');
        onClose();
      },
    },
    {
      id: 'math',
      category: 'Formatting',
      label: 'LaTeX Math Formula',
      detail: 'Insert $$math$$ expression',
      shortcut: '$$',
      icon: <Sigma className="w-4 h-4 text-teal-500" />,
      action: () => {
        onInsertText('$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
        onClose();
      },
    },
    {
      id: 'link',
      category: 'Formatting',
      label: 'Reference Document',
      detail: 'Link to another note [[link]]',
      shortcut: '@',
      icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
      action: () => {
        onInsertText('[[]]');
        onClose();
      },
    },
  ], [onClose, onInsertText, onSetRemType, onToggleTodo, onTriggerAi, onTriggerImport]);

  // Filter items by user's typed slash query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => {
        // Prevent textarea from losing focus!
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        top: `${position.top + 26}px`,
        left: `${Math.min(position.left, typeof window !== 'undefined' ? window.innerWidth - 340 : 200)}px`,
      }}
      className="fixed z-50 w-80 max-h-96 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
    >
      {/* Header with discovery hint */}
      <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Recallio Commands</span>
        </div>
        {query && (
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            /{query}
          </span>
        )}
      </div>

      {/* Action items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100/60 dark:divide-zinc-800/40 p-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.id}
                ref={isSelected ? selectedItemRef : null}
                onMouseEnter={() => onSelectIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 transition-transform ${
                  isSelected ? 'bg-blue-100 dark:bg-blue-900/60 scale-105' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate leading-tight mt-0.5">
                    {item.detail}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-zinc-400 space-y-1">
            <p className="font-medium text-zinc-600 dark:text-zinc-300">No matching command found</p>
            <p className="text-[11px] text-zinc-400">
              Type <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">::</kbd> for cards, <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">todo</kbd> for checkbox, or <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">ai</kbd> for AI tools.
            </p>
          </div>
        )}
      </div>

      {/* Footer navigation hint */}
      <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
        <span>Use ↑↓ to navigate</span>
        <span>Enter to select • Esc to dismiss</span>
      </div>
    </div>
  );
};
