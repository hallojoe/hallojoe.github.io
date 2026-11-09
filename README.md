# hallojoe.github.io

A personal one-page portfolio built with Astro and hosted on GitHub Pages.

The homepage displays GitHub profile details, pinned repositories, and a separate live-site link whenever a pinned repository publishes GitHub Pages.

Deployment is handled by `.github/workflows/deploy.yml` on commits to `main`, manual runs and a daily schedule. The build reads pinned repositories using the GitHub GraphQL API and verifies Pages URLs with the GitHub REST API.

## Development

Install Node.js 22+ and run `npm install`. To build with your actual GitHub data, set `GITHUB_TOKEN` to a GitHub token with GraphQL access, then run `npm run build`.

## GitHub Pages setup

Open this repository’s **Settings → Pages → Build and deployment** and select **GitHub Actions** as the publishing source. Once the Actions deployment succeeds, visit https://hallojoe.github.io/.

Avoid committing any GitHub tokens.
## Curating selected gists

Gists appear in a separate section under the pinned repositories. To change which gists are featured or their display order, edit `src/config/gists.ts` and add/remove entries with IDs from URLs such as `https://gist.github.com/hallojoe/GIST_ID`.

The Astro build calls GitHub's public Gists REST API for each selected ID. It displays the custom title, the live description, detected language, file count and a link to the original gist. Only public gists owned by `hallojoe` are rendered. A temporarily unavailable gist is skipped so the rest of the site can still publish.

The existing daily GitHub Actions build refreshes the gist cards automatically; no additional token or runtime server is required.

## Automatic mobile screenshots

The GitHub Pages deployment workflow generates screenshots from the *current pinned repositories* that publish a GitHub Pages URL. During each push to `main`, manual deployment, and daily rebuild, it installs Playwright Chromium, visits each live project at a **390 × 844 mobile viewport**, waits for the page to render, and saves a PNG in `public/screenshots/<repository>.png`. Astro embeds those PNGs into the corresponding cards. Only successfully captured screenshots appear; repositories without Pages retain their text-only cards.

The screenshots are generated assets: they are included in the deployed static site, **not committed to Git**. If a demo is temporarily down or a screenshot fails, that card retains its source/live links without a screenshot and the rest of the site still deploys.

For local testing, run `npm install`, `npx playwright install chromium` and then `npm run screenshots` with `GITHUB_TOKEN` set; `npm run build` will include the screenshots. The workflow uses `npm run build:pages` to install Chromium and perform both steps.
