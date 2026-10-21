// Public view counter for /journal/<slug> pages, stored in Upstash Redis.
// POST /api/views?slug=<slug> counts a view and returns the total; GET only reads it.
// Needs the Upstash integration on the Vercel project (sets KV_REST_API_URL / KV_REST_API_TOKEN).
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|lighthouse|headless/i

async function redis(command, key) {
  const res = await fetch(`${URL}/${command}/${encodeURIComponent(key)}`, {
    headers: {Authorization: `Bearer ${TOKEN}`},
  })
  if (!res.ok) throw new Error(`Upstash ${command} failed: ${res.status}`)
  return (await res.json()).result
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const slug = String(req.query.slug || '')
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return res.status(400).json({error: 'Invalid slug'})
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'})
  if (!URL || !TOKEN) return res.status(503).json({error: 'View counter not configured'})

  try {
    const count = req.method === 'POST' && !BOT.test(req.headers['user-agent'] || '')
      ? await redis('incr', `views:${slug}`)
      : await redis('get', `views:${slug}`)
    res.status(200).json({views: Number(count) || 0})
  } catch (err) {
    console.error(err)
    res.status(502).json({error: 'View counter unavailable'})
  }
}
