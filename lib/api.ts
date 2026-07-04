import { API_BASE_URL } from "./config";
import { getToken } from "./auth";
import {
  getMockApiData,
  getMockApiPostData,
  USE_DEMO_MOCK_DATA,
} from "./mock-data";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestBody = Record<string, unknown> | undefined;

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// FastAPI는 에러를 {detail: string} 또는 422 검증 배열로 반환한다.
function extractDetail(body: unknown): unknown {
  if (body && typeof body === "object" && "detail" in body) {
    return (body as { detail: unknown }).detail;
  }
  return body;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(data));
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: RequestBody,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await authHeader()),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

// 서버가 내려주는 image_url은 호스트가 localhost로 박혀 올 수 있어 신뢰하지 않고,
// 세션 ID로 우리 API base 기준 이미지 엔드포인트 URL을 직접 만든다.
export function sessionImageUrl(sessionId: number): string {
  return `${API_BASE_URL}/recall/sessions/${sessionId}/image`;
}

export function apiGet<T>(path: string): Promise<T> {
  if (USE_DEMO_MOCK_DATA) {
    const mockData = getMockApiData<T>(path);
    if (mockData !== undefined) {
      return Promise.resolve(mockData);
    }
  }

  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: RequestBody): Promise<T> {
  if (USE_DEMO_MOCK_DATA) {
    const mockData = getMockApiPostData<T>(path);
    if (mockData !== undefined) {
      return Promise.resolve(mockData);
    }
  }

  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body?: RequestBody): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// multipart는 Content-Type을 직접 지정하면 boundary가 빠지므로 절대 설정하지 않는다.
export async function apiMultipart<T>(
  method: string,
  path: string,
  form: FormData,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(await authHeader()),
    },
    body: form,
  });

  return parseResponse<T>(response);
}
