## 사장님 확인 목록

사장님이 직접 해야 하는 일(값 확인, 촬영, 외부 서비스 설정 등)은 코드에 두지 말고
루트의 [TODO.md](TODO.md)에 추가한다. 사장님이 직접 편집하는 문서이므로
기존 항목의 문구와 순서는 임의로 바꾸지 말고, 새 항목만 아래에 덧붙인다.
완료된 항목은 "완료 처리" 섹션으로 옮기고 날짜를 남긴다.

## 제품 표기 규칙

화면·구조화데이터·분석 이벤트에는 **공식 옵션명만** 쓴다 — `기본형` / `대용량` / `대용량+롱노즐`.
내부 모델 번호(BF-…)는 산출물에 나가면 안 되며, `verify-build.mjs`가 이를 검사한다.
고객이 주문할 때 보는 이름과 사이트가 부르는 이름이 달라지는 것을 막기 위한 규칙이다.

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
