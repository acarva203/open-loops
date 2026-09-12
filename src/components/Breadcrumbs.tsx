import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { Engagement, LoopNode } from '../types';

interface BreadcrumbsProps {
  engagement: Engagement;
  path: LoopNode[];
  onZoom: (nodeId: string | null) => void;
  onBackToDashboard: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  engagement,
  path,
  onZoom,
  onBackToDashboard,
}) => {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-4 py-1">
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Engagements</span>
      </button>

      <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />

      <button
        onClick={() => onZoom(null)}
        className={`hover:text-zinc-900 dark:hover:text-white transition-colors font-medium ${
          path.length === 0 ? 'text-zinc-900 dark:text-white font-semibold' : ''
        }`}
      >
        {engagement.title}
      </button>

      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <React.Fragment key={node.id}>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
            <button
              onClick={() => onZoom(node.id)}
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors max-w-[200px] truncate ${
                isLast
                  ? 'text-zinc-900 dark:text-white font-semibold'
                  : 'font-normal'
              }`}
            >
              {node.text || 'Untitled'}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
