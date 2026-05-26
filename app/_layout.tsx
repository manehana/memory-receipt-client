import { Stack } from "expo-router";
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [loaded] = useFonts({
    PretendardRegular: require("../assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}