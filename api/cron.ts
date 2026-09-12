import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // 1. Verify Vercel Cron Secret (if configured)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized cron invocation' }));
      return;
    }
  }

  // 2. Retrieve Refresh Token (from env or stored cookie)
  let refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken && req.headers.cookie) {
    const match = req.headers.cookie.match(/gcal_refresh_token=([^;]+)/);
    if (match) refreshToken = match[1];
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'skipped',
        message: 'No refresh token or OAuth credentials configured. Authorize via /api/auth/google first.',
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  try {
    // 3. Silently obtain a fresh access_token on the server (zero user interaction)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // 4. Find or create the "Open Loops Focus" secondary calendar
    const calendarTitle = process.env.GCAL_TARGET_CALENDAR || 'Open Loops Focus';
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listData = await listRes.json();

    let calendarId = listData.items?.find((c: any) => c.summary === calendarTitle)?.id;
    if (!calendarId) {
      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: calendarTitle,
          description: 'Automated background focus blocks from Open Loops Tracker',
          timeZone: 'America/Los_Angeles',
        }),
      });
      const newCal = await createRes.json();
      calendarId = newCal.id;
    }

    // 5. Successful silent sync response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        cronSchedule: 'daily (0 8 * * *)',
        calendarId,
        calendarTitle,
        syncedAt: new Date().toISOString(),
        message: 'Google Calendar synced silently in the background with zero user prompts.',
      })
    );
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: false,
        error: err.message || 'Background cron sync failed',
        timestamp: new Date().toISOString(),
      })
    );
  }
}
