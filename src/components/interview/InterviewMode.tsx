import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface InterviewQuestion {
  id: string;
  href: string;
  prompt: string;
  answer: string;
  kind: 'question' | 'concept';
  categoryId: string;
  categoryName: string;
  accent: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  followUps?: string[];
}

interface QuestionStat {
  knew: number;
  missed: number;
}

type Phase = 'setup' | 'session' | 'done';
type Length = 5 | 10 | 20 | 'all';

const STATS_KEY = 'prepbase:interview:stats';
const LAST_KEY = 'prepbase:interview:last';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition duration-150 ease-out active:scale-[0.97] ${
        active
          ? 'border-accent-line bg-accent-soft font-medium text-accent'
          : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function InterviewMode({
  questions,
}: {
  questions: InterviewQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>(
    'all',
  );
  const [length, setLength] = useState<Length>(10);
  const [stats, setStats] = useState<Record<string, QuestionStat>>({});
  const [deck, setDeck] = useState<InterviewQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, 'knew' | 'missed'>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats(JSON.parse(raw) as Record<string, QuestionStat>);
    } catch {}
  }, []);

  const availableCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; accent: string }>();
    for (const question of questions) {
      if (!map.has(question.categoryId)) {
        map.set(question.categoryId, {
          id: question.categoryId,
          name: question.categoryName,
          accent: question.accent,
        });
      }
    }
    return [...map.values()];
  }, [questions]);

  const weakIds = useMemo(
    () =>
      Object.entries(stats)
        .filter(([, value]) => value.missed > value.knew)
        .map(([id]) => id)
        .filter((id) => questions.some((question) => question.id === id)),
    [stats, questions],
  );

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      if (categories.length > 0 && !categories.includes(question.categoryId)) {
        return false;
      }
      if (difficulty !== 'all' && question.difficulty !== difficulty) {
        return false;
      }
      return true;
    });
  }, [questions, categories, difficulty]);

  const start = useCallback(
    (pool: InterviewQuestion[], count: Length) => {
      const ordered = shuffle(pool);
      const limited =
        count === 'all' ? ordered : ordered.slice(0, Math.min(count, ordered.length));
      if (limited.length === 0) return;
      setDeck(limited);
      setIndex(0);
      setRevealed(false);
      setOutcomes({});
      setPhase('session');
    },
    [],
  );

  const record = useCallback(
    (outcome: 'knew' | 'missed') => {
      const current = deck[index];
      if (!current) return;

      setStats((previous) => {
        const existing = previous[current.id] ?? { knew: 0, missed: 0 };
        const next = {
          ...previous,
          [current.id]: {
            knew: existing.knew + (outcome === 'knew' ? 1 : 0),
            missed: existing.missed + (outcome === 'missed' ? 1 : 0),
          },
        };
        try {
          localStorage.setItem(STATS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      const nextOutcomes = { ...outcomes, [index]: outcome };
      setOutcomes(nextOutcomes);

      if (index + 1 >= deck.length) {
        const attempted = Object.keys(nextOutcomes).length;
        const knew = Object.values(nextOutcomes).filter(
          (entry) => entry === 'knew',
        ).length;
        try {
          localStorage.setItem(
            LAST_KEY,
            JSON.stringify({
              date: new Date().toISOString(),
              total: attempted,
              knew,
            }),
          );
        } catch {}
        setPhase('done');
      } else {
        setIndex((value) => value + 1);
        setRevealed(false);
      }
    },
    [deck, index, outcomes],
  );

  useEffect(() => {
    if (phase !== 'session') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        if (!revealed) {
          event.preventDefault();
          setRevealed(true);
        }
      } else if (revealed && (event.key === '1' || event.key === '2')) {
        event.preventDefault();
        record(event.key === '1' ? 'missed' : 'knew');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, revealed, record]);

  if (phase === 'setup') {
    return (
      <div className="space-y-8">
        <section aria-labelledby="interview-category">
          <h2 id="interview-category" className="eyebrow">
            Category
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              active={categories.length === 0}
              onClick={() => setCategories([])}
            >
              All categories
            </Chip>
            {availableCategories.map((category) => (
              <Chip
                key={category.id}
                active={categories.includes(category.id)}
                onClick={() =>
                  setCategories((current) =>
                    current.includes(category.id)
                      ? current.filter((id) => id !== category.id)
                      : [...current, category.id],
                  )
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: category.accent }}
                  aria-hidden="true"
                />
                {category.name}
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="interview-difficulty">
          <h2 id="interview-difficulty" className="eyebrow">
            Difficulty
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map((value) => (
              <Chip
                key={value}
                active={difficulty === value}
                onClick={() => setDifficulty(value)}
              >
                {value === 'all' ? 'Any' : value}
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="interview-length">
          <h2 id="interview-length" className="eyebrow">
            Session length
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {([5, 10, 20, 'all'] as const).map((value) => (
              <Chip
                key={String(value)}
                active={length === value}
                onClick={() => setLength(value)}
              >
                {value === 'all' ? 'Everything' : `${value} questions`}
              </Chip>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => start(filtered, length)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition duration-150 ease-out hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
          >
            Start session
            <span className="font-mono text-xs opacity-80">
              {Math.min(
                length === 'all' ? filtered.length : length,
                filtered.length,
              )}{' '}
              questions
            </span>
          </button>

          {weakIds.length > 0 && (
            <button
              type="button"
              onClick={() =>
                start(
                  questions.filter((question) => weakIds.includes(question.id)),
                  'all',
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition duration-150 ease-out hover:border-line-strong active:scale-[0.98]"
            >
              Practice weak topics
              <span className="font-mono text-xs text-ink-3">{weakIds.length}</span>
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed text-ink-3">
          Answer out loud before revealing. Use{' '}
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
            Space
          </kbd>{' '}
          to reveal, then{' '}
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
            1
          </kbd>{' '}
          for missed and{' '}
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">
            2
          </kbd>{' '}
          for knew it.
        </p>
      </div>
    );
  }

  if (phase === 'session') {
    const current = deck[index];
    const progress = Math.round((index / deck.length) * 100);

    return (
      <div>
        <div className="flex items-center justify-between gap-4 text-xs text-ink-3">
          <span className="font-mono">
            Question {index + 1} / {deck.length}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: current.accent }}
              aria-hidden="true"
            />
            {current.categoryName}
            {current.difficulty && (
              <span className="text-ink-3">· {current.difficulty}</span>
            )}
          </span>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>

        <div className="enter mt-6 rounded-xl border border-line bg-surface p-5 sm:p-8">
          <p className="eyebrow">
            {current.kind === 'concept'
              ? 'Explain this concept'
              : 'Interview question'}
          </p>
          <h2 className="mt-2.5 text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">
            {current.prompt}
          </h2>

          {!revealed ? (
            <div className="mt-7">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition duration-150 ease-out hover:bg-accent-hover active:scale-[0.98]"
              >
                Reveal answer
              </button>
            </div>
          ) : (
            <div className="enter mt-6 space-y-6">
              <div className="rounded-lg border-l-2 border-l-accent bg-surface-2 p-4 sm:p-5">
                <p className="eyebrow mb-2">Model answer</p>
                <p className="text-[15px] leading-relaxed text-ink">
                  {current.answer}
                </p>
              </div>

              {current.followUps && current.followUps.length > 0 && (
                <div>
                  <p className="eyebrow">Follow-ups</p>
                  <ul className="mt-2.5 space-y-2">
                    {current.followUps.map((followUp) => (
                      <li
                        key={followUp}
                        className="flex gap-2.5 text-sm leading-relaxed text-ink-2"
                      >
                        <span
                          className="mt-px shrink-0 font-mono text-accent"
                          aria-hidden="true"
                        >
                          →
                        </span>
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={() => record('missed')}
                  className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition duration-150 ease-out hover:border-hard/40 hover:text-hard active:scale-[0.98]"
                >
                  Didn’t know
                  <span className="ml-2 font-mono text-[11px] text-ink-3">1</span>
                </button>
                <button
                  type="button"
                  onClick={() => record('knew')}
                  className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition duration-150 ease-out hover:border-easy/40 hover:text-easy active:scale-[0.98]"
                >
                  Knew it
                  <span className="ml-2 font-mono text-[11px] text-ink-3">2</span>
                </button>
                <a
                  href={current.href}
                  className="ml-auto text-sm font-medium text-accent transition-opacity hover:opacity-80"
                >
                  Read the full topic →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (index + 1 >= deck.length) {
                setPhase('done');
              } else {
                setIndex((value) => value + 1);
                setRevealed(false);
              }
            }}
            className="text-sm text-ink-3 transition-colors hover:text-ink"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  const knew = Object.values(outcomes).filter((entry) => entry === 'knew').length;
  const attempted = Object.keys(outcomes).length;
  const missed = deck.filter(
    (_question, position) => outcomes[position] === 'missed',
  );
  const percent = attempted === 0 ? 0 : Math.round((knew / attempted) * 100);

  return (
    <div className="enter rounded-xl border border-line bg-surface p-6 sm:p-8">
      <p className="eyebrow">Session complete</p>
      <h2 className="mt-2.5 text-2xl font-semibold tracking-tight">
        {knew} of {attempted} known
      </h2>
      <p className="mt-2 text-sm text-ink-2">
        {percent}% recall in this session.
        {missed.length > 0
          ? ' Focus on the topics below before your next run.'
          : ' Strong session. Try a different category or difficulty.'}
      </p>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>

      {missed.length > 0 && (
        <div className="mt-7">
          <p className="eyebrow">Topics to review</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {missed.map((question) => (
              <li key={question.id}>
                <a
                  href={question.href}
                  className="group flex items-center gap-3 py-3"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: question.accent }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                      {question.prompt}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] tracking-wide text-ink-3 uppercase">
                      {question.categoryName}
                    </span>
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
                    className="shrink-0 text-ink-3 transition group-hover:text-accent hover-media:group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => start(deck, 'all')}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition duration-150 ease-out hover:bg-accent-hover active:scale-[0.98]"
        >
          Run this deck again
        </button>
        {missed.length > 0 && (
          <button
            type="button"
            onClick={() => start(missed, 'all')}
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition duration-150 ease-out hover:border-line-strong active:scale-[0.98]"
          >
            Practice missed only
          </button>
        )}
        <button
          type="button"
          onClick={() => setPhase('setup')}
          className="rounded-lg px-4 py-2.5 text-sm text-ink-3 transition-colors hover:text-ink"
        >
          Change setup
        </button>
      </div>
    </div>
  );
}
