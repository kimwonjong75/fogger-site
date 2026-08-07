import { BUSINESS, EXTERNAL, ORG_ID, SITE, WEBSITE_ID } from '../data/site';
import {
  FILL_RATIO_LABEL,
  HEAT_SOURCE,
  MEDIA_LABEL,
  PRODUCT_TYPE,
  USE_VENUE,
  maxFillLiters,
  priceLabel,
  type Product,
} from '../data/products';
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
    logo: absoluteUrl('/favicon-512.png'),
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

/**
 * Product — 제품 상세 페이지에 출력한다.
 *
 * `offers`는 넣지 않는다. 이 사이트는 결제·주문 기능이 없는 정보 사이트이고,
 * 실제 거래는 공식몰에서 일어난다. 구매할 수 없는 페이지에 Offer를 붙이면
 * 검색엔진이 이 URL을 판매 페이지로 잘못 인식한다.
 * 가격·재고 구조화데이터는 공식몰 상품 페이지 쪽에 넣어야 한다.
 *
 * 가격이 확정되면(priceKrw) 사람이 읽는 정보로만 `description`에 함께 싣는다.
 */
export function productSchema(product: Product) {
  const url = absoluteUrl(`/products/${product.id}/`);
  const price = priceLabel(product);

  return compact({
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    sku: product.model,
    model: product.model,
    category: PRODUCT_TYPE,
    description: [
      product.tagline,
      `탱크 ${product.tankLiters}L, 최대 충전량 ${maxFillLiters(product.tankLiters)}L.`,
      `가열원 ${HEAT_SOURCE}, 사용 매질 ${MEDIA_LABEL}.`,
      price ? `공식몰 정가 ${price}.` : null,
    ]
      .filter(Boolean)
      .join(' '),
    url,
    brand: { '@id': ORG_ID },
    manufacturer: { '@id': ORG_ID },
    additionalProperty: [
      { '@type': 'PropertyValue', name: '탱크 용량', value: `${product.tankLiters}L` },
      {
        '@type': 'PropertyValue',
        name: '최대 충전량',
        value: `${maxFillLiters(product.tankLiters)}L`,
        description: `탱크 용량의 ${FILL_RATIO_LABEL} 상한`,
      },
      { '@type': 'PropertyValue', name: '크기', value: `${product.dimensionsMm} mm` },
      { '@type': 'PropertyValue', name: '노즐', value: product.nozzle },
      { '@type': 'PropertyValue', name: '분사 방식', value: product.sprayMode },
      { '@type': 'PropertyValue', name: '가열원', value: HEAT_SOURCE },
      { '@type': 'PropertyValue', name: '사용 매질', value: MEDIA_LABEL },
      {
        '@type': 'PropertyValue',
        name: '사용 장소',
        value: USE_VENUE.label,
        description: USE_VENUE.condition,
      },
      {
        '@type': 'PropertyValue',
        name: '어깨끈',
        value: product.shoulderStrap ? '포함' : '미포함',
      },
    ],
  });
}

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQPage — 문서 하단 FAQ와 항목·순서가 항상 동일해야 한다 */
export function faqSchema(url: string, items: readonly FaqItem[]) {
  if (items.length === 0) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(url)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export interface HowToStep {
  no: number;
  title: string;
  body: string;
}

/** HowTo — 공식 사용법 10단계. 화면에 같은 순서·문구가 함께 있어야 한다 */
export function howToSchema(url: string, name: string, steps: readonly HowToStep[]) {
  const base = absoluteUrl(url);
  return {
    '@type': 'HowTo',
    '@id': `${base}#howto`,
    name,
    inLanguage: SITE.lang,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      position: step.no,
      name: step.title,
      text: step.body,
      url: `${base}#step-${step.no}`,
    })),
  };
}

export interface VideoSchemaInput {
  name: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
  durationSec: number;
  /** ISO 날짜. 확인되지 않았으면 넣지 않는다 — 추정 날짜를 만들지 말 것 */
  uploadDate?: string;
}

/** VideoObject — 업로드 날짜가 확인된 영상에만 출력한다 */
export function videoSchema(input: VideoSchemaInput) {
  return compact({
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    contentUrl: absoluteUrl(input.contentUrl),
    thumbnailUrl: absoluteUrl(input.thumbnailUrl),
    duration: `PT${Math.floor(input.durationSec / 60)}M${input.durationSec % 60}S`,
    uploadDate: input.uploadDate,
    publisher: { '@id': ORG_ID },
  });
}

export interface ListItemInput {
  name: string;
  href: string;
}

/** ItemList — 목록형 인덱스 페이지에 출력한다 */
export function itemListSchema(url: string, name: string, items: ListItemInput[]) {
  if (items.length === 0) return null;
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(url)}#itemlist`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

/** @graph 래핑 */
export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
