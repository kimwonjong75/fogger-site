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
`verify-build.mjs`가 양방향으로 검사한다 — `src/assets`의 `photo-*`가 전부 지도에
등록됐는지, 지도가 가리키는 파일이 실제로 있는지, `public/video`의 영상이 전부
`media.ts`에 등록됐는지.

**사진·영상을 넣거나 바꾸면 `media-map.ts`도 같이 고친다.** 안 고치면 빌드가 막힌다.

## 문서 편집 화면 (`/admin/`)

사장님이 가이드·활용사례·문제해결 문서를 직접 고치는 화면이다. Sveltia CMS를 쓴다.

**입력칸 정의는 `public/admin/config.yml`, 실제 스키마는 `src/content.config.ts`다.
둘은 손으로 맞춘 사본 관계이므로 한쪽만 고치면 안 된다.** 어긋나면 화면에서는 저장되는데
빌드가 깨지거나, 멀쩡한 기존 문서를 화면이 거부해서 손을 못 대게 된다.
`verify-build.mjs`가 "저장소의 모든 문서가 편집 화면을 통과하는가"로 이 드리프트를 검사한다.

문서를 새로 추가하면 `config.yml`의 `related` 선택지에도 추가한다(검증기가 강제한다).

편집 화면은 `main`이 아니라 **`draft` 브랜치**를 바라본다. Sveltia CMS는 저장 시 PR을 만드는
editorial workflow를 지원하지 않아, 그대로 두면 검증 없이 `main`에 직행하기 때문이다.
`draft`에 푸시되면 `open-draft-pr` 워크플로가 PR을 열고 `verify` 워크플로가 검사한다.

제품 사양·가격·안전수칙은 편집 화면에 넣지 않는다. 근거 주석이 달린 검증된 값이라
폼으로 열면 근거 추적이 끊긴다. 변경이 필요하면 [TODO.md](TODO.md)를 통한다.

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
