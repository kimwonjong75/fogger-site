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
선택: `related`, `showSpecTable`, `videoKey`(`sprayTest|longNozzle` — `src/data/media.ts`의
`VIDEO_BY_KEY` 참조).

`published: false` 문서는 라우트가 생성되지 않으므로 사이트맵·RSS·llms.txt·
내부링크 어디에도 나타나지 않는다.
(`winter-operation`, `greenhouse`, `livestock-barn`, `underground-parking`, `warehouse` —
공식 사양이 "사용 장소: 실외"라 실내·반개방 작업 문서는 비공개 상태다)

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
| 각 문서 `sources` | 기관 홈이 아닌 직접 문서 URL | 개선 필요 (공식 영상은 이미 1차 출처로 추가됨) |
| `src/data/chemicals.ts` → `approvalNumber` | 약제 승인·신고 번호 | 미확보 (전 품목 비공개 유지) |
| 이 문서 하단 "추가로 필요한 실사 촬영 목록" | 실물 크기·부위 상세 사진 | 미촬영 (TODO.md B섹션과 동일 목록) |

사업자 정보, 탱크 용량(1.8L/2.5L, 공식 상세페이지 확인 완료), GA4 ID, 구매 URL, 제품 실사,
공식 로고, 사용법·촬영 영상, 구성품·크기·노즐 사양은 반영 완료.

## 제품 실사

`src/assets/photo-*.jpg` 는 사내 제품 자산 폴더의 1000×1000 제품 컷을 가져온 것이다.

```bash
npm run photos          # 기본 경로에서 가져오기
FOGGER_PHOTO_SOURCE=... npm run photos   # 다른 경로에서 가져오기
```

원본 폴더가 없으면 스크립트는 조용히 종료한다(다른 PC에서도 빌드가 깨지지 않게).
검증기는 제품 실사 3종이 없으면 **실패**시킨다 — 임시 그래픽으로 대체되는 것을 막기 위함이다.
`public/og/*.png` 는 SNS 카드용 브랜드 그래픽이며 제품 사진이 아니다.

아직 없는 실물 크기·부위 상세 사진은 `src/data/photo-requests.ts` 에 목록으로 남겨 두었고
홈/제품 페이지의 `PhotoRequest` 컴포넌트가 점선 자리표시 타일로 보여준다. 촬영본이 생기면
사진을 넣고 배열에서 항목을 지우면 된다 — 목록이 비면 섹션 자체가 사라진다.

## 영상

`src/data/media.ts` 가 자체 호스팅 영상(공식 사용법·분사테스트·롱노즐 촬영·제조 현장·실사용
현장)의 단일 소스다. `VideoEmbed` 는 클릭 전까지 `<video>`를 만들지 않으므로 초기 페이지
전송량에 영향이 없다. 새 영상을 추가하려면:

1. `ffmpeg`으로 `public/video/`에 웹용으로 재인코딩 (`scale=540:-2`, `crf 26~30`, `+faststart`)
2. 포스터 프레임을 `src/assets/`에 추출
3. `media.ts`에 `VideoAsset` 항목 추가
4. 문서에서 쓰려면 `content.config.ts`의 `videoKey` enum에 키를 추가하고 frontmatter에 지정

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
- title 35자·중복, canonical 자기참조, 구조화데이터 정책, 화면 브레드크럼 일치
- 이미지 width/height·lazy·alt 형식

실사 이미지로 교체한 뒤에는 임시 이미지 경고를 실패로 승격시켜 확인한다:

```bash
STRICT_IMAGES=1 npm run build:verify
```

## 추가로 필요한 실사 촬영 목록

과거에는 이 목록을 `PhotoRequest` 컴포넌트로 홈에 점선 자리표시자로 띄웠으나,
공개 사이트에 내부 촬영 체크리스트가 노출되어 미완성 인상을 주므로 제거했다.
촬영본이 확보되면 해당 자리에 실사를 넣고 이 목록에서 지운다.

### 홈
- **사람이 들고 있는 크기 비교** — 성인이 기기를 들고 선 정면·측면. 실제 크기를 가늠할 기준.
- **3모델 동일 구도 비교** — BF-100S·BF-102·롱노즐 구성을 같은 배경·거리·각도로 나란히.
- **실제 작업 현장 전경** — 분사 중인 모습을 사람·배경과 함께. 현재 클립은 근접 촬영뿐.

### 제품 상세
- **점화스위치·가스밸브 클로즈업** — 조작부 위치를 명확히 보여주는 근접 사진.
- **부탄가스 장착부** — 가스가 걸리는 위치와 체결 상태.
- **연료통 주입구·보조주입구** — 충전 한도 눈금이나 주입구 구조가 보이는 사진.

AI로 합성한 가짜 사진으로 채우지 않는다. 사진이 없으면 해당 섹션을 렌더링하지 않는다.
