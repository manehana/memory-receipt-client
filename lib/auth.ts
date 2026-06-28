import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "memory_receipt_access_token";

// 아이디만 입력받는 UI라 비밀번호는 클라이언트에서 고정값으로 보낸다.
export const LOGIN_PASSWORD = "asdfasdf"; // memory-receipt-fixed-pw

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
