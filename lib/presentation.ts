import * as SecureStore from "expo-secure-store";

// 발표(presentation) 모드: 더보기 탭에서 '고객센터'를 10번 연속 터치하면 토글된다.
// 켜지면 시나리오에 포함된 API(/recall, /stats, /auth/me)만 /presentation prefix로
// 요청하고, 나머지는 기존 API를 그대로 쓴다.
const MODE_KEY = "memory_receipt_presentation_mode";

// buildUrl은 동기라서 in-memory 미러를 두고, 저장값은 모듈 로드 시 1회 하이드레이트한다.
let presentationMode = false;

SecureStore.getItemAsync(MODE_KEY).then((value) => {
  presentationMode = value === "1";
});

export function isPresentationMode(): boolean {
  return presentationMode;
}

export async function setPresentationMode(on: boolean): Promise<void> {
  presentationMode = on;
  await SecureStore.setItemAsync(MODE_KEY, on ? "1" : "0");
}

// 발표 시나리오가 서버에 구현된 경로들. 여기 없는 경로는 기존 API 사용.
const SCENARIO_PREFIXES = ["/recall", "/stats", "/auth/me", "/report"];

export function presentationPath(path: string): string {
  if (!presentationMode) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return SCENARIO_PREFIXES.some((p) => normalized.startsWith(p))
    ? `/presentation${normalized}`
    : normalized;
}
