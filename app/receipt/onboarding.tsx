import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const LOGO_WIDTH = 175;
const LOGO_HEIGHT = 146.33;

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width],
  );
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(10)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          duration: 450,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          duration: 450,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          duration: 360,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          duration: 360,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [buttonOpacity, buttonTranslateY, logoOpacity, logoTranslateY]);

  return (
    <View style={styles.background}>
      <Image
        resizeMode="stretch"
        source={require("../../assets/images/splash/splash-bg.png")}
        style={styles.backgroundImage}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Animated.Image
            resizeMode="contain"
            source={require("../../assets/images/splash/splash-logo.png")}
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoTranslateY }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.buttonWrap,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            <Pressable
              onPress={() => router.replace("/receipt/login")}
              style={styles.primaryButton}
            >
              <Text maxFontSizeMultiplier={1.1} style={styles.primaryButtonText}>
                시작하기
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number,
) => {
  const widthRatio = screenWidth / BASE_WIDTH;
  const heightRatio = screenHeight / BASE_HEIGHT;
  const splashScale = Math.min(widthRatio, heightRatio);
  const logoWidth = Math.round(LOGO_WIDTH * splashScale);
  const logoHeight = Math.round(LOGO_HEIGHT * splashScale);

  return StyleSheet.create({
    background: {
      flex: 1,
    },
    backgroundImage: {
      bottom: 0,
      height: "100%",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      width: "100%",
    },
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingBottom: scaled(84, scale),
      paddingHorizontal: scaled(23, scale),
    },
    logo: {
      alignSelf: "center",
      height: logoHeight,
      marginTop: Math.round(screenHeight * 0.36),
      width: logoWidth,
    },
    buttonWrap: {
      marginTop: "auto",
      width: "100%",
    },
    primaryButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#23CC89",
      borderRadius: scaled(8, scale),
      height: scaled(55, scale),
      justifyContent: "center",
      maxWidth: scaled(370, scale),
      width: "100%",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
    },
  });
};
