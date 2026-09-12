import type { LoopNode, Engagement, EngagementStats, GlobalStats } from '../types';

/**
 * Recursively counts total, open, and completed loops in a node tree.
 */
export function countLoops(nodes: LoopNode[]): { total: number; open: number; completed: number } {
  let total = 0;
  let open = 0;
  let completed = 0;

  function traverse(list: LoopNode[]) {
    for (const node of list) {
      total++;
      if (node.completed) {
        completed++;
      } else {
        open++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return { total, open, completed };
}

/**
 * Calculates stats for each engagement and global totals.
 */
export function calculateStats(engagements: Engagement[]): {
  engagementStats: EngagementStats[];
  globalStats: GlobalStats;
} {
  let totalLoops = 0;
  let totalOpenLoops = 0;
  let totalCompletedLoops = 0;

  const engagementStats = engagements.map((eng) => {
    const counts = countLoops(eng.rootNodes);
    totalLoops += counts.total;
    totalOpenLoops += counts.open;
    totalCompletedLoops += counts.completed;

    return {
      id: eng.id,
      title: eng.title,
      color: eng.color,
      totalLoops: counts.total,
      openLoops: counts.open,
      completedLoops: counts.completed,
    };
  });

  return {
    engagementStats,
    globalStats: {
      totalEngagements: engagements.length,
      totalLoops,
      totalOpenLoops,
      totalCompletedLoops,
    },
  };
}

/**
 * Recursively finds a node by ID.
 */
export function findNode(nodes: LoopNode[], id: string): LoopNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the trail of nodes from top-level down to the target node ID (useful for breadcrumbs).
 */
export function findNodePath(nodes: LoopNode[], targetId: string): LoopNode[] {
  function search(currentNodes: LoopNode[], path: LoopNode[]): LoopNode[] | null {
    for (const node of currentNodes) {
      const currentPath = [...path, node];
      if (node.id === targetId) return currentPath;
      if (node.children && node.children.length > 0) {
        const found = search(node.children, currentPath);
        if (found) return found;
      }
    }
    return null;
  }

  return search(nodes, []) || [];
}

/**
 * Immutably updates a node by ID.
 */
export function updateNode(
  nodes: LoopNode[],
  id: string,
  updater: (node: LoopNode) => Partial<LoopNode>
): LoopNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      const updates = updater(node);
      return { ...node, ...updates };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNode(node.children, id, updater),
      };
    }
    return node;
  });
}

/**
 * Inserts a new node directly after the target node at the same hierarchical level.
 */
export function insertNodeAfter(
  nodes: LoopNode[],
  targetId: string,
  newNode: LoopNode
): LoopNode[] {
  const result: LoopNode[] = [];

  for (const node of nodes) {
    result.push(node);
    if (node.id === targetId) {
      result.push(newNode);
    } else if (node.children && node.children.length > 0) {
      const updatedChildren = insertNodeAfter(node.children, targetId, newNode);
      result[result.length - 1] = {
        ...node,
        children: updatedChildren,
      };
    }
  }

  return result;
}

/**
 * Inserts a new node as the first child of parentId.
 */
export function insertNodeAsFirstChild(
  nodes: LoopNode[],
  parentId: string,
  newNode: LoopNode
): LoopNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        collapsed: false,
        children: [newNode, ...node.children],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: insertNodeAsFirstChild(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

/**
 * Deletes a node and provides the ID of the node that was immediately before it (for cursor focus).
 */
export function deleteNode(
  nodes: LoopNode[],
  targetId: string
): { newNodes: LoopNode[]; previousNodeId: string | null } {
  let prevId: string | null = null;
  let foundPrev = false;

  function traverse(list: LoopNode[]): LoopNode[] {
    const nextList: LoopNode[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      if (item.id === targetId) {
        if (i > 0) {
          // The item right above it at the same level
          // If that previous sibling has visible children, focus its deepest descendant
          prevId = getDeepestLastDescendant(list[i - 1]).id;
        }
        foundPrev = true;
        continue; // skip this item
      }

      if (!foundPrev) {
        prevId = item.id;
      }

      if (item.children && item.children.length > 0) {
        const updatedChildren = traverse(item.children);
        nextList.push({ ...item, children: updatedChildren });
      } else {
        nextList.push(item);
      }
    }

    return nextList;
  }

  const newNodes = traverse(nodes);
  return { newNodes, previousNodeId: prevId };
}

function getDeepestLastDescendant(node: LoopNode): LoopNode {
  if (!node.collapsed && node.children && node.children.length > 0) {
    return getDeepestLastDescendant(node.children[node.children.length - 1]);
  }
  return node;
}

/**
 * Indent: Makes the target node the last child of its preceding sibling.
 */
export function indentNode(nodes: LoopNode[], targetId: string): LoopNode[] {
  function processList(list: LoopNode[]): { updatedList: LoopNode[]; moved: boolean } {
    const idx = list.findIndex((n) => n.id === targetId);

    if (idx > 0) {
      const targetNode = list[idx];
      const prevSibling = list[idx - 1];

      const updatedPrevSibling: LoopNode = {
        ...prevSibling,
        collapsed: false,
        children: [...(prevSibling.children || []), targetNode],
      };

      const newList = [...list.slice(0, idx - 1), updatedPrevSibling, ...list.slice(idx + 1)];
      return { updatedList: newList, moved: true };
    }

    // Otherwise check in children
    let anyMoved = false;
    const updatedList = list.map((node) => {
      if (node.children && node.children.length > 0) {
        const childRes = processList(node.children);
        if (childRes.moved) {
          anyMoved = true;
          return { ...node, children: childRes.updatedList };
        }
      }
      return node;
    });

    return { updatedList, moved: anyMoved };
  }

  return processList(nodes).updatedList;
}

/**
 * Outdent: Moves node up one level, placing it right after its parent.
 */
export function outdentNode(nodes: LoopNode[], targetId: string): LoopNode[] {
  // If target is already at top level, cannot outdent
  if (nodes.some((n) => n.id === targetId)) {
    return nodes;
  }

  function processParent(parent: LoopNode): {
    updatedChildren: LoopNode[];
    extractedNode: LoopNode | null;
  } {
    const childIdx = parent.children.findIndex((c) => c.id === targetId);
    if (childIdx !== -1) {
      const targetNode = parent.children[childIdx];
      const newChildren = [
        ...parent.children.slice(0, childIdx),
        ...parent.children.slice(childIdx + 1),
      ];
      return { updatedChildren: newChildren, extractedNode: targetNode };
    }

    let foundNode: LoopNode | null = null;
    const newChildren = parent.children.map((child) => {
      if (child.children && child.children.length > 0) {
        const res = processParent(child);
        if (res.extractedNode) {
          foundNode = res.extractedNode;
          // Place extractedNode immediately after child!
          return { ...child, children: res.updatedChildren };
        }
      }
      return child;
    });

    if (foundNode) {
      // Insert right after the child that contained it
      const childContainerIdx = parent.children.findIndex((c) =>
        c.children.some((sub) => sub.id === targetId || isDescendant(sub, targetId))
      );
      if (childContainerIdx !== -1) {
        newChildren.splice(childContainerIdx + 1, 0, foundNode);
        return { updatedChildren: newChildren, extractedNode: null };
      }
    }

    return { updatedChildren: newChildren, extractedNode: null };
  }

  function isDescendant(node: LoopNode, id: string): boolean {
    if (node.id === id) return true;
    return node.children.some((c) => isDescendant(c, id));
  }

  // Top level search
  const result: LoopNode[] = [];

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const res = processParent(node);
      result.push({ ...node, children: res.updatedChildren });
      if (res.extractedNode) {
        result.push(res.extractedNode);
      }
    } else {
      result.push(node);
    }
  }

  return result;
}

/**
 * Returns a linear flattened list of visible nodes (ignoring collapsed children)
 * for smooth keyboard up/down navigation.
 */
export function getFlattenedVisibleNodes(
  nodes: LoopNode[],
  hideCompleted: boolean = false
): { id: string; node: LoopNode; depth: number }[] {
  const list: { id: string; node: LoopNode; depth: number }[] = [];

  function traverse(items: LoopNode[], depth: number) {
    for (const item of items) {
      if (hideCompleted && item.completed) {
        continue;
      }
      list.push({ id: item.id, node: item, depth });
      if (!item.collapsed && item.children && item.children.length > 0) {
        traverse(item.children, depth + 1);
      }
    }
  }

  traverse(nodes, 0);
  return list;
}

/**
 * Extracts hashtags (#tag) and mentions (@person) from string.
 */
export function extractTags(text: string): { tags: string[]; mentions: string[] } {
  const tagMatches = text.match(/#[a-zA-Z0-9_\-]+/g) || [];
  const mentionMatches = text.match(/@[a-zA-Z0-9_\-]+/g) || [];
  return {
    tags: Array.from(new Set(tagMatches)),
    mentions: Array.from(new Set(mentionMatches)),
  };
}

/**
 * Export engagement to clean Markdown outliner text.
 */
export function exportEngagementToMarkdown(engagement: Engagement): string {
  let md = `# ${engagement.title}\n\n`;
  if (engagement.description) {
    md += `> ${engagement.description}\n\n`;
  }

  function printNodes(nodes: LoopNode[], indent: number) {
    const spaces = '  '.repeat(indent);
    for (const node of nodes) {
      const checkbox = node.completed ? '[x]' : '[ ]';
      md += `${spaces}- ${checkbox} ${node.text}\n`;
      if (node.note && node.note.trim()) {
        md += `${spaces}  ${node.note.trim()}\n`;
      }
      if (node.children && node.children.length > 0) {
        printNodes(node.children, indent + 1);
      }
    }
  }

  printNodes(engagement.rootNodes, 0);
  return md;
}

/**
 * Swaps a node with its previous sibling at the same tree level.
 */
export function moveNodeUp(nodes: LoopNode[], targetId: string): LoopNode[] {
  function processList(list: LoopNode[]): { list: LoopNode[]; moved: boolean } {
    const idx = list.findIndex((n) => n.id === targetId);
    if (idx > 0) {
      const next = [...list];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return { list: next, moved: true };
    }

    let anyMoved = false;
    const updated = list.map((node) => {
      if (node.children && node.children.length > 0) {
        const res = processList(node.children);
        if (res.moved) {
          anyMoved = true;
          return { ...node, children: res.list };
        }
      }
      return node;
    });

    return { list: updated, moved: anyMoved };
  }

  return processList(nodes).list;
}

/**
 * Swaps a node with its next sibling at the same tree level.
 */
export function moveNodeDown(nodes: LoopNode[], targetId: string): LoopNode[] {
  function processList(list: LoopNode[]): { list: LoopNode[]; moved: boolean } {
    const idx = list.findIndex((n) => n.id === targetId);
    if (idx !== -1 && idx < list.length - 1) {
      const next = [...list];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return { list: next, moved: true };
    }

    let anyMoved = false;
    const updated = list.map((node) => {
      if (node.children && node.children.length > 0) {
        const res = processList(node.children);
        if (res.moved) {
          anyMoved = true;
          return { ...node, children: res.list };
        }
      }
      return node;
    });

    return { list: updated, moved: anyMoved };
  }

  return processList(nodes).list;
}

/**
 * Moves a source node before, after, or inside a target node (for drag and drop).
 */
export function moveNodeToPosition(
  nodes: LoopNode[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): LoopNode[] {
  if (sourceId === targetId) return nodes;

  let extracted: LoopNode | null = null;

  function remove(list: LoopNode[]): LoopNode[] {
    const next: LoopNode[] = [];
    for (const item of list) {
      if (item.id === sourceId) {
        extracted = item;
        continue;
      }
      if (item.children && item.children.length > 0) {
        next.push({ ...item, children: remove(item.children) });
      } else {
        next.push(item);
      }
    }
    return next;
  }

  const cleaned = remove(nodes);
  if (!extracted) return nodes;

  const nodeToInsert: LoopNode = extracted;

  function insert(list: LoopNode[]): LoopNode[] {
    const next: LoopNode[] = [];
    for (const item of list) {
      if (item.id === targetId) {
        if (position === 'before') {
          next.push(nodeToInsert, item);
        } else if (position === 'after') {
          next.push(item, nodeToInsert);
        } else if (position === 'inside') {
          next.push({
            ...item,
            collapsed: false,
            children: [nodeToInsert, ...(item.children || [])],
          });
        }
        continue;
      }

      if (item.children && item.children.length > 0) {
        next.push({ ...item, children: insert(item.children) });
      } else {
        next.push(item);
      }
    }
    return next;
  }

  return insert(cleaned);
}

