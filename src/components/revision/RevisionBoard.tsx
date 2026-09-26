import { useEffect, useMemo, useState } from 'react';

export interface RevisionCard {
  id: string;
  term: string;
  short: string;
  medium?: string;
  detail?: string;
  relatedHref?: string;
  relatedTitle?: string;
}

type Mode = '30s' | '1min' | 'detail';

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: '30s', label: '30 seconds', hint: 'One line per card' },
  { key: '1min', label: '1 minute', hint: 'Adds the short explanation' },
  { key: 'detail', label: 'Detail', hint: 'Full explanation' },
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export default function RevisionBoard({
  categoryId,
  entries,
}: {
  categoryId: string;
  entries: RevisionCard[];
}) {
  const [mode, setMode] = useState<Mode>('30s');
  const [revised, setRevised] = useState<string[]>([]);
  const [hideRevised, setHideRevised] = useState(false);
  const storageKey = `prepbase:revision:${categoryId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setRevised(JSON.parse(raw) as string[]);
    } catch {}
  }, [storageKey]);

  const revisedSet = useMemo(() => new Set(revised), [revised]);
  const total = entries.length;
  const doneCount = entries.filter((entry) => revisedSet.has(entry.id)).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const persist = (next: string[]) => {
    setRevised(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const toggle = (id: string) => {
    persist(
      revisedSet.has(id)
        ? revised.filter((entry) => entry !== id)
        : [...revised, id],
    );
  };

  const visible = hideRevised
    ? entries.filter((entry) => !revisedSet.has(entry.id))
    : entries;

  return (
    <div data-revision data-mode={mode}>
      <div className="sticky top-14 z-30 -mx-5 mb-6 border-b border-line bg-canvas/85 px-5 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            role="group"
            aria-label="Revision depth"
            className="inline-flex rounded-lg border border-line bg-surface p-0.5"
          >
            {MODES.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setMode(entry.key)}
                aria-pressed={mode === entry.key}
                title={entry.hint}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150 ease-out ${
                  mode === entry.key
                    ? 'bg-surface-2 font-medium text-ink'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="flex min-w-[12rem] flex-1 items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={doneCount}
              aria-label="Revision progress"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-3">
              {doneCount}/{total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHideRevised((value) => !value)}
              aria-pressed={hideRevised}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] transition-colors duration-150 ease-out ${
                hideRevised
                  ? 'border-accent-line bg-accent-soft text-accent'
                  : 'border-line text-ink-3 hover:text-ink'
              }`}
            >
              Hide revised
            </button>
            <button
              type="button"
              onClick={() => persist([])}
              disabled={doneCount === 0}
              className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-ink-3 transition-colors duration-150 ease-out hover:text-ink disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong px-5 py-12 text-center">
          <p className="text-sm font-medium text-ink">Everything revised.</p>
          <p className="mt-1 text-sm text-ink-3">
            Turn off “Hide revised” to review the cards again.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {visible.map((entry) => {
            const isRevised = revisedSet.has(entry.id);
            return (
              <li
                key={entry.id}
                id={entry.id}
                className={`scroll-mt-36 rounded-lg border p-4 transition-colors duration-150 ease-out sm:p-5 ${
                  isRevised
                    ? 'border-line bg-surface-2/60'
                    : 'border-line bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className={`text-[15px] font-medium tracking-tight ${
                      isRevised ? 'text-ink-2' : 'text-ink'
                    }`}
                  >
                    {entry.term}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-pressed={isRevised}
                    aria-label={
                      isRevised
                        ? `Mark ${entry.term} as not revised`
                        : `Mark ${entry.term} as revised`
                    }
                    className={`grid size-7 shrink-0 place-items-center rounded-full border transition-colors duration-150 ease-out ${
                      isRevised
                        ? 'border-easy/40 bg-easy/10 text-easy'
                        : 'border-line text-ink-3 hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    <CheckIcon />
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {entry.short}
                </p>

                {entry.medium && (
                  <p
                    data-level="medium"
                    className="mt-3 text-sm leading-relaxed text-ink-2"
                  >
                    {entry.medium}
                  </p>
                )}

                {entry.detail && (
                  <p
                    data-level="detail"
                    className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-2"
                  >
                    {entry.detail}
                  </p>
                )}

                {entry.relatedHref && (
                  <a
                    href={entry.relatedHref}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:opacity-80"
                  >
                    Full topic: {entry.relatedTitle}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
