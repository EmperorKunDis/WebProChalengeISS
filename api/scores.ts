import { kv } from '@vercel/kv';

interface ScoreEntry {
  name: string;
  score: number;
  timestamp: number;
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawScores = await kv.zrange('leaderboard', 0, 9, { rev: true });

    const scores: ScoreEntry[] = (rawScores || []).map((item: unknown) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }
      return item;
    }).filter(Boolean);

    return new Response(
      JSON.stringify({ scores }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching scores:', error);
    return new Response(
      JSON.stringify({ scores: [], error: 'Failed to fetch scores' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
