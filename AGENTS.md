<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product photography

Before collecting, adding or replacing product images, follow [the image runbook](public/images/products/README.md). Use real product photography, preserve transparent backgrounds, and inspect the review sheet on coloured backgrounds before recording an image approval. Never approve hashes in bulk without inspecting every image. `npm run images:manifest` and the production build enforce this review; unreviewed remote `image_url` values are not rendered.
