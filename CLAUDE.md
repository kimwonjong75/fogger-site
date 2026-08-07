## 사장님 확인 목록

사장님이 직접 해야 하는 일(값 확인, 촬영, 외부 서비스 설정 등)은 코드에 두지 말고
루트의 [TODO.md](TODO.md)에 추가한다. 사장님이 직접 편집하는 문서이므로
기존 항목의 문구와 순서는 임의로 바꾸지 말고, 새 항목만 아래에 덧붙인다.
완료된 항목은 "완료 처리" 섹션으로 옮기고 날짜를 남긴다.

## 제품 표기 규칙

화면·구조화데이터·분석 이벤트에는 **공식 옵션명만** 쓴다 — `기본형` / `대용량` / `대용량+롱노즐`.
내부 모델 번호(BF-…)는 산출물에 나가면 안 되며, `verify-build.mjs`가 이를 검사한다.
고객이 주문할 때 보는 이름과 사이트가 부르는 이름이 달라지는 것을 막기 위한 규칙이다.

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
