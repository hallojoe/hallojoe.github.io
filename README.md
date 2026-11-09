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
