import { useState, useEffect } from 'react';
import { useEngagementsStore } from './hooks/useEngagementsStore';
import { useTimeblockingStore } from './hooks/useTimeblockingStore';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { FocusOutliner } from './components/FocusOutliner';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ExportModal } from './components/ExportModal';
import { TimeblockingDrawer } from './components/TimeblockingDrawer';
import { GCalConnectModal } from './components/GCalConnectModal';
import type { Engagement, LoopNode } from './types';

export function App() {
  const {
    engagements,
    activeEngagement,
    setActiveEngagementId,
    zoomedNodeId,
    setZoomedNodeId,
    hideCompleted,
    setHideCompleted,
    globalStats,
    engagementStats,
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
  } = useEngagementsStore();

  const {
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
  } = useTimeblockingStore();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('open_loops_dark_mode');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTimeblockingOpen, setIsTimeblockingOpen] = useState(false);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('open_loops_dark_mode', JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  // Global keyboard shortcuts (e.g. "?" for shortcuts modal, Escape to go back, Cmd+/ for Timeblocks)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if (!isInput && e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsTimeblockingOpen((prev) => !prev);
      }

      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isExportOpen) {
          setIsExportOpen(false);
        } else if (isGCalModalOpen) {
          setIsGCalModalOpen(false);
        } else if (isTimeblockingOpen) {
          setIsTimeblockingOpen(false);
        } else if (zoomedNodeId) {
          setZoomedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isExportOpen, isGCalModalOpen, isTimeblockingOpen, zoomedNodeId]);

  const handleQuickSchedule = (engagement: Engagement, node: LoopNode) => {
    // Schedule into a free afternoon slot or 13:00
    scheduleLoop(engagement.title, engagement.color, engagement.id, node, '13:00', 60);
    setIsTimeblockingOpen(true);
  };

  const scheduledFocusCount = timeblocks.filter((b) => !b.isExternalBusy).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Header */}
      <Header
        globalStats={globalStats}
        activeEngagement={activeEngagement}
        onBackToDashboard={() => {
          setActiveEngagementId(null);
          setZoomedNodeId(null);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onToggleTimeblocking={() => setIsTimeblockingOpen(!isTimeblockingOpen)}
        timeblockCount={scheduledFocusCount}
      />

      {/* Main Content Area: Dashboard View or Focus Outliner View */}
      <main className="w-full">
        {activeEngagement ? (
          <FocusOutliner
            engagement={activeEngagement}
            zoomedNodeId={zoomedNodeId}
            hideCompleted={hideCompleted}
            onToggleHideCompleted={() => setHideCompleted(!hideCompleted)}
            onZoom={setZoomedNodeId}
            onBackToDashboard={() => {
              setActiveEngagementId(null);
              setZoomedNodeId(null);
            }}
            onAddNode={addNode}
            onUpdateText={updateNodeText}
            onUpdateNote={updateNodeNote}
            onToggleComplete={toggleNodeCompletion}
            onToggleCollapse={toggleNodeCollapse}
            onIndent={indentNode}
            onOutdent={outdentNode}
            onMoveNodeUp={moveNodeUp}
            onMoveNodeDown={moveNodeDown}
            onMoveNodeToPosition={moveNodeToPosition}
            onDelete={deleteNode}
            onQuickSchedule={handleQuickSchedule}
          />
        ) : (
          <DashboardView
            engagements={engagements}
            engagementStats={engagementStats}
            globalStats={globalStats}
            totalFocusMinutes={timeblocks
              .filter((b) => !b.isExternalBusy)
              .reduce((acc, b) => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                return acc + (eh * 60 + em - (sh * 60 + sm));
              }, 0)}
            onSelectEngagement={(id) => {
              setActiveEngagementId(id);
              setZoomedNodeId(null);
            }}
            onAddEngagement={addEngagement}
            onUpdateEngagement={updateEngagement}
            onDeleteEngagement={deleteEngagement}
            onQuickAddNode={(engId, text) => addNode(engId, null, text)}
          />
        )}
      </main>

      {/* Timeblocking Drawer */}
      <TimeblockingDrawer
        isOpen={isTimeblockingOpen}
        onClose={() => setIsTimeblockingOpen(false)}
        timeblocks={timeblocks}
        engagements={engagements}
        gcalConfig={gcalConfig}
        onOpenGCalModal={() => setIsGCalModalOpen(true)}
        onScheduleLoop={scheduleLoop}
        onRemoveBlock={removeTimeblock}
        onUpdateDuration={updateDuration}
        onDownloadICS={downloadICS}
      />

      {/* Google Calendar Connect & Sync Modal */}
      <GCalConnectModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        config={gcalConfig}
        onSaveConfig={setGcalConfig}
        onSync={syncWithGoogleCalendar}
        onDownloadICS={downloadICS}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
      />

      {/* Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Export & Import Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        engagements={engagements}
        activeEngagement={activeEngagement}
        onImport={importEngagements}
        onResetDemo={resetToDemoData}
      />
    </div>
  );
}

export default App;
