import Constants from "expo-constants";

const DEFAULT_BASE_URL = "https://api.memory-receipt.today";

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.replace(
    /\/+$/,
    "",
  ) ?? DEFAULT_BASE_URL;
