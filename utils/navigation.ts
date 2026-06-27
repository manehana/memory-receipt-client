import { router } from "expo-router";

export const goBackToPreviousScreen = () => {
  if (router.canGoBack()) {
    router.back();
  }
};
