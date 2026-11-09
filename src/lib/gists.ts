import { selectedGists } from '../config/gists';

interface GithubGist {
  id: string;
  html_url: string;
  description: string | null;
  public: boolean;
  owner: { login: string } | null;
  files: Record<string, { filename: string; language: string | null }>;
  updated_at: string;
}

export interface FeaturedGist {
  title: string;
  description: string | null;
  url: string;
  language: string | null;
  fileCount: number;
  updatedAt: string;
}

async function getGist(id: string, title: string): Promise<FeaturedGist | null> {
  try {
    const response = await fetch('https://api.github.com/gists/' + encodeURIComponent(id), {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'hallojoe-github-pages',
      },
    });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    const gist = await response.json() as GithubGist;
    if (!gist.public || gist.owner?.login?.toLowerCase() !== 'hallojoe') {
      throw new Error('Gist is not a public gist owned by hallojoe');
    }
    const files = Object.values(gist.files ?? {});
    return {
      title,
      description: gist.description || null,
      url: 'https://gist.github.com/hallojoe/' + id,
      language: files.find((file) => file.language)?.language ?? null,
      fileCount: files.length,
      updatedAt: gist.updated_at,
    };
  } catch (error) {
    // A temporarily unavailable gist should not break a production deployment.
    console.warn('Could not load selected gist ' + id, error);
    return null;
  }
}

export async function getFeaturedGists(): Promise<FeaturedGist[]> {
  const results = await Promise.all(selectedGists.map(({ id, title }) => getGist(id, title)));
  return results.filter((gist): gist is FeaturedGist => gist !== null);
}
