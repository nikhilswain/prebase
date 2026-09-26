const DEFAULT_SITE_URL = 'https://prepbase.ze-ro.workers.dev';

export const SITE_URL = (import.meta.env.SITE ?? DEFAULT_SITE_URL).replace(
  /\/$/,
  '',
);

export const SITE = {
  name: 'prepbase',
  url: SITE_URL,
  domain: new URL(SITE_URL).host,
  title: 'prepbase - revise for developer interviews',
  tagline: 'Everything you need to revise for a developer interview.',
  description:
    'A fast, structured interview knowledge base covering JavaScript, React, TypeScript, CSS, frontend development and more. Search, understand, revise, move on.',
  keywords: [
    'developer interview questions',
    'frontend interview preparation',
    'JavaScript interview questions',
    'React interview questions',
    'TypeScript interview questions',
    'CSS interview questions',
    'interview revision notes',
    'coding interview practice',
  ],
  locale: 'en',
  ogImage: '/og.png',
} as const;

export type NavItem = {
  label: string;
  href: string;
  match?: string;
};

export const NAV: NavItem[] = [
  { label: 'Explore', href: '/explore' },
  { label: 'Quick Revision', href: '/quick-revision' },
  { label: 'Interview Mode', href: '/interview' },
  { label: 'Cheat Sheets', href: '/cheat-sheets' },
];

export const FOOTER_GROUPS: { title: string; links: NavItem[] }[] = [
  {
    title: 'Learn',
    links: [
      { label: 'Explore topics', href: '/explore' },
      { label: 'Search', href: '/search' },
      { label: 'Quick Revision', href: '/quick-revision' },
      { label: 'Cheat Sheets', href: '/cheat-sheets' },
      { label: 'Comparisons', href: '/comparisons' },
      { label: 'Tags', href: '/tags' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { label: 'Interview Mode', href: '/interview' },
      { label: 'Code Challenges', href: '/challenges' },
      { label: 'Interview Questions', href: '/questions' },
    ],
  },
];

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  unreviewed: 'Unreviewed',
  'community-reviewed': 'Community reviewed',
  verified: 'Verified',
};
