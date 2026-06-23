const BBC_RSS_URL = 'https://feeds.bbci.co.uk/sport/football/rss.xml'

const WC_KEYWORDS = ['world cup', '2026', 'fifa']

function extractCdata(str) {
  const m = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return m ? m[1].trim() : str.trim()
}

function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`))
  if (!m) return ''
  return extractCdata(m[1])
}

function parseItems(xml) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const chunk = m[1]
    items.push({
      title:       getTag(chunk, 'title'),
      description: getTag(chunk, 'description'),
      link:        getTag(chunk, 'link') || getTag(chunk, 'guid'),
      pubDate:     getTag(chunk, 'pubDate'),
    })
  }
  return items
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const upstream = await fetch(BBC_RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; wc2026-dashboard/1.0)' },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'BBC RSS unavailable' })
    }

    const xml = await upstream.text()
    const items = parseItems(xml)

    const filtered = items.filter(item => {
      const text = `${item.title} ${item.description}`.toLowerCase()
      return WC_KEYWORDS.some(k => text.includes(k))
    })

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
    return res.status(200).json(filtered)
  } catch (err) {
    console.error('BBC RSS proxy error:', err)
    return res.status(500).json({ error: 'RSS unavailable' })
  }
}
