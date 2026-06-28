import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
import type { StatsResponse } from "./types";

// GET /stats?year=&month= — 대화 참여 통계 + 소비 통계를 한 번에 가져온다.
// year/month는 1-based(API 계약). 호출부는 JS의 0-based month를 +1 해서 넘긴다.
// 같은 (year, month)는 캐시를 공유하므로 선택 월이 현재 월과 같으면 요청은 한 번뿐이다.
export function useStats(year: number, month: number) {
  return useQuery({
    queryKey: ["stats", year, month],
    queryFn: () => apiGet<StatsResponse>(`/stats?year=${year}&month=${month}`),
    staleTime: 1000 * 60 * 5,
  });
}
