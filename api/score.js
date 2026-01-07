export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = 'EmperorKunDis';
  const repo = 'WebProChalengeISS';

  if (req.method === 'POST') {
    const { name, score } = req.body;
    const timestamp = Date.now();
    const filename = `${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '')}.json`;
    const content = JSON.stringify({ name, score, time: timestamp });

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/scores/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Score: ${name} - ${score}`,
        content: Buffer.from(content).toString('base64')
      })
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
