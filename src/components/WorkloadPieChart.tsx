import React, { useState } from 'react';
import type { Engagement, EngagementStats } from '../types';
import { getEngagementIcon } from '../utils/engagementIcons';

interface WorkloadPieChartProps {
  engagements: Engagement[];
  engagementStats: EngagementStats[];
  totalOpenLoops: number;
  onSelectEngagement: (id: string) => void;
}

export const WorkloadPieChart: React.FC<WorkloadPieChartProps> = ({
  engagements,
  engagementStats,
  totalOpenLoops,
  onSelectEngagement,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const segments = engagements.map((eng) => {
    const stats = engagementStats.find((s) => s.id === eng.id);
    const openCount = stats?.openLoops || 0;
    const percentage = totalOpenLoops > 0 ? Math.round((openCount / totalOpenLoops) * 100) : 0;
    const RoleIcon = getEngagementIcon(eng.title, eng.id);
    return {
      id: eng.id,
      title: eng.title,
      color: eng.color,
      count: openCount,
      percentage,
      RoleIcon,
    };
  });

  const radius = 38;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Cumulative offsets for donut slices
  let accumulatedLength = 0;
  const slices = segments.map((seg) => {
    const fraction = totalOpenLoops > 0 ? seg.count / totalOpenLoops : 0;
    const length = fraction * circumference;
    const offset = -accumulatedLength;
    accumulatedLength += length;

    return {
      ...seg,
      length,
      offset,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredId);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
      {/* 1. Interactive SVG Donut Pie Chart */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          className="w-40 h-40 transform -rotate-90 filter drop-shadow-md"
          viewBox="0 0 100 100"
        >
          {/* Background circle track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-white/10"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            if (slice.count === 0) return null;
            const isHovered = hoveredId === slice.id;

            return (
              <circle
                key={slice.id}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${slice.length} ${circumference}`}
                strokeDashoffset={slice.offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                style={{
                  opacity: hoveredId ? (isHovered ? 1 : 0.45) : 0.95,
                  filter: isHovered ? 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' : 'none',
                }}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectEngagement(slice.id)}
              />
            );
          })}
        </svg>

        {/* Donut Center Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {activeSegment ? (
            <div className="animate-fade-in">
              <div
                className="text-xl font-black tracking-tight"
                style={{ color: activeSegment.color }}
              >
                {activeSegment.percentage}%
              </div>
              <div className="text-[10px] font-semibold text-zinc-300 truncate max-w-[80px]">
                {activeSegment.title.split(' ')[0]}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-black tracking-tight text-white">
                {totalOpenLoops}
              </div>
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Loops
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Legend Grid */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {segments.map((seg) => {
          const isHovered = hoveredId === seg.id;
          const { RoleIcon } = seg;

          return (
            <button
              key={seg.id}
              onClick={() => onSelectEngagement(seg.id)}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                isHovered
                  ? 'bg-white/15 border-white/30 shadow-md scale-[1.02]'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: seg.color }}
                >
                  <RoleIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[160px]">
                    {seg.title}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {seg.count} {seg.count === 1 ? 'loop' : 'loops'} open
                  </div>
                </div>
              </div>

              <div className="text-right pl-2 shrink-0">
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: isHovered ? '#ffffff' : seg.color }}
                >
                  {seg.percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
