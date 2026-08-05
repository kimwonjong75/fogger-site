import { BUSINESS, EXTERNAL, ORG_ID, SITE, WEBSITE_ID } from '../data/site';
import { absoluteUrl } from './url';

/** 자리표시자(TODO_) 값은 구조화데이터에 넣지 않는다 */
function real(value: string): string | undefined {
  return value && !value.startsWith('TODO_') ? value : undefined;
}

function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Organization — 홈에서 1회만 출력하고 다른 페이지는 @id로 참조한다 */
export function organizationSchema() {
  const address = real(BUSINESS.address);
  return compact({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: real(BUSINESS.name),
    url: SITE.url,
    email: real(BUSINESS.email),
    telephone: real(BUSINESS.tel),
    address: address
      ? { '@type': 'PostalAddress', addressCountry: 'KR', streetAddress: address }
      : undefined,
    sameAs: [EXTERNAL.corporate, EXTERNAL.smartstore],
  });
}

/** WebSite — 홈에서 1회만 출력 */
export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { '@id': ORG_ID },
  };
}

export interface Crumb {
  name: string;
  href: string;
}

/** BreadcrumbList — 화면 브레드크럼과 항목·순서가 항상 동일해야 한다 */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(crumbs[crumbs.length - 1]!.href)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  updatedDate: Date;
  reviewer: string;
  imageUrl?: string;
}

/** Article — 가이드/활용사례/문제해결 문서에만 출력 */
export function articleSchema(input: ArticleSchemaInput) {
  const iso = input.updatedDate.toISOString();
  return compact({
    '@type': 'Article',
    '@id': `${absoluteUrl(input.url)}#article`,
    headline: input.title,
    description: input.description,
    inLanguage: SITE.lang,
    datePublished: iso,
    dateModified: iso,
    mainEntityOfPage: absoluteUrl(input.url),
    image: input.imageUrl,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    contributor: { '@type': 'Person', name: input.reviewer },
  });
}

/** @graph 래핑 */
export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
