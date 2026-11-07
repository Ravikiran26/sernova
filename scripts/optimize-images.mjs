// Converts every PNG/JPG in assets/ to WebP and moves the original to assets-originals/.
//
//   npm run optimize-images
//
// Drop a new PNG or JPG into assets/ and run this again: it is converted, the original is
// moved to assets-originals/ (kept in git, not deployed), and existing WebP files are only
// rebuilt when their original has changed. Update the page to reference the .webp file.
//
// Sizes (longest side, never enlarged): logos 600px, doctor portraits 800px, photos 1600px.
// Images used for social previews / structured data also keep a JPG/PNG copy (max 1200px),
// because some apps don't show WebP link previews.
import {existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync} from 'node:fs'
import {basename, dirname, extname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(ROOT, 'assets')
const ORIGINALS = join(ROOT, 'assets-originals')

// Referenced by og:image, twitter:image, JSON-LD "image"/"logo" and the favicon.
const SOCIAL_COPIES = new Set(['logo.png', 'clinic-reception-hero.png'])

const RASTER = /\.(png|jpe?g)$/i
const QUALITY = 80

const maxSide = (name) => (/^logo/i.test(name) ? 600 : /^dr-/i.test(name) ? 800 : 1600)

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, {withFileTypes: true}).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : RASTER.test(e.name) ? [join(dir, e.name)] : [],
  )
}

// 1. Move new originals out of assets/ (social copies are outputs of this script, not inputs).
for (const file of walk(ASSETS)) {
  const rel = relative(ASSETS, file)
  if (SOCIAL_COPIES.has(rel) && existsSync(join(ORIGINALS, rel))) continue
  const dest = join(ORIGINALS, rel)
  mkdirSync(dirname(dest), {recursive: true})
  renameSync(file, dest)
  console.log(`moved     ${rel} → assets-originals/`)
}

// 2. Pick an output name per original. Two originals with the same base name (photo.jpg and
//    photo.png) would both become photo.webp, so the later one becomes photo-png.webp.
const originals = walk(ORIGINALS).sort()
const taken = new Set()
const jobs = originals.map((src) => {
  const rel = relative(ORIGINALS, src)
  const ext = extname(rel)
  let out = rel.slice(0, -ext.length) + '.webp'
  if (taken.has(out)) out = rel.slice(0, -ext.length) + `-${ext.slice(1).toLowerCase()}.webp`
  taken.add(out)
  return {src, rel, out}
})

const stale = (src, out) => !existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs
const kb = (n) => `${Math.round(n / 1024)} KB`

let before = 0
let after = 0
for (const {src, rel, out} of jobs) {
  const dest = join(ASSETS, out)
  if (stale(src, dest)) {
    mkdirSync(dirname(dest), {recursive: true})
    const size = maxSide(basename(rel))
    await sharp(src)
      .rotate()
      .resize({width: size, height: size, fit: 'inside', withoutEnlargement: true})
      .webp({quality: QUALITY, alphaQuality: 100, effort: 6})
      .toFile(dest)
    console.log(`converted ${rel.padEnd(42)} ${kb(statSync(src).size).padStart(8)} → ${out} ${kb(statSync(dest).size)}`)
  }
  before += statSync(src).size
  after += statSync(dest).size

  if (SOCIAL_COPIES.has(rel)) {
    const copy = join(ASSETS, rel)
    if (stale(src, copy)) {
      const encode = (palette) => {
        const img = sharp(src).rotate().resize({width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true})
        return (/\.png$/i.test(rel) ? img.png({compressionLevel: 9, palette, quality: 90}) : img.jpeg({quality: 85, mozjpeg: true})).toBuffer()
      }
      // Never make the copy larger than the original: fall back to a palette PNG, or to the
      // original bytes when it is already within 1200px.
      const original = readFileSync(src)
      const {width, height} = await sharp(src).metadata()
      let buf = await encode(false)
      if (buf.length > original.length) buf = Math.max(width, height) <= 1200 ? original : await encode(true)
      writeFileSync(copy, buf)
      console.log(`social    ${rel} (max 1200px) ${kb(buf.length)}${buf === original ? ' (original kept as is)' : ''}`)
    }
  }
}
console.log(`\n${jobs.length} images: ${(before / 1048576).toFixed(1)} MB originals → ${(after / 1048576).toFixed(1)} MB WebP`)
