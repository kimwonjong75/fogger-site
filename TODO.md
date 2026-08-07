# 사장님 확인·보완 목록

이 문서는 **사장님이 직접 하셔야 하는 일**만 모읍니다. 코드로 끝나는 일은 여기 없습니다.

- 자유롭게 직접 수정하셔도 됩니다. 순서를 바꾸거나 항목을 지우셔도 됩니다.
- 새로 생기는 확인 항목은 Claude가 이 문서 아래에 추가합니다.
- 끝난 항목은 `- [x]`로 바꾸고 **완료 처리** 섹션으로 옮깁니다.

마지막 갱신: 2026-08-07

---

## A. 지금 막혀 있는 것 (값을 주셔야 진행됨)

### A-1. 영상 7건 출처 확인
**어디에** — `src/data/media.ts` 의 `VIDEO_PROVENANCE` 배열
**왜** — 출처가 확인된 영상만 "제조사 촬영", "공식", "품질검수" 같은 표현을 쓸 수 있습니다. 지금은 전부 비어 있어서 표현을 뺀 상태입니다.

아는 것만 채우고 **모르면 비워 두세요.** 추측해서 적으면 안 됩니다.

| 파일 | 촬영 주체 | 촬영일 | 촬영 장소 | 저작권자 | 웹 게시 동의 | 사람 등장 |
|---|---|---|---|---|---|---|
| blueguard-fogger-howto.mp4 | | | | | | |
| qc-assembly-1.mp4 | | | | | | |
| qc-assembly-2.mp4 | | | | | | |
| spray-test.mp4 | | | | | | |
| long-nozzle-spray.mp4 | | | | | | |
| customer-use-1.mp4 | | | | | | |
| customer-use-2.mp4 | | | | | | |

- 촬영 주체는 `제조사` / `자사` / `고객` 중 하나로 적어 주세요.
- **사람이 나오는 영상**은 얼굴·차량번호·상호가 식별되는지 함께 봐 주세요. 식별되면 초상 사용 동의를 받았는지 확인이 필요하고, 없으면 모자이크 처리해야 합니다.
- 우선순위는 `blueguard-fogger-howto.mp4` 입니다. 이 영상만 검색용 구조화데이터가 붙어 있어 노출 영향이 가장 큽니다.

### A-2. 출처 링크 9건 교체
**어디에** — 각 문서의 `sources:` 항목
**왜** — 지금은 전부 기관 **홈 주소**만 걸려 있어서 독자가 근거를 확인할 수 없습니다. 근거 없는 출처는 오히려 신뢰를 깎습니다.

| 문서 | 현재 링크 |
|---|---|
| `src/content/guides/after-use-cleaning.md` | kgs.or.kr |
| `src/content/guides/choose-fogger.md` | kgs.or.kr |
| `src/content/guides/fill-and-prepare.md` | law.go.kr, kgs.or.kr |
| `src/content/guides/fogger-vs-mist-blower.md` | kgs.or.kr |
| `src/content/guides/ignition-and-spray.md` | kgs.or.kr |
| `src/content/guides/mosquito-control.md` | kdca.go.kr, kgs.or.kr |
| `src/content/uses/greenhouse.md` | nongsaro.go.kr, kdca.go.kr |
| `src/content/troubleshooting/nozzle-clogged.md` | kosha.or.kr |
| `src/content/troubleshooting/weak-smoke.md` | kdca.go.kr |

이렇게 바꿔 주세요. `issuer` · `docDate` · `section` 은 선택이고, 채우면 화면에 함께 표시됩니다.

```yaml
sources:
  - name: 부탄캔 안전사용 요령        # 기관 이름 말고 문서 제목
    url: https://www.kgs.or.kr/...   # 그 문서를 직접 여는 주소
    issuer: 한국가스안전공사
    docDate: 2025-03-11
    section: p.7
```

> 문서를 못 찾겠으면 **해당 출처를 지우는 게 낫습니다.** 홈 주소만 남기지 마세요.

### A-3. 네이버 서치어드바이저 재수집 요청
**어디서** — 네이버 서치어드바이저 → 요청 → 웹 페이지 수집

이번에 새로 만들거나 되살린 URL입니다. 네이버는 등록 후 반영까지 2~4주 걸리니 지금 넣어 두시는 게 좋습니다.

```
https://fogger.blueguard.kr/
https://fogger.blueguard.kr/guides/fogger-vs-mist-blower/
https://fogger.blueguard.kr/guides/mosquito-control/
https://fogger.blueguard.kr/guides/choose-fogger/
https://fogger.blueguard.kr/uses/
https://fogger.blueguard.kr/uses/warehouse/
https://fogger.blueguard.kr/uses/livestock-barn/
https://fogger.blueguard.kr/uses/greenhouse/
https://fogger.blueguard.kr/uses/underground-parking/
```

사이트맵도 제출돼 있는지 확인해 주세요 → `https://fogger.blueguard.kr/sitemap-index.xml`

### A-4. GA4 내부 트래픽 필터
**어디서** — GA4 관리 → 데이터 스트림 → 태그 설정 구성 → 내부 트래픽 정의

코드에서 localhost·프리뷰 도메인은 이미 차단했습니다. 남은 건 **사무실 IP**입니다. 직원이 사이트를 볼 때마다 통계가 부풀려집니다.

---

## B. 사진 촬영 (있으면 전환율이 오르는 것)

없어도 사이트는 돌아갑니다. 다만 구매 판단에 직접 영향이 큽니다.

### 홈
- [ ] **사람이 들고 있는 크기 비교** — 성인이 기기를 들고 선 정면·측면. 실제 크기를 가늠할 기준이 됩니다. **가장 효과가 큽니다.**
- [ ] **3구성 동일 구도 비교** — 기본형·대용량·대용량+롱노즐을 같은 배경, 같은 거리, 같은 각도로 나란히.
- [ ] **실제 작업 현장 전경** — 분사 중인 모습을 사람·배경과 함께. 지금 있는 영상은 근접 촬영뿐입니다.

### 제품 상세
- [ ] **점화스위치·가스밸브 클로즈업** — 조작부 위치가 보이게.
- [ ] **부탄가스 장착부** — 가스가 걸리는 위치와 체결 상태.
- [ ] **연료통 주입구·보조주입구** — 충전 한도 눈금이나 주입구 구조가 보이게.

> AI로 만든 가짜 사진은 넣지 않습니다. 사진이 없으면 그 자리를 아예 비웁니다.

---

## C. 판매처 정보 정합성

사이트와 판매처가 다른 말을 하면 검색 AI가 어느 쪽을 믿을지 알 수 없습니다.

- [ ] **네이버 스마트스토어 옵션명**이 공식몰과 같은지 (`기본형` / `대용량` / `대용량+롱노즐`)
- [ ] **가격**이 세 곳(공식몰·스마트스토어·가격비교)에서 같은지
  현재 사이트 표기: 기본형 92,000 / 대용량 103,000 / 대용량+롱노즐 113,000
- [ ] **네이버 AI가 용량을 `1.5L`로 표시하는 문제**
  원인은 찾았습니다 — 상세페이지 상단 "1,500ml로 약 30분·300평"을 AI가 탱크 용량으로 오독한 것입니다.
  사이트에는 "충전량 1,500mL 기준"이라고 조건을 명시해 뒀습니다. 상세페이지 쪽에도 같은 조건을 붙이면 더 확실합니다.
- [ ] **상세페이지 사양표가 이미지**라 검색엔진이 못 읽습니다. 표 내용을 텍스트로도 넣으면 색인에 잡힙니다.

---

## D. 결정이 필요한 것

- [ ] **제품 페이지 주소를 바꿀지**
  현재: `/products/bf-100s/`, `/products/bf-102/`, `/products/bf-102-long-nozzle/`
  화면 표기는 전부 공식 옵션명으로 바꿨지만 **주소에는 모델 번호가 남아 있습니다.**
  바꾸면 주소가 더 깔끔해지지만, 기존 주소가 404가 되므로 전부 리다이렉트를 걸어야 합니다.
  → 바꾸길 원하시면 알려주세요. 리다이렉트까지 함께 처리합니다.

- [ ] **자사몰 리뷰를 사이트에 가져올지**
  공식몰에 리뷰 117개, 만족도 4.8이 쌓여 있습니다. 구매 판단에 큰 자산입니다.
  다만 **구매가 안 되는 정보 사이트에 별점 구조화데이터를 넣으면 검색엔진 정책 위반**입니다.
  별점 데이터는 공식몰 쪽에 넣고, 이 사이트에는 리뷰 원문 링크만 거는 방식을 권합니다.

---

## 완료 처리

- [x] 공식몰 정가 3건 확인 및 반영 (2026-08-07)
- [x] 탱크 용량 확인 — 기본형 1.8L / 대용량·롱노즐 2.5L (2026-08-07)
- [x] Google Search Console 소유권 확인 (2026-08-07)
- [x] GA4 측정 ID 확인 — `G-0MQD99WG0W` (2026-08-07)
- [x] 사이트맵 제출 (2026-08-07)
- [x] 벅스델타 승인번호 확인 — `2419-0109`, 확산제는 승인 비대상 (2026-08-07)
- [x] 10단계 절차 적용 범위 확인 — 전 구성 공통, 예외 절차 불필요 (2026-08-07)
- [x] 실내외 사용 기준 확인 — 경유는 실외, 확산제는 실내외 (2026-08-07)
