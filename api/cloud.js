// In-memory cache across serverless requests
const cloudStore = new Map();

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let key = 'default';
  try {
    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    key = url.searchParams.get('key') || url.searchParams.get('pin') || 'default';
  } catch (e) {
    key = req.query?.key || req.query?.pin || 'default';
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      if (!body) {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const rawStr = Buffer.concat(buffers).toString();
        if (rawStr) {
          body = JSON.parse(rawStr);
        }
      }

      if (body) {
        cloudStore.set(key, body);

        // Background server-side persistence to cl1p.net
        try {
          fetch(`https://api.cl1p.net/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }).catch(() => {});
        } catch (e) {}

        return res.status(200).json({ success: true, key, timestamp: Date.now() });
      }

      return res.status(400).json({ success: false, error: 'No data provided' });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method === 'GET') {
    if (cloudStore.has(key)) {
      return res.status(200).json(cloudStore.get(key));
    }

    // Try reading from server-side cl1p.net backup
    try {
      const extRes = await fetch(`https://api.cl1p.net/${key}`);
      if (extRes.ok) {
        const text = await extRes.text();
        if (text && (text.includes('playerLevel') || text.includes('save') || text.includes('gold'))) {
          const parsed = JSON.parse(text);
          cloudStore.set(key, parsed);
          return res.status(200).json(parsed);
        }
      }
    } catch (e) {}

    return res.status(200).json({ success: false, notFound: true, message: 'No cloud record found yet' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
