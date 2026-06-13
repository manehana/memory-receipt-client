import {
  fontScaled,
  getButtonWidth,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [id, setId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width),
    [fontScale, scale, width]
  );
  const canLogin = id.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      setIsSubmitting(false);

      return () => {
        if (loginTimerRef.current) {
          clearTimeout(loginTimerRef.current);
          loginTimerRef.current = null;
        }
      };
    }, [])
  );

  useEffect(() => {
    if (!isSubmitting) {
      dotAnimations.forEach((animation) => animation.setValue(0));
      return;
    }

    const makeWave = (animation: Animated.Value) =>
      Animated.sequence([
        Animated.timing(animation, {
          toValue: -7,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.stagger(150, dotAnimations.map(makeWave)),
        Animated.delay(120),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [dotAnimations, isSubmitting]);

  const handleLogin = () => {
    if (!canLogin || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    loginTimerRef.current = setTimeout(() => {
      loginTimerRef.current = null;
      router.push("/receipt/main");
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topContent}>
          <Image
            source={require("../../assets/images/login/login-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.form}>
            <Text maxFontSizeMultiplier={1.1} style={styles.label}>
              아이디
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              maxFontSizeMultiplier={1.1}
              placeholder="아이디를 입력하세요."
              placeholderTextColor="#9F9F9F"
              style={styles.input}
              value={id}
              onChangeText={setId}
            />
          </View>
        </View>

        <Pressable
          disabled={!canLogin || isSubmitting}
          style={[styles.loginButton, canLogin && styles.loginButtonActive]}
          onPress={handleLogin}
        >
          {isSubmitting ? (
            <View style={styles.loadingDots}>
              {dotAnimations.map((animation, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.loadingDot,
                    { transform: [{ translateY: animation }] },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text
              maxFontSizeMultiplier={1.1}
              style={[
                styles.loginButtonText,
                canLogin && styles.loginButtonTextActive,
              ]}
            >
              로그인
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(scale: number, fontScale: number, screenWidth: number) {
  const buttonWidth = getButtonWidth(screenWidth);

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F7F7F7",
    },
    container: {
      flex: 1,
      paddingHorizontal: 23,
      paddingBottom: scaled(84, scale),
      justifyContent: "space-between",
    },
    topContent: {
      flexShrink: 1,
    },
    logo: {
      width: scaled(139, scale),
      height: scaled(121, scale),
      marginTop: scaled(76, scale),
      alignSelf: "center",
    },
    form: {
      marginTop: scaled(28, scale),
    },
    label: {
      marginBottom: scaled(14, scale),
      color: "#3D3D3A",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    input: {
      height: scaled(55, scale),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#DADADA",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      color: "#3D3D3A",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardMedium",
    },
    loginButton: {
      width: buttonWidth,
      height: scaled(55, scale),
      alignSelf: "center",
      borderRadius: 8,
      backgroundColor: "#E2E2E2",
      alignItems: "center",
      justifyContent: "center",
    },
    loginButtonActive: {
      backgroundColor: "#23CC89",
    },
    loginButtonText: {
      color: "#6C6C6C",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    loginButtonTextActive: {
      color: "#FFFFFF",
    },
    loadingDots: {
      flexDirection: "row",
      gap: 10,
    },
    loadingDot: {
      width: 11,
      height: 11,
      borderRadius: 5.5,
      backgroundColor: "#FFFFFF",
    },
  });
}
