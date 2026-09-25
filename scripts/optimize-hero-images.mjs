// One-off asset optimization: re-encodes the hero slideshow JPEGs (mozjpeg,
// quality 78) and writes a sibling .webp next to each one. Re-run this
// whenever new hero photos are added to public/home/hero-slideshow/.
import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.join(import.meta.dirname, '..', 'public', 'home', 'hero-slideshow')
const JPEG_QUALITY = 78
const WEBP_QUALITY = 75

async function findJpegs(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findJpegs(full)))
    } else if (entry.name.endsWith('.jpg')) {
      files.push(full)
    }
  }
  return files
}

async function main() {
  const files = await findJpegs(ROOT)
  let totalBefore = 0
  let totalAfterJpeg = 0
  let totalWebp = 0

  for (const file of files) {
    const before = (await stat(file)).size
    const original = await sharp(file).toBuffer()

    const jpeg = await sharp(original)
      .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
      .toBuffer()
    const webp = await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer()

    // Write the already-encoded buffers directly — piping them back through
    // sharp().toFile() would decode and re-encode a second time (losing the
    // quality/mozjpeg options set above and adding another generation of
    // compression loss).
    await writeFile(file, jpeg)
    await writeFile(file.replace(/\.jpg$/, '.webp'), webp)

    totalBefore += before
    totalAfterJpeg += jpeg.length
    totalWebp += webp.length

    console.log(
      `${path.relative(ROOT, file)}: ${before} -> jpeg ${jpeg.length} (${Math.round((100 * jpeg.length) / before)}%), webp ${webp.length} (${Math.round((100 * webp.length) / before)}%)`
    )
  }

  console.log('---')
  console.log(`${files.length} files`)
  console.log(`original total:      ${(totalBefore / 1024).toFixed(0)} KiB`)
  console.log(
    `recompressed jpeg:   ${(totalAfterJpeg / 1024).toFixed(0)} KiB (${Math.round((100 * totalAfterJpeg) / totalBefore)}%)`
  )
  console.log(
    `webp total:          ${(totalWebp / 1024).toFixed(0)} KiB (${Math.round((100 * totalWebp) / totalBefore)}%)`
  )
}

main()
