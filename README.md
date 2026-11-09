# hallojoe.github.io

A personal one-page portfolio built with Astro and hosted on GitHub Pages.

The homepage displays GitHub profile details, pinned repositories, and a separate live-site link whenever a pinned repository publishes GitHub Pages.

Deployment is handled by `.github/workflows/deploy.yml` on commits to `main`, manual runs and a daily schedule. The build reads pinned repositories using the GitHub GraphQL API and verifies Pages URLs with the GitHub REST API.

## Development

Install Node.js 22+ and run `npm install`. To build with your actual GitHub data, set `GITHUB_TOKEN` to a GitHub token with GraphQL access, then run `npm run build`.

## GitHub Pages setup

Open this repository’s **Settings → Pages → Build and deployment** and select **GitHub Actions** as the publishing source. Once the Actions deployment succeeds, visit https://hallojoe.github.io/.

Avoid committing any GitHub tokens.