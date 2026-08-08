// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://fogger.blueguard.kr';

/**
 * 문서 묶음 폴더 이름.
 *
 * `src/content/` 밑을 통째로 훑으면 안 된다 — 그 아래에는 문서가 아닌 폴더도 있다
 * (`pages`·`data`는 편집 화면이 쓰는 JSON, `uploads`는 본문 사진). 훑으면 그것들이
 * "공개 문서가 0건인 컬렉션"으로 잡혀 `/pages/`·`/data/`·`/uploads/`가 사이트맵
 * 제외 목록에 들어간다. 지금은 그런 주소가 없어 아무 일도 안 일어나지만, 나중에
 * 같은 이름의 페이지를 만들면 이유 없이 사이트맵에서 빠진다.
 *
 * `src/content.config.ts`의 collections 키와 같아야 한다.
 */
const DOC_COLLECTIONS = ['guides', 'uses', 'troubleshooting'];

/**
 * 공개 문서가 0건인 컬렉션 인덱스 경로.
 *
 * 해당 페이지들은 lib/content.ts와 동일한 조건(`docs.length === 0`)으로 noindex 처리된다
 * (src/pages/{collection}/index.astro 참조). noindex 페이지가 사이트맵에 남으면
 * "noindex인데 사이트맵에는 있다"는 모순이 생기므로 여기서도 함께 제외한다.
 * astro:content 가상 모듈은 이 설정 파일 컨텍스트에서 쓸 수 없어 프론트매터를 직접 읽는다.
 */
function collectionsWithNoPublishedDocs() {
  const contentRoot = fileURLToPath(new URL('./src/content/', import.meta.url));
  const empty = [];
  for (const name of DOC_COLLECTIONS) {
    const dir = `${contentRoot}${name}/`;
    const hasPublished = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .some((f) => /^published:\s*true\s*$/m.test(readFileSync(`${dir}${f}`, 'utf8')));
    if (!hasPublished) empty.push(`/${name}/`);
  }
  return empty;
}

const noindexCollectionPaths = collectionsWithNoPublishedDocs();

/**
 * 문서 URL → 최종 수정일 매핑.
 *
 * 사이트맵의 lastmod가 없으면 크롤러가 어떤 문서가 바뀌었는지 알 수 없어
 * 재수집이 늦어진다. 문서 프론트매터의 updatedDate를 그대로 쓴다.
 * (여기서도 astro:content를 쓸 수 없어 프론트매터를 직접 읽는다)
 */
function docLastmodByPath() {
  const contentRoot = fileURLToPath(new URL('./src/content/', import.meta.url));
  /** @type {Record<string, string>} */
  const map = {};
  for (const name of DOC_COLLECTIONS) {
    const dir = `${contentRoot}${name}/`;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const source = readFileSync(`${dir}${file}`, 'utf8');
      if (!/^published:\s*true\s*$/m.test(source)) continue;
      const updated = source.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
      if (!updated) continue;
      map[`/${name}/${file.replace(/\.md$/, '')}/`] = new Date(updated).toISOString();
    }
  }
  return map;
}

const lastmodByPath = docLastmodByPath();

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      /**
       * published: false 문서는 애초에 라우트가 생성되지 않으므로 사이트맵에도 들어가지 않는다.
       * 여기서는 색인 대상이 아닌 특수 페이지(404, 공개 문서 0건인 컬렉션 인덱스)를 제외한다.
       */
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path === '/404/' || path === '/404') return false;
        // 사장님 작업용 화면(미디어 지도)은 noindex라 사이트맵에도 넣지 않는다
        if (path.startsWith('/admin/')) return false;
        if (noindexCollectionPaths.includes(path)) return false;
        return true;
      },
      changefreq: 'monthly',
      /** 문서 페이지에만 실제 수정일을 붙인다. 없는 페이지는 lastmod를 생략한다. */
      serialize: (item) => {
        const path = new URL(item.url).pathname;
        const lastmod = lastmodByPath[path];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
