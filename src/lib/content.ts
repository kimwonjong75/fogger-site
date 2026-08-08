import { getCollection, type CollectionEntry } from 'astro:content';

import { GUIDES_PAGE, TROUBLESHOOTING_PAGE, USES_PAGE } from '../data/pages';

export const DOC_COLLECTIONS = ['guides', 'uses', 'troubleshooting'] as const;
export type DocCollection = (typeof DOC_COLLECTIONS)[number];
export type DocEntry = CollectionEntry<DocCollection>;

/**
 * 세 문서 묶음의 이름·주소·소개 문구.
 *
 * 이름과 문구는 편집 화면에서 고치는 값이라 `src/content/pages/{묶음}.json` 에서 온다.
 * 주소(`href`)만 여기 남긴 것은 파일 경로·사이트맵·내부 링크가 전부 이 값에 묶여 있어
 * 편집 화면에서 바꾸면 사이트 링크가 통째로 끊기기 때문이다.
 */
export const COLLECTION_META: Record<
  DocCollection,
  { label: string; href: string; title: string; description: string }
> = {
  guides: {
    label: GUIDES_PAGE.label,
    href: '/guides/',
    title: GUIDES_PAGE.heading,
    description: GUIDES_PAGE.lede,
  },
  uses: {
    label: USES_PAGE.label,
    href: '/uses/',
    title: USES_PAGE.heading,
    description: USES_PAGE.lede,
  },
  troubleshooting: {
    label: TROUBLESHOOTING_PAGE.label,
    href: '/troubleshooting/',
    title: TROUBLESHOOTING_PAGE.heading,
    description: TROUBLESHOOTING_PAGE.lede,
  },
};

/** 문서 URL — 항상 슬래시로 끝난다 */
export function docHref(collection: DocCollection, id: string): string {
  return `${COLLECTION_META[collection].href}${id}/`;
}

/** published: true 문서만, 최신 수정일 순으로 반환 */
export async function getPublishedDocs(collection: DocCollection): Promise<DocEntry[]> {
  const entries = await getCollection(collection, ({ data }) => data.published === true);
  return entries.sort((a, b) => b.data.updatedDate.valueOf() - a.data.updatedDate.valueOf());
}

/** 세 컬렉션의 published 문서 전체 */
export async function getAllPublishedDocs(): Promise<DocEntry[]> {
  const groups = await Promise.all(DOC_COLLECTIONS.map((c) => getPublishedDocs(c)));
  return groups.flat().sort((a, b) => b.data.updatedDate.valueOf() - a.data.updatedDate.valueOf());
}

/** 공개 문서 중 가장 최근 수정일 — 신뢰 블록의 "최종 검수일" 표기에 쓴다 */
export async function getLatestReviewDate(): Promise<Date | null> {
  const docs = await getAllPublishedDocs();
  return docs[0]?.data.updatedDate ?? null;
}

/** 전 컬렉션 문서 (비공개 포함) — related 참조 검증용 */
async function getAllDocs(): Promise<DocEntry[]> {
  const groups = await Promise.all(DOC_COLLECTIONS.map((c) => getCollection(c)));
  return groups.flat();
}

/**
 * frontmatter의 `related`("컬렉션/문서id")를 실제 문서로 해석한다.
 * 지정이 없으면 같은 컬렉션 → 사용법 순으로 자동 보충한다.
 *
 * - 존재하지 않는 id를 참조하면 오타이므로 빌드를 실패시킨다.
 * - 존재하지만 비공개인 문서는 조용히 건너뛴다.
 *   (published를 토글하는 것만으로 다른 문서 빌드가 깨지지 않도록)
 */
export async function resolveRelated(entry: DocEntry, limit = 3): Promise<DocEntry[]> {
  const all = await getAllPublishedDocs();
  const byKey = new Map(all.map((d) => [`${d.collection}/${d.id}`, d]));
  const picked: DocEntry[] = [];

  const knownKeys = new Set((await getAllDocs()).map((d) => `${d.collection}/${d.id}`));

  for (const ref of entry.data.related) {
    const found = byKey.get(ref);
    if (!found) {
      if (!knownKeys.has(ref)) {
        throw new Error(
          `[related] ${entry.collection}/${entry.id} 가 참조한 "${ref}" 문서가 존재하지 않습니다. id를 확인하세요.`,
        );
      }
      continue; // 존재하지만 비공개 → 건너뛴다
    }
    if (found.id !== entry.id || found.collection !== entry.collection) picked.push(found);
  }

  if (picked.length < limit) {
    const isPicked = (d: DocEntry) =>
      picked.some((p) => p.collection === d.collection && p.id === d.id);
    const isSelf = (d: DocEntry) => d.collection === entry.collection && d.id === entry.id;

    const sameCollection = all.filter((d) => d.collection === entry.collection);
    const others = all.filter((d) => d.collection !== entry.collection);

    for (const candidate of [...sameCollection, ...others]) {
      if (picked.length >= limit) break;
      if (isSelf(candidate) || isPicked(candidate)) continue;
      picked.push(candidate);
    }
  }

  return picked.slice(0, limit);
}

/** 컬렉션 문서의 정적 경로 파라미터 (published만) */
export async function docStaticPaths(collection: DocCollection) {
  const docs = await getPublishedDocs(collection);
  return docs.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
