import type { TimeblockEvent } from '../types/calendar';

declare global {
  interface Window {
    google?: any;
    tokenClient?: any;
  }
}

/**
 * Dynamically loads the Google Identity Services client script if not already present.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

/**
 * Requests OAuth token from Google for Calendar API access.
 */
export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error));
          } else {
            resolve(tokenResponse.access_token);
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Finds or creates a secondary Google Calendar named "Open Loops Focus".
 */
export async function getOrCreateFocusCalendar(accessToken: string, calendarTitle = 'Open Loops Focus'): Promise<string> {
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await listRes.json();

  const existing = data.items?.find((cal: any) => cal.summary === calendarTitle);
  if (existing) {
    return existing.id;
  }

  // Create new secondary calendar
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: calendarTitle,
      description: 'Dedicated focus blocks synced from Open Loops Tracker',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });

  const newCal = await createRes.json();
  return newCal.id;
}

/**
 * Pushes a TimeblockEvent to Google Calendar.
 */
export async function pushEventToGCal(
  accessToken: string,
  calendarId: string,
  block: TimeblockEvent
): Promise<string> {
  const startDateTime = `${block.date}T${block.startTime}:00`;
  const endDateTime = `${block.date}T${block.endTime}:00`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let fullDescription = block.description || '';
  if (block.checklist && block.checklist.length > 0) {
    fullDescription += '\n\nChecklist:\n' + block.checklist.map((c) => `[ ] ${c}`).join('\n');
  }

  const payload = {
    summary: block.title,
    description: fullDescription.trim(),
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    colorId: '9', // Blueberry / Indigo
  };

  const url = block.gcalEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${block.gcalEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  const method = block.gcalEventId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const created = await res.json();
  return created.id;
}

/**
 * Deletes an event from Google Calendar by its GCal event ID.
 */
export async function deleteEventFromGCal(
  accessToken: string,
  calendarId: string,
  gcalEventId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${gcalEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.status === 204 || res.ok;
  } catch (err) {
    console.error('Failed to delete event from Google Calendar:', err);
    return false;
  }
}


/**
 * Exports an array of TimeblockEvents into standard iCalendar (.ics) format
 * for 1-click import into Google Calendar or Apple Calendar.
 */
export function generateICS(events: TimeblockEvent[]): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatICSDate = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(year, month - 1, day, hours, minutes);
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      '00'
    );
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Loops Tracker//Timeblocking Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Open Loops Focus',
  ];

  for (const ev of events) {
    const dtStart = formatICSDate(ev.date, ev.startTime);
    const dtEnd = formatICSDate(ev.date, ev.endTime);
    let desc = ev.description || '';
    if (ev.checklist && ev.checklist.length > 0) {
      desc += '\\n\\nChecklist:\\n' + ev.checklist.map((item) => `- [ ] ${item}`).join('\\n');
    }

    ics.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@openloopstracker.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${ev.title.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
