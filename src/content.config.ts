import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/** CTA 유형 — 문서 하단에 어떤 전환 블록을 붙일지 결정 */
export const CTA_TYPES = ['product', 'consumable', 'as', 'none'] as const;

/**
 * 세 콘텐츠 컬렉션이 공유하는 스키마.
 * `image()`는 컬렉션 컨텍스트에서 주입되므로 팩토리 형태로 정의한다.
 */
const docSchema = ({ image }: SchemaContext) =>
  z
    .object({
      /** 문서 제목 */
      title: z.string().min(1),

      /** 메타 설명 — 검색결과 잘림 방지를 위해 70~80자로 제한 */
      description: z
        .string()
        .min(70, 'description은 70자 이상이어야 합니다.')
        .max(80, 'description은 80자 이하여야 합니다.'),

      /** 최종 수정일 */
      updatedDate: z.coerce.date(),

      /** 공개 여부 — false면 라우트·사이트맵·RSS·내부링크에서 모두 제외 */
      published: z.boolean(),

      /**
       * 문서 하단 FAQ — 4~6개.
       * 화면(Faq 컴포넌트)과 FAQPage 구조화데이터가 같은 배열을 쓴다.
       * 화면에 없는 질문을 스키마에만 넣지 않기 위해 소스를 하나로 유지한다.
       */
      faq: z
        .array(
          z.object({
            q: z.string().min(1),
            a: z.string().min(1),
          }),
        )
        .min(4, 'faq는 최소 4개여야 합니다.')
        .max(6, 'faq는 최대 6개까지입니다.'),

      /** 근거 출처 */
      sources: z
        .array(
          z.object({
            name: z.string().min(1),
            url: z.url(),
          }),
        )
        .default([]),

      /** 검수자 */
      reviewer: z.string().min(1),

      /** 전환 CTA 유형 */
      ctaType: z.enum(CTA_TYPES),

      /** 히어로 이미지 (astro:assets) */
      heroImage: image().optional(),

      /** 히어로 이미지 대체텍스트 — "{주제} — {구체 장면}" 형식 */
      heroImageAlt: z.string().optional(),

      /** 관련 문서 — "컬렉션/문서id" 형식. 미지정 시 자동 추천 */
      related: z.array(z.string()).default([]),

      /**
       * 본문 아래에 모델별 핵심 수치표를 렌더링할지.
       * 마크다운에 숫자를 쓰지 않고 products.ts 값을 그대로 보여주기 위한 스위치.
       */
      showSpecTable: z.boolean().default(false),

      /**
       * 본문에 자체 호스팅 영상을 붙일 때 media.ts의 VIDEO_BY_KEY 키를 지정한다.
       * 문서 내용과 실제로 관련된 촬영본이 있을 때만 지정할 것.
       */
      videoKey: z.enum(['sprayTest', 'longNozzle']).optional(),
    })
    .refine((data) => !data.heroImage || !!data.heroImageAlt, {
      message: 'heroImage를 지정하면 heroImageAlt도 필요합니다.',
      path: ['heroImageAlt'],
    });

const makeCollection = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.md', base: `./src/content/${dir}` }),
    schema: docSchema,
  });

export const collections = {
  guides: makeCollection('guides'),
  uses: makeCollection('uses'),
  troubleshooting: makeCollection('troubleshooting'),
};
