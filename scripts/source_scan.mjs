import fs from 'node:fs/promises';

const EXISTING_SOURCES = [
  'El Universal', 'Milenio', 'InSight Crime', 'Proceso', 'Animal Político',
  'Sin Embargo', 'Zeta Tijuana', 'Reforma', 'NTR Guadalajara',
  'Borderland Beat', 'Riodoce', 'Noroeste', 'El Debate'
];

const CANDIDATE_FEEDS = [
  { name: 'La Jornada', url: 'https://www.jornada.com.mx/rss/ultimasnoticias.xml' },
  { name: 'Aristegui Noticias', url: 'https://aristeguinoticias.com/feed/' },
  { name: 'El Financiero', url: 'https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/?outputType=xml' },
  { name: 'Excélsior Nacional', url: 'https://www.excelsior.com.mx/rss.xml' },
  { name: 'Forbes México', url: 'https://www.forbes.com.mx/feed/' },
  { name: 'AP News Latin America', url: 'https://apnews.com/hub/latin-america?output=rss' },
  { name: 'Reuters World News', url: 'https://www.reutersagency.com/feed/?best-topics=crime-law-and-justice&post_type=best' },
  { name: 'DW Español', url: 'https://rss.dw.com/xml/rss-sp-all' },
  { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
  { name: 'El País América', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada' }
];

const KEYWORDS = [
  'cartel', 'cártel', 'narco', 'narcotráfico', 'sicario', 'fentanilo',
  'cjng', 'sinaloa', 'zetas', 'golfo', 'jalisco', 'homicidio', 'violencia'
];

function stripCdata(s = '') {
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
}

function extractItems(xml) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  if (items.length) return items;
  return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? stripCdata(m[1]).replace(/<[^>]+>/g, '').trim() : '';
}

function extractLink(block) {
  const m1 = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (m1) return stripCdata(m1[1]).trim();
  const m2 = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m2 ? m2[1].trim() : '';
}

function scoreText(text) {
  const l = text.toLowerCase();
  return KEYWORDS.reduce((acc, k) => (l.includes(k) ? acc + 1 : acc), 0);
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'user-agent': 'cartel-atlas-source-scan/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const blocks = extractItems(xml).slice(0, 40);
  const entries = blocks.map((b) => {
    const title = extractTag(b, 'title');
    const description = extractTag(b, 'description') || extractTag(b, 'summary');
    const link = extractLink(b);
    const score = scoreText(`${title} ${description}`);
    return { title, description, link, score };
  });

  const relevant = entries.filter((e) => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
  return {
    source: feed.name,
    url: feed.url,
    checkedAt: new Date().toISOString(),
    totalEntries: entries.length,
    relevantCount: relevant.length,
    relevant,
  };
}

const results = [];
for (const feed of CANDIDATE_FEEDS) {
  try {
    const data = await fetchFeed(feed);
    results.push({ ok: true, ...data });
    console.log(`✓ ${feed.name}: ${data.relevantCount} relevant / ${data.totalEntries}`);
  } catch (err) {
    const detail = String(err?.cause?.message || err?.message || err);
    results.push({ ok: false, source: feed.name, url: feed.url, error: detail });
    console.log(`✗ ${feed.name}: ${detail}`);
  }
}

const recommended = results
  .filter((r) => r.ok && r.relevantCount > 0)
  .sort((a, b) => b.relevantCount - a.relevantCount)
  .map((r) => r.source);

const report = {
  generatedAt: new Date().toISOString(),
  baselineSourcesAlreadyUsed: EXISTING_SOURCES,
  scannedFeeds: CANDIDATE_FEEDS,
  recommendedNewSources: recommended,
  results,
};

await fs.writeFile('research/source-scan/latest.json', JSON.stringify(report, null, 2));

const lines = [];
lines.push('# Source Scan Report');
lines.push('');
lines.push(`Generated: ${report.generatedAt}`);
lines.push('');
lines.push('## Recommended new sources');
if (!recommended.length) lines.push('- No strong candidates found in this pass.');
else recommended.forEach((s) => lines.push(`- ${s}`));
lines.push('');
lines.push('## Feed results');
for (const r of results) {
  if (!r.ok) {
    lines.push(`- ${r.source}: ERROR (${r.error})`);
    continue;
  }
  lines.push(`- ${r.source}: ${r.relevantCount}/${r.totalEntries} relevant`);
  for (const e of r.relevant.slice(0, 3)) {
    lines.push(`  - [score ${e.score}] ${e.title}${e.link ? ` (${e.link})` : ''}`);
  }
}
lines.push('');
lines.push('## Notes');
lines.push('- This is a discovery scan only; no app data was modified.');
lines.push('- Keywords can be tuned in `scripts/source_scan.mjs`.');

await fs.writeFile('research/source-scan/latest.md', lines.join('\n'));
console.log('Wrote research/source-scan/latest.json and latest.md');
