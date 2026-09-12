import React, { useState } from 'react';
import { X, Download, Upload, FileText, Check } from 'lucide-react';
import type { Engagement } from '../types';
import { exportEngagementToMarkdown } from '../utils/treeUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagements: Engagement[];
  activeEngagement: Engagement | null;
  onImport: (engagements: Engagement[]) => void;
  onResetDemo: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  engagements,
  activeEngagement,
  onImport,
  onResetDemo,
}) => {
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(engagements, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `open-loops-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadMarkdown = () => {
    if (!activeEngagement) return;
    const md = exportEngagementToMarkdown(activeEngagement);
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${activeEngagement.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-outline.md`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    if (!activeEngagement) return;
    const md = exportEngagementToMarkdown(activeEngagement);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a JSON array of engagements');
      }
      onImport(parsed);
      onClose();
    } catch (e: any) {
      setImportError(e.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Data Management & Portability</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Backup, export, or import your engagements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Export section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              Export
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-500" />
                Export Full Backup (JSON)
              </button>

              {activeEngagement ? (
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Export Job as Markdown
                </button>
              ) : (
                <div className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 text-center">
                  (Zoom into a job to export its Markdown)
                </div>
              )}
            </div>

            {activeEngagement && (
              <div className="mt-2 text-right">
                <button
                  onClick={handleCopyMarkdown}
                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : null}
                  {copied ? 'Copied Markdown to clipboard!' : 'Copy Markdown to clipboard'}
                </button>
              </div>
            )}
          </div>

          {/* Import section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Import from Backup JSON
            </h4>
            <textarea
              rows={3}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste JSON backup content here..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {importError && (
              <p className="mt-1 text-xs text-red-500 font-medium">{importError}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleImportSubmit}
                disabled={!importJson.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-40 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Restore Data
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Need to reset back to starter sample jobs?</span>
            <button
              onClick={() => {
                if (window.confirm('Reset to initial sample engagements? Any unsaved custom data will be replaced.')) {
                  onResetDemo();
                  onClose();
                }
              }}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              Reset to Sample Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
