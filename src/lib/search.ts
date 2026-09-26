import type { Difficulty } from './content-types';

export type SearchGroupKey =
  | 'categories'
  | 'questions'
  | 'concepts'
  | 'comparisons'
  | 'code'
  | 'gotchas'
  | 'challenges'
  | 'cheat-sheets'
  | 'revision';

export interface SearchDoc {
  id: string;
  group: SearchGroupKey;
  typeLabel: string;
  title: string;
  titleLower: string;
  summary: string;
  href: string;
  categoryName?: string;
  accent?: string;
  difficulty?: Difficulty;
  tags: string[];
  tagText: string;
  text: string;
  code: string;
  featured?: boolean;
}

export interface SearchResult extends SearchDoc {
  score: number;
  matchKind: 'title' | 'tag' | 'body' | 'code';
  resultGroup: SearchGroupKey;
}

export const GROUP_LABELS: Record<SearchGroupKey, string> = {
  categories: 'Categories',
  questions: 'Questions',
  concepts: 'Concepts',
  comparisons: 'Comparisons',
  code: 'Code',
  gotchas: 'Gotchas',
  challenges: 'Challenges',
  'cheat-sheets': 'Cheat Sheets',
  revision: 'Revision',
};

export const GROUP_ORDER: SearchGroupKey[] = [
  'categories',
  'questions',
  'concepts',
  'comparisons',
  'code',
  'gotchas',
  'challenges',
  'cheat-sheets',
  'revision',
];

function isFuzzyMatch(haystack: string, needle: string): boolean {
  let index = 0;
  for (const char of needle) {
    index = haystack.indexOf(char, index);
    if (index === -1) return false;
    index += 1;
  }
  return true;
}

function scoreDoc(doc: SearchDoc, tokens: string[], query: string) {
  const title = doc.titleLower;
  let score = 0;
  let matchKind: SearchResult['matchKind'] | 'none' = 'none';
  let codeHit = false;

  if (title === query) {
    score += 200;
    matchKind = 'title';
  } else if (title.startsWith(query)) {
    score += 120;
    matchKind = 'title';
  } else if (title.includes(query)) {
    score += 80;
    matchKind = 'title';
  }

  if (doc.tagText === query || doc.tagText.includes(` ${query} `)) {
    score += 60;
    if (matchKind === 'none') matchKind = 'tag';
  }

  let matchedAll = true;
  for (const token of tokens) {
    let hit = false;
    if (title.includes(token)) {
      score += 40;
      hit = true;
      if (matchKind === 'none') matchKind = 'title';
    } else if (doc.tagText.includes(token)) {
      score += 30;
      hit = true;
      if (matchKind === 'none') matchKind = 'tag';
    } else if (doc.text.includes(token)) {
      score += 12;
      hit = true;
      if (matchKind === 'none') matchKind = 'body';
    } else if (doc.code.includes(token)) {
      score += 10;
      hit = true;
      codeHit = true;
    } else if (token.length >= 3 && isFuzzyMatch(title, token)) {
      score += 8;
      hit = true;
      if (matchKind === 'none') matchKind = 'title';
    }
    if (!hit) matchedAll = false;
  }

  if (!matchedAll) score -= 60;
  if (doc.featured) score += 4;

  const resolvedKind: SearchResult['matchKind'] =
    matchKind === 'none' && codeHit ? 'code' : (matchKind as SearchResult['matchKind']);

  return { score, matchKind: resolvedKind, codeHit };
}

function resultGroupFor(
  doc: SearchDoc,
  matchKind: SearchResult['matchKind'],
): SearchGroupKey {
  if (doc.group === 'categories' || doc.group === 'revision') return doc.group;
  if (matchKind === 'code') return 'code';
  return doc.group;
}

export function searchDocs(
  docs: SearchDoc[],
  rawQuery: string,
  limit = 30,
): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return docs
      .filter((doc) => doc.featured || doc.group === 'categories')
      .slice(0, limit)
      .map((doc) => ({
        ...doc,
        score: 0,
        matchKind: 'title' as const,
        resultGroup: doc.group,
      }));
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const doc of docs) {
    const { score, matchKind } = scoreDoc(doc, tokens, query);
    if (score <= 0) continue;
    results.push({
      ...doc,
      score,
      matchKind,
      resultGroup: resultGroupFor(doc, matchKind),
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });

  return results.slice(0, limit);
}

export function groupResults(results: SearchResult[]) {
  const byGroup = new Map<SearchGroupKey, SearchResult[]>();
  for (const result of results) {
    const list = byGroup.get(result.resultGroup);
    if (list) list.push(result);
    else byGroup.set(result.resultGroup, [result]);
  }
  return GROUP_ORDER.filter((key) => byGroup.has(key)).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: byGroup.get(key) ?? [],
  }));
}
