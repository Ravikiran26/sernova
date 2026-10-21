// Builds the deployable site into dist/: copies the static pages, then generates
// /journal/<slug> pages, the /journal listing and sitemap entries from Sanity.
import {cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {basename, dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import {escapeHTML, toHTML} from '@portabletext/to-html'
import {treatments} from '../studio/schemaTypes/treatments.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://srenova.in'
const WHATSAPP = 'https://wa.me/919100060902'

const EXCLUDE = new Set([
  'node_modules', 'studio', 'scripts', 'api', 'dist', '.git', '.vercel', '.DS_Store', '.gitignore',
  'package.json', 'package-lock.json', 'vercel.json', 'serve-local.py',
  'start-local.bat', 'start-local.command', 'README.md', 'README.txt', 'README_LOCAL_TEST.txt',
])

const client = createClient({
  projectId: 'wl7g0dv3',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'published',
})
const img = createImageUrlBuilder(client)
const imageUrl = (source, w, h) => {
  let b = img.image(source).width(w).auto('format').fit('crop')
  if (h) b = b.height(h)
  return b.url()
}

const esc = (s = '') => escapeHTML(String(s))
const treatmentTitle = Object.fromEntries(treatments.map((t) => [t.value, t.title]))
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'})

const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) {
  _id, _updatedAt, title, "slug": slug.current, excerpt, publishedAt, coverImage, body, faqs, relatedTreatments, seo,
  "category": category->title,
  "author": author->{name, credentials, photo},
  "reviewer": medicallyReviewedBy->{name, credentials}
}`

// ---------- Shared page chrome, taken from journal.html ----------

const journalSrc = readFileSync(join(ROOT, 'journal.html'), 'utf8')
// Pages under /journal/ need root-relative asset paths.
const absolutize = (html) => html.replace(/(href|src)="(?!https?:|\/|#|mailto:|tel:|data:)/g, '$1="/')
const gtmEnd = '<!-- End Google Tag Manager -->'
const headStart = journalSrc.slice(0, journalSrc.indexOf(gtmEnd) + gtmEnd.length)
const stylesheet = absolutize(journalSrc.match(/<link rel="stylesheet"[^>]*>/)[0])
const bodyStart = absolutize(journalSrc.slice(journalSrc.indexOf('<body>'), journalSrc.indexOf('<main>')))
const bodyEnd = absolutize(journalSrc.slice(journalSrc.indexOf('</main>') + '</main>'.length))

const POST_CSS = `<style>
.post-hero{background:var(--green);color:#fff;padding:64px 0 56px}
.post-hero .eyebrow{color:var(--gold2)}
.post-hero h1{font:500 58px/1.02 var(--serif);letter-spacing:-.03em;margin:16px 0 18px;max-width:860px}
.post-meta{color:rgba(255,255,255,.66);font-size:12px;letter-spacing:.04em;display:flex;gap:10px;flex-wrap:wrap}
.post-meta a{color:var(--gold2)}
.post-cover{width:min(1040px,calc(100% - 48px));margin:-1px auto 0;aspect-ratio:16/9;object-fit:cover;background:var(--ivory)}
.post-wrap{background:var(--paper);padding:56px 0 90px}
.post-body{width:min(720px,calc(100% - 32px));margin:auto;font-size:16.5px;line-height:1.85}
.post-body h2{font:500 38px/1.1 var(--serif);letter-spacing:-.02em;margin:48px 0 14px;color:var(--ink)}
.post-body h3{font:600 22px/1.25 var(--serif);margin:34px 0 10px;color:var(--ink)}
.post-body p{margin:0 0 20px}
.post-body ul,.post-body ol{margin:0 0 22px;padding-left:22px}
.post-body li{margin:0 0 8px}
.post-body a{color:var(--green);border-bottom:1px solid var(--gold)}
.post-body blockquote{margin:30px 0;padding:6px 0 6px 24px;border-left:2px solid var(--gold);font:italic 500 24px/1.4 var(--serif);color:var(--green)}
.post-body figure{margin:34px 0}
.post-body figcaption{font-size:12px;color:var(--muted);margin-top:8px}
.post-cta{background:var(--green);color:#fff;padding:30px 32px;margin:36px 0}
.post-cta h3{color:#fff;margin:0 0 8px}
.post-cta p{color:rgba(255,255,255,.72);margin:0 0 18px;font-size:14px}
.post-cta .btn{border-bottom:0}
.post-byline{display:flex;gap:16px;align-items:center;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0;margin:46px 0 0;font-size:13px;color:var(--muted)}
.post-byline img{width:56px;height:56px;border-radius:50%;object-fit:cover}
.post-byline strong{color:var(--ink);display:block;font-size:14px}
.post-section-title{font:500 32px/1.1 var(--serif);margin:52px 0 18px;color:var(--ink)}
.post-faq details{border-bottom:1px solid var(--line);padding:16px 0}
.post-faq summary{cursor:pointer;font-weight:600;color:var(--ink)}
.post-faq details p{margin:10px 0 0;color:var(--muted)}
.post-related{display:flex;flex-wrap:wrap;gap:10px}
.post-related a{border:1px solid var(--line);padding:9px 16px;font-size:13px;color:var(--green);background:#fff;border-bottom:1px solid var(--line)}
.post-back{display:inline-block;margin-top:46px}
@media(max-width:780px){.post-hero h1{font-size:40px}.post-cover{width:100%}.post-body h2{font-size:31px}}
</style>`

const portableComponents = {
  types: {
    image: ({value}) =>
      value?.asset
        ? `<figure><img src="${imageUrl(value, 1440)}" alt="${esc(value.alt)}" loading="lazy">${
            value.caption ? `<figcaption>${esc(value.caption)}</figcaption>` : ''
          }</figure>`
        : '',
    callout: ({value}) =>
      `<aside class="post-cta"><h3>${esc(value.heading)}</h3>${value.text ? `<p>${esc(value.text)}</p>` : ''}` +
      `<a class="btn btn-gold" href="${WHATSAPP}" target="_blank" rel="noopener">${esc(value.buttonLabel || 'Book Consultation')}</a></aside>`,
  },
  marks: {
    link: ({children, value}) => {
      const href = value?.href || '#'
      const external = /^https?:/.test(href) && !href.startsWith(SITE)
      return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${children}</a>`
    },
  },
}

// ---------- Page renderers ----------

function renderPost(post) {
  const url = `${SITE}/journal/${post.slug}`
  const seo = post.seo || {}
  const title = seo.metaTitle || post.title
  const description = seo.metaDescription || post.excerpt
  const ogSource = seo.ogImage?.asset ? seo.ogImage : post.coverImage
  const ogImage = ogSource?.asset ? imageUrl(ogSource, 1200, 630) : `${SITE}/assets/clinic-reception-hero.png`
  const words = JSON.stringify(post.body || []).split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 230))
  // Only show "Updated" when the post was edited on a later day than it was published.
  const updated = fmtDate(post._updatedAt) !== fmtDate(post.publishedAt) && post._updatedAt > post.publishedAt

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      image: ogImage,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
      mainEntityOfPage: url,
      author: post.author
        ? {'@type': 'Person', name: post.author.name, jobTitle: post.author.credentials || undefined}
        : {'@type': 'Organization', name: 'SRENOVA'},
      ...(post.reviewer && {reviewedBy: {'@type': 'Person', name: post.reviewer.name}}),
      publisher: {'@type': 'Organization', name: 'SRENOVA', logo: {'@type': 'ImageObject', url: `${SITE}/assets/logo.png`}},
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/`},
        {'@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE}/journal`},
        {'@type': 'ListItem', position: 3, name: post.title, item: url},
      ],
    },
  ]
  if (post.faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {'@type': 'Answer', text: f.answer},
      })),
    })
  }

  const head = `${headStart}
<title>${esc(title)} | SRENOVA Journal</title>
<meta name="description" content="${esc(description)}" />
${seo.noIndex ? '<meta name="robots" content="noindex" />\n' : ''}<link rel="canonical" href="${url}" />
<link rel="icon" type="image/png" href="/assets/logo.png">
<meta property="og:type" content="article" />
<meta property="og:site_name" content="SRENOVA" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="article:published_time" content="${post.publishedAt}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${ogImage}" />
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
${stylesheet}
${POST_CSS}
</head>`

  const byline = post.author
    ? `<div class="post-byline">${
        post.author.photo?.asset ? `<img src="${imageUrl(post.author.photo, 112, 112)}" alt="${esc(post.author.name)}">` : ''
      }<div><strong>${esc(post.author.name)}</strong>${esc(post.author.credentials || '')}${
        post.reviewer ? `<br>Medically reviewed by ${esc(post.reviewer.name)}${post.reviewer.credentials ? `, ${esc(post.reviewer.credentials)}` : ''}` : ''
      }</div></div>`
    : ''

  const faqs = post.faqs?.length
    ? `<h2 class="post-section-title">Frequently asked questions</h2><div class="post-faq">${post.faqs
        .map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)
        .join('')}</div>`
    : ''

  const related = (post.relatedTreatments || []).filter((t) => treatmentTitle[t])
  const relatedHtml = related.length
    ? `<h2 class="post-section-title">Related treatments</h2><div class="post-related">${related
        .map((t) => `<a href="/treatments/${t}">${esc(treatmentTitle[t])} →</a>`)
        .join('')}</div>`
    : ''

  const main = `<main>
<section class="post-hero">
  <div class="container">
    <div class="eyebrow">${esc(post.category || 'Journal')}</div>
    <h1>${esc(post.title)}</h1>
    <div class="post-meta"><a href="/journal">Journal</a><span>•</span><span>${fmtDate(post.publishedAt)}</span>${
      updated ? `<span>•</span><span>Updated ${fmtDate(post._updatedAt)}</span>` : ''
    }<span>•</span><span>${minutes} min read</span>${
      post.author ? `<span>•</span><span>By ${esc(post.author.name)}</span>` : ''
    }<span data-views hidden>•</span><span data-views hidden></span></div>
  </div>
</section>
${post.coverImage?.asset ? `<img class="post-cover" src="${imageUrl(post.coverImage, 1600, 900)}" alt="${esc(post.coverImage.alt)}">` : ''}
<section class="post-wrap">
  <article class="post-body">
${toHTML(post.body || [], {components: portableComponents})}
${faqs}
${relatedHtml}
${byline}
<a class="link post-back" href="/journal"><span>←</span> All articles</a>
  </article>
</section>
</main>
<script>
(function () {
  // Count one view per browser session; the counter stays hidden if /api/views is unavailable.
  var slug = ${JSON.stringify(post.slug)}, key = 'viewed:' + slug, seen = false
  try { seen = !!sessionStorage.getItem(key) } catch (e) {}
  fetch('/api/views?slug=' + encodeURIComponent(slug), {method: seen ? 'GET' : 'POST'})
    .then(function (r) { return r.ok ? r.json() : null })
    .then(function (d) {
      if (!d || typeof d.views !== 'number' || d.views < 1) return
      try { sessionStorage.setItem(key, '1') } catch (e) {}
      var els = document.querySelectorAll('[data-views]')
      els[1].textContent = d.views.toLocaleString('en-IN') + (d.views === 1 ? ' view' : ' views')
      for (var i = 0; i < els.length; i++) els[i].hidden = false
    })
    .catch(function () {})
})()
</script>`

  return `${head}\n${bodyStart}${main}${bodyEnd}`
}

function renderCard(post) {
  const href = `/journal/${post.slug}`
  return `      <article class="j-card">
        ${post.coverImage?.asset ? `<a class="j-img" href="${href}"><img src="${imageUrl(post.coverImage, 720, 450)}" alt="${esc(post.coverImage.alt)}" loading="lazy"></a>` : ''}
        <small class="j-cat">${esc(post.category || 'Journal')} · ${fmtDate(post.publishedAt)}</small>
        <h2><a href="${href}">${esc(post.title)}</a></h2>
        <p>${esc(post.excerpt)}</p>
        <a class="link" href="${href}">Read Article <span>→</span></a>
      </article>
`
}

// ---------- Build ----------

rmSync(DIST, {recursive: true, force: true})
mkdirSync(DIST)
for (const entry of readdirSync(ROOT)) {
  if (EXCLUDE.has(entry)) continue
  cpSync(join(ROOT, entry), join(DIST, entry), {recursive: true, filter: (src) => basename(src) !== '.DS_Store'})
}

const posts = await client.fetch(POSTS_QUERY)
console.log(`Fetched ${posts.length} published post(s) from Sanity`)

mkdirSync(join(DIST, 'journal'), {recursive: true})
for (const post of posts) {
  writeFileSync(join(DIST, 'journal', `${post.slug}.html`), renderPost(post))
  console.log(`  /journal/${post.slug}`)
}

// With no posts yet, the hand-written cards in journal.html stay in place.
if (posts.length) {
  const listing = journalSrc.replace(
    /<!-- JOURNAL:POSTS -->[\s\S]*<!-- \/JOURNAL:POSTS -->/,
    `<!-- JOURNAL:POSTS -->\n${posts.map(renderCard).join('')}<!-- /JOURNAL:POSTS -->`,
  )
  writeFileSync(join(DIST, 'journal.html'), listing)
}

const sitemapPath = join(DIST, 'sitemap.xml')
const entries = posts
  .filter((p) => !p.seo?.noIndex)
  .map(
    (p) =>
      `  <url>\n    <loc>${SITE}/journal/${p.slug}</loc>\n    <lastmod>${p._updatedAt.slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`,
  )
  .join('')
writeFileSync(sitemapPath, readFileSync(sitemapPath, 'utf8').replace('</urlset>', `  <!-- Journal posts -->\n${entries}</urlset>`))

console.log('Build complete → dist/')
