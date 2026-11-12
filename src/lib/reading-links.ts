import type { Tagged } from '../config/portfolio';

export interface ReadingLink extends Tagged {
  id: string;
  date: string;
  title: string;
  url: string;
  comments: string[];
}

export function newestFirst(links: readonly ReadingLink[]): ReadingLink[] {
  return [...links].sort((a, b) => b.date.localeCompare(a.date));
}
