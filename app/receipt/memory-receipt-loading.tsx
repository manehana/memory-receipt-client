import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const LoadingBg = require("@/assets/images/memory-receipt-loading/memory-receipt-loading-bg.png");
const LoadingIcon = require("@/assets/images/memory-receipt-loading/memory-receipt-loading-icon.png");

// 402×874 기준: 아이콘 222px → base = 222 / 0.9393 ≈ 236
const ICON_SIZE = 236;
const STROKE_WIDTH = 10;
const CIRCLE_VIEWBOX = ICON_SIZE + STROKE_WIDTH * 2;
const RADIUS = (CIRCLE_VIEWBOX - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CX = CIRCLE_VIEWBOX / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getStageText(progress: number) {
  if (progress >= 100) {
    return {
      title: "기억 영수증 제작 완료!",
      description: "기억 수첩에 자동 저장돼요\n언제든 기억 수첩에서 모아서 볼 수 있어요.",
    };
  }
  if (progress >= 75) {
    return {
      title: "거의다 만들었어요!",
      description: "기억 수첩에 자동 저장돼요.\n언제든 기억 수첩에서 모아서 볼 수 있어요.",
    };
  }
  return {
    title: "기억 영수증 제작 중..",
    description: "오늘 나눈 대화를 바탕으로\n기억 영수증을 만들고 있어요.",
  };
}

export default function MemoryReceiptLoading() {
  const [progress, setProgress] = useState(0);
  const progressAnim = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale],
  );

  const svgSize = scaled(CIRCLE_VIEWBOX, scale);
  const iconSize = scaled(ICON_SIZE, scale);
  const { title, description } = getStageText(progress);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressAnim.value / 100),
  }));

  const startProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    progressAnim.value = 0;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        const next = prev + 1;
        progressAnim.value = withTiming(next, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        return next;
      });
    }, 120); // 1% / 120ms → 약 12초
  }, [progressAnim]);

  useEffect(() => {
    startProgress();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startProgress]);

  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => {
      router.replace("/receipt/memory-receipt");
    }, 350);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <View style={styles.root}>
      <Image source={LoadingBg} style={styles.backgroundImage} resizeMode="stretch" />

      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#9F9F9F" />
        </Pressable>

        <View style={styles.textBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* 텍스트~원: 98px (402 기준) → scaled(104) */}
        <View style={[styles.circleArea, { width: svgSize, height: svgSize }]}>
          <Image
            source={LoadingIcon}
            style={{ width: iconSize, height: iconSize, position: "absolute" }}
            resizeMode="contain"
          />
          <Svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${CIRCLE_VIEWBOX} ${CIRCLE_VIEWBOX}`}
            style={{ position: "absolute" }}
          >
            <Circle
              cx={CX}
              cy={CX}
              r={RADIUS}
              stroke="#E0E0E0"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CX}
              cy={CX}
              r={RADIUS}
              stroke="#23CC89"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform={`rotate(-90, ${CX}, ${CX})`}
              animatedProps={animatedProps}
            />
          </Svg>
        </View>

        {/* 원~진행률: 41px (402 기준) → scaled(44) */}
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>진행률 </Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>

        {/* 진행률~버튼: 107px (402 기준) → scaled(114) */}
        <Pressable style={styles.helpButton} onPress={startProgress}>
          <Text style={styles.helpText}>제작이 안돼요</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (scale: number, fontScale: number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: -8,
    right: -8,
    bottom: 0,
    width: undefined,
    height: undefined,
  },
  container: {
    flex: 1,
    paddingHorizontal: scaled(24, scale),
    paddingTop: scaled(44, scale),
    paddingBottom: scaled(86, scale),
  },
  backButton: {
    width: scaled(40, scale),
    height: scaled(40, scale),
    justifyContent: "center",
    marginLeft: scaled(-6, scale),
  },
  textBox: {
    marginTop: scaled(42, scale),
  },
  title: {
    color: "#2ABD83",
    fontSize: fontScaled(32, fontScale),
    fontFamily: "PretendardBold",
    lineHeight: fontScaled(40, fontScale),
  },
  description: {
    marginTop: scaled(12, scale),
    color: "#9F9F9F",
    fontSize: fontScaled(20, fontScale),
    fontFamily: "PretendardMedium",
    lineHeight: fontScaled(26, fontScale),
  },
  circleArea: {
    marginTop: scaled(104, scale),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBox: {
    marginTop: scaled(44, scale),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  progressLabel: {
    color: "#9F9F9F",
    fontSize: fontScaled(24, fontScale),
    fontFamily: "PretendardSemiBold",
  },
  progressValue: {
    color: "#2ABD83",
    fontSize: fontScaled(24, fontScale),
    fontFamily: "PretendardBold",
  },
  helpButton: {
    marginTop: scaled(114, scale),
    alignItems: "center",
  },
  helpText: {
    color: "#BFBFBF",
    fontSize: fontScaled(20, fontScale),
    fontFamily: "PretendardMedium",
  },
});
