export interface TimeblockEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  date: string;      // "2026-08-28"
  color: string;
  engagementId?: string;
  nodeId?: string;
  isExternalBusy?: boolean; // e.g. imported class or meeting from GCal
  gcalEventId?: string;
  completed?: boolean;
  checklist?: string[];
}

export interface GCalConfig {
  clientId: string;
  calendarName: string;
  calendarId?: string;
  isConnected: boolean;
  userEmail?: string;
  lastSyncedAt?: string;
}
