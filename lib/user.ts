import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
import type { UserFullResponse } from "./types";

// GET /auth/me — 프로필·결제·음성·회상 세션 이력을 한 번에 가져온다.
// 여러 화면(main, more)이 같은 ["me"] 키를 공유하므로 staleTime을 두어
// 화면 전환마다 재요청하지 않고 캐시된 값을 재사용한다.
export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserFullResponse>("/auth/me"),
    staleTime: 1000 * 60 * 5,
  });
}
