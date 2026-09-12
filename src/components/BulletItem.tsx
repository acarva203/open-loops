import React, { useRef, useEffect, useState } from 'react';
import {
  ChevronRight,
  Check,
  CornerDownRight,
  Clock,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { LoopNode } from '../types';

interface BulletItemProps {
  node: LoopNode;
  engagementId: string;
  depth?: number;
  hideCompleted: boolean;
  searchFilter: string;
  focusedNodeId: string | null;
  reorderMode?: boolean;
  onFocusNode: (id: string | null) => void;
  onZoom: (id: string) => void;
  onAddNode: (engagementId: string, afterNodeId: string, text?: string) => string;
  onUpdateText: (engagementId: string, nodeId: string, text: string) => void;
  onUpdateNote: (engagementId: string, nodeId: string, note: string) => void;
  onToggleComplete: (engagementId: string, nodeId: string) => void;
  onToggleCollapse: (engagementId: string, nodeId: string) => void;
  onIndent: (engagementId: string, nodeId: string) => void;
  onOutdent: (engagementId: string, nodeId: string) => void;
  onMoveNodeUp?: (engagementId: string, nodeId: string) => void;
  onMoveNodeDown?: (engagementId: string, nodeId: string) => void;
  onMoveNodeToPosition?: (
    engagementId: string,
    sourceId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => void;
  onDelete: (engagementId: string, nodeId: string) => string | null;
  onNavigateVertical: (currentId: string, direction: 'up' | 'down') => void;
  onTagClick: (tag: string) => void;
  onQuickSchedule?: (node: LoopNode) => void;
}

function matchesSearchRecursive(n: LoopNode, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (n.text.toLowerCase().includes(q) || (n.note && n.note.toLowerCase().includes(q))) {
    return true;
  }
  return n.children ? n.children.some((child) => matchesSearchRecursive(child, query)) : false;
}

export const BulletItem: React.FC<BulletItemProps> = ({
  node,
  engagementId,
  depth = 0,
  hideCompleted,
  searchFilter,
  focusedNodeId,
  reorderMode = false,
  onFocusNode,
  onZoom,
  onAddNode,
  onUpdateText,
  onUpdateNote,
  onToggleComplete,
  onToggleCollapse,
  onIndent,
  onOutdent,
  onMoveNodeUp,
  onMoveNodeDown,
  onMoveNodeToPosition,
  onDelete,
  onNavigateVertical,
  onTagClick,
  onQuickSchedule,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const isFocused = focusedNodeId === node.id;

  // Auto-focus when this node is targeted
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  // If hideCompleted is true and node is completed, hide
  if (hideCompleted && node.completed) {
    return null;
  }

  // Filter check
  if (searchFilter && !matchesSearchRecursive(node, searchFilter)) {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;

  // Render text with clickable tag pills when not focused
  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-zinc-400 italic">Empty loop</span>;

    const parts = text.split(/(#[a-zA-Z0-9_\-]+|@[a-zA-Z0-9_\-]+)/g);

    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const isUrgent = part.toLowerCase() === '#urgent';
        const isWaiting = part.toLowerCase() === '#waiting';
        const isNext = part.toLowerCase() === '#next';

        let colorClass =
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60';
        if (isUrgent) {
          colorClass =
            'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60';
        } else if (isWaiting) {
          colorClass =
            'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
        } else if (isNext) {
          colorClass =
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
        }

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(part);
            }}
            className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded-md border ${colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            {part}
          </button>
        );
      }

      if (part.startsWith('@')) {
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(part);
            }}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded-md border bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60 hover:opacity-80 transition-opacity cursor-pointer"
          >
            {part}
          </button>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Alt + Up: Move loop up
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveNodeUp?.(engagementId, node.id);
      return;
    }

    // Alt + Down: Move loop down
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveNodeDown?.(engagementId, node.id);
      return;
    }

    // Cmd / Ctrl + Enter: Toggle complete
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onToggleComplete(engagementId, node.id);
      return;
    }

    // Shift + Enter: Add / edit sub-note
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      setIsEditingNote(true);
      setTimeout(() => noteRef.current?.focus(), 50);
      return;
    }

    // Enter: Create sibling bullet below
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newId = onAddNode(engagementId, node.id, '');
      onFocusNode(newId);
      return;
    }

    // Tab: Indent
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      onIndent(engagementId, node.id);
      return;
    }

    // Shift + Tab: Outdent
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      onOutdent(engagementId, node.id);
      return;
    }

    // Backspace: If empty, delete and focus previous
    if (e.key === 'Backspace' && !node.text) {
      e.preventDefault();
      const prevId = onDelete(engagementId, node.id);
      if (prevId) {
        onFocusNode(prevId);
      }
      return;
    }

    // Arrow Up
    if (e.key === 'ArrowUp' && !e.altKey) {
      e.preventDefault();
      onNavigateVertical(node.id, 'up');
      return;
    }

    // Arrow Down
    if (e.key === 'ArrowDown' && !e.altKey) {
      e.preventDefault();
      onNavigateVertical(node.id, 'down');
      return;
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    if (offsetY < height * 0.25) {
      setDragOverPosition('before');
    } else if (offsetY > height * 0.75) {
      setDragOverPosition('after');
    } else {
      setDragOverPosition('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== node.id && dragOverPosition && onMoveNodeToPosition) {
      onMoveNodeToPosition(engagementId, sourceId, node.id, dragOverPosition);
    }
    setDragOverPosition(null);
  };

  return (
    <div
      className={`relative group/item ${depth > 0 ? 'ml-5 sm:ml-6' : ''} ${
        isDragging ? 'opacity-40' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop Indicator Lines */}
      {dragOverPosition === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-full z-20 shadow-sm animate-pulse" />
      )}
      {dragOverPosition === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full z-20 shadow-sm animate-pulse" />
      )}

      {/* Indentation guide line */}
      {depth > 0 && (
        <div className="absolute left-[-15px] sm:left-[-17px] top-0 bottom-0 w-[1px] bg-zinc-200 dark:bg-zinc-800/90 group-hover/item:bg-zinc-300 dark:group-hover/item:bg-zinc-700 transition-colors" />
      )}

      {/* Main Bullet Row */}
      <div
        className={`flex items-start gap-1 py-1 px-1 rounded-lg transition-colors ${
          dragOverPosition === 'inside'
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 ring-1 ring-indigo-400'
            : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
        }`}
      >
        {/* Reorder Drag Handle & Move Up/Down Controls */}
        <div className="flex items-center shrink-0">
          {/* Drag Handle */}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`cursor-grab active:cursor-grabbing p-0.5 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity ${
              reorderMode ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
            }`}
            title="Drag to reorder loop"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Quick Shift Up / Down Arrow buttons (visible in Reorder Mode) */}
          {reorderMode && (
            <div className="flex flex-col -space-y-1">
              <button
                type="button"
                onClick={() => onMoveNodeUp?.(engagementId, node.id)}
                className="p-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-sm"
                title="Move up (Alt + ↑)"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => onMoveNodeDown?.(engagementId, node.id)}
                className="p-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-sm"
                title="Move down (Alt + ↓)"
              >
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Expand / Collapse Chevron */}
        <div className="w-5 h-6 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleCollapse(engagementId, node.id)}
              className="p-0.5 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-transform duration-150"
              style={{
                transform: node.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
              }}
              title={node.collapsed ? 'Expand branch' : 'Collapse branch'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Workflowy Bullet Dot (Zoom trigger) */}
        <div className="relative w-5 h-6 flex items-center justify-center shrink-0">
          <button
            onClick={() => onZoom(node.id)}
            className="group/bullet relative w-4 h-4 flex items-center justify-center rounded-full transition-all"
            title="Click to zoom in on this loop"
          >
            <span className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700 opacity-0 group-hover/bullet:opacity-100 transition-opacity" />
            <span
              className={`w-2 h-2 rounded-full transition-transform group-hover/bullet:scale-125 ${
                hasChildren
                  ? 'bg-zinc-700 dark:bg-zinc-200 ring-2 ring-zinc-300 dark:ring-zinc-600'
                  : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
          </button>
        </div>

        {/* Completion Check Circle */}
        <button
          onClick={() => onToggleComplete(engagementId, node.id)}
          className={`w-4 h-4 mt-1 rounded-full border flex items-center justify-center transition-all shrink-0 ${
            node.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400 text-transparent'
          }`}
          title={node.completed ? 'Re-open loop' : 'Close loop (Cmd+Enter)'}
        >
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </button>

        {/* Text Input / Content */}
        <div className="flex-1 min-w-0 ml-1.5">
          <div className="relative">
            {isFocused ? (
              <input
                ref={inputRef}
                type="text"
                value={node.text}
                onChange={(e) => onUpdateText(engagementId, node.id, e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => onFocusNode(null)}
                placeholder="What's the open loop?"
                className={`w-full bg-transparent border-none p-0 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-hidden ${
                  node.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                }`}
              />
            ) : (
              <div
                onClick={() => onFocusNode(node.id)}
                className={`w-full min-h-[22px] text-sm leading-relaxed cursor-text select-text ${
                  node.completed
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {renderFormattedText(node.text)}
              </div>
            )}
          </div>

          {/* Sub-note */}
          {(node.note || isEditingNote) && (
            <div className="mt-1 flex items-start gap-1 text-xs">
              <CornerDownRight className="w-3 h-3 text-zinc-400 mt-1 shrink-0" />
              {isEditingNote ? (
                <textarea
                  ref={noteRef}
                  value={node.note || ''}
                  onChange={(e) => onUpdateNote(engagementId, node.id, e.target.value)}
                  onBlur={() => setIsEditingNote(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
                      setIsEditingNote(false);
                      inputRef.current?.focus();
                    }
                  }}
                  rows={2}
                  placeholder="Add context, sub-details, or links..."
                  className="w-full text-xs font-normal text-zinc-600 dark:text-zinc-400 bg-zinc-50/70 dark:bg-zinc-800/60 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <div
                  onClick={() => {
                    setIsEditingNote(true);
                    setTimeout(() => noteRef.current?.focus(), 50);
                  }}
                  className="text-xs text-zinc-500 dark:text-zinc-400 italic hover:text-zinc-700 dark:hover:text-zinc-300 cursor-text py-0.5"
                >
                  {node.note}
                </div>
              )}
            </div>
          )}

          {/* Completed Timestamp */}
          {node.completed && node.completedAt && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">
              Closed {new Date(node.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(node.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Hover Quick Schedule Button */}
        {onQuickSchedule && !node.completed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickSchedule(node);
            }}
            className="opacity-0 group-hover/item:opacity-100 p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-opacity shrink-0"
            title="Timeblock this loop today"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recursive Children */}
      {!node.collapsed && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <BulletItem
              key={child.id}
              node={child}
              engagementId={engagementId}
              depth={depth + 1}
              hideCompleted={hideCompleted}
              searchFilter={searchFilter}
              focusedNodeId={focusedNodeId}
              reorderMode={reorderMode}
              onFocusNode={onFocusNode}
              onZoom={onZoom}
              onAddNode={onAddNode}
              onUpdateText={onUpdateText}
              onUpdateNote={onUpdateNote}
              onToggleComplete={onToggleComplete}
              onToggleCollapse={onToggleCollapse}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onMoveNodeUp={onMoveNodeUp}
              onMoveNodeDown={onMoveNodeDown}
              onMoveNodeToPosition={onMoveNodeToPosition}
              onDelete={onDelete}
              onNavigateVertical={onNavigateVertical}
              onTagClick={onTagClick}
              onQuickSchedule={onQuickSchedule}
            />
          ))}
        </div>
      )}
    </div>
  );
};
