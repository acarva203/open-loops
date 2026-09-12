import { useState, useEffect, useCallback } from 'react';
import type { TimeblockEvent, GCalConfig } from '../types/calendar';
import type { LoopNode } from '../types';
import {
  getOrCreateFocusCalendar,
  pushEventToGCal,
  deleteEventFromGCal,
  generateICS,
} from '../services/gcalService';

const TIMEBLOCKS_STORAGE_KEY = 'open_loops_timeblocks_v1';
const GCAL_CONFIG_STORAGE_KEY = 'open_loops_gcal_config_v1';
const PENDING_DELETIONS_KEY = 'open_loops_gcal_pending_deletions_v1';

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const INITIAL_TIMEBLOCKS: TimeblockEvent[] = [
  {
    id: 'block-ext-1',
    title: 'ECS 150: Operating Systems (Lecture)',
    description: 'Bainer Hall 1062 - Kernel structures & memory paging',
    startTime: '09:00',
    endTime: '10:00',
    date: TODAY_DATE,
    color: '#64748b', // Slate
    isExternalBusy: true,
  },
  {
    id: 'block-ext-2',
    title: 'WiCS Officer Weekly Standup',
    description: 'Kearney Room / Zoom - GHC sponsorship updates & mentorship pairing',
    startTime: '11:00',
    endTime: '11:45',
    date: TODAY_DATE,
    color: '#f43f5e',
    isExternalBusy: true,
  },
  {
    id: 'block-focus-1',
    title: '[Stanford] Distributed Pipeline & GPU Profiling',
    description: 'Deep focus work on PyTorch memory bottlenecks and cluster ablation runs',
    startTime: '14:00',
    endTime: '15:30',
    date: TODAY_DATE,
    color: '#b91c1c',
    engagementId: 'eng-stanford',
    checklist: [
      'Profile GPU memory allocation and eliminate memory bottlenecks in PyTorch',
      'Run ablation baseline experiments on Stanford cluster compute nodes',
    ],
  },
];

export function useTimeblockingStore() {
  const [timeblocks, setTimeblocks] = useState<TimeblockEvent[]>(() => {
    try {
      const saved = localStorage.getItem(TIMEBLOCKS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_TIMEBLOCKS;
  });

  const [gcalConfig, setGcalConfig] = useState<GCalConfig>(() => {
    try {
      const saved = localStorage.getItem(GCAL_CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      clientId: '',
      calendarName: 'Open Loops Focus',
      isConnected: false,
    };
  });

  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Persist timeblocks
  useEffect(() => {
    try {
      localStorage.setItem(TIMEBLOCKS_STORAGE_KEY, JSON.stringify(timeblocks));
    } catch {}
  }, [timeblocks]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(GCAL_CONFIG_STORAGE_KEY, JSON.stringify(gcalConfig));
    } catch {}
  }, [gcalConfig]);

  // Helper to add minutes to HH:mm
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(endH)}:${pad(endM)}`;
  };

  // Queue an event to be deleted on next Google Calendar sync
  const queuePendingDeletion = useCallback((gcalEventId: string) => {
    try {
      const raw = localStorage.getItem(PENDING_DELETIONS_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      if (!existing.includes(gcalEventId)) {
        localStorage.setItem(PENDING_DELETIONS_KEY, JSON.stringify([...existing, gcalEventId]));
      }
    } catch {}
  }, []);

  // Schedule an open loop
  const scheduleLoop = useCallback(
    (
      engagementTitle: string,
      engagementColor: string,
      engagementId: string,
      node: LoopNode,
      startTime: string = '13:00',
      durationMinutes: number = 60
    ) => {
      const endTime = addMinutesToTime(startTime, durationMinutes);

      const checklist =
        node.children && node.children.length > 0
          ? node.children.map((c) => c.text)
          : undefined;

      const newBlock: TimeblockEvent = {
        id: `block-${Date.now()}`,
        title: `[${engagementTitle.split(' ')[0]}] ${node.text}`,
        description: node.note || '',
        startTime,
        endTime,
        date: TODAY_DATE,
        color: engagementColor,
        engagementId,
        nodeId: node.id,
        completed: node.completed,
        checklist,
      };

      setTimeblocks((prev) => [...prev, newBlock]);
      return newBlock;
    },
    []
  );

  // Remove timeblock and delete from Google Calendar if synced
  const removeTimeblock = useCallback(
    (id: string) => {
      const blockToDelete = timeblocks.find((b) => b.id === id);
      setTimeblocks((prev) => prev.filter((b) => b.id !== id));

      if (blockToDelete?.gcalEventId) {
        const eventId = blockToDelete.gcalEventId;
        const calId = gcalConfig.calendarId;

        if (activeToken && calId) {
          // Immediately delete from Google Calendar
          deleteEventFromGCal(activeToken, calId, eventId)
            .then((success) => {
              if (success) {
                setSyncStatus(`Deleted "${blockToDelete.title}" from Google Calendar`);
              }
            })
            .catch(() => {
              queuePendingDeletion(eventId);
            });
        } else {
          // Queue for deletion upon next sync
          queuePendingDeletion(eventId);
          if (gcalConfig.isConnected) {
            setSyncStatus(`Event queued for deletion on next Google Calendar sync`);
          }
        }
      }
    },
    [timeblocks, activeToken, gcalConfig.calendarId, gcalConfig.isConnected, queuePendingDeletion]
  );

  const updateDuration = useCallback((id: string, newDurationMinutes: number) => {
    setTimeblocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        const [h, m] = block.startTime.split(':').map(Number);
        const totalMinutes = h * 60 + m + newDurationMinutes;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return {
          ...block,
          endTime: `${pad(endH)}:${pad(endM)}`,
        };
      })
    );
  }, []);

  // Sync scheduled focus blocks to Google Calendar
  const syncWithGoogleCalendar = useCallback(
    async (accessToken: string) => {
      setIsSyncing(true);
      setActiveToken(accessToken);
      setSyncStatus('Connecting to Google Calendar...');

      try {
        const calId = await getOrCreateFocusCalendar(accessToken, gcalConfig.calendarName);
        setSyncStatus(`Syncing with "${gcalConfig.calendarName}"...`);

        // Process any queued deletions
        try {
          const rawPending = localStorage.getItem(PENDING_DELETIONS_KEY);
          if (rawPending) {
            const pendingIds: string[] = JSON.parse(rawPending);
            for (const pId of pendingIds) {
              await deleteEventFromGCal(accessToken, calId, pId);
            }
            localStorage.removeItem(PENDING_DELETIONS_KEY);
          }
        } catch (e) {
          console.error('Failed to process pending deletions:', e);
        }

        const focusBlocks = timeblocks.filter((b) => !b.isExternalBusy);
        const updatedBlocks = [...timeblocks];

        for (const block of focusBlocks) {
          const gcalEventId = await pushEventToGCal(accessToken, calId, block);
          const idx = updatedBlocks.findIndex((b) => b.id === block.id);
          if (idx !== -1) {
            updatedBlocks[idx] = { ...updatedBlocks[idx], gcalEventId };
          }
        }

        setTimeblocks(updatedBlocks);
        setGcalConfig((prev) => ({
          ...prev,
          isConnected: true,
          calendarId: calId,
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setSyncStatus(`Successfully synced ${focusBlocks.length} blocks to Google Calendar!`);
      } catch (err: any) {
        setSyncStatus(`Sync failed: ${err.message || 'Check network / Client ID'}`);
      } finally {
        setIsSyncing(false);
      }
    },
    [gcalConfig.calendarName, timeblocks]
  );

  // Export to .ics file for 1-click import into Google Calendar or Apple Calendar
  const downloadICS = useCallback(() => {
    const icsContent = generateICS(timeblocks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `open-loops-focus-${TODAY_DATE}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [timeblocks]);

  return {
    timeblocks,
    gcalConfig,
    setGcalConfig,
    isSyncing,
    syncStatus,
    scheduleLoop,
    removeTimeblock,
    updateDuration,
    syncWithGoogleCalendar,
    downloadICS,
  };
}
