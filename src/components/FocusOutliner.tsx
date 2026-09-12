import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Plus,
  X,
  Layers,
  CheckCircle2,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import type { Engagement, LoopNode } from '../types';
import { BulletItem } from './BulletItem';
import { Breadcrumbs } from './Breadcrumbs';
import {
  findNode,
  findNodePath,
  countLoops,
  getFlattenedVisibleNodes,
  extractTags,
} from '../utils/treeUtils';

interface FocusOutlinerProps {
  engagement: Engagement;
  zoomedNodeId: string | null;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onZoom: (nodeId: string | null) => void;
  onBackToDashboard: () => void;
  onAddNode: (engagementId: string, afterNodeId: string | null, text?: string) => string;
  onUpdateText: (engagementId: string, nodeId: string, text: string) => void;
  onUpdateNote: (engagementId: string, nodeId: string, note: string) => void;
  onToggleComplete: (engagementId: string, nodeId: string) => void;
  onToggleCollapse: (engagementId: string, nodeId: string) => void;
  onIndent: (engagementId: string, nodeId: string) => void;
  onOutdent: (engagementId: string, nodeId: string) => void;
  onMoveNodeUp: (engagementId: string, nodeId: string) => void;
  onMoveNodeDown: (engagementId: string, nodeId: string) => void;
  onMoveNodeToPosition: (
    engagementId: string,
    sourceId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => void;
  onDelete: (engagementId: string, nodeId: string) => string | null;
  onQuickSchedule?: (engagement: Engagement, node: LoopNode) => void;
}

export const FocusOutliner: React.FC<FocusOutlinerProps> = ({
  engagement,
  zoomedNodeId,
  hideCompleted,
  onToggleHideCompleted,
  onZoom,
  onBackToDashboard,
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
  onQuickSchedule,
}) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [reorderMode, setReorderMode] = useState<boolean>(false);

  // Target nodes being rendered (either zoomed node's children or rootNodes)
  const zoomedNode = useMemo(() => {
    if (!zoomedNodeId) return null;
    return findNode(engagement.rootNodes, zoomedNodeId);
  }, [engagement.rootNodes, zoomedNodeId]);

  const breadcrumbPath = useMemo(() => {
    if (!zoomedNodeId) return [];
    return findNodePath(engagement.rootNodes, zoomedNodeId);
  }, [engagement.rootNodes, zoomedNodeId]);

  const activeNodes = useMemo(() => {
    if (zoomedNode) {
      return zoomedNode.children;
    }
    return engagement.rootNodes;
  }, [zoomedNode, engagement.rootNodes]);

  // Current scope stats
  const scopeStats = useMemo(() => {
    return countLoops(activeNodes);
  }, [activeNodes]);

  // Extract all tags in this engagement for quick filtering
  const allDiscoveredTags = useMemo(() => {
    const set = new Set<string>();

    function walk(list: LoopNode[]) {
      for (const node of list) {
        const { tags, mentions } = extractTags(node.text + ' ' + (node.note || ''));
        tags.forEach((t) => set.add(t));
        mentions.forEach((m) => set.add(m));
        if (node.children) walk(node.children);
      }
    }

    walk(engagement.rootNodes);
    return Array.from(set);
  }, [engagement.rootNodes]);

  // Handle vertical arrow key navigation between visible nodes
  const handleNavigateVertical = (currentId: string, direction: 'up' | 'down') => {
    const flatList = getFlattenedVisibleNodes(activeNodes, hideCompleted);
    const index = flatList.findIndex((item) => item.id === currentId);

    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      setFocusedNodeId(flatList[index - 1].id);
    } else if (direction === 'down' && index < flatList.length - 1) {
      setFocusedNodeId(flatList[index + 1].id);
    }
  };

  const handleAddNewAtEnd = () => {
    const lastNode = activeNodes.length > 0 ? activeNodes[activeNodes.length - 1] : null;
    let newId: string;
    if (zoomedNode) {
      newId = onAddNode(engagement.id, lastNode ? lastNode.id : null, '');
    } else {
      newId = onAddNode(engagement.id, lastNode ? lastNode.id : null, '');
    }
    setFocusedNodeId(newId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Breadcrumb Trail */}
      <Breadcrumbs
        engagement={engagement}
        path={breadcrumbPath}
        onZoom={onZoom}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Engagement Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: engagement.color }}
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {zoomedNode ? zoomedNode.text || 'Zoomed View' : engagement.title}
            </h1>
          </div>
          {engagement.description && !zoomedNode && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {engagement.description}
            </p>
          )}
        </div>

        {/* Live Open Loop Tally Badge for this engagement */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>{scopeStats.open} Open Loops</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{scopeStats.completed} Closed</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search loops, #tags, or @mentions..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Reorder / Move Mode Toggle */}
          <button
            onClick={() => setReorderMode(!reorderMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              reorderMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="Toggle drag handles and move buttons to reorder bullets"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{reorderMode ? 'Reorder Mode: ON' : 'Move Bullets'}</span>
          </button>

          {/* Hide/Show Closed */}
          <button
            onClick={onToggleHideCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              hideCompleted
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideCompleted ? 'Hiding Closed' : 'Show Closed'}</span>
          </button>
        </div>
      </div>

      {/* Quick Tag Pills Bar */}
      {allDiscoveredTags.length > 0 && (
        <div className="mt-3 flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" /> Quick filters:
          </span>
          {allDiscoveredTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchFilter(searchFilter === tag ? '' : tag)}
              className={`text-xs px-2 py-0.5 rounded-md font-medium border transition-colors ${
                searchFilter === tag
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Outliner Bullet Tree */}
      <div className="mt-6 pt-2 pb-24">
        {activeNodes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No open loops here yet. Capture what's on your mind!
            </p>
            <button
              onClick={handleAddNewAtEnd}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Add first loop
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {activeNodes.map((node) => (
              <BulletItem
                key={node.id}
                node={node}
                engagementId={engagement.id}
                depth={0}
                hideCompleted={hideCompleted}
                searchFilter={searchFilter}
                focusedNodeId={focusedNodeId}
                reorderMode={reorderMode}
                onFocusNode={setFocusedNodeId}
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
                onNavigateVertical={handleNavigateVertical}
                onTagClick={(tag) => setSearchFilter(tag)}
                onQuickSchedule={onQuickSchedule ? (node) => onQuickSchedule(engagement, node) : undefined}
              />
            ))}
          </div>
        )}

        {/* Quick Add at Bottom */}
        <div className="mt-4 pt-2">
          <button
            onClick={handleAddNewAtEnd}
            className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add open loop (or press Enter on any bullet)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
