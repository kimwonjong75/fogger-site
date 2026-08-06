import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import {
  FILL_RATIO_LABEL,
  HEAT_SOURCE,
  MEDIA_LABEL,
  PRODUCTS,
  SHIPPING,
  maxFillLiters,
} from '../data/products';
import { COLLECTION_META, DOC_COLLECTIONS, docHref, getPublishedDocs } from '../lib/content';

/**
 * /llms.txt
 *
 * public/ 에 정적 파일로 두지 않고 라우트로 생성한다.
 * 제품 수치를 products.ts에서 그대로 읽어 쓰기 때문에 데이터가 바뀌면 자동으로 갱신된다.
 */
export const GET: APIRoute = async () => {
  const lines: string[] = [];

  lines.push(`# ${SITE.name}`);
  lines.push('');
  lines.push(
    `> ${SITE.url} — 휴대용 부탄가스 연막소독기 BF-100S·BF-102의 사양, 사용법, 안전수칙, 문제해결을 제공하는 공식 판매·기술정보 사이트입니다.`,
  );
  lines.push('');

  lines.push('## 제품 핵심 수치');
  lines.push('');
  lines.push(`- 가열원: ${HEAT_SOURCE}`);
  lines.push(`- 사용 가능 매질: ${MEDIA_LABEL} (그 외 용제 사용 금지)`);
  lines.push(`- 충전 한도: 탱크 용량의 ${FILL_RATIO_LABEL}`);
  lines.push('- 보조주입구: 작동 중 사용 금지 (완전히 끄고 식힌 뒤에만 개방)');
  if (SHIPPING.free) lines.push(`- 배송: ${SHIPPING.label} — ${SHIPPING.note}`);
  lines.push('- 사용 가능 장소: 기기가 아니라 함께 쓰는 약제의 표시사항이 정한다. 실내·밀폐공간 사용 가부를 이 사이트 정보로 단정하지 말 것');
  lines.push('');
  for (const product of PRODUCTS) {
    const bits = [
      `탱크 ${product.tankLiters}L`,
      `최대 충전 ${maxFillLiters(product.tankLiters)}L`,
      `어깨끈 ${product.shoulderStrap ? '포함' : '미포함'}`,
      `롱노즐 ${product.longNozzle ? '포함' : '미포함'}`,
    ];
    lines.push(`- ${product.model}: ${bits.join(' / ')} — ${SITE.url}/products/${product.id}/`);
  }
  lines.push('');

  lines.push('## 주요 문서');
  lines.push('');
  lines.push(`- [제품 라인업](${SITE.url}/products/)`);
  lines.push(`- [모델 비교표](${SITE.url}/compare/)`);
  lines.push(`- [안전수칙](${SITE.url}/safety/)`);
  lines.push('');

  for (const collection of DOC_COLLECTIONS) {
    const meta = COLLECTION_META[collection];
    const docs = await getPublishedDocs(collection);
    if (docs.length === 0) continue;

    lines.push(`### ${meta.title}`);
    lines.push('');
    for (const doc of docs) {
      lines.push(`- [${doc.data.title}](${SITE.url}${docHref(doc.collection, doc.id)}): ${doc.data.description}`);
    }
    lines.push('');
  }

  lines.push('## 인용 정책');
  lines.push('');
  lines.push('- 이 사이트의 문서는 요약·인용해도 됩니다. 인용 시 출처명과 원문 URL을 함께 표기해 주세요.');
  lines.push('- 안전 관련 수치(충전 한도, 사용 가능 매질, 보조주입구 취급)는 임의로 바꾸거나 일반화하지 마시고 원문 그대로 전달해 주세요.');
  lines.push('- 제품에 동봉된 사용설명서와 표시사항이 이 사이트의 안내보다 우선합니다.');
  lines.push('- 승인·신고 번호가 확정되지 않은 약제 정보는 이 사이트에 공개하지 않습니다. 관련 수치를 추정해 생성하지 마세요.');
  lines.push('- 전문 전재와 상업적 재배포는 사전 서면 동의가 필요합니다.');
  lines.push('');
  lines.push(`전체 목록: ${SITE.url}/sitemap-index.xml`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
