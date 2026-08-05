import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { docHref, getAllPublishedDocs } from '../lib/content';

/** published: true 문서만 피드에 포함한다. */
export const GET: APIRoute = async (context) => {
  const docs = await getAllPublishedDocs();

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: true,
    items: docs.map((doc) => ({
      title: doc.data.title,
      description: doc.data.description,
      pubDate: doc.data.updatedDate,
      link: docHref(doc.collection, doc.id),
    })),
    customData: '<language>ko-kr</language>',
  });
};
