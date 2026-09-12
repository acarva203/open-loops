import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(302, { Location: `/?gcal_error=${encodeURIComponent(error || 'No code returned')}` });
    res.end();
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://${req.headers.host || 'localhost:5173'}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' }));
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const refreshToken = tokenData.refresh_token;

    // Set secure cookie with refresh_token so serverless cron and sync endpoints can use it
    const cookieHeader = [
      `gcal_refresh_token=${refreshToken || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      `gcal_connected=true; Path=/; SameSite=Lax; Max-Age=31536000`,
    ];

    res.writeHead(302, {
      Location: '/?gcal_connected=true',
      'Set-Cookie': cookieHeader,
    });
    res.end();
  } catch (err: any) {
    res.writeHead(302, {
      Location: `/?gcal_error=${encodeURIComponent(err.message || 'Token exchange failed')}`,
    });
    res.end();
  }
}
