'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  CreditCard, 
  Check, 
  Square, 
  MoreHorizontal, 
  Trash2, 
  CornerDownRight, 
  Sparkles 
} from 'lucide-react';
import { Rem } from '@/types';
import { useRem } from '@/context/RemContext';
import { SlashMenu } from './SlashMenu';
import { parseCardsFromText } from '@/lib/cardParser';

interface RemItemProps {
  remId: string;
  depth?: number;
  isLastSibling?: boolean;
  onOpenAiModal?: (mode: 'flashcards' | 'summary' | 'expand', remId?: string) => void;
  onOpenImportModal?: (type: 'pdf' | 'web' | 'youtube', remId?: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (remId: string, multi: boolean) => void;
}

export const RemItem: React.FC<RemItemProps> = ({
  remId,
  depth = 0,
  onOpenAiModal,
  onOpenImportModal,
  isSelected = false,
  onToggleSelect,
}) => {
  const {
    rems,
    activeRemId,
    updateRemText,
    updateRemType,
    createRem,
    deleteRem,
    indentRem,
    outdentRem,
    toggleCollapse,
    toggleTodo,
    zoomIntoRem,
    getCardsForRem,
    setActiveRemId,
  } = useRem();

  const rem = rems.find((r) => r.id === remId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(rem?.text || '');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Sync local text with external changes when not actively typing
  useEffect(() => {
    if (rem && !isEditing) {
      setLocalText(rem.text);
    }
  }, [rem, isEditing]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(26, textareaRef.current.scrollHeight)}px`;
    }
  }, [localText, isEditing]);

  if (!rem) return null;

  const hasChildren = rem.childrenIds && rem.childrenIds.length > 0;
  const cards = getCardsForRem(rem.id);
  const cardCount = cards.length;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalText(val);

    // Trigger slash command menu if / is typed
    const slashIdx = val.lastIndexOf('/');
    if (slashIdx !== -1) {
      const beforeSlash = val.slice(0, slashIdx);
      if (slashIdx === 0 || /\s$/.test(beforeSlash)) {
        const query = val.slice(slashIdx + 1);
        if (!/\s/.test(query) && query.length < 20) {
          setSlashQuery(query);
          setSlashSelectedIndex(0);
          setShowSlashMenu(true);
          if (textareaRef.current) {
            const rect = textareaRef.current.getBoundingClientRect();
            setSlashMenuPos({ top: rect.bottom, left: rect.left + 10 });
          }
          return;
        }
      }
    }
    setShowSlashMenu(false);
  };

  const handleBlur = () => {
    // Small delay to allow slash menu click events without unmounting
    setTimeout(() => {
      if (!showSlashMenu) {
        setIsEditing(false);
        if (localText !== rem.text) {
          updateRemText(rem.id, localText);
        }
      }
    }, 120);
  };

  const executeSlashAction = (actionId: string) => {
    const slashIdx = localText.lastIndexOf('/');
    if (slashIdx === -1) {
      setShowSlashMenu(false);
      return;
    }

    const beforeSlash = localText.slice(0, slashIdx);
    const afterSlash = localText.slice(slashIdx + 1 + slashQuery.length);
    const cleanedText = (beforeSlash + afterSlash).trimStart();

    setShowSlashMenu(false);

    if (actionId === 'todo') {
      toggleTodo(rem.id);
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      setTimeout(() => textareaRef.current?.focus(), 20);
      return;
    }

    if (actionId === 'h1' || actionId === 'h2' || actionId === 'header1' || actionId === 'header2' || actionId === 'bullet') {
      const mappedType = (actionId === 'h1' || actionId === 'header1') ? 'header1' : (actionId === 'h2' || actionId === 'header2') ? 'header2' : 'bullet';
      updateRemType(rem.id, mappedType);
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      setTimeout(() => textareaRef.current?.focus(), 20);
      return;
    }

    if (actionId === 'concept') {
      const newText = beforeSlash + ' :: ' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = beforeSlash.length + 4;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 20);
      return;
    }

    if (actionId === 'bidirectional') {
      const newText = beforeSlash + ' ::: ' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = beforeSlash.length + 5;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 20);
      return;
    }

    if (actionId === 'cloze') {
      const newText = beforeSlash + '{{}}' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = beforeSlash.length + 2;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 20);
      return;
    }

    if (actionId === 'code') {
      const newText = beforeSlash + '`code`' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => textareaRef.current?.focus(), 20);
      return;
    }

    if (actionId === 'math') {
      const newText = beforeSlash + '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => textareaRef.current?.focus(), 20);
      return;
    }

    if (actionId === 'link') {
      const newText = beforeSlash + '[[]]' + afterSlash;
      setLocalText(newText);
      updateRemText(rem.id, newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const pos = beforeSlash.length + 2;
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 20);
      return;
    }

    if (actionId === 'ai-cards') {
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      onOpenAiModal?.('flashcards', rem.id);
      return;
    }

    if (actionId === 'ai-summary') {
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      onOpenAiModal?.('summary', rem.id);
      return;
    }

    if (actionId === 'ai-expand') {
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      onOpenAiModal?.('expand', rem.id);
      return;
    }

    if (actionId === 'pdf' || actionId === 'youtube' || actionId === 'web') {
      setLocalText(cleanedText);
      updateRemText(rem.id, cleanedText);
      onOpenImportModal?.(actionId, rem.id);
      return;
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => prev + 1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // Trigger action based on query or default order
        const actionsList = [
          'todo', 'concept', 'bidirectional', 'cloze', 'h1', 'h2', 'bullet',
          'ai-cards', 'ai-summary', 'ai-expand', 'youtube', 'pdf', 'web', 'code', 'math', 'link'
        ];
        const filtered = actionsList.filter((a) => a.toLowerCase().includes(slashQuery.toLowerCase()));
        const targetAction = filtered[slashSelectedIndex % Math.max(1, filtered.length)] || filtered[0] || 'todo';
        executeSlashAction(targetAction);
        return;
      }
    }

    // Enter: Create sibling beneath
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (localText !== rem.text) {
        await updateRemText(rem.id, localText);
      }
      const newRemId = await createRem(rem.parentId || activeRemId, rem.id, '', 'bullet');
      setTimeout(() => {
        const el = document.getElementById(`rem-input-${newRemId}`);
        if (el) (el as HTMLTextAreaElement).focus();
      }, 50);
      return;
    }

    // Tab: Indent
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (localText !== rem.text) {
        await updateRemText(rem.id, localText);
      }
      const success = await indentRem(rem.id);
      if (success) {
        setTimeout(() => textareaRef.current?.focus(), 20);
      }
      return;
    }

    // Shift + Tab: Outdent
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (localText !== rem.text) {
        await updateRemText(rem.id, localText);
      }
      const success = await outdentRem(rem.id);
      if (success) {
        setTimeout(() => textareaRef.current?.focus(), 20);
      }
      return;
    }

    // Backspace: Delete empty Rem
    if (e.key === 'Backspace' && localText.trim() === '' && !hasChildren) {
      e.preventDefault();
      await deleteRem(rem.id);
      // Focus previous element
      const inputs = Array.from(document.querySelectorAll('textarea[id^="rem-input-"]'));
      const currIdx = inputs.findIndex((i) => i.id === `rem-input-${rem.id}`);
      if (currIdx > 0) {
        (inputs[currIdx - 1] as HTMLTextAreaElement).focus();
      }
      return;
    }

    // Arrow Up: Move to previous line
    if (e.key === 'ArrowUp' && textareaRef.current) {
      if (textareaRef.current.selectionStart === 0) {
        const inputs = Array.from(document.querySelectorAll('textarea[id^="rem-input-"]'));
        const currIdx = inputs.findIndex((i) => i.id === `rem-input-${rem.id}`);
        if (currIdx > 0) {
          e.preventDefault();
          const target = inputs[currIdx - 1] as HTMLTextAreaElement;
          target.focus();
          target.setSelectionRange(target.value.length, target.value.length);
        }
      }
    }

    // Arrow Down: Move to next line
    if (e.key === 'ArrowDown' && textareaRef.current) {
      if (textareaRef.current.selectionStart === localText.length) {
        const inputs = Array.from(document.querySelectorAll('textarea[id^="rem-input-"]'));
        const currIdx = inputs.findIndex((i) => i.id === `rem-input-${rem.id}`);
        if (currIdx !== -1 && currIdx < inputs.length - 1) {
          e.preventDefault();
          const target = inputs[currIdx + 1] as HTMLTextAreaElement;
          target.focus();
          target.setSelectionRange(0, 0);
        }
      }
    }
  };

  const handleInsertTextFromSlash = (textToInsert: string) => {
    let base = localText;
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    const updated = base + textToInsert;
    setLocalText(updated);
    updateRemText(rem.id, updated);
    setShowSlashMenu(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(updated.length, updated.length);
      }
    }, 20);
  };

  // Helper to render inline markdown within plain text segments (**bold**, *italic*, `code`, ==highlight==, ~~strike~~)
  const renderMarkdownInline = (text: string) => {
    if (!text) return '';
    const mdRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|==[^=]+==|~~[^~]+~~)/g;
    const tokens = text.split(mdRegex);

    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return <strong key={i} className="font-bold text-zinc-900 dark:text-zinc-50">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return <em key={i} className="italic text-zinc-800 dark:text-zinc-200">{token.slice(1, -1)}</em>;
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-700">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('==') && token.endsWith('==') && token.length > 4) {
        return (
          <mark key={i} className="px-1 py-0.5 mx-0.5 rounded bg-amber-200/90 dark:bg-amber-900/60 text-zinc-900 dark:text-zinc-100">
            {token.slice(2, -2)}
          </mark>
        );
      }
      if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
        return <del key={i} className="line-through text-zinc-400 dark:text-zinc-500">{token.slice(2, -2)}</del>;
      }
      return token;
    });
  };

  // Render nicely formatted elements (highlight ::, {{cloze}}, [[links]], and markdown)
  const renderRichText = (text: string) => {
    if (!text || text.trim() === '') {
      return <span className="text-zinc-400 dark:text-zinc-500 italic text-sm">Empty rem...</span>;
    }

    // Format concept-definition (strict ' ::: ' or ' :: ')
    const conceptDelim = text.includes(' ::: ')
      ? ' ::: '
      : text.includes(' :: ')
      ? ' :: '
      : text.includes(' <-> ')
      ? ' <-> '
      : null;

    if (conceptDelim) {
      const [front, ...backParts] = text.split(conceptDelim);
      const back = backParts.join(conceptDelim);

      return (
        <div className="flex flex-wrap items-center gap-1.5 leading-relaxed text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{renderMarkdownInline(front)}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {conceptDelim.trim()}
          </span>
          <span className="text-zinc-700 dark:text-zinc-300">{renderSegments(back)}</span>
        </div>
      );
    }

    return <div className="leading-relaxed text-sm text-zinc-800 dark:text-zinc-200">{renderSegments(text)}</div>;
  };

  // Helper to render inline Clozes, [[Links]], and #Tags
  const renderSegments = (str: string) => {
    // Regex for cloze {{...}}, link [[...]], and tag #...
    const parts = str.split(/(\{\{[^}]+\}\}|\[\[[^\]]+\]\]|#[a-zA-Z0-9_\-]+)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const inner = part.slice(2, -2).replace(/^c\d+::/, '');
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
          >
            [{inner}]
          </span>
        );
      }
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkName = part.slice(2, -2);
        const target = rems.find((r) => r.text.toLowerCase().includes(linkName.toLowerCase()));
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (target) zoomIntoRem(target.id);
            }}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:underline cursor-pointer border border-blue-200 dark:border-blue-900/50"
          >
            @{linkName}
          </button>
        );
      }
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span
            key={idx}
            className="inline-block px-1.5 py-0.2 mx-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 rounded-full"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{renderMarkdownInline(part)}</span>;
    });
  };

  const isHeading = rem.type === 'header1' || rem.type === 'header2';
  const headingClasses =
    rem.type === 'header1'
      ? 'text-lg font-bold text-zinc-900 dark:text-white'
      : rem.type === 'header2'
      ? 'text-base font-semibold text-zinc-900 dark:text-zinc-100'
      : '';

  return (
    <div className={`relative group/rem transition-colors ${isSelected ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/50 rounded-xl px-1' : ''}`}>
      {/* Indentation Guidelines */}
      {depth > 0 && (
        <div
          className="absolute left-[-16px] top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800/80 group-hover/rem:bg-blue-400/50 transition-colors pointer-events-none"
        />
      )}

      <div className="flex items-start gap-1 py-1 px-1 rounded-md hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors">
        {/* Selection Checkbox (visible on hover or when selected) */}
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(rem.id, e.shiftKey);
            }}
            className={`w-4 h-6 flex items-center justify-center shrink-0 transition-opacity cursor-pointer ${
              isSelected
                ? 'opacity-100 text-blue-600 dark:text-blue-400'
                : 'opacity-0 group-hover/rem:opacity-60 hover:!opacity-100 text-zinc-400'
            }`}
            title="Select Rem (Shift+Click to multi-select)"
          >
            <div
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-500 bg-white dark:bg-zinc-900'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>
        )}

        {/* Collapse / Expand Chevron */}
        <div className="w-5 h-6 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCollapse(rem.id)}
              className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title={rem.isCollapsed ? 'Expand' : 'Collapse'}
            >
              {rem.isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Bullet Point with Zoom & Card Glow */}
        <div className="relative h-6 flex items-center justify-center shrink-0 group/bullet">
          <button
            type="button"
            onClick={() => zoomIntoRem(rem.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer relative ${
              cardCount > 0
                ? 'bg-blue-500 ring-4 ring-blue-500/20 shadow-sm'
                : hasChildren
                ? 'bg-zinc-600 dark:bg-zinc-400'
                : 'bg-zinc-400 dark:bg-zinc-600'
            } hover:scale-135 hover:bg-blue-600`}
            title={`Click to zoom into: "${rem.text.slice(0, 30)}"`}
          />
        </div>

        {/* Checkbox (if Todo) */}
        {rem.isTodo && (
          <button
            type="button"
            onClick={() => toggleTodo(rem.id)}
            className="mt-1 ml-1 text-zinc-400 hover:text-blue-500 cursor-pointer"
          >
            {rem.isCompleted ? (
              <Check className="w-4 h-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 rounded" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Text Content Area */}
        <div className="flex-1 min-w-0 ml-1.5">
          {isEditing ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                id={`rem-input-${rem.id}`}
                value={localText}
                onChange={handleTextChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                rows={1}
                autoFocus
                placeholder="Type your note... (/ for tools, :: for flashcard)"
                className={`w-full bg-transparent resize-none border-0 outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 leading-relaxed py-0 px-0 focus:ring-0 ${headingClasses}`}
              />
              {showSlashMenu && (
                <SlashMenu
                  position={slashMenuPos}
                  query={slashQuery}
                  selectedIndex={slashSelectedIndex}
                  onSelectIndex={setSlashSelectedIndex}
                  onClose={() => setShowSlashMenu(false)}
                  onInsertText={(text) => {
                    if (text === ' :: ') executeSlashAction('concept');
                    else if (text === ' ::: ') executeSlashAction('bidirectional');
                    else if (text === '{{}}') executeSlashAction('cloze');
                    else if (text === '`code`') executeSlashAction('code');
                    else if (text.startsWith('$$')) executeSlashAction('math');
                    else if (text === '[[]]') executeSlashAction('link');
                    else executeSlashAction('concept');
                  }}
                  onSetRemType={(type) => executeSlashAction(type)}
                  onToggleTodo={() => executeSlashAction('todo')}
                  onTriggerAi={(mode) => executeSlashAction(`ai-${mode}`)}
                  onTriggerImport={(type) => executeSlashAction(type)}
                />
              )}
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`min-h-[26px] cursor-text rounded px-1 -mx-1 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/60 transition-colors ${
                rem.isCompleted ? 'line-through opacity-60' : ''
              } ${headingClasses}`}
            >
              {renderRichText(localText)}
            </div>
          )}
        </div>

        {/* Active Flashcard Indicator Badge */}
        {cardCount > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowCardPreview(!showCardPreview)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title={`${cardCount} flashcard(s) generated. Click to preview.`}
            >
              <CreditCard className="w-3 h-3 text-blue-500" />
              <span>{cardCount} {cardCount === 1 ? 'card' : 'cards'}</span>
            </button>

            {/* Flashcard Live Preview Popover */}
            {showCardPreview && (
              <div className="absolute right-0 top-7 z-30 w-80 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-xs space-y-2.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Generated Flashcard{cardCount > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowCardPreview(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                {cards.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold">
                      <span>Card #{i + 1} ({c.type})</span>
                      <span className="text-emerald-600 dark:text-emerald-400 capitalize">
                        {c.state}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Front:</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{c.front}</div>
                    </div>
                    <div className="pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="text-[10px] text-zinc-400">Back:</div>
                      <div className="text-zinc-700 dark:text-zinc-300 font-normal">{c.back}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hover Actions Menu */}
        <div className="opacity-0 group-hover/rem:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              createRem(rem.parentId || activeRemId, rem.id, '', 'bullet');
            }}
            title="Add sibling below"
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 cursor-pointer"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteRem(rem.id)}
            title="Delete this rem"
            className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Children Outliner List */}
      {hasChildren && !rem.isCollapsed && (
        <div className="pl-6 ml-1 space-y-0.5 border-l border-zinc-200/80 dark:border-zinc-800/80">
          {rem.childrenIds.map((childId, idx) => (
            <RemItem
              key={childId}
              remId={childId}
              depth={depth + 1}
              isLastSibling={idx === rem.childrenIds.length - 1}
              onOpenAiModal={onOpenAiModal}
              onOpenImportModal={onOpenImportModal}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
