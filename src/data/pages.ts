/**
 * 화면별 문구의 단일 소스.
 *
 * `src/content/pages/*.json` 을 읽어 검사한 뒤 각 .astro 가 쓸 수 있는 모양으로 내보낸다.
 * 그 JSON 은 편집 화면(/admin/)이 직접 여는 파일이므로, **여기 스키마와 `public/admin/config.yml`
 * 의 입력칸은 같은 것을 두 벌로 적은 관계다.** 한쪽만 고치면 조용히 어긋나므로 항상 함께 고친다.
 * (`scripts/verify-build.mjs` 가 어긋남을 검사한다)
 *
 * 숫자 자리표시자(`{{충전한도}}` 등)와 사진 경로 해석은 `src/lib/page-content.ts` 참조.
 */
import { z } from 'zod';

import { field, parsePage } from '../lib/page-content';

import homeRaw from '../content/pages/home.json';
import compareRaw from '../content/pages/compare.json';
import productsRaw from '../content/pages/products.json';
import safetyRaw from '../content/pages/safety.json';
import guidesRaw from '../content/pages/guides.json';
import usesRaw from '../content/pages/uses.json';
import troubleshootingRaw from '../content/pages/troubleshooting.json';

const { line, lines, rich, image, imageAlt, navLink, factRow } = field;

/* ------------------------------------------------------------------ *
 * 검색결과 표기
 * ------------------------------------------------------------------ */

/**
 * 검색결과 제목 — 검색결과 목록에 파란 글씨로 뜨는 줄.
 * 한글 검색결과는 30자 부근에서 잘린다.
 */
const seoTitle = (where: string) =>
  line(where).pipe(
    z.string().refine((v) => [...v].length <= 35, '검색결과 제목은 35자 이내여야 합니다.'),
  );

/**
 * 검색결과 설명 — 제목 아래 회색 글씨.
 *
 * 문서는 70~80자로 못박혀 있는데 여기를 40~90자로 둔 것은 이 화면들의 기존 문구가
 * 이미 그 밖에 있었기 때문이다. 새로 쓸 때는 70~80자가 가장 좋다.
 */
const seoDescription = (where: string) =>
  line(where).pipe(
    z
      .string()
      .refine(
        (v) => [...v].length >= 40 && [...v].length <= 90,
        '검색결과 설명은 40~90자여야 합니다 (70~80자를 권합니다).',
      ),
  );

/** 제목과 설명을 모두 따로 적는 화면 */
const seo = (where: string) =>
  z.object({
    title: seoTitle(where),
    description: seoDescription(where),
  });

/**
 * 문서 목록 화면용 — 제목만 따로 적는다.
 * 검색결과 설명은 화면 맨 위 소개 문구(`lede`)를 그대로 쓴다. 둘을 따로 적게 하면
 * 같은 내용을 두 번 적게 되고, 한쪽만 고쳐서 어긋난다.
 */
const seoTitleOnly = (where: string) => z.object({ title: seoTitle(where) });

/* ------------------------------------------------------------------ *
 * 홈
 * ------------------------------------------------------------------ */

const HOME = 'home';

const homeSchema = z.object({
  hero: z.object({
    eyebrow: line(HOME),
    headlineTop: line(HOME),
    /** 두 번째 줄 — 화면에서 파란 그러데이션이 걸리는 부분 */
    headlineAccent: line(HOME),
    lede: lines(HOME),
    videoButtonLabel: line(HOME),
    modelButtonLabel: line(HOME),
    specLine: line(HOME),
    image: image(HOME),
    imageAlt: imageAlt(HOME),
  }),
  works: z.object({
    heading: line(HOME),
    desc: line(HOME),
    image: image(HOME),
    imageAlt: imageAlt(HOME),
    /** 사진 옆 근거 3줄 — 문단 대신 이 목록으로 읽히게 한다 */
    benefits: z.array(field.titledText(HOME)).min(1).max(4),
    moreLinks: z.array(navLink(HOME)).default([]),
  }),
  parts: z.object({
    heading: line(HOME),
    desc: line(HOME),
    closing: line(HOME),
  }),
  models: z.object({
    heading: line(HOME),
    desc: line(HOME),
    moreLinks: z.array(navLink(HOME)).default([]),
  }),
  closing: z.object({
    heading: line(HOME),
    desc: line(HOME),
    safetyBoxTitle: line(HOME),
    safetyLinkLabel: line(HOME),
    moreLinks: z.array(navLink(HOME)).default([]),
  }),
  seo: seo(HOME),
});

export const HOME_PAGE = parsePage(HOME, homeSchema, homeRaw);

/* ------------------------------------------------------------------ *
 * 모델비교
 * ------------------------------------------------------------------ */

const COMPARE = 'compare';

const compareSchema = z.object({
  eyebrow: line(COMPARE),
  heading: line(COMPARE),
  lede: line(COMPARE),
  specTableCaption: line(COMPARE),
  specTableFootnote: line(COMPARE),
  pickerHeading: line(COMPARE),
  pickerDetailLabel: line(COMPARE),
  summaryHeading: line(COMPARE),
  summary: z.array(rich(COMPARE)).min(1),
  safetyBoxTitle: line(COMPARE),
  seo: seo(COMPARE),
});

export const COMPARE_PAGE = parsePage(COMPARE, compareSchema, compareRaw);

/* ------------------------------------------------------------------ *
 * 제품 목록
 * ------------------------------------------------------------------ */

const PRODUCTS_PAGE_NAME = 'products';

const productsSchema = z.object({
  eyebrow: line(PRODUCTS_PAGE_NAME),
  heading: line(PRODUCTS_PAGE_NAME),
  lede: line(PRODUCTS_PAGE_NAME),
  partsHeading: line(PRODUCTS_PAGE_NAME),
  partsDesc: line(PRODUCTS_PAGE_NAME),
  partsCheckLabel: line(PRODUCTS_PAGE_NAME),
  commonHeading: line(PRODUCTS_PAGE_NAME),
  commonFacts: z.array(factRow(PRODUCTS_PAGE_NAME)).min(1),
  commonFootnote: line(PRODUCTS_PAGE_NAME),
  videoHeading: line(PRODUCTS_PAGE_NAME),
  videoDesc: line(PRODUCTS_PAGE_NAME),
  moreLink: navLink(PRODUCTS_PAGE_NAME),
  seo: seo(PRODUCTS_PAGE_NAME),
});

export const PRODUCTS_PAGE = parsePage(PRODUCTS_PAGE_NAME, productsSchema, productsRaw);

/* ------------------------------------------------------------------ *
 * 안전수칙
 * ------------------------------------------------------------------ */

const SAFETY = 'safety';

/**
 * 안전 규칙의 `id` 는 화면에서 안 보이지만 지워지면 안 된다.
 * 홈·사용법·문제해결 화면이 "이 규칙만 보여 달라"고 id 로 지목하기 때문이다.
 * 아래 REQUIRED_RULE_IDS 가 그 지목 목록이고, 하나라도 없어지면 빌드가 선다.
 */
const safetyRuleSchema = (where: string) =>
  z.object({
    id: z
      .string()
      .trim()
      .regex(/^[a-z][a-z-]*$/, 'id 는 영문 소문자와 붙임표(-)만 씁니다. 예: fill-limit'),
    /** critical = 필수 / warning = 주의 */
    level: z.enum(['critical', 'warning']),
    title: line(where),
    body: line(where),
  });

/**
 * 다른 화면이 이름으로 지목하는 안전 규칙.
 * 여기 있는 id 는 편집 화면에서 지우거나 이름을 바꾸면 안 된다.
 */
export const REQUIRED_RULE_IDS = ['fill-limit', 'aux-inlet', 'venue', 'heat'] as const;

const safetySchema = z
  .object({
    heading: line(SAFETY),
    lede: line(SAFETY),
    printButtonLabel: line(SAFETY),

    limitsHeading: line(SAFETY),
    limitsCaption: line(SAFETY),
    limits: z.array(factRow(SAFETY)).min(1),

    rulesHeading: line(SAFETY),
    rules: z.array(safetyRuleSchema(SAFETY)).min(1),

    dontHeading: line(SAFETY),
    dont: z.array(line(SAFETY)).min(1),

    fillTableHeading: line(SAFETY),
    fillTableCaption: line(SAFETY),
    fillTableFootnote: line(SAFETY),

    emergencyHeading: line(SAFETY),
    emergencySteps: z.array(line(SAFETY)).min(1),
    emergencyContactPrefix: line(SAFETY),
    emergencyContactSuffix: line(SAFETY),
    emergencyNote: line(SAFETY),

    seo: seo(SAFETY),
  })
  .superRefine((data, ctx) => {
    const ids = new Set(data.rules.map((rule) => rule.id));
    for (const required of REQUIRED_RULE_IDS) {
      if (!ids.has(required)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules'],
          message:
            `"${required}" 규칙이 없습니다. 이 규칙은 홈·사용법·문제해결 화면이 이름으로 ` +
            `불러다 쓰고 있어서 지우면 그 화면들의 안전 안내가 사라집니다.`,
        });
      }
    }

    const seen = new Set<string>();
    for (const rule of data.rules) {
      if (seen.has(rule.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules'],
          message: `"${rule.id}" 가 두 번 있습니다. 규칙마다 다른 id 를 쓰세요.`,
        });
      }
      seen.add(rule.id);
    }
  });

export const SAFETY_PAGE = parsePage(SAFETY, safetySchema, safetyRaw);

/** 안전 규칙 — SafetyBox 와 안전수칙 페이지가 함께 쓴다 */
export const SAFETY_RULES = SAFETY_PAGE.rules;

/* ------------------------------------------------------------------ *
 * 문서 목록 화면 (사용법 · 활용사례 · 문제해결)
 * ------------------------------------------------------------------ */

/** 세 목록 화면이 공유하는 부분 */
const docIndexBase = (where: string) => ({
  /** 메뉴·breadcrumb 에 뜨는 짧은 이름 */
  label: line(where),
  heading: line(where),
  /** 화면 맨 위 소개 문구이자 검색결과 설명 — 두 곳에 같이 쓰인다 */
  lede: seoDescription(where),
  seo: seoTitleOnly(where),
});

const guidesSchema = z.object({
  ...docIndexBase('guides'),
  safetyBoxTitle: line('guides'),
  howtoHeading: line('guides'),
  howtoDesc: line('guides'),
  docsHeading: line('guides'),
  moreText: rich('guides'),
});

const usesSchema = z.object({
  ...docIndexBase('uses'),
  moreText: rich('uses'),
});

const troubleshootingSchema = z.object({
  ...docIndexBase('troubleshooting'),
  safetyBoxTitle: line('troubleshooting'),
  asHeading: line('troubleshooting'),
  asBody: line('troubleshooting'),
  asContactSuffix: line('troubleshooting'),
});

export const GUIDES_PAGE = parsePage('guides', guidesSchema, guidesRaw);
export const USES_PAGE = parsePage('uses', usesSchema, usesRaw);
export const TROUBLESHOOTING_PAGE = parsePage(
  'troubleshooting',
  troubleshootingSchema,
  troubleshootingRaw,
);

/*
 * 사진이 어느 화면 어디에 들어가는지의 목록은 `src/data/media-map.ts` 에 있다.
 * 편집 화면에서 바꿀 수 있는 자리는 그 파일이 여기 값을 읽어가므로, 사진을 바꾸면
 * /admin/media/ 의 목록도 저절로 따라온다.
 */
