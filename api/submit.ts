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

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { name, score } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid name' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid score' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedName = name.trim().substring(0, 20);
    const timestamp = Date.now();

    const entry: ScoreEntry = {
      name: sanitizedName,
      score,
      timestamp
    };

    await kv.zadd('leaderboard', {
      score: score,
      member: JSON.stringify(entry)
    });

    const rank = await kv.zrevrank('leaderboard', JSON.stringify(entry));

    return new Response(
      JSON.stringify({
        success: true,
        rank: rank !== null ? rank + 1 : null
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error submitting score:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to submit score' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
