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
| `npm run images`       | og:image 브랜드 카드 재생성                       |
| `npm run photos`       | 공식 자산 폴더에서 제품 실사 가져오기             |

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

## 표시 원칙

- **사용 장소는 기기가 아니라 약제가 정한다.** 실내·밀폐공간 사용을 권하는 문구는 약제
  표시사항의 허용 장소가 확인되기 전까지 쓰지 않는다. `bestFor`에는 장소가 아니라 작업
  조건(면적·이동거리·도달거리)만 적고, `uses` 문서에는 DocLayout이 고지 배너를 자동으로 붙인다.
- **사용 장소는 공식 사양이 "실외"다.** 실내·밀폐공간 작업을 다루는 문서는 공개하지 않는다.
- **"무료배송"은 단독으로 쓰지 않는다.** 표기하는 페이지에는 `ShippingNote`(또는 조건이 담긴
  각주)가 반드시 함께 있어야 하며, 검증기가 이를 강제한다.
- **추천 모델을 두지 않는다.** 공식몰이 단일 상품 + 옵션 선택 구조이고 추천 근거도 없다.
- **확인되지 않은 제품 속성은 비워 둔다.** `includes`/`bestFor`가 비면 해당 섹션이 렌더링되지
  않는다. 지어내지 말고 비워 둘 것.

## 배포 전 남은 값

| 위치 | 항목 | 상태 |
| :--- | :--- | :--- |
| `src/data/products.ts` → `TANK_SPEC_CONFIRMED` | 탱크 용량이 공식 상세페이지(1.8L/2.5L)와 다름 | **확인 필요 — 검증 실패로 배포 차단 중** |
| `src/data/site.ts` → `GA4_MEASUREMENT_ID` | 실제 GA4 측정 ID | **미입력 — 검증 실패로 배포 차단 중** |
| 각 문서 `sources` | 기관 홈이 아닌 직접 문서 URL | 개선 필요 |
| `src/data/chemicals.ts` → `approvalNumber` | 약제 승인·신고 번호 | 미확보 (전 품목 비공개 유지) |

사업자 정보, 구매 URL, 제품 실사, 구성품·크기·노즐 사양은 반영 완료.

## 제품 실사

`src/assets/photo-*.jpg` 는 사내 제품 자산 폴더의 1000×1000 제품 컷을 가져온 것이다.

```bash
npm run photos          # 기본 경로에서 가져오기
FOGGER_PHOTO_SOURCE=... npm run photos   # 다른 경로에서 가져오기
```

원본 폴더가 없으면 스크립트는 조용히 종료한다(다른 PC에서도 빌드가 깨지지 않게).
검증기는 제품 실사 3종이 없으면 **실패**시킨다 — 임시 그래픽으로 대체되는 것을 막기 위함이다.
`public/og/*.png` 는 SNS 카드용 브랜드 그래픽이며 제품 사진이 아니다.

## 검증

```bash
npm run build:verify
```

`astro check` → 빌드 → 산출물 검사 순으로 돌아간다. 검사 항목:

- 깨진 링크, 페이지 전송량(1.2MB 예산), 웹폰트 0
- `published:false` 문서의 라우트·사이트맵·RSS·llms.txt·내부링크 노출
  (대상 목록은 프론트매터에서 자동으로 읽는다)
- **자리표시자 차단** — `TODO_`, `G-XXXXXXXXXX`, `example.com`
- **구매 CTA 목적지** — 공식몰 상품 URL이 아니거나 `utm_content`가 없으면 실패
- **배송 조건 고지** — "무료배송"만 있고 조건 문구가 없으면 실패
- title 30자·중복, canonical 자기참조, 구조화데이터 정책, 화면 브레드크럼 일치
- 이미지 width/height·lazy·alt 형식

실사 이미지로 교체한 뒤에는 임시 이미지 경고를 실패로 승격시켜 확인한다:

```bash
STRICT_IMAGES=1 npm run build:verify
```
