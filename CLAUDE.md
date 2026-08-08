## 사장님 확인 목록

사장님이 직접 해야 하는 일(값 확인, 촬영, 외부 서비스 설정 등)은 코드에 두지 말고
루트의 [TODO.md](TODO.md)에 추가한다. 사장님이 직접 편집하는 문서이므로
기존 항목의 문구와 순서는 임의로 바꾸지 말고, 새 항목만 아래에 덧붙인다.
완료된 항목은 "완료 처리" 섹션으로 옮기고 날짜를 남긴다.

## 제품 표기 규칙

화면·구조화데이터·분석 이벤트에는 **공식 옵션명만** 쓴다 — `기본형` / `대용량` / `대용량+롱노즐`.
내부 모델 번호(BF-…)는 산출물에 나가면 안 되며, `verify-build.mjs`가 이를 검사한다.
고객이 주문할 때 보는 이름과 사이트가 부르는 이름이 달라지는 것을 막기 위한 규칙이다.

## 디자인 토큰

색·모서리·글꼴은 **블루가드 디자인 시스템**에서 온다. 원본은 상표권 폴더의
`블루가드-디자인시스템-가이드.md`이고, 사이트가 쓰는 값은
[BaseLayout.astro](src/layouts/BaseLayout.astro)의 `:root` 블록 하나에 모여 있다.

**브랜드 색은 네이비 `#004282`·시안 `#008fd5`와 회색뿐이다.** 이 둘은 헤더 로고 파일에서
뽑은 값이라, 새 색을 늘리면 로고와 화면이 어긋난다. 강조가 필요하면 기존 토큰을 쓰고,
없으면 토큰을 추가하지 말고 왜 필요한지 먼저 따진다.

- **모서리는 `--r-*` 단계만 쓴다** (tag 4 / sm 6 / btn 10 / card 16 / tile 20 / panel 24 / hero 32 / pill).
  `border-radius`에 px을 직접 적지 않는다. 값이 흩어지면 규칙이 없어 보인다.
- **색 있는 한쪽 테두리(`border-left: 4px solid <브랜드색>`)는 쓰지 않는다.** 디자인 시스템 규정이다.
  강조가 필요하면 네 변을 고르게 두르고 배경을 옅게 깐다.
- **제목 굵기는 700이다.** Pretendard는 변수 폰트라 850·900을 적으면 그대로 그려져 뭉친다.
  시스템 글꼴 시절에는 브라우저가 눌러 줘서 티가 안 났을 뿐이다.
- **안전 경고(`--c-warn`/`--c-danger`)는 브랜드 색과 분리해서 쓴다.** 디자인 시스템은 경고에
  빨강을 금하지만 그것은 살충제 기준이고, 연막소독기는 화기·고온 위험이 실재한다.

글꼴은 `public/fonts/pretendard/`에 자체 호스팅한다. 92개 조각으로 나뉘어 있어 브라우저가
그 페이지에 쓰인 글자가 든 조각만 받는다(홈 기준 22조각·96KB). `verify-build.mjs`가
외부 글꼴 서버 참조와 조각 파일 용량을 검사한다 — 남의 CDN을 걸면 빌드가 막힌다.

## 미디어 지도 (`/admin/media/`)

사진·영상이 **어느 화면 어디에 쓰이는지, 어느 자리가 비었는지** 사장님이 보는 화면이다.
자리표시자(`PhotoSlot`)는 개발 서버에서만 보이는데 사장님은 개발 서버를 켜지 않으므로,
이 화면이 유일한 확인 수단이다.

목록의 원본은 [media-map.ts](src/data/media-map.ts)다. **채워진 사진은 실제 자산을
`import` 하므로** 파일을 지우면 빌드가 깨져 목록이 현실과 어긋날 수 없다.

편집 화면에서 바꿀 수 있는 자리는 파일명을 손으로 적지 않고 화면 문구 JSON에서 읽어간다
(`assetFileName(HOME_PAGE.hero.image.path)`). 사장님이 사진을 바꾸면 지도가 저절로 따라오고,
`editIn`에 "어디를 열면 바꿀 수 있는지"가 적혀 화면에 표시된다.

`verify-build.mjs`가 검사한다 — 지도가 가리키는 파일이 실제로 있는지(실패),
`public/video`의 영상이 전부 `media.ts`에 등록됐는지(실패), `src/assets`의 `photo-*`를
아무 데서도 안 쓰는지(**경고**).

마지막 것만 경고인 이유: 편집 화면에서 사진을 바꾸면 예전 파일이 `src/assets`에 남는다.
이걸 실패로 잡으면 "사진을 바꿨더니 배포가 안 되는" 상황이 되고 사장님은 원인을 알 수 없다.
안 쓰는 파일은 화면을 망가뜨리지 않으므로 알려만 주고 배포는 막지 않는다.

**코드에 박힌 사진을 넣거나 바꾸면 `media-map.ts`도 같이 고친다.**

## 편집 화면 (`/admin/`)

사장님이 사이트 내용을 직접 고치는 화면이다. Sveltia CMS를 쓴다. 두 묶음이 있다.

**"화면 문구"** — 방문자가 보는 각 화면의 글과 사진. 값은 `src/content/pages/*.json`,
스키마는 [pages.ts](src/data/pages.ts), 읽기·검사 도구는 [page-content.ts](src/lib/page-content.ts).
**"문서"** — 사용법·활용사례·문제해결 마크다운. 스키마는 [content.config.ts](src/content.config.ts).

**두 스키마와 `public/admin/config.yml`은 손으로 맞춘 사본 관계다. 한쪽만 고치면 안 된다.**
어긋나는 방향이 셋 다 나쁘다.

- 규칙이 느슨해지면 → 화면에서는 저장되는데 빌드가 깨진다
- 규칙이 빡빡해지면 → 멀쩡한 기존 내용을 화면이 거부해서 손을 못 댄다
- **입력칸을 빠뜨리면 → 사장님이 그 화면을 저장하는 순간 그 항목이 파일에서 지워진다**
  (Sveltia는 설정에 적힌 입력칸만 다시 쓴다. 가장 위험한 방향이다)

`verify-build.mjs`가 셋 다 검사한다 — 문서는 "모든 문서가 편집 화면을 통과하는가"로,
화면 문구는 "설정의 입력칸과 JSON의 항목이 정확히 같은가"로.

문서를 새로 추가하면 `config.yml`의 `related` 선택지에도 추가한다(검증기가 강제한다).

### 화면 문구를 다룰 때

**숫자를 JSON에 직접 쓰지 않는다.** `{{충전한도}}`처럼 적으면 빌드 때 `products.ts`의 값으로
치환된다(`TOKENS` 참조). 자리표시자 없이 숫자를 적으면 사양이 바뀔 때 화면만 옛 값으로 남는다.

사진은 `"/src/assets/파일명"` 경로로 저장되고 `import.meta.glob`이 실제 이미지로 바꾼다.
정적 `import`를 쓰면 편집 화면에서 올린 사진이 화면에 붙지 않는다.

한 줄짜리 문구의 `**굵게**`·`[링크](/주소/)` 표기는 `inlineParts`가 처리한다. HTML 태그는
글자 그대로 나간다 — 편집 화면을 통해 임의의 HTML이 사이트에 들어오는 것을 막기 위해서다.

제품 사양·가격은 편집 화면에 넣지 않는다. 근거 주석이 달린 검증된 값이라 폼으로 열면
근거 추적이 끊긴다. 변경이 필요하면 [TODO.md](TODO.md)를 통한다.
(안전수칙 **문구**는 2026-08-08에 사장님 요청으로 편집 화면에 열었다. 숫자는 여전히
자리표시자로 `products.ts`에서 온다.)

### 저장하면 바로 반영된다

편집 화면은 `main`을 바라보고, Vercel이 `main`을 보고 배포한다. 예전에는 `draft` 브랜치와
PR을 거쳤는데, 사장님이 매번 [Merge]를 눌러야 해서 "저장했는데 왜 안 바뀌지"가 됐다.

검증은 배포 과정 **안으로** 옮겼다 — [vercel.json](vercel.json)의 `buildCommand`가
`npm run build:verify`다. 검증에 걸리면 빌드가 실패하고, 빌드가 실패하면 Vercel은 배포하지
않는다(사이트는 직전 버전 유지). **이 한 줄이 유일한 게이트다. 지우면 검증이 조용히 빠진다.**
`verify` 워크플로는 같은 검사를 GitHub 커밋 목록에 초록불/빨간불로 남기는 용도다.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
