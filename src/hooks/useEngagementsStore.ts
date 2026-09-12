import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { Engagement, LoopNode } from '../types';
import { INITIAL_ENGAGEMENTS } from '../data/initialData';
import {
  calculateStats,
  updateNode,
  insertNodeAfter,
  deleteNode as deleteTreeNode,
  indentNode as indentTreeNode,
  outdentNode as outdentTreeNode,
  moveNodeUp as moveTreeNodeUp,
  moveNodeDown as moveTreeNodeDown,
  moveNodeToPosition as moveTreeNodeToPosition,
} from '../utils/treeUtils';

const STORAGE_KEY = 'open_loops_engagements_v3';

export function useEngagementsStore() {
  const [engagements, setEngagements] = useState<Engagement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load engagements from localStorage:', e);
    }
    return INITIAL_ENGAGEMENTS;
  });

  const [activeEngagementId, setActiveEngagementId] = useState<string | null>(null);
  const [zoomedNodeId, setZoomedNodeId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(engagements));
    } catch (e) {
      console.error('Failed to save engagements to localStorage:', e);
    }
  }, [engagements]);

  // Derived stats
  const { engagementStats, globalStats } = useMemo(() => {
    return calculateStats(engagements);
  }, [engagements]);

  // Currently active engagement object
  const activeEngagement = useMemo(() => {
    return engagements.find((e) => e.id === activeEngagementId) || null;
  }, [engagements, activeEngagementId]);

  // Add Engagement
  const addEngagement = useCallback((title: string, description: string = '', color: string = '#6366f1') => {
    const newEngagement: Engagement = {
      id: `eng-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim() || 'Untitled Engagement',
      description: description.trim(),
      color,
      createdAt: new Date().toISOString(),
      rootNodes: [
        {
          id: `node-${Date.now()}-1`,
          text: 'First open loop for this engagement',
          completed: false,
          createdAt: new Date().toISOString(),
          children: [],
        },
      ],
    };

    setEngagements((prev) => [newEngagement, ...prev]);
    return newEngagement.id;
  }, []);

  // Update Engagement metadata
  const updateEngagement = useCallback((id: string, updates: Partial<Engagement>) => {
    setEngagements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  // Delete Engagement
  const deleteEngagement = useCallback((id: string) => {
    setEngagements((prev) => prev.filter((e) => e.id !== id));
    if (activeEngagementId === id) {
      setActiveEngagementId(null);
      setZoomedNodeId(null);
    }
  }, [activeEngagementId]);

  // Tree Node Operations
  const addNode = useCallback(
    (engagementId: string, afterNodeId: string | null, text: string = ''): string => {
      const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newNode: LoopNode = {
        id: newNodeId,
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        children: [],
      };

      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;

          if (!afterNodeId) {
            return {
              ...eng,
              rootNodes: [...eng.rootNodes, newNode],
            };
          }

          return {
            ...eng,
            rootNodes: insertNodeAfter(eng.rootNodes, afterNodeId, newNode),
          };
        })
      );

      return newNodeId;
    },
    []
  );

  const updateNodeText = useCallback(
    (engagementId: string, nodeId: string, text: string) => {
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          return {
            ...eng,
            rootNodes: updateNode(eng.rootNodes, nodeId, () => ({ text })),
          };
        })
      );
    },
    []
  );

  const updateNodeNote = useCallback(
    (engagementId: string, nodeId: string, note: string) => {
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          return {
            ...eng,
            rootNodes: updateNode(eng.rootNodes, nodeId, () => ({ note })),
          };
        })
      );
    },
    []
  );

  const toggleNodeCompletion = useCallback(
    (engagementId: string, nodeId: string) => {
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          return {
            ...eng,
            rootNodes: updateNode(eng.rootNodes, nodeId, (node) => {
              const nextCompleted = !node.completed;
              if (nextCompleted) {
                // Subtle celebratory micro-confetti
                try {
                  confetti({
                    particleCount: 28,
                    spread: 45,
                    origin: { y: 0.8 },
                    ticks: 120,
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                  });
                } catch {}
              }
              return {
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : null,
              };
            }),
          };
        })
      );
    },
    []
  );

  const toggleNodeCollapse = useCallback(
    (engagementId: string, nodeId: string) => {
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          return {
            ...eng,
            rootNodes: updateNode(eng.rootNodes, nodeId, (node) => ({
              collapsed: !node.collapsed,
            })),
          };
        })
      );
    },
    []
  );

  const indentNode = useCallback((engagementId: string, nodeId: string) => {
    setEngagements((prev) =>
      prev.map((eng) => {
        if (eng.id !== engagementId) return eng;
        return {
          ...eng,
          rootNodes: indentTreeNode(eng.rootNodes, nodeId),
        };
      })
    );
  }, []);

  const outdentNode = useCallback((engagementId: string, nodeId: string) => {
    setEngagements((prev) =>
      prev.map((eng) => {
        if (eng.id !== engagementId) return eng;
        return {
          ...eng,
          rootNodes: outdentTreeNode(eng.rootNodes, nodeId),
        };
      })
    );
  }, []);

  const moveNodeUp = useCallback((engagementId: string, nodeId: string) => {
    setEngagements((prev) =>
      prev.map((eng) => {
        if (eng.id !== engagementId) return eng;
        return {
          ...eng,
          rootNodes: moveTreeNodeUp(eng.rootNodes, nodeId),
        };
      })
    );
  }, []);

  const moveNodeDown = useCallback((engagementId: string, nodeId: string) => {
    setEngagements((prev) =>
      prev.map((eng) => {
        if (eng.id !== engagementId) return eng;
        return {
          ...eng,
          rootNodes: moveTreeNodeDown(eng.rootNodes, nodeId),
        };
      })
    );
  }, []);

  const moveNodeToPosition = useCallback(
    (
      engagementId: string,
      sourceId: string,
      targetId: string,
      position: 'before' | 'after' | 'inside'
    ) => {
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          return {
            ...eng,
            rootNodes: moveTreeNodeToPosition(eng.rootNodes, sourceId, targetId, position),
          };
        })
      );
    },
    []
  );

  const deleteNode = useCallback(
    (engagementId: string, nodeId: string): string | null => {
      let previousId: string | null = null;
      setEngagements((prev) =>
        prev.map((eng) => {
          if (eng.id !== engagementId) return eng;
          const res = deleteTreeNode(eng.rootNodes, nodeId);
          previousId = res.previousNodeId;
          return {
            ...eng,
            rootNodes: res.newNodes,
          };
        })
      );
      return previousId;
    },
    []
  );

  const resetToDemoData = useCallback(() => {
    setEngagements(INITIAL_ENGAGEMENTS);
    setActiveEngagementId(null);
    setZoomedNodeId(null);
    setSearchQuery('');
  }, []);

  const importEngagements = useCallback((newEngagements: Engagement[]) => {
    if (Array.isArray(newEngagements) && newEngagements.length > 0) {
      setEngagements(newEngagements);
      setActiveEngagementId(null);
      setZoomedNodeId(null);
    }
  }, []);

  return {
    engagements,
    activeEngagement,
    activeEngagementId,
    setActiveEngagementId,
    zoomedNodeId,
    setZoomedNodeId,
    hideCompleted,
    setHideCompleted,
    searchQuery,
    setSearchQuery,
    engagementStats,
    globalStats,
    // Actions
    addEngagement,
    updateEngagement,
    deleteEngagement,
    addNode,
    updateNodeText,
    updateNodeNote,
    toggleNodeCompletion,
    toggleNodeCollapse,
    indentNode,
    outdentNode,
    moveNodeUp,
    moveNodeDown,
    moveNodeToPosition,
    deleteNode,
    resetToDemoData,
    importEngagements,
  };
}

