import React, { useState } from 'react';
import {
  X,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Download,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { GCalConfig } from '../types/calendar';
import { requestGoogleAccessToken } from '../services/gcalService';

interface GCalConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GCalConfig;
  onSaveConfig: (config: GCalConfig) => void;
  onSync: (token: string) => Promise<void>;
  onDownloadICS: () => void;
  isSyncing: boolean;
  syncStatus: string | null;
}

export const GCalConnectModal: React.FC<GCalConnectModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSync,
  onDownloadICS,
  isSyncing,
  syncStatus,
}) => {
  const [clientId, setClientId] = useState(config.clientId || '');
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!clientId.trim()) {
      setError('Please provide a Google Client ID to connect.');
      return;
    }

    setError(null);
    try {
      onSaveConfig({ ...config, clientId: clientId.trim() });
      const token = await requestGoogleAccessToken(clientId.trim());
      await onSync(token);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Google Calendar Sync
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sync focus timeblocks to a dedicated GCal calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Status Badge */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-semibold">
                {config.isConnected ? 'Linked to Google Calendar' : 'Using Local Simulation Mode'}
              </span>
            </div>

            {config.lastSyncedAt && (
              <span className="text-[11px] text-zinc-400">
                Last synced: {config.lastSyncedAt}
              </span>
            )}
          </div>

          {/* Automated Daily Cron Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Zero-Prompt Background Cron (Daily Sync)</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Authorize once to enable automated serverless sync with persistent refresh tokens.
              </div>
            </div>
            <a
              href="/api/auth/google"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <span>Authorize 1-Time</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Sync Status Banner */}
          {syncStatus && (
            <div className="text-xs px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
              {syncStatus}
            </div>
          )}

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Dedicated Calendar Info */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Target Calendar Name
            </label>
            <input
              type="text"
              readOnly
              value={config.calendarName}
              className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Created as a clean secondary calendar on your Google account so your main calendar stays uncluttered.
            </p>
          </div>

          {/* Client ID field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Google OAuth Client ID (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[11px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3 h-3" />
                {showInstructions ? 'Hide setup guide' : 'How to get one?'}
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Setup Guide Accordion */}
          {showInstructions && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                Quick 2-minute Google Cloud Setup:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console &gt; Credentials</a></li>
                <li>Create an <strong>OAuth Client ID</strong> (Application type: <em>Web application</em>).</li>
                <li>Add <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded">http://localhost:5173</code> to <strong>Authorized JavaScript origins</strong>.</li>
                <li>Enable the <strong>Google Calendar API</strong> under Enabled APIs.</li>
                <li>Paste your Client ID above and click Connect!</li>
              </ol>
            </div>
          )}

          {/* Alternative: Instant iCalendar .ics Download */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No Google setup? Use 1-Click .ICS
              </div>
              <div className="text-[11px] text-zinc-400">
                Download and open with Google Calendar or Apple Calendar
              </div>
            </div>
            <button
              type="button"
              onClick={onDownloadICS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              Download .ICS
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Google Calendar
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            >
              Done
            </button>
            <button
              onClick={handleConnect}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Connect & Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
