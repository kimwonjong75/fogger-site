// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://fogger.blueguard.kr';

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
       * 여기서는 색인 대상이 아닌 특수 페이지만 추가로 제외한다.
       */
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/404/' && path !== '/404';
      },
      changefreq: 'monthly',
    }),
  ],
});
