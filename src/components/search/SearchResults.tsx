import { useEffect, useMemo, useState } from 'react';
import { groupResults, searchDocs, type SearchDoc } from '../../lib/search';

interface BrowseCategory {
  name: string;
  href: string;
  accent: string;
}

interface BrowseTopic {
  title: string;
  href: string;
  summary: string;
  typeLabel: string;
  accent: string;
}

export default function SearchResults({
  categories,
  topics,
}: {
  categories: BrowseCategory[];
  topics: BrowseTopic[];
}) {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') ?? '';
    setQuery(initial);
    setActiveQuery(initial);
  }, []);

  useEffect(() => {
    if (!activeQuery || docs || loading) return;
    setLoading(true);
    fetch('/search-index.json')
      .then((response) => response.json() as Promise<SearchDoc[]>)
      .then((data) => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [activeQuery, docs, loading]);

  const results = useMemo(
    () => (docs && activeQuery ? searchDocs(docs, activeQuery, 60) : []),
    [docs, activeQuery],
  );
  const groups = useMemo(() => groupResults(results), [results]);

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const value = query.trim();
    setActiveQuery(value);
    const url = value ? `/search?q=${encodeURIComponent(value)}` : '/search';
    window.history.replaceState(null, '', url);
  };

  return (
    <div>
      <form onSubmit={submit} role="search" className="max-w-xl">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-line bg-surface px-4 shadow-xs focus-within:border-line-strong">
          <svg
            width="17"
            height="17"
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
          <span className="sr-only">Search the knowledge base</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            name="q"
            placeholder="Search topics, questions, code examples…"
            autoComplete="off"
            className="h-full flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-ink transition duration-150 ease-out hover:bg-accent-hover active:scale-[0.98]"
          >
            Search
          </button>
        </label>
      </form>

      <p className="mt-3 text-xs text-ink-3">
        Tip: press{' '}
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
          ⌘K
        </kbd>{' '}
        anywhere to search from the command palette.
      </p>

      {!activeQuery && (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="search-categories">
            <h2 id="search-categories" className="eyebrow">
              Browse categories
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.href}>
                  <a
                    href={category.href}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-2 transition duration-150 ease-out hover:border-line-strong hover:text-ink"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ background: category.accent }}
                      aria-hidden="true"
                    />
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="search-popular">
            <h2 id="search-popular" className="eyebrow">
              Popular topics
            </h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {topics.map((topic) => (
                <li key={topic.href}>
                  <a
                    href={topic.href}
                    className="group flex items-center gap-3 py-2.5"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: topic.accent }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                        {topic.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-3">
                        {topic.summary}
                      </span>
                    </span>
                    <span className="hidden shrink-0 font-mono text-[10px] tracking-wide text-ink-3 uppercase sm:block">
                      {topic.typeLabel}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeQuery && loading && (
        <p className="mt-10 text-sm text-ink-3">Searching…</p>
      )}

      {activeQuery && !loading && docs && results.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-line-strong px-5 py-12 text-center">
          <p className="text-sm text-ink-2">
            No results for{' '}
            <span className="font-medium text-ink">“{activeQuery}”</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-3">
            Try a shorter or more general term.
          </p>
        </div>
      )}

      {activeQuery && !loading && results.length > 0 && (
        <div className="mt-10">
          <p className="font-mono text-[11px] tracking-wide text-ink-3 uppercase">
            {results.length} result{results.length === 1 ? '' : 's'} for “
            {activeQuery}”
          </p>
          <div className="mt-6 space-y-8">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`group-${group.key}`}>
                <h2 id={`group-${group.key}`} className="eyebrow">
                  {group.label}
                </h2>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {group.items.map((result) => (
                    <li key={result.id}>
                      <a
                        href={result.href}
                        className="group flex items-center gap-3 py-3"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: result.accent ?? 'var(--ink-3)' }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                            {result.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-ink-3">
                            {result.summary}
                          </span>
                        </span>
                        <span className="hidden shrink-0 font-mono text-[10px] tracking-wide text-ink-3 uppercase sm:block">
                          {result.typeLabel}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-accent"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
