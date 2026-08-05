# fogger.blueguard.kr

블루가드 휴대용 연막소독기(BF-100S · BF-102) 공식 정보 사이트. Astro 정적 빌드.

## 명령어

| 명령                   | 설명                                              |
| :--------------------- | :------------------------------------------------ |
| `npm run dev`          | 개발 서버 (`localhost:4321`)                      |
| `npm run build`        | `./dist/` 로 정적 빌드                            |
| `npm run build:verify` | 빌드 후 검증 스크립트까지 실행                    |
| `npm run verify`       | `dist/` 검증만 실행                               |
| `npm run check`        | `astro check` 타입 검사                           |
| `npm run images`       | 플레이스홀더 OG/히어로 이미지 재생성              |

## 데이터는 한 곳에서만

제품 수치는 **`src/data/products.ts`** 가 유일한 출처다. 페이지·컴포넌트·마크다운
어디에도 용량·비율을 직접 쓰지 않는다.

- `HEAT_SOURCE` 가열원
- `MEDIA` / `MEDIA_LABEL` 사용 매질
- `FILL_RATIO` 충전 한도 → `maxFillLiters()` 가 모델별 최대 충전량을 계산
- `SAFETY_RULES` 안전 규칙 (SafetyBox · 안전수칙 페이지 공용)
- `SPEC_ROWS` 비교표 행 정의

마크다운 본문에 수치가 필요하면 frontmatter에 `showSpecTable: true` 를 주면
`ModelSpecTable` 이 products.ts 값으로 표를 렌더링한다.

`src/data/chemicals.ts` 의 약제(`bugs-delta`, `diffuser`)는 승인번호 미확보 상태라
전부 `published: false` 다. 노출은 반드시 `publishedChemicals()` 를 거친다.

## 콘텐츠

`src/content/{guides,uses,troubleshooting}/*.md` — 스키마는 `src/content.config.ts`.

필수 frontmatter: `title`, `description`(70~80자), `updatedDate`, `published`,
`faq`(4~6), `sources`, `reviewer`, `ctaType`(`product|consumable|as|none`).
선택: `heroImage`+`heroImageAlt`, `related`, `video`, `showSpecTable`.

`published: false` 문서는 라우트가 생성되지 않으므로 사이트맵·RSS·llms.txt·
내부링크 어디에도 나타나지 않는다. (`winter-operation`, `greenhouse` 가 그 예시)

## 구조화데이터 정책

- 홈: `Organization` + `WebSite` 1회
- 전 페이지: `BreadcrumbList` (화면 브레드크럼과 항목·순서 동일)
- 가이드/활용사례/문제해결: `Article`
- **넣지 않음**: `Offer`, `Product`, `aggregateRating`, `FAQPage`, `HowTo`

`npm run verify` 가 위 규칙을 빌드 산출물에서 강제 검사한다.

## 배포 전 채워야 할 값

| 위치 | 항목 |
| :--- | :--- |
| `src/data/site.ts` → `BUSINESS` | 상호 · 대표자 · 사업자등록번호 · 통신판매업신고번호 · 주소 · 이메일 (`TODO_` 로 시작하는 값) |
| `src/data/site.ts` → `GA4_MEASUREMENT_ID` | 실제 GA4 측정 ID (자리표시자면 gtag.js를 아예 로드하지 않는다) |
| `src/data/products.ts` → `buyUrl` | 모델별 공식몰 상품 상세 URL (현재는 스토어 메인) |
| `src/assets/*.png`, `public/og/*.png` | 실사 촬영본으로 교체 (같은 파일명이면 코드 수정 불필요) |

## 검증

```bash
npm run build:verify
```

깨진 링크, 페이지 전송량(1.2MB 예산), 사이트맵/RSS의 비공개 문서 노출,
title 30자·중복, canonical 자기참조, 구조화데이터 정책, 이미지 width/height·
lazy·alt 형식, 웹폰트 0 을 검사한다.
