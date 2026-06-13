import {
  fontScaled,
  getButtonWidth,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReceiptStartScreen() {
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width),
    [fontScale, scale, width],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoBars}>|||</Text>
          </View>
          <Text style={styles.title}>기억 HANA</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push("/receipt/login")}>
          <Text style={styles.primaryButtonText}>시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (scale: number, fontScale: number, screenWidth: number) => {
  const buttonWidth = getButtonWidth(screenWidth);

  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FFFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: scaled(23, scale),
    paddingBottom: scaled(84, scale),
    justifyContent: "space-between",
  },
  logoBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    width: scaled(76, scale),
    height: scaled(76, scale),
    borderRadius: scaled(18, scale),
    backgroundColor: "#2ABD83",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBars: {
    color: "#FFFFFF",
    fontSize: fontScaled(32, fontScale),
    fontFamily: "PretendardBold",
  },
  title: {
    marginTop: scaled(24, scale),
    color: "#2ABD83",
    fontSize: fontScaled(36, fontScale),
    fontFamily: "PretendardBold",
  },
  primaryButton: {
    alignSelf: "center",
    height: scaled(55, scale),
    borderRadius: scaled(8, scale),
    backgroundColor: "#29CB88",
    alignItems: "center",
    justifyContent: "center",
    width: buttonWidth,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: fontScaled(20, fontScale),
    fontFamily: "PretendardBold",
  },
  });
};
