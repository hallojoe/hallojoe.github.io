# hallojoe.github.io

A personal portfolio built with Astro and hosted on GitHub Pages.

The homepage displays GitHub profile details, the four newest reading links, followed by repositories and gists grouped by tag. Repository cards link to the live site when available and otherwise link to the source. Star counts appear from six stars upwards.

Deployment is handled by `.github/workflows/deploy.yml` on commits to `main`, manual runs and a daily schedule. The build reads the configured repositories using the GitHub GraphQL API and verifies Pages URLs with the GitHub REST API.

## Development

Install Node.js 22+ and run `npm install`. To build with your actual GitHub data, set `GITHUB_TOKEN` to a GitHub token with GraphQL access, then run `npm run build`.

## GitHub Pages setup

Open this repository’s **Settings → Pages → Build and deployment** and select **GitHub Actions** as the publishing source. Once the Actions deployment succeeds, visit https://hallojoe.github.io/.

Avoid committing any GitHub tokens.

## Curating the portfolio

Edit [src/config/portfolio.ts](src/config/portfolio.ts) to add repositories by name under `hallojoe`, or gists by ID and title. Each entry takes a nonempty tag list, for example `tags: ['Umbraco', '.NET']`. An entry appears under every tag you give it. Edit the shared `tags` array to add or reorder headings. Within each group, entries follow their order in the configuration. Empty groups are omitted.

Edit [src/pages/links.md](src/pages/links.md) to update the reading list and its introduction. Each entry has a stable ID, a date added in quoted YYYY-MM-DD form, a title, a URL, tags and a list of comments. Both pages sort newest first. Entries with the same date keep their order in the Markdown file. The homepage shows the comment count and links to the notes at `/links/#id`.

The Astro build calls GitHub's public Gists REST API for each selected ID. It displays the custom title, the live description, detected language, file count and a link to the original gist. Only public gists owned by `hallojoe` are rendered. A temporarily unavailable gist is skipped so the rest of the site can still publish.

The existing daily GitHub Actions build refreshes the gist cards automatically; no additional token or runtime server is required.

## Automatic landscape tablet screenshots

The GitHub Pages deployment workflow generates screenshots from the configured repositories that publish a GitHub Pages URL. During each push to `main`, manual deployment, and daily rebuild, it installs Playwright Chromium, visits each live project at a **1024 × 768 landscape tablet viewport**, waits for the page to render, and saves a PNG in `public/screenshots/<repository>.png`. Astro uses each successful capture as its card’s background. A theme-colored gradient protects the text, and hover or keyboard focus reveals more of the image.

Screenshots are generated during deployment. If a capture fails, the card still shows its live-site link on a plain background.

For local testing, run `npm install`, `npx playwright install chromium` and then `npm run screenshots` with `GITHUB_TOKEN` set; `npm run build` will include the screenshots. The workflow uses `npm run build:pages` to install Chromium and perform both steps.
