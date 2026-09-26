import { SITE } from '../config';
import type { ResolvedItem } from './content-types';

export function absolute(path: string): string {
  return new URL(path, SITE.url).href;
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: 'en',
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
  };
}

export function techArticleJsonLd(item: ResolvedItem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: item.title,
    description: item.summary,
    url: absolute(item.href),
    mainEntityOfPage: absolute(item.href),
    inLanguage: 'en',
    keywords: (item.tags ?? []).join(', '),
    proficiencyLevel: item.difficulty,
    ...(item.updated ? { dateModified: item.updated } : {}),
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

export function questionJsonLd(item: ResolvedItem) {
  if (item.type !== 'question') return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: item.title,
    text: item.title,
    url: absolute(item.href),
    acceptedAnswer: { '@type': 'Answer', text: item.shortAnswer },
  };
}

export function collectionJsonLd(options: {
  title: string;
  description: string;
  path: string;
  items: ResolvedItem[];
}) {
  const { title, description, path, items } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absolute(path),
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: absolute(item.href),
      })),
    },
  };
}
