import type { AnimatedTextConfig } from '../lib/animated-text';

export const headline = {
  pretext: ['Together', 'Discover', 'Explore'],
  posttext: ['things', 'ideas', 'tools'],
  left: { effect: 'type', holdMs: 3600 },
  right: { effect: 'spin-vertical', holdMs: 2400 },
} satisfies AnimatedTextConfig;

// Tag order controls the order of groups in every section.
export const tags = ['3D', '.NET', 'Umbraco', 'Humans'] as const;
export type Tag = typeof tags[number];
export interface Tagged {
  tags: readonly [Tag, ...Tag[]];
}

export const repositories = [
  { name: 'cubing', tags: ['3D'] },
  { name: 'authentication-nemlogin3', tags: ['.NET'] },
  { name: 'umbraco-topology', tags: ['Umbraco'] },
  { name: 'planetary', tags: ['3D'] },
  { name: 'solar-storm-simulator', tags: ['3D'] },
  { name: 'hilbert-space', tags: ['3D'] },
  { name: 'terminal-theme-for-umbraco', tags: ['Umbraco'] },
  { name: 'nemlogin3-for-umbraco', tags: ['Umbraco'] },
  { name: 'http-headers-for-umbraco', tags: ['Umbraco'] },
] satisfies (Tagged & { name: string })[];

export const selectedGists = [
  { id: 'cd0bc288afdeb0de7d4feceda37c4a03', title: 'SQL Server on Apple Silicon', tags: ['.NET'] },
  { id: 'ba99d60c01d3c00f9c4cfcad4c874c50', title: 'Customizing Claude spinner verbs', tags: ['Humans'] },
  { id: '4cf68bdeaaffc986c4ceed3d15c984ea', title: 'XML Serialization Control in C#', tags: ['.NET'] },
  { id: 'b2739eb8e19eed05d3965a733da1cff4', title: 'Danish computing pioneers', tags: ['Humans'] },
] satisfies (Tagged & { id: string; title: string })[];

export const links = [
  { title: 'Announcing .NET 11', url: 'https://devblogs.microsoft.com/dotnet/announcing-dotnet-11/', tags: ['.NET'] },
  { title: 'Delivering skills in NuGet packages', url: 'https://devblogs.microsoft.com/dotnet/delivering-skills-in-nuget-packages/', tags: ['.NET'] },
] satisfies (Tagged & { title: string; url: string })[];

export function groupByTag<T extends Tagged>(items: readonly T[]) {
  return tags.map(tag => ({ tag, items: items.filter(item => item.tags.includes(tag)) }))
    .filter(group => group.items.length > 0);
}
