import AnimatedTranscript from "@/components/AnimatedTranscript";
import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { apiGet, apiPost } from "@/lib/api";
import { revealPresentationTodaySession } from "@/lib/presentation";
import type { RecallSessionResponse } from "@/lib/types";
import { goBackToPreviousScreen } from "@/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
      title: "거의 다 만들었어요!",
      description: "기억 수첩에 자동 저장돼요.\n언제든 기억 수첩에서 모아서 볼 수 있어요.",
    };
  }
  return {
    title: "기억 영수증 제작 중..",
    description: "오늘 나눈 대화를 바탕으로\n기억 영수증을 만들고 있어요.",
  };
}

export default function MemoryReceiptLoading() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const id = sessionId ? Number(sessionId) : null;
  const queryClient = useQueryClient();
  // 분석이 끝날 때까지 진행률은 표시용 인디케이터로만 반복 채운다(실제 진행도 아님).
  const [progress, setProgress] = useState(0);
  const progressAnim = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale],
  );

  // 세션 상태를 2초마다 폴링해 completed/failed로 분기한다.
  const { data } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiGet<RecallSessionResponse>(`/recall/sessions/${id}`),
    enabled: id != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
  });
  const status = data?.status;
  const isFailed = status === "failed";

  // 실패한 세션은 재녹음 없이 분석만 재시도한다(spec: failed + restart 미지정 → 재분석).
  const retryMutation = useMutation({
    mutationFn: () => apiPost("/recall/sessions", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
    },
    onError: () => {
      Alert.alert("다시 시도할 수 없어요", "잠시 후 다시 시도해주세요.");
    },
  });

  const svgSize = scaled(CIRCLE_VIEWBOX, scale);
  const iconSize = scaled(ICON_SIZE, scale);
  const { title, description } = isFailed
    ? {
        title: "분석에 실패했어요",
        description: "다시 시도하면 오늘 대화를\n다시 분석해드릴게요.",
      }
    : getStageText(progress);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressAnim.value / 100),
  }));

  const startProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    progressAnim.value = 0;

    // 시간 기반으로 0→100을 반복 채운다. 선형 대신, 한 사이클 안에서 속도가
    // 여러 번 빨라졌다 느려지도록(가감속을 반복) 한다. 항상 전진은 유지한다.
    const CYCLE_DURATION = 9000; // 한 바퀴(0→100)에 걸리는 시간
    const TICK = 40;
    const PULSES = 3; // 한 사이클당 가감속 반복 횟수
    const AMP = 0.9; // 가감속 강도(0~1, 1에 가까울수록 멈칫→쭉 차오름)
    const startTime = Date.now();
    let lastValue = 0;

    intervalRef.current = setInterval(() => {
      const t = ((Date.now() - startTime) % CYCLE_DURATION) / CYCLE_DURATION;
      // 기본 진행(t)에 사인파를 더해 속도를 PULSES번 가감속시킨다.
      // 도함수 = 1 + AMP*cos(...) 이라 AMP<1이면 항상 단조 증가한다.
      const eased =
        t + (AMP / (2 * Math.PI * PULSES)) * Math.sin(2 * Math.PI * PULSES * t);
      const value = Math.min(100, Math.max(0, Math.round(eased * 100)));

      if (value < lastValue) {
        if (completedRef.current) {
          // 완료된 상태라면 되감지 않고 100%에서 멈춘다.
          if (lastValue < 100) {
            progressAnim.value = withTiming(100, {
              duration: TICK,
              easing: Easing.linear,
            });
            setProgress(100);
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        // 다음 사이클로 넘어가며 0으로 되감길 때는 애니메이션 없이 스냅한다.
        progressAnim.value = value;
      } else {
        progressAnim.value = withTiming(value, {
          duration: TICK,
          easing: Easing.linear,
        });
      }
      if (value !== lastValue) setProgress(value);
      lastValue = value;
    }, TICK);
  }, [progressAnim]);

  useEffect(() => {
    if (isFailed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startProgress();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startProgress, isFailed]);

  // 완료 응답을 받아도 그래프는 기존 속도로 계속 오르고, 사이클 끝(100%)에서 멈춘다.
  useEffect(() => {
    completedRef.current = status === "completed";
    if (status !== "completed") return;
    // 발표 모드: 오늘 세션을 목록에 공개하고, ["me"] 캐시를 갱신해 반영한다.
    revealPresentationTodaySession();
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [status, queryClient]);

  // 진행률이 100%가 된 뒤에만 결과 화면으로 전환한다.
  useEffect(() => {
    if (status !== "completed" || id == null || progress < 100) return;
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/receipt/memory-receipt",
        params: { sessionId: String(id) },
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [status, id, progress]);

  return (
    <View style={styles.root}>
      <Image source={LoadingBg} style={styles.backgroundImage} resizeMode="stretch" />

      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={goBackToPreviousScreen}>
          <Ionicons name="chevron-back" size={30} color="#9F9F9F" />
        </Pressable>

        {/* 제목/설명은 voice-waiting의 질문·응답과 동일한 blur→sharp 단어 등장 연출을 쓴다.
            단계(getStageText)가 바뀌면 새 문구의 단어들이 시차를 두고 흐림→선명으로 떠오른다. */}
        <View style={styles.textBox}>
          <AnimatedTranscript
            transcript={title}
            textStyle={styles.title}
            containerStyle={styles.titleWords}
            wrapStyle={styles.titleWordWrap}
            shadowColor="#2ABD83"
            staggerMs={80}
            manualLineBreaks={false}
          />
          <AnimatedTranscript
            transcript={description}
            textStyle={styles.description}
            containerStyle={styles.descriptionWords}
            wrapStyle={styles.descriptionWordWrap}
            shadowColor="#9F9F9F"
            staggerMs={55}
            manualLineBreaks={false}
          />
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
        <Pressable
          disabled={retryMutation.isPending}
          style={styles.helpButton}
          onPress={() => {
            if (isFailed) {
              retryMutation.mutate();
            }
          }}
        >
          <Text style={styles.helpText}>
            {isFailed ? "다시 시도하기" : "제작이 안돼요"}
          </Text>
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
  titleWords: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  titleWordWrap: {
    marginRight: scaled(8, scale),
    position: "relative",
  },
  description: {
    color: "#9F9F9F",
    fontSize: fontScaled(20, fontScale),
    fontFamily: "PretendardMedium",
    lineHeight: fontScaled(26, fontScale),
  },
  descriptionWords: {
    marginTop: scaled(12, scale),
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  descriptionWordWrap: {
    marginRight: scaled(6, scale),
    position: "relative",
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
