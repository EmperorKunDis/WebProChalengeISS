// Jednoduche API pro zebricek - pouziva Upstash Redis
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  return res.json();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - nacist zebricek
    if (req.method === 'GET') {
      const data = await redis(['GET', 'snake_scores']);
      const scores = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json({ scores });
    }

    // POST - pridat skore
    if (req.method === 'POST') {
      const { name, score } = req.body;

      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
      }

      // Nacist aktualni
      const data = await redis(['GET', 'snake_scores']);
      const scores = data.result ? JSON.parse(data.result) : [];

      // Pridat nove
      scores.push({ name: name.substring(0, 20), score });

      // Seradit a vzit top 10
      scores.sort((a, b) => b.score - a.score);
      const top10 = scores.slice(0, 10);

      // Ulozit
      await redis(['SET', 'snake_scores', JSON.stringify(top10)]);

      return res.status(200).json({ success: true, scores: top10 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
}
