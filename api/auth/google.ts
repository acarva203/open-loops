import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://${req.headers.host || 'localhost:5173'}/api/auth/callback`;

  if (!clientId) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'GOOGLE_CLIENT_ID environment variable is missing on the server.',
      })
    );
    return;
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar',
  ].join(' ');

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // Requests persistent refresh_token
      prompt: 'consent',      // Forces refresh_token issuance
    }).toString();

  res.writeHead(302, { Location: authUrl });
  res.end();
}
