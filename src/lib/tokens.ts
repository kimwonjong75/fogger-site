/**
 * 문구 안의 `{{이름}}` 을 실제 값으로 바꾸는 도구.
 *
 * **왜 자리표시자를 쓰는가**
 * 탱크 용량·충전 한도 같은 값은 한 곳에만 있어야 한다. 화면 문구에 숫자를 손으로 적으면
 * 나중에 사양이 바뀌었을 때 한쪽만 고쳐지고 다른 쪽은 옛 숫자로 남는다. 편집 화면을
 * 사장님이 직접 쓰기 시작하면서 이 위험이 실제가 됐다.
 *
 * 아무것도 읽지 않는 파일로 떼어 둔 이유: 제품 데이터(`src/data/products.ts`)와
 * 화면 문구(`src/lib/page-content.ts`)가 각자 다른 자리표시자 표를 쓰는데, 제품 데이터
 * 쪽이 표의 재료라서 한쪽이 다른 쪽을 읽으면 서로 물린다.
 */

const TOKEN_PATTERN = /\{\{\s*([^}\s]+)\s*\}\}/g;

/**
 * `{{이름}}` 을 표의 값으로 바꾼다.
 *
 * 표에 없는 이름이면 조용히 남기지 않고 빌드를 세운다 — 화면에 `{{오타}}` 가 그대로
 * 찍히는 것보다 배포가 막히는 편이 낫다.
 */
export function substitute(text: string, table: Record<string, string>, where: string): string {
  return text.replace(TOKEN_PATTERN, (whole, name: string) => {
    const value = table[name];
    if (value === undefined) {
      throw new Error(
        `[${where}] 쓸 수 없는 자리표시자 "${whole}" 입니다.\n` +
          `쓸 수 있는 이름: ${Object.keys(table).join(', ')}`,
      );
    }
    return value;
  });
}

/** 산출물에 자리표시자가 남았는지 확인할 때 쓰는 검사식 */
export const hasToken = (text: string) => /\{\{\s*[^}\s]+\s*\}\}/.test(text);
