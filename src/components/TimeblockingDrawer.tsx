import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Lock,
  Sparkles,
  Plus,
  ListChecks,
} from 'lucide-react';
import type { TimeblockEvent, GCalConfig } from '../types/calendar';
import type { Engagement, LoopNode } from '../types';

interface TimeblockingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  timeblocks: TimeblockEvent[];
  engagements: Engagement[];
  gcalConfig: GCalConfig;
  onOpenGCalModal: () => void;
  onScheduleLoop: (
    engagementTitle: string,
    engagementColor: string,
    engagementId: string,
    node: LoopNode,
    startTime: string,
    durationMinutes: number
  ) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateDuration: (id: string, minutes: number) => void;
  onDownloadICS: () => void;
}

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export const TimeblockingDrawer: React.FC<TimeblockingDrawerProps> = ({
  isOpen,
  onClose,
  timeblocks,
  engagements,
  gcalConfig,
  onOpenGCalModal,
  onScheduleLoop,
  onRemoveBlock,
  onUpdateDuration,
  onDownloadICS,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  if (!isOpen) return null;

  const todayDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Calculate total focus time today in minutes
  const totalFocusMinutes = timeblocks
    .filter((b) => !b.isExternalBusy)
    .reduce((acc, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      return acc + (eh * 60 + em - (sh * 60 + sm));
    }, 0);

  const focusHoursStr = `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`;

  // Collect all active open loops from across all 6 engagements
  const allActiveLoops: { engagement: Engagement; node: LoopNode }[] = [];
  engagements.forEach((eng) => {
    function collect(nodes: LoopNode[]) {
      for (const n of nodes) {
        if (!n.completed) {
          allActiveLoops.push({ engagement: eng, node: n });
        }
        if (n.children) collect(n.children);
      }
    }
    collect(eng.rootNodes);
  });

  const handlePickLoopForSlot = (item: { engagement: Engagement; node: LoopNode }) => {
    if (!selectedSlot) return;
    onScheduleLoop(
      item.engagement.title,
      item.engagement.color,
      item.engagement.id,
      item.node,
      selectedSlot,
      selectedDuration
    );
    setSelectedSlot(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-2xs animate-fade-in">
      <div
        className="w-full max-w-md h-full bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between text-zinc-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                Today's Timeblocks
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {todayDisplay} • <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{focusHoursStr} focused</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenGCalModal}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                gcalConfig.isConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
              title="Google Calendar Connection Settings"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${gcalConfig.isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>{gcalConfig.isConnected ? 'GCal Synced' : 'Sync GCal'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Timeline Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {HOURS.map((hour) => {
            // Find blocks in this hour range
            const matchingBlocks = timeblocks.filter((b) => {
              const startH = b.startTime.split(':')[0];
              const hourH = hour.split(':')[0];
              return startH === hourH;
            });

            return (
              <div key={hour} className="group relative flex items-start gap-3 min-h-[56px]">
                {/* Time Label */}
                <div className="w-12 text-right text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 pt-1 shrink-0">
                  {hour}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-1 space-y-2">
                  {matchingBlocks.length > 0 ? (
                    matchingBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`relative rounded-xl p-3 border transition-all ${
                          block.isExternalBusy
                            ? 'bg-zinc-100/70 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            : 'bg-white dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700 shadow-xs hover:shadow-md'
                        }`}
                      >
                        {/* Colored Left Accent */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                          style={{ backgroundColor: block.color }}
                        />

                        <div className="pl-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {block.isExternalBusy ? (
                                  <Lock className="w-3 h-3 text-zinc-400" />
                                ) : (
                                  <Clock className="w-3 h-3 text-indigo-500" />
                                )}
                                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                                  {block.startTime} – {block.endTime}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 truncate">
                                {block.title}
                              </h4>
                              {block.description && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                                  {block.description}
                                </p>
                              )}
                            </div>

                            {/* Actions for focus blocks */}
                            {!block.isExternalBusy && (
                              <button
                                onClick={() => onRemoveBlock(block.id)}
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                title="Remove timeblock"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Checklist preview */}
                          {block.checklist && block.checklist.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-700/60 space-y-1">
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                                <ListChecks className="w-3 h-3 text-indigo-500" />
                                <span>Checklist ({block.checklist.length})</span>
                              </div>
                              {block.checklist.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 truncate"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                  <span className="truncate">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Duration Pills */}
                          {!block.isExternalBusy && (
                            <div className="mt-2 pt-1 flex items-center gap-1">
                              {[30, 45, 60, 90].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => onUpdateDuration(block.id, mins)}
                                  className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Empty Hour Slot */
                    <button
                      onClick={() => setSelectedSlot(hour)}
                      className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-zinc-700 transition-all flex items-center gap-1.5 group/slot"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-300 group-hover/slot:text-indigo-500" />
                      <span className="text-[11px] font-medium">Free focus window • Click to schedule loop</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loop Picker Drawer/Popover when a slot is clicked */}
        {selectedSlot && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 animate-slide-up max-h-[45vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Schedule Loop at {selectedSlot}
                </span>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[11px] text-zinc-400">Duration:</span>
              {[30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedDuration(mins)}
                  className={`px-2 py-0.5 rounded-md text-xs font-mono transition-colors ${
                    selectedDuration === mins
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* List of active loops from 6 engagements */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {allActiveLoops.length === 0 ? (
                <p className="text-xs italic text-zinc-400 py-2">No open loops available to schedule.</p>
              ) : (
                allActiveLoops.map(({ engagement, node }) => (
                  <button
                    key={node.id}
                    onClick={() => handlePickLoopForSlot({ engagement, node })}
                    className="w-full text-left p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 transition-all flex items-start gap-2 group/pick"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: engagement.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                        {engagement.title}
                      </div>
                      <div className="text-xs font-medium text-zinc-800 dark:text-zinc-100 group-hover/pick:text-indigo-600 dark:group-hover/pick:text-indigo-400 truncate">
                        {node.text}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
          <button
            onClick={onDownloadICS}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Export Day as .ICS
          </button>
          <button
            onClick={onOpenGCalModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            Google Calendar Sync
          </button>
        </div>
      </div>
    </div>
  );
};
