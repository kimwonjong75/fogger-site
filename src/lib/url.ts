import { SITE, UTM_DEFAULTS } from '../data/site';

/** 사이트 절대 URL — canonical / og:url / JSON-LD @id 에 사용 */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}

/** 항상 슬래시로 끝나는 경로로 정규화 (파일 확장자가 있으면 그대로 둔다) */
export function normalizePath(pathname: string): string {
  if (/\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export interface UtmOptions {
  /** utm_content — 어느 위치의 CTA인지 식별 (예: hero, sticky_bar, product_bf-102) */
  content: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

/**
 * 구매 URL에 UTM 파라미터를 자동 부착한다.
 * 원본 URL의 기존 쿼리스트링은 유지하고, 동일 키는 덮어쓴다.
 */
export function withUtm(baseUrl: string, options: UtmOptions): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', options.source ?? UTM_DEFAULTS.source);
  url.searchParams.set('utm_medium', options.medium ?? UTM_DEFAULTS.medium);
  url.searchParams.set('utm_campaign', options.campaign ?? UTM_DEFAULTS.campaign);
  url.searchParams.set('utm_content', options.content);
  return url.href;
}
