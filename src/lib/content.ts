import { getCollection, type CollectionEntry } from 'astro:content';

export const DOC_COLLECTIONS = ['guides', 'uses', 'troubleshooting'] as const;
export type DocCollection = (typeof DOC_COLLECTIONS)[number];
export type DocEntry = CollectionEntry<DocCollection>;

export const COLLECTION_META: Record<
  DocCollection,
  { label: string; href: string; title: string; description: string }
> = {
  guides: {
    label: '사용법',
    href: '/guides/',
    title: '연막소독기 사용법',
    description:
      '약제 충전부터 예열·분사·세척까지, 블루가드 연막소독기를 안전하게 쓰는 순서를 단계별로 정리했습니다.',
  },
  uses: {
    label: '활용사례',
    href: '/uses/',
    title: '연막소독기 활용사례',
    description:
      '축사·창고·지하주차장 등 현장별로 연막소독기를 어떻게 운용하는지 조건과 주의점을 정리했습니다.',
  },
  troubleshooting: {
    label: '문제해결',
    href: '/troubleshooting/',
    title: '연막소독기 문제해결',
    description:
      '점화 불량, 연막량 부족, 노즐 막힘 등 자주 생기는 증상의 원인과 점검 순서를 정리했습니다.',
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

/**
 * frontmatter의 `related`("컬렉션/문서id")를 실제 문서로 해석한다.
 * 지정이 없으면 같은 컬렉션 → 사용법 순으로 자동 보충한다.
 * 존재하지 않거나 비공개인 문서를 지정하면 빌드를 실패시켜 깨진 링크를 막는다.
 */
export async function resolveRelated(entry: DocEntry, limit = 3): Promise<DocEntry[]> {
  const all = await getAllPublishedDocs();
  const byKey = new Map(all.map((d) => [`${d.collection}/${d.id}`, d]));
  const picked: DocEntry[] = [];

  for (const ref of entry.data.related) {
    const found = byKey.get(ref);
    if (!found) {
      throw new Error(
        `[related] ${entry.collection}/${entry.id} 가 참조한 "${ref}" 를 찾을 수 없거나 비공개 문서입니다.`,
      );
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
