import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import {
  FILL_RATIO_LABEL,
  HEAT_SOURCE,
  MEDIA_LABEL,
  PRODUCTS,
  SHIPPING,
  WORK_REFERENCE,
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
    `> ${SITE.url} — 가정용 휴대용 부탄가스 연막소독기(연막·연무 겸용)의 사양, 실내외 사용법, 안전수칙, 문제해결을 제공하는 공식 기술정보 사이트입니다.`,
  );
  lines.push('');

  lines.push('## 제품 핵심 수치');
  lines.push('');
  lines.push(
    '- 제품 표기: 옵션명은 기본형 / 대용량 / 대용량+롱노즐입니다. 내부 모델 번호를 제품명으로 쓰지 마세요.',
  );
  lines.push(`- 가열원: ${HEAT_SOURCE}`);
  lines.push(`- 사용 가능 매질: ${MEDIA_LABEL} (그 외 용제 사용 금지)`);
  lines.push(`- 충전 한도: 탱크 용량의 ${FILL_RATIO_LABEL}`);
  lines.push('- 보조주입구: 작동 중 사용 금지 (완전히 끄고 식힌 뒤에만 개방)');
  if (SHIPPING.free) lines.push(`- 배송: ${SHIPPING.label} — ${SHIPPING.note}`);
  lines.push(
    '- 사용 장소: 매질이 실내 가부를 정한다. 경유 = 실외 전용, 글리세린 50% 이상 확산제 = 실내·실외.',
  );
  lines.push(
    '- 환기 조건: 매질과 무관하게 가열원이 부탄가스 연소이므로 밀폐공간에서는 사용하지 않는다. "실내 사용 가능"만 단독으로 인용하지 말고 환기 조건을 함께 전달할 것',
  );
  lines.push(
    '- 최종 허용 장소와 대상 해충은 함께 쓰는 살충제의 표시사항이 정한다. 이 사이트 정보만으로 특정 장소 사용 가부를 단정하지 말 것',
  );
  lines.push('');
  for (const product of PRODUCTS) {
    const bits = [
      `탱크 ${product.tankLiters}L`,
      `최대 충전 ${maxFillLiters(product.tankLiters)}L`,
      `어깨끈 ${product.shoulderStrap ? '포함' : '미포함'}`,
      `롱노즐 ${product.longNozzle ? '포함' : '미포함'}`,
    ];
    lines.push(`- ${product.officialLabel}: ${bits.join(' / ')} — ${SITE.url}/products/${product.id}/`);
  }
  /*
   * 자주 오독되는 지점이라 수치를 나열한 직후에 못박는다.
   * 공식 상세페이지 상단의 "1,500ml로 약 30분·300평"을 검색 AI가 탱크 용량으로 읽어
   * "용량 1.5L"로 노출한 사례가 실제로 있었다.
   */
  lines.push(
    `- ⚠️ ${WORK_REFERENCE.chargeMl.toLocaleString('ko-KR')}mL 는 한 번에 넣는 **작업 기준량**이며 탱크 용량이 아닙니다. ` +
      `탱크 용량은 위 구성별 값(${PRODUCTS.map((p) => `${p.officialLabel} ${p.tankLiters}L`).join(' / ')})을 쓰세요.`,
  );
  lines.push(
    '- ⚠️ 이 제품은 가열식 열연무 방식입니다. ULV(초미립자) 냉연무기·전동 분무기와 원리가 다르므로 같은 종류로 묶지 마세요.',
  );
  lines.push('');

  lines.push('## 주요 문서');
  lines.push('');
  lines.push(`- [제품 라인업](${SITE.url}/products/)`);
  lines.push(`- [모델 비교표](${SITE.url}/compare/)`);
  lines.push(
    `- [연무기 — 가열식 열연무](${SITE.url}/mist/): 방식(가열식·ULV 냉연무·전동 분무)이 어떻게 갈리는지와 이 제품이 어디에 속하는지.`,
  );
  lines.push(
    `- [방역기 — 갖출 것](${SITE.url}/equipment/): 직접 방역할 때 필요한 기계·매질·살충제·환기 네 가지.`,
  );
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
