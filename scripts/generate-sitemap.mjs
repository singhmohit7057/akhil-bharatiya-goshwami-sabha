// Run before build: node scripts/generate-sitemap.mjs
// Queries Supabase for dynamic content (events, matrimonial) and writes public/sitemap.xml

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// Load .env.local then .env manually (no dotenv dependency needed)
function loadEnv(file) {
  if (!existsSync(file)) return
  readFileSync(file, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
    }
  })
}
loadEnv('.env.local')
loadEnv('.env')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const BASE = 'https://akhilbharatiyagoswami.com'
const TODAY = new Date().toISOString().split('T')[0]

const staticRoutes = [
  { path: '/',               changefreq: 'weekly',  priority: '1.0' },
  { path: '/about',          changefreq: 'monthly', priority: '0.8' },
  { path: '/events',         changefreq: 'weekly',  priority: '0.8' },
  { path: '/businesses',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/matrimonial',    changefreq: 'weekly',  priority: '0.7' },
  { path: '/members',        changefreq: 'weekly',  priority: '0.7' },
  { path: '/gallery',        changefreq: 'weekly',  priority: '0.7' },
  { path: '/souvenirs',      changefreq: 'monthly', priority: '0.6' },
  { path: '/donate',         changefreq: 'monthly', priority: '0.8' },
  { path: '/contact',        changefreq: 'monthly', priority: '0.7' },
  { path: '/verify',         changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly',  priority: '0.3' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookie-policy',  changefreq: 'yearly',  priority: '0.3' },
]

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

const entries = staticRoutes.map(r => urlEntry({
  loc: `${BASE}${r.path}`,
  lastmod: TODAY,
  changefreq: r.changefreq,
  priority: r.priority,
}))

// Events
const { data: events } = await supabase
  .from('events')
  .select('id, updated_at')
  .eq('is_published', true)

for (const e of events || []) {
  entries.push(urlEntry({
    loc: `${BASE}/events/${e.id}`,
    lastmod: e.updated_at ? e.updated_at.split('T')[0] : TODAY,
    changefreq: 'monthly',
    priority: '0.6',
  }))
}

// Matrimonial profiles
const { data: profiles } = await supabase
  .from('matrimonial_profiles')
  .select('id, updated_at')
  .eq('is_visible', true)

for (const p of profiles || []) {
  entries.push(urlEntry({
    loc: `${BASE}/matrimonial/${p.id}`,
    lastmod: p.updated_at ? p.updated_at.split('T')[0] : TODAY,
    changefreq: 'monthly',
    priority: '0.5',
  }))
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

writeFileSync('public/sitemap.xml', xml)
console.log(`✓ Sitemap generated: ${staticRoutes.length} static + ${(events || []).length} events + ${(profiles || []).length} matrimonial profiles`)
