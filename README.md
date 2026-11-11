# hallojoe.github.io

A personal one-page portfolio built with Astro and hosted on GitHub Pages.

The homepage displays GitHub profile details, curated repositories, gists, and reading links grouped by tag. Projects with GitHub Pages also have a separate live-site link.

Deployment is handled by `.github/workflows/deploy.yml` on commits to `main`, manual runs and a daily schedule. The build reads the configured repositories using the GitHub GraphQL API and verifies Pages URLs with the GitHub REST API.

## Development

Install Node.js 22+ and run `npm install`. To build with your actual GitHub data, set `GITHUB_TOKEN` to a GitHub token with GraphQL access, then run `npm run build`.

## GitHub Pages setup

Open this repository’s **Settings → Pages → Build and deployment** and select **GitHub Actions** as the publishing source. Once the Actions deployment succeeds, visit https://hallojoe.github.io/.

Avoid committing any GitHub tokens.

## Curating the portfolio

Edit [src/config/portfolio.ts](src/config/portfolio.ts) to add repositories by name under `hallojoe`, gists by ID and title, or links by URL and title. Each entry takes a nonempty tag list, for example `tags: ['Umbraco', '.NET']`. An entry appears under every tag you give it. Edit the shared `tags` array to add or reorder headings. Within each group, entries follow their order in the configuration. Empty groups are omitted.

The Astro build calls GitHub's public Gists REST API for each selected ID. It displays the custom title, the live description, detected language, file count and a link to the original gist. Only public gists owned by `hallojoe` are rendered. A temporarily unavailable gist is skipped so the rest of the site can still publish.

The existing daily GitHub Actions build refreshes the gist cards automatically; no additional token or runtime server is required.

## Automatic landscape tablet screenshots

The GitHub Pages deployment workflow generates screenshots from the configured repositories that publish a GitHub Pages URL. During each push to `main`, manual deployment, and daily rebuild, it installs Playwright Chromium, visits each live project at a **1024 × 768 landscape tablet viewport**, waits for the page to render, and saves a PNG in `public/screenshots/<repository>.png`. Astro embeds those PNGs as full-width previews directly below each project's description. The preview extends flush to both sides of the card, while the text and links remain padded. Only successfully captured screenshots appear; repositories without Pages retain their text-only cards.

The screenshots are generated assets: they are included in the deployed static site, **not committed to Git**. If a demo is temporarily down or a screenshot fails, that card retains its source/live links without a screenshot and the rest of the site still deploys.

For local testing, run `npm install`, `npx playwright install chromium` and then `npm run screenshots` with `GITHUB_TOKEN` set; `npm run build` will include the screenshots. The workflow uses `npm run build:pages` to install Chromium and perform both steps.
