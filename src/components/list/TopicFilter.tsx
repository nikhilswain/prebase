import { useMemo, useState, type CSSProperties } from 'react';
import type { Difficulty } from '../../lib/content-types';

export interface LiteItem {
  id: string;
  title: string;
  summary: string;
  href: string;
  typeLabel: string;
  categoryId: string;
  categoryName: string;
  accent: string;
  difficulty?: Difficulty;
  tags: string[];
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 text-ink-3"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export default function TopicFilter({
  items,
  placeholder = 'Filter…',
  emptyLabel = 'Nothing matches those filters yet.',
}: {
  items: LiteItem[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [animated, setAnimated] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; accent: string }>();
    for (const item of items) {
      if (!map.has(item.categoryId)) {
        map.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
          accent: item.accent,
        });
      }
    }
    return [...map.values()];
  }, [items]);

  const hasDifficulty = useMemo(
    () => items.some((item) => item.difficulty),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.categoryId !== category) return false;
      if (difficulty !== 'all' && item.difficulty !== difficulty) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.summary.toLowerCase().includes(needle) ||
        item.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [items, query, category, difficulty]);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <label className="flex h-10 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 focus-within:border-line-strong">
          <SearchIcon />
          <input
            id="topic-filter"
            name="topic-filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
        </label>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setAnimated(true);
              }}
              aria-pressed={category === 'all'}
              className={`rounded-full border px-3 py-1 text-[13px] transition duration-150 ease-out active:scale-[0.97] ${
                category === 'all'
                  ? 'border-accent-line bg-accent-soft font-medium text-accent'
                  : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'
              }`}
            >
              All
            </button>
            {categories.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setCategory(entry.id);
                  setAnimated(true);
                }}
                aria-pressed={category === entry.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition duration-150 ease-out active:scale-[0.97] ${
                  category === entry.id
                    ? 'border-accent-line bg-accent-soft font-medium text-accent'
                    : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'
                }`}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: entry.accent }}
                  aria-hidden="true"
                />
                {entry.name}
              </button>
            ))}
          </div>

          {hasDifficulty && (
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setDifficulty((current) =>
                      current === value ? 'all' : value,
                    );
                    setAnimated(true);
                  }}
                  aria-pressed={difficulty === value}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase transition duration-150 ease-out active:scale-[0.97] ${
                    difficulty === value
                      ? 'border-accent-line bg-accent-soft text-accent'
                      : 'border-line text-ink-3 hover:border-line-strong hover:text-ink-2'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>

        <p
          className="font-mono text-[11px] tracking-wide text-ink-3 uppercase"
          aria-live="polite"
        >
          {filtered.length} of {items.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div
          className={`mt-8 rounded-lg border border-dashed border-line-strong px-5 py-12 text-center ${
            animated ? 'enter-list' : ''
          }`}
        >
          <p className="text-sm text-ink-2">{emptyLabel}</p>
        </div>
      ) : (
        <ul
          key={animated ? `${category}|${difficulty}` : 'initial'}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((item, index) => (
            <li
              key={item.id}
              style={
                animated
                  ? ({
                      '--enter-delay': `${Math.min(index, 9) * 32}ms`,
                    } as CSSProperties)
                  : undefined
              }
              className={animated ? 'enter-list' : undefined}
            >
              <a
                href={item.href}
                className="group flex h-full flex-col gap-2.5 rounded-lg border border-line bg-surface p-4 transition duration-150 ease-out can-hover:-translate-y-0.5 can-hover:border-line-strong can-hover:shadow-md sm:p-5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] tracking-wide text-ink-3 uppercase">
                    {item.typeLabel}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: item.accent }}
                      aria-hidden="true"
                    />
                    {item.categoryName}
                  </span>
                </span>
                <span className="text-[15px] leading-snug font-medium tracking-tight text-ink transition-colors group-hover:text-accent">
                  {item.title}
                </span>
                <span className="line-clamp-2 text-sm leading-relaxed text-ink-2">
                  {item.summary}
                </span>
                {item.difficulty && (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1.5 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {item.difficulty}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
