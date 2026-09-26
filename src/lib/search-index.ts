import {
  categories,
  getAllRevisionEntries,
  getItems,
  getTypeLabel,
} from './content';
import type { ContentType, ResolvedItem } from './content-types';
import type { SearchDoc, SearchGroupKey } from './search';

const TYPE_GROUP: Record<ContentType, SearchGroupKey> = {
  question: 'questions',
  concept: 'concepts',
  comparison: 'comparisons',
  challenge: 'challenges',
  gotcha: 'gotchas',
  'cheat-sheet': 'cheat-sheets',
};

function join(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(' \n ');
}

function clamp(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function textOf(item: ResolvedItem): string {
  const base: (string | undefined)[] = [item.summary];

  if (item.type === 'question') {
    base.push(item.shortAnswer, item.realWorld);
    base.push(...(item.explanation ?? []));
    base.push(...(item.keyPoints ?? []));
    base.push(...(item.commonMistakes ?? []));
    base.push(...(item.followUps ?? []));
  } else if (item.type === 'concept') {
    base.push(item.definition);
    base.push(...(item.explanation ?? []));
    base.push(...(item.keyPoints ?? []));
    base.push(...(item.commonMistakes ?? []));
    base.push(...(item.followUps ?? []));
  } else if (item.type === 'comparison') {
    base.push(item.verdict);
    base.push(...item.options.map((option) => `${option.name} ${option.summary ?? ''}`));
    base.push(...item.rows.map((row) => `${row.label} ${row.values.join(' ')}`));
    base.push(...(item.pickWhen ?? []).map((entry) => `${entry.option} ${entry.guidance}`));
  } else if (item.type === 'challenge') {
    base.push(item.prompt);
    base.push(...(item.constraints ?? []));
    base.push(...(item.hints ?? []));
    base.push(...(item.solution.explanation ?? []));
  } else if (item.type === 'gotcha') {
    base.push(item.scenario, item.problem, item.fix);
    base.push(...(item.explanation ?? []));
    base.push(...(item.keyPoints ?? []));
  } else if (item.type === 'cheat-sheet') {
    base.push(item.description);
    for (const section of item.sections) {
      base.push(section.title);
      base.push(
        ...section.items.map((entry) =>
          join([entry.label, entry.value, entry.note]),
        ),
      );
    }
  }

  return join(base).toLowerCase();
}

function codeOf(item: ResolvedItem): string {
  const chunks: (string | undefined)[] = [];
  if (
    item.type === 'question' ||
    item.type === 'concept' ||
    item.type === 'comparison' ||
    item.type === 'gotcha'
  ) {
    chunks.push(item.example?.code);
  }
  if (item.type === 'challenge') {
    chunks.push(item.starterCode?.code, item.solution.code.code);
  }
  if (item.type === 'cheat-sheet') {
    for (const section of item.sections) {
      for (const entry of section.items) chunks.push(entry.code);
    }
  }
  return join(chunks).toLowerCase();
}

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const category of categories) {
    docs.push({
      id: `category:${category.id}`,
      group: 'categories',
      typeLabel: 'Category',
      title: category.name,
      titleLower: category.name.toLowerCase(),
      summary: category.description,
      href: `/${category.id}`,
      accent: category.accent,
      tags: [],
      tagText: category.shortName.toLowerCase(),
      text: category.description.toLowerCase(),
      code: '',
    });
  }

  for (const item of getItems()) {
    docs.push({
      id: item.id,
      group: TYPE_GROUP[item.type],
      typeLabel: getTypeLabel(item.type),
      title: item.title,
      titleLower: item.title.toLowerCase(),
      summary: item.summary,
      href: item.href,
      categoryName: item.categoryShortName,
      accent: item.accent,
      difficulty: item.difficulty,
      tags: item.tags ?? [],
      tagText: (item.tags ?? []).join(' ').toLowerCase(),
      text: clamp(textOf(item), 600),
      code: clamp(codeOf(item), 400),
      featured: item.featured,
    });
  }

  for (const entry of getAllRevisionEntries()) {
    const category = categories.find((item) => item.id === entry.category);
    docs.push({
      id: entry.id,
      group: 'revision',
      typeLabel: 'Revision',
      title: entry.term,
      titleLower: entry.term.toLowerCase(),
      summary: entry.short,
      href: `/quick-revision/${entry.category}#${entry.id}`,
      categoryName: category?.shortName,
      accent: category?.accent,
      tags: entry.tags ?? [],
      tagText: join([entry.term, ...(entry.tags ?? [])]).toLowerCase(),
      text: clamp(
        join([entry.short, entry.medium, entry.detail]).toLowerCase(),
        600,
      ),
      code: '',
    });
  }

  return docs;
}
