import React from 'react';
import {
  Layers,
  Moon,
  Sun,
  Keyboard,
  Download,
  ArrowLeft,
  CircleDot,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import type { GlobalStats, Engagement } from '../types';

interface HeaderProps {
  globalStats: GlobalStats;
  activeEngagement: Engagement | null;
  onBackToDashboard: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShortcuts: () => void;
  onOpenExport: () => void;
  onToggleTimeblocking: () => void;
  timeblockCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  globalStats,
  activeEngagement,
  onBackToDashboard,
  darkMode,
  onToggleDarkMode,
  onOpenShortcuts,
  onOpenExport,
  onToggleTimeblocking,
  timeblockCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3 min-w-0">
          {activeEngagement ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all"
              title="Return to Engagements Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Engagements</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <CircleDot className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                  OpenLoops
                </span>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hidden md:inline">
                  Outliner
                </span>
              </div>
            </div>
          )}

          {/* Active Job indicator in header if focused */}
          {activeEngagement && (
            <div className="flex items-center gap-2 min-w-0 pl-1">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeEngagement.color }}
              />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {activeEngagement.title}
              </span>
            </div>
          )}
        </div>

        {/* Center: Open Loops live global badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
            {globalStats.totalOpenLoops} open
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {globalStats.totalCompletedLoops} closed
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
            {globalStats.totalEngagements} jobs
          </span>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onToggleTimeblocking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
            title="Open Today's Timeblock Schedule"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Today's Schedule</span>
            {timeblockCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                {timeblockCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenExport}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            title="Export / Import Data"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
