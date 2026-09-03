# Product photos

Drop real studio or manufacturer photos here. No code change needed.

- File name must match the product id: `<product-id>.webp` (e.g. `samsung-q90c.webp`).
  Accepted extensions: `.jpg` `.jpeg` `.png` `.webp` `.avif` `.svg`.
- Square-ish, at least 400x400. `.webp` under ~120KB keeps cards fast.
- Only use photos you have the rights to publish.
- Run `npm run images:manifest` after adding or removing files (it also runs
  automatically before `next build`). Products without a file keep their
  branded monogram tile; nothing ever renders a broken image.
