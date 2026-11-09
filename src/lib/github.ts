const USERNAME = 'hallojoe';

interface Repository {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  owner: { login: string };
  primaryLanguage: { name: string; color: string | null } | null;
}

export interface Project {
  name: string;
  description: string | null;
  repoUrl: string;
  pagesUrl: string | null;
  stars: number;
  language: string | null;
  languageColor: string | null;
}

export interface PortfolioData {
  profile: { name: string; bio: string | null; avatarUrl: string; url: string };
  projects: Project[];
}

interface GraphResponse {
  data?: {
    user?: {
      name: string | null;
      bio: string | null;
      avatarUrl: string;
      url: string;
      pinnedItems: { nodes: (Repository | null)[] };
    } | null;
  };
  errors?: { message: string }[];
}

const query = [
  'query Portfolio($login: String!) {',
  '  user(login: $login) {',
  '    name bio avatarUrl(size: 192) url',
  '    pinnedItems(first: 6, types: REPOSITORY) {',
  '      nodes { ... on Repository {',
  '        name description url homepageUrl stargazerCount',
  '        owner { login }',
  '        primaryLanguage { name color }',
  '      } }',
  '    }',
  '  }',
  '}',
].join('\n');

async function publishedPagesUrl(repo: Repository): Promise<string | null> {
  const api = 'https://api.github.com/repos/' +
    encodeURIComponent(repo.owner.login) + '/' +
    encodeURIComponent(repo.name) + '/pages';
  try {
    const response = await fetch(api, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'hallojoe-github-pages',
      },
    });
    if (response.ok) {
      const pages = await response.json() as { html_url?: string };
      if (pages.html_url && pages.html_url.startsWith('https://')) return pages.html_url;
    } else if (response.status !== 404) {
      console.warn('Pages lookup failed for ' + repo.name + ': ' + response.status);
    }
  } catch (error) {
    console.warn('Pages lookup failed for ' + repo.name, error);
  }

  // No guessed Pages URLs: only trust a deliberately supplied GitHub Pages homepage.
  try {
    if (repo.homepageUrl) {
      const home = new URL(repo.homepageUrl);
      if (home.protocol === 'https:' &&
          (home.hostname === 'github.io' || home.hostname.endsWith('.github.io'))) {
        return home.href;
      }
    }
  } catch { /* Invalid homepage */ }
  return null;
}

export async function getPortfolioData(): Promise<PortfolioData> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required during the Astro build');
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      'User-Agent': 'hallojoe-github-pages',
    },
    body: JSON.stringify({ query, variables: { login: USERNAME } }),
  });
  if (!response.ok) {
    throw new Error('GitHub GraphQL returned HTTP ' + response.status);
  }
  const payload = await response.json() as GraphResponse;
  if (payload.errors?.length) {
    throw new Error('GitHub GraphQL: ' + payload.errors.map(e => e.message).join('; '));
  }
  const user = payload.data?.user;
  if (!user) throw new Error('GitHub user not found: ' + USERNAME);

  const repos = user.pinnedItems.nodes.filter(
    (node): node is Repository => !!node && typeof node.url === 'string',
  );
  const projects: Project[] = await Promise.all(repos.map(async (repo) => ({
    name: repo.name,
    description: repo.description,
    repoUrl: repo.url,
    pagesUrl: await publishedPagesUrl(repo),
    stars: repo.stargazerCount,
    language: repo.primaryLanguage?.name ?? null,
    languageColor: repo.primaryLanguage?.color ?? null,
  })));

  return {
    profile: {
      name: user.name || USERNAME,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      url: user.url,
    },
    projects,
  };
}
