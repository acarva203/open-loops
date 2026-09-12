export interface LoopNode {
  id: string;
  text: string;
  note?: string;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  collapsed?: boolean;
  children: LoopNode[];
}

export interface Engagement {
  id: string;
  title: string;
  description?: string;
  color: string;
  createdAt: string;
  rootNodes: LoopNode[];
}

export interface EngagementStats {
  id: string;
  title: string;
  color: string;
  totalLoops: number;
  openLoops: number;
  completedLoops: number;
}

export interface GlobalStats {
  totalEngagements: number;
  totalLoops: number;
  totalOpenLoops: number;
  totalCompletedLoops: number;
}

export type ViewMode = 'dashboard' | 'focus';
