import type { IncomingMessage, ServerResponse } from 'http';
import { neon } from '@neondatabase/serverless';

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const databaseUrl = process.env.DATABASE_URL;

  // If no DATABASE_URL configured, return informative response
  if (!databaseUrl) {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          source: 'local',
          message: 'No DATABASE_URL configured. Client will use local IndexedDB/localStorage storage.',
        })
      );
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        source: 'local',
        message: 'Saved locally. Add DATABASE_URL in Vercel to activate cloud Postgres sync.',
      })
    );
    return;
  }

  try {
    const sql = neon(databaseUrl);

    // Ensure durable schema exists
    await sql`
      CREATE TABLE IF NOT EXISTS open_loops_data (
        user_id TEXT PRIMARY KEY,
        engagements JSONB NOT NULL,
        timeblocks JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 1. GET Request -> Fetch cloud data
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT engagements, timeblocks, updated_at 
        FROM open_loops_data 
        WHERE user_id = 'default_user'
      `;

      if (rows.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ source: 'database', found: false, data: null }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          source: 'database',
          found: true,
          data: {
            engagements: rows[0].engagements,
            timeblocks: rows[0].timeblocks,
            updatedAt: rows[0].updated_at,
          },
        })
      );
      return;
    }

    // 2. POST Request -> Save/Sync cloud data
    if (req.method === 'POST') {
      const payload = await parseRequestBody(req);
      const { engagements, timeblocks } = payload;

      if (!engagements) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing engagements payload' }));
        return;
      }

      await sql`
        INSERT INTO open_loops_data (user_id, engagements, timeblocks, updated_at)
        VALUES (
          'default_user', 
          ${JSON.stringify(engagements)}::jsonb, 
          ${JSON.stringify(timeblocks || [])}::jsonb, 
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          engagements = EXCLUDED.engagements,
          timeblocks = EXCLUDED.timeblocks,
          updated_at = CURRENT_TIMESTAMP
      `;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          source: 'database',
          success: true,
          savedAt: new Date().toISOString(),
        })
      );
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err: any) {
    console.error('Durable database storage error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: err.message || 'Failed to interact with durable database',
      })
    );
  }
}
