import categoriesData from '../data/categories.json';
import type {
  Category,
  ContentItem,
  ContentType,
  Difficulty,
  ResolvedItem,
  RevisionEntry,
  RevisionFile,
} from './content-types';

const topicModules = import.meta.glob('../data/topics/*.json', { eager: true });
const revisionModules = import.meta.glob('../data/revision/*.json', {
  eager: true,
});

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function readDefault<T>(mod: unknown): T {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

export const categories: Category[] = [...(categoriesData as Category[])].sort(
  (a, b) => a.order - b.order,
);

const categoryById = new Map(categories.map((category) => [category.id, category]));

function collectItems(): ContentItem[] {
  const collected: ContentItem[] = [];
  for (const mod of Object.values(topicModules)) {
    const list = readDefault<ContentItem[]>(mod);
    if (Array.isArray(list)) collected.push(...list);
  }
  return collected;
}

function validate(items: ContentItem[]): void {
  const problems: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const item of items) {
    if (!item.id) problems.push(`An item is missing an "id".`);
    if (!item.slug) problems.push(`Item "${item.id}" is missing a "slug".`);
    if (!item.title) problems.push(`Item "${item.id}" is missing a "title".`);
    if (!item.summary) problems.push(`Item "${item.id}" is missing a "summary".`);
    if (!categoryById.has(item.category)) {
      problems.push(`Item "${item.id}" references unknown category "${item.category}".`);
    }

    if (ids.has(item.id)) problems.push(`Duplicate item id "${item.id}".`);
    ids.add(item.id);

    const slugKey = `${item.category}/${item.slug}`;
    if (slugs.has(slugKey)) problems.push(`Duplicate slug "${slugKey}".`);
    slugs.add(slugKey);

    if (item.type === 'question' && !item.shortAnswer) {
      problems.push(`Question "${item.id}" is missing a "shortAnswer".`);
    }
    if (item.type === 'concept' && !item.definition) {
      problems.push(`Concept "${item.id}" is missing a "definition".`);
    }
    if (item.type === 'comparison') {
      if (!item.rows?.length) problems.push(`Comparison "${item.id}" has no rows.`);
      if (!item.options?.length) problems.push(`Comparison "${item.id}" has no options.`);
      for (const row of item.rows ?? []) {
        if (row.values.length !== item.options.length) {
          problems.push(
            `Comparison "${item.id}" row "${row.label}" has ${row.values.length} values but there are ${item.options.length} options.`,
          );
        }
      }
    }
    if (item.type === 'challenge' && !item.solution?.code?.code) {
      problems.push(`Challenge "${item.id}" is missing a solution.`);
    }
    if (item.type === 'cheat-sheet' && !item.sections?.length) {
      problems.push(`Cheat sheet "${item.id}" has no sections.`);
    }
  }

  if (problems.length) {
    throw new Error(`Content validation failed:\n- ${problems.join('\n- ')}`);
  }

  const dangling = new Set<string>();
  for (const item of items) {
    for (const id of item.related ?? []) {
      if (!ids.has(id)) dangling.add(`${item.id} → ${id}`);
    }
  }
  if (dangling.size) {
    console.warn(
      `[content] ${dangling.size} related reference(s) point to missing topics:\n  ${[...dangling].join('\n  ')}`,
    );
  }
}

const allItems = collectItems();
validate(allItems);

function resolve(item: ContentItem): ResolvedItem {
  const category = categoryById.get(item.category);
  return {
    ...item,
    href: `/${item.category}/${item.slug}`,
    categoryName: category?.name ?? item.category,
    categoryShortName: category?.shortName ?? item.category,
    accent: category?.accent ?? '#8b8b96',
  } as ResolvedItem;
}

export const items: ResolvedItem[] = allItems.map(resolve);

const itemById = new Map(items.map((item) => [item.id, item]));
const itemByPath = new Map(items.map((item) => [`${item.category}/${item.slug}`, item]));

const itemsByCategory = new Map<string, ResolvedItem[]>();
for (const category of categories) {
  itemsByCategory.set(
    category.id,
    items
      .filter((item) => item.category === category.id)
      .sort((a, b) => a.title.localeCompare(b.title)),
  );
}

export function getCategories(): Category[] {
  return categories;
}

export function getLiveCategories(): Category[] {
  return categories.filter((category) => category.status === 'live');
}

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id);
}

export function getCategoryBySlug(id: string): Category | undefined {
  return categoryById.get(id);
}

export function getItems(): ResolvedItem[] {
  return items;
}

export function getItemsByCategory(id: string): ResolvedItem[] {
  return itemsByCategory.get(id) ?? [];
}

export function getItemsByType(type: ContentType): ResolvedItem[] {
  return items.filter((item) => item.type === type);
}

export function getFeatured(limit = 6): ResolvedItem[] {
  const featured = items.filter((item) => item.featured);
  const pool = featured.length ? featured : items;
  return pool.slice(0, limit);
}

export function getItem(id: string): ResolvedItem | undefined {
  return itemById.get(id);
}

export function getItemByPath(category: string, slug: string): ResolvedItem | undefined {
  return itemByPath.get(`${category}/${slug}`);
}

export function resolveRelated(item: ContentItem): ResolvedItem[] {
  return (item.related ?? [])
    .map((id) => itemById.get(id))
    .filter((entry): entry is ResolvedItem => Boolean(entry));
}

export function getCategoryHref(id: string): string {
  return `/${id}`;
}

export function sortByDifficulty(list: ResolvedItem[]): ResolvedItem[] {
  return [...list].sort((a, b) => {
    const left = a.difficulty ? DIFFICULTY_ORDER[a.difficulty] : 9;
    const right = b.difficulty ? DIFFICULTY_ORDER[b.difficulty] : 9;
    return left - right;
  });
}

export function getRevisionEntries(categoryId: string): RevisionEntry[] {
  for (const mod of Object.values(revisionModules)) {
    const file = readDefault<RevisionFile>(mod);
    if (file?.category === categoryId) {
      return file.entries ?? [];
    }
  }
  return [];
}

export function getAllRevisionEntries(): RevisionEntry[] {
  const entries: RevisionEntry[] = [];
  for (const category of categories) {
    entries.push(...getRevisionEntries(category.id));
  }
  return entries;
}

export function getRevisionCount(): number {
  return getAllRevisionEntries().length;
}

export function getTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    question: 'Interview question',
    concept: 'Concept',
    comparison: 'Comparison',
    challenge: 'Code challenge',
    gotcha: 'Gotcha',
    'cheat-sheet': 'Cheat sheet',
  };
  return labels[type];
}

export function getStats() {
  return {
    topics: items.length,
    questions: items.filter((item) => item.type === 'question').length,
    comparisons: items.filter((item) => item.type === 'comparison').length,
    challenges: items.filter((item) => item.type === 'challenge').length,
    cheatSheets: items.filter((item) => item.type === 'cheat-sheet').length,
    revision: getRevisionCount(),
    categories: getLiveCategories().length,
  };
}
