import { getToken } from "@/lib/auth";
import { useEffect, useState } from "react";

// 하이라이트 이미지는 인증이 필요한 엔드포인트라 Authorization 헤더를 붙여 불러온다.
// expo-image의 source.headers에 그대로 넘겨 쓴다.
export function useImageAuthHeaders(): Record<string, string> | undefined {
  const [headers, setHeaders] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        setHeaders({ Authorization: `Bearer ${token}` });
      }
    });
  }, []);

  return headers;
}
