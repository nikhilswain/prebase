import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  groupResults,
  searchDocs,
  type SearchDoc,
  type SearchResult,
} from '../../lib/search';

declare global {
  interface Window {
    __prepbaseOpenSearch?: boolean;
  }
}

function ResultRow({
  result,
  index,
  active,
  onActivate,
  onSelect,
}: {
  result: SearchResult;
  index: number;
  active: boolean;
  onActivate: (index: number) => void;
  onSelect: (href: string) => void;
}) {
  return (
    <div
      id={`search-option-${index}`}
      role="option"
      aria-selected={active}
      onMouseEnter={() => onActivate(index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(result.href)}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 ${
        active ? 'bg-surface-2' : 'bg-transparent'
      }`}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: result.accent ?? 'var(--ink-3)' }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">
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
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`shrink-0 ${active ? 'text-accent' : 'text-ink-3'}`}
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </div>
  );
}

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const openDialog = useCallback(() => {
    if (typeof document !== 'undefined') {
      restoreRef.current = document.activeElement as HTMLElement | null;
    }
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    restoreRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      window.__prepbaseOpenSearch = false;
      openDialog();
    };
    window.addEventListener('prepbase:open-search', handleOpen);
    if (window.__prepbaseOpenSearch) {
      window.__prepbaseOpenSearch = false;
      openDialog();
    }
    return () => window.removeEventListener('prepbase:open-search', handleOpen);
  }, [openDialog]);

  useEffect(() => {
    if (!open || docs || loading) return;
    setLoading(true);
    fetch('/search-index.json')
      .then((response) => response.json() as Promise<SearchDoc[]>)
      .then((data) => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [open, docs, loading]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleTab = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'input, button, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      } else if (current && !panel.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  const results = useMemo(
    () => (docs ? searchDocs(docs, query) : []),
    [docs, query],
  );
  const groups = useMemo(() => groupResults(results), [results]);
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const optionIndex = useMemo(() => {
    const map = new Map<SearchResult, number>();
    flat.forEach((item, index) => map.set(item, index));
    return map;
  }, [flat]);

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`search-option-${active}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const navigate = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = flat[active];
      if (target) navigate(target.href);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        data-search-overlay
        onClick={closeDialog}
        className="absolute inset-0 bg-black/40 opacity-100 backdrop-blur-[2px] transition-opacity duration-150 ease-out starting:opacity-0 dark:bg-black/60"
        aria-hidden="true"
      />

      <div className="relative mx-auto mt-[9vh] w-[calc(100%-1.5rem)] max-w-xl">
        <div
          ref={panelRef}
          data-search-panel
          role="dialog"
          aria-modal="true"
          aria-label="Search the knowledge base"
          className="overflow-hidden rounded-xl border border-line bg-surface opacity-100 shadow-lg transition duration-150 ease-out starting:scale-[0.98] starting:opacity-0"
        >
          <div className="flex items-center gap-3 border-b border-line px-4">
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
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                flat.length > 0 ? `search-option-${active}` : undefined
              }
              placeholder="Search topics, questions, code examples…"
              autoComplete="off"
              spellCheck={false}
              className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={closeDialog}
              className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Esc
            </button>
          </div>

          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            className="max-h-[58vh] overflow-y-auto p-2"
          >
            {loading && (
              <p className="px-3 py-6 text-center text-sm text-ink-3">
                Loading index…
              </p>
            )}

            {!loading && docs && results.length === 0 && (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-ink-2">
                  No results for{' '}
                  <span className="font-medium text-ink">“{query}”</span>
                </p>
                <p className="mt-1.5 text-xs text-ink-3">
                  Try a broader term, or browse the categories in Explore.
                </p>
              </div>
            )}

            {!loading &&
              groups.map((group) => (
                <div
                  key={group.key}
                  role="group"
                  aria-label={group.label}
                  className="mb-1 last:mb-0"
                >
                  <p className="px-3 pt-3 pb-1.5 font-mono text-[10px] tracking-wider text-ink-3 uppercase">
                    {group.label}
                  </p>
                  {group.items.map((result) => {
                    const index = optionIndex.get(result) ?? 0;
                    return (
                      <ResultRow
                        key={`${group.key}-${result.id}`}
                        result={result}
                        index={index}
                        active={index === active}
                        onActivate={setActive}
                        onSelect={navigate}
                      />
                    );
                  })}
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-[11px] text-ink-3">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">
                  ↑
                </kbd>
                <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">
                  ↓
                </kbd>
                navigate
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">
                  ↵
                </kbd>
                open
              </span>
            </span>
            <span className="flex items-center gap-3">
              {query && results.length > 0 && (
                <span className="font-mono">
                  {results.length} result{results.length === 1 ? '' : 's'}
                </span>
              )}
              {query ? (
                <a
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="font-medium text-accent transition-opacity hover:opacity-80"
                >
                  All results →
                </a>
              ) : (
                <span className="font-mono">Search across every topic</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
