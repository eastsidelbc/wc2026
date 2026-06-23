const SOURCES = [
  {
    name: 'BBC Sport',
    url:  'https://feeds.bbci.co.uk/sport/football/rss.xml',
  },
  {
    name: 'ESPN',
    url:  'https://www.espn.com/espn/rss/soccer/news',
  },
]

// BBC article URLs live in <guid>, not <link>
function extractCdata(str) {
  const m = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return m ? m[1].trim() : str.trim()
}

function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`))
  if (!m) return ''
  return extractCdata(m[1])
}

function parseItems(xml, sourceName) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const chunk = m[1]
    const link  = getTag(chunk, 'link')
    const guid  = getTag(chunk, 'guid')
    const desc  = getTag(chunk, 'description')
    items.push({
      source:      sourceName,
      title:       getTag(chunk, 'title'),
      description: desc === 'null' ? '' : desc,
      link:        link || (guid.startsWith('http') ? guid : ''),
      pubDate:     getTag(chunk, 'pubDate'),
    })
  }
  return items
}

// During the World Cup the football RSS is dominated by WC content.
// Only filter out obvious non-WC topics (club transfers, domestic leagues).
const EXCLUDE_KEYWORDS = ['premier league', 'champions league', 'la liga', 'serie a', 'bundesliga', 'transfer']

function isRelevant(item) {
  if (!item.title || !item.link) return false
  const text = `${item.title} ${item.description}`.toLowerCase()
  return !EXCLUDE_KEYWORDS.some(k => text.includes(k))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const results = await Promise.allSettled(
    SOURCES.map(async src => {
      const upstream = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; wc2026-dashboard/1.0)' },
      })
      if (!upstream.ok) throw new Error(`${src.name} ${upstream.status}`)
      const xml = await upstream.text()
      return parseItems(xml, src.name)
    })
  )

  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(isRelevant)

  // Sort newest first by pubDate
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

  if (items.length === 0) {
    console.error('BBC RSS proxy: both sources empty or failed', results.map(r => r.reason?.message))
  }

  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
  return res.status(200).json(items)
}
