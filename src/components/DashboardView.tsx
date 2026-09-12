import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowRight,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Sparkles,
  Search,
  AlertCircle,
  Clock,
  Flame,
  Check,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import type { Engagement, EngagementStats, GlobalStats } from '../types';
import { getEngagementIcon } from '../utils/engagementIcons';

interface DashboardViewProps {
  engagements: Engagement[];
  engagementStats: EngagementStats[];
  globalStats: GlobalStats;
  totalFocusMinutes?: number;
  onSelectEngagement: (id: string) => void;
  onAddEngagement: (title: string, description: string, color: string) => void;
  onUpdateEngagement: (id: string, updates: Partial<Engagement>) => void;
  onDeleteEngagement: (id: string) => void;
  onQuickAddNode: (engagementId: string, text: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  engagements,
  engagementStats,
  globalStats,
  totalFocusMinutes = 90,
  onSelectEngagement,
  onAddEngagement,
  onUpdateEngagement,
  onDeleteEngagement,
  onQuickAddNode,
}) => {
  // Quick-capture state
  const [omnibarText, setOmnibarText] = useState('');
  const [selectedEngId, setSelectedEngId] = useState<string>(
    engagements[0]?.id || ''
  );
  const [activeQuickTags, setActiveQuickTags] = useState<string[]>([]);
  const [justCaptured, setJustCaptured] = useState(false);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'waiting'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'loops' | 'alpha'>('default');

  // Inline card add states: mapping engId -> string
  const [cardInlineInputs, setCardInlineInputs] = useState<Record<string, string>>({});

  // Engagement creation modal
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0].hex);

  // Engagement editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Handle Omnibar submit
  const handleOmnibarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omnibarText.trim() || !selectedEngId) return;

    let textToInsert = omnibarText.trim();
    if (activeQuickTags.length > 0) {
      textToInsert += ' ' + activeQuickTags.join(' ');
    }

    onQuickAddNode(selectedEngId, textToInsert);
    setOmnibarText('');
    setActiveQuickTags([]);
    setJustCaptured(true);
    setTimeout(() => setJustCaptured(false), 2000);
  };

  const toggleQuickTag = (tag: string) => {
    setActiveQuickTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle inline card add
  const handleCardInlineAdd = (engId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (cardInlineInputs[engId] || '').trim();
    if (!text) return;
    onQuickAddNode(engId, text);
    setCardInlineInputs((prev) => ({ ...prev, [engId]: '' }));
  };

  // Filtered & Sorted engagements
  const filteredEngagements = useMemo(() => {
    return engagements
      .filter((eng) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = eng.title.toLowerCase().includes(q);
          const descMatch = (eng.description || '').toLowerCase().includes(q);
          const loopMatch = eng.rootNodes.some(
            (n) =>
              n.text.toLowerCase().includes(q) ||
              (n.note && n.note.toLowerCase().includes(q))
          );
          if (!titleMatch && !descMatch && !loopMatch) return false;
        }

        // Category filter
        if (activeFilter === 'urgent') {
          return eng.rootNodes.some(
            (n) =>
              !n.completed &&
              (n.text.toLowerCase().includes('#urgent') ||
                n.text.toLowerCase().includes('#next'))
          );
        }

        if (activeFilter === 'waiting') {
          return eng.rootNodes.some(
            (n) =>
              !n.completed &&
              (n.text.toLowerCase().includes('#waiting') ||
                n.text.toLowerCase().includes('@'))
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'loops') {
          const statsA = engagementStats.find((s) => s.id === a.id)?.openLoops || 0;
          const statsB = engagementStats.find((s) => s.id === b.id)?.openLoops || 0;
          return statsB - statsA;
        }
        if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [engagements, searchQuery, activeFilter, sortBy, engagementStats]);

  // Workload distribution segments
  const workloadSegments = useMemo(() => {
    if (globalStats.totalOpenLoops === 0) return [];
    return engagements.map((eng) => {
      const stats = engagementStats.find((s) => s.id === eng.id);
      const openCount = stats?.openLoops || 0;
      const percentage = Math.round((openCount / globalStats.totalOpenLoops) * 100);
      return {
        id: eng.id,
        title: eng.title,
        color: eng.color,
        count: openCount,
        percentage,
      };
    });
  }, [engagements, engagementStats, globalStats.totalOpenLoops]);

  const handleStartEdit = (eng: Engagement) => {
    setEditingId(eng.id);
    setEditTitle(eng.title);
    setEditDesc(eng.description || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    onUpdateEngagement(id, { title: editTitle, description: editDesc });
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEngagement(newTitle, newDesc, newColor);
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      {/* 1. Executive Hero & Metrics Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-xs font-semibold text-indigo-300 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Cognitive Workload & Engagements
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
                Real-time inventory across your leadership, research, academic, and industry roles.
              </p>
            </div>

            {/* Quick KPI stats in Hero */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-2xl font-black text-white tracking-tight">
                  {globalStats.totalOpenLoops}
                </div>
                <div className="text-[11px] font-medium text-indigo-300 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Active Loops</span>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-2xl font-black text-emerald-400 tracking-tight">
                  {globalStats.totalCompletedLoops}
                </div>
                <div className="text-[11px] font-medium text-emerald-300/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Closed</span>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="text-2xl font-black text-blue-400 tracking-tight">
                  {formatHours(totalFocusMinutes)}
                </div>
                <div className="text-[11px] font-medium text-blue-300/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Timeblocked Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Segmented Workload Distribution Spectrum */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between text-xs mb-2 text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Workload Distribution
              </span>
              <span>{globalStats.totalOpenLoops} total unresolved loops</span>
            </div>

            {/* Segmented bar */}
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex shadow-inner">
              {workloadSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="h-full transition-all duration-300 hover:opacity-90 relative group/seg"
                  style={{
                    width: `${seg.percentage}%`,
                    backgroundColor: seg.color,
                  }}
                  title={`${seg.title}: ${seg.count} loops (${seg.percentage}%)`}
                />
              ))}
            </div>

            {/* Segment Legend */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[11px]">
              {workloadSegments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => onSelectEngagement(seg.id)}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium truncate max-w-[130px]">{seg.title.split(' ')[0]}</span>
                  <span className="text-zinc-500 font-mono">({seg.percentage}%)</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Interactive Quick-Capture Omnibar */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <form onSubmit={handleOmnibarSubmit} className="relative">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-2xl bg-white/10 dark:bg-black/30 border border-white/15 backdrop-blur-md shadow-lg">
                {/* Target Engagement Selector Pill */}
                <div className="relative shrink-0">
                  <select
                    value={selectedEngId}
                    onChange={(e) => setSelectedEngId(e.target.value)}
                    className="w-full sm:w-auto h-full text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 focus:outline-hidden appearance-none pr-8 cursor-pointer transition-colors"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.id} className="bg-zinc-900 text-white">
                        {eng.title}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                    ▼
                  </span>
                </div>

                {/* Task Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={omnibarText}
                    onChange={(e) => setOmnibarText(e.target.value)}
                    placeholder="Quick brain dump: type any open loop and press Enter..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-transparent text-white placeholder-zinc-400 focus:outline-hidden"
                  />
                </div>

                {/* Quick Tag Pills */}
                <div className="flex items-center gap-1.5 px-1 shrink-0">
                  {['#urgent', '#next', '#waiting'].map((tag) => {
                    const isSelected = activeQuickTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleQuickTag(tag)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!omnibarText.trim()}
                    className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 text-white shadow-md transition-all shrink-0"
                    title="Capture Loop (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirmation Toast */}
              {justCaptured && (
                <div className="absolute -bottom-7 left-3 flex items-center gap-1.5 text-xs text-emerald-300 font-medium animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Captured open loop straight into outliner!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 4. Filter, Search & Sort Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
            }`}
          >
            All Engagements ({engagements.length})
          </button>

          <button
            onClick={() => setActiveFilter('urgent')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === 'urgent'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Needs Attention</span>
          </button>

          <button
            onClick={() => setActiveFilter('waiting')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === 'waiting'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span>Waiting On</span>
          </button>
        </div>

        {/* Right: Search, Sort & New Job */}
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search loops..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="loops">Most Open Loops</option>
            <option value="alpha">Alphabetical</option>
          </select>

          {/* New Engagement Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Role</span>
          </button>
        </div>
      </div>

      {/* 5. Rich Executive Engagement Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEngagements.map((eng) => {
          const stats = engagementStats.find((s) => s.id === eng.id) || {
            openLoops: 0,
            completedLoops: 0,
            totalLoops: 0,
          };
          const isEditing = editingId === eng.id;
          const RoleIcon = getEngagementIcon(eng.title, eng.id);

          // Find the primary urgent or first unresolved open loop
          const urgentLoop = eng.rootNodes.find(
            (n) =>
              !n.completed &&
              (n.text.toLowerCase().includes('#urgent') ||
                n.text.toLowerCase().includes('#next'))
          );
          const primaryLoop = urgentLoop || eng.rootNodes.find((n) => !n.completed);

          // Other open loops (excluding primary)
          const otherOpenLoops = eng.rootNodes
            .filter((n) => !n.completed && n.id !== primaryLoop?.id)
            .slice(0, 2);

          const completionPercent =
            stats.totalLoops > 0
              ? Math.round((stats.completedLoops / stats.totalLoops) * 100)
              : 0;

          return (
            <div
              key={eng.id}
              className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 p-5 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
                style={{ backgroundColor: eng.color }}
              />

              <div>
                {/* Header: Role Icon, Title & Edit menu */}
                <div className="flex items-start justify-between gap-3 mt-1">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Role Icon Box */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: eng.color }}
                    >
                      <RoleIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-sm font-bold px-2 py-1 rounded-md border border-indigo-400 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Short description"
                            className="w-full text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(eng.id)}
                              className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                            {eng.title}
                          </h3>
                          {eng.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                              {eng.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleStartEdit(eng)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit Role Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete engagement "${eng.title}" and its loops?`)) {
                            onDeleteEngagement(eng.id);
                          }
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Engagement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress / Completion Health Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {stats.openLoops} Open Loops
                    </span>
                    <span>
                      {stats.completedLoops} of {stats.totalLoops} closed ({completionPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${completionPercent}%`,
                        backgroundColor: eng.color,
                      }}
                    />
                  </div>
                </div>

                {/* Primary Action / Urgent Callout */}
                {primaryLoop ? (
                  <div className="mt-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60">
                    <div className="flex items-center justify-between gap-1 text-[10px] uppercase font-bold text-zinc-400 mb-1">
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <Flame className="w-3 h-3 text-rose-500" />
                        Next Up Focus
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-relaxed">
                      {primaryLoop.text}
                    </p>
                    {primaryLoop.note && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 italic">
                        {primaryLoop.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      All loops closed! Well done. 🎉
                    </p>
                  </div>
                )}

                {/* Other Preview Loops */}
                {otherOpenLoops.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {otherOpenLoops.map((item) => (
                      <div
                        key={item.id}
                        className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 truncate py-0.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                        <span className="truncate">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Card Actions: Inline Add + Focus Button */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                {/* Inline Fast Add */}
                <form
                  onSubmit={(e) => handleCardInlineAdd(eng.id, e)}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={cardInlineInputs[eng.id] || ''}
                    onChange={(e) =>
                      setCardInlineInputs({
                        ...cardInlineInputs,
                        [eng.id]: e.target.value,
                      })
                    }
                    placeholder="+ Quick add loop to this role..."
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                  />
                  {cardInlineInputs[eng.id]?.trim() && (
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs shrink-0"
                      title="Add to this role"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Zoom into Focus Button */}
                <button
                  onClick={() => onSelectEngagement(eng.id)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-xs font-semibold text-white transition-all group/btn shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-white transition-colors" />
                    Zoom into Focus Outliner
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal for New Role / Engagement */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Add New Engagement / Role</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Create a dedicated workspace for a job, club, internship, or major commitment.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Engagement Title
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Robotics Team Lead, Consulting Gig..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Description / Focus Area (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hardware sprint deliverables & firmware testing"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newColor === c.hex
                          ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
              >
                Create Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
