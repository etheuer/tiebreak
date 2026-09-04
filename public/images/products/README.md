# Product image runbook

Use this workflow whenever collecting, adding or replacing a product photo, in any category. Products without an approved local photo keep their monogram. Remote catalogue `image_url` values do not bypass this workflow.

## Why there are two checks

The September 2026 headphone import introduced opaque padding and studio backdrops. Some files even had transparent outer margins around an opaque white rectangle. Checking for an alpha channel, transparent corners or a `.png` extension did not catch that second problem.

The automated gate checks format, dimensions, size, visible content and meaningful transparency. A visual review catches internal boxes, fake checkerboards, damaged edges and missing product parts. The review is tied to the file's SHA-256: replacing even an already approved filename requires a fresh review. This is a workflow safeguard, not automatic proof that a cutout is visually correct.

## 1. Source and prepare

- Use an accurate manufacturer/studio photograph of the exact product and generation, with rights to publish. Record the source page and original image URL in [SOURCES.md](SOURCES.md).
- Prefer genuine manufacturer alpha. Otherwise remove the backdrop using a background-removal editor or local segmentation (macOS Vision foreground masks worked for these headphones). Preserve the real product; do not generate replacement product details.
- Inspect white objects, open cases, gaps between parts and the inside of headbands. Segmentation can remove a white case along with the background. In that situation, fix the mask or find a better source before proceeding.
- Export a single-frame **640 × 640 WebP, at most 120,000 bytes**, named exactly `<product-id>.webp`. Keep originals and intermediate files outside this directory.
- Preserve alpha throughout trimming, resizing and padding. Never flatten onto white, paint a checkerboard into the image or use CSS blending to hide the background.

Example export from a source whose background has already been removed (run from the repository root):

```bash
node --input-type=module - /absolute/path/cutout.png public/images/products/product-id.webp <<'JS'
import sharp from 'sharp'
const [input, output] = process.argv.slice(2)
const background = { r: 0, g: 0, b: 0, alpha: 0 }
await sharp(input)
  .trim({ threshold: 10 })
  .resize(576, 576, { fit: 'contain', background })
  .extend({ top: 32, bottom: 32, left: 32, right: 32, background })
  .webp({ quality: 85 })
  .toFile(output)
JS
```

This export preserves transparency; it does **not** remove an existing backdrop.

## 2. Inspect the actual exported bytes

```bash
npm run images:review
```

Open the printed temporary HTML file. It embeds snapshots of every current image on purple, green, dark and checkerboard backgrounds. Inspect each new or changed image:

- The background and all intended openings show the surrounding colour, with no inner rectangle or baked-in checkerboard.
- The product is complete, including earbud cases and small components; white surfaces remain white.
- Edges are clean, without obvious halos or clipped parts. Colour, shape and branding still match the source.

Only after inspection, run the per-image `npm run images:approve -- <filename> <sha256>` command printed below that image. The command checks that the current bytes still match the reviewed snapshot. Do not copy new hashes into the review registry merely to make a failing check pass; automated collection must stop at review until someone or a visual-capable agent has inspected the result.

## 3. Register and verify

```bash
npm run images:manifest
npm run check:images
```

The manifest command validates **all** current files before writing anything. `npm run build` invokes it through `prebuild`, and CI also runs the gate and its regression tests. A missing or stale approval, opaque photo, blank image, wrong format/size or insufficient transparency stops the process with the affected filename. Normal development may preview changed files before approval; the build remains blocked until they pass.

Check the product in a comparison page at desktop and mobile widths. Commit the photos, source attribution, generated manifest and `src/data/product-image-reviews.json` together. No customer-facing component change is needed for each new image.

To exercise the guard itself, run `npm run test:images`. It covers opaque files, blank files, token transparency, white boxes inside transparent padding, missing reviews, replacements after approval and preservation of the last valid manifest when a check fails.
