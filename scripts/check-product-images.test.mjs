import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import sharp from 'sharp'
import { inspectImage } from './check-product-images.mjs'

const file = 'test-headphones.webp'
const cutout = color => sharp({ create: { width: 640, height: 640, channels: 4, background: '#00000000' } })
  .composite([{ input: Buffer.from(`<svg width="640" height="640"><circle cx="320" cy="320" r="200" fill="${color}"/></svg>`) }])
  .webp().toBuffer()

test('rejects opaque, empty, undersized and token-transparency assets', async () => {
  const opaque = await sharp({ create: { width: 640, height: 640, channels: 3, background: 'white' } }).webp().toBuffer()
  await assert.rejects(inspectImage(opaque, file), /alpha/)
  const blank = await sharp({ create: { width: 640, height: 640, channels: 4, background: '#00000000' } }).webp().toBuffer()
  await assert.rejects(inspectImage(blank, file), /visible product/)
  const tiny = await sharp(await cutout('black')).resize(100, 100).webp().toBuffer()
  await assert.rejects(inspectImage(tiny, file), /640x640/)
  const pixels = Buffer.alloc(640 * 640 * 4, 255)
  pixels[3] = 0
  const token = await sharp(pixels, { raw: { width: 640, height: 640, channels: 4 } }).webp().toBuffer()
  await assert.rejects(inspectImage(token, file), /substantial transparent/)
  await assert.rejects(inspectImage(await cutout('black'), 'test.jpg'), /product-id/)
})

test('manifest blocks unreviewed images and changed bytes, preserving its last valid output', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'image-gate-test-'))
  const dir = join(cwd, 'public/images/products')
  const manifest = join(cwd, 'src/data/generated/product-images.json')
  const cli = fileURLToPath(new URL('./check-product-images.mjs', import.meta.url))
  const generator = fileURLToPath(new URL('./generate-image-manifest.mjs', import.meta.url))
  const run = (script, ...args) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' })
  try {
    mkdirSync(dir, { recursive: true })
    mkdirSync(join(cwd, 'src/data/generated'), { recursive: true })
    writeFileSync(manifest, '{}\n')
    // A white rectangle with transparent padding passes pixel checks, but must
    // still be blocked until someone reviews it on coloured backgrounds.
    const box = await sharp({ create: { width: 576, height: 576, channels: 3, background: 'white' } })
      .extend({ top: 32, bottom: 32, left: 32, right: 32, background: '#00000000' }).webp().toBuffer()
    await inspectImage(box, file)
    writeFileSync(join(dir, file), box)
    const blocked = run(generator)
    assert.notEqual(blocked.status, 0)
    assert.match(blocked.stderr, /needs visual review/)
    assert.equal(readFileSync(manifest, 'utf8'), '{}\n')
    const good = await cutout('black')
    writeFileSync(join(dir, file), good)
    const hash = await inspectImage(good, file)
    assert.equal(run(cli, 'approve', file, hash).status, 0)
    assert.equal(run(generator).status, 0)
    const approvedManifest = readFileSync(manifest, 'utf8')
    assert.equal(JSON.parse(approvedManifest)['test-headphones'], `/images/products/${file}`)
    writeFileSync(join(dir, file), await cutout('navy'))
    assert.notEqual(run(generator).status, 0)
    assert.equal(readFileSync(manifest, 'utf8'), approvedManifest)
    assert.match(run(cli, 'approve', file, hash).stderr, /changed since review/)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})
