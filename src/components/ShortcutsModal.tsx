import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', desc: 'Create a new sibling loop below' },
    { key: 'Tab', desc: 'Indent loop (make it a sub-loop)' },
    { key: 'Shift + Tab', desc: 'Outdent loop (move up one level)' },
    { key: 'Alt + ↑ / ↓', desc: 'Move loop up / down among siblings' },
    { key: 'Cmd / Ctrl + Enter', desc: 'Toggle loop completion (close loop)' },
    { key: 'Shift + Enter', desc: 'Add or edit a detailed sub-note' },
    { key: 'Backspace (on empty)', desc: 'Delete loop & focus previous item' },
    { key: '↑ / ↓ Arrows', desc: 'Move cursor focus up and down the outline' },
    { key: 'Click bullet dot', desc: 'Zoom in to focus on that specific node' },
    { key: 'Click breadcrumb', desc: 'Zoom back out to parent or dashboard' },
    { key: '?', desc: 'Open this keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Workflowy Shortcuts</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Fly through your open loops with pure keyboard speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-sm"
            >
              <span className="text-zinc-600 dark:text-zinc-300">{item.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
