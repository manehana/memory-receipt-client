import {
  fontScaled,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
  View,
} from "react-native";
import Reanimated, {
  Easing as REasing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const COMPLETE_PRESSED_MS = 180;
const COMPLETE_DONE_MS = 650;
// STT 단어 등장 애니메이션: 시그모이드(S-커브) 가속, blur→sharp + fade
const SIGMOID_EASING = REasing.bezier(0.65, 0, 0.35, 1);
const WORD_FADE_MS = 520;
const REFLOW_MS = 360;
// 글자 자체에 거는 흐림 반경(시작값) — BlurView 같은 사각형 패널이 아니라
// 글리프 모양을 따라가는 그림자라 영역이 네모로 잘리지 않는다.
const MAX_BLUR_RADIUS = 9;
const WORD_SHADOW = {
  textShadowColor: "#3B3B3B",
  textShadowOffset: { width: 0, height: 0 },
} as const;
const voiceIdleCircleImage = require("../../assets/images/voice/voice-idle-circle.png");
const voiceIdleSmallCircleImage = require("../../assets/images/voice/voice-idle-small-circle.png");
const voiceListeningCircleImage = require("../../assets/images/voice/voice-listening-circle.png");
const voiceListeningMicroCircleImage = require("../../assets/images/voice/voice-listening-micro-circle.png");
const voiceListeningSmallCircleBlurImage = require("../../assets/images/voice/voice-listening-small-circle-blur.png");
const voiceListeningSmallCircleImage = require("../../assets/images/voice/voice-listening-small-circle.png");

type CompleteStatus = "ready" | "pressed" | "done";

type ConversationFriend = {
  id: string;
  icon: ImageSourcePropType;
};

const friends: ConversationFriend[] = [
  {
    id: "hanaboy",
    icon: require("../../assets/images/onboarding/friend-hanaboy-inactive-icon.png"),
  },
  {
    id: "hanagirl",
    icon: require("../../assets/images/onboarding/friend-hanagirl-inactive-icon.png"),
  },
  {
    id: "son",
    icon: require("../../assets/images/onboarding/friend-son-inactive-icon.png"),
  },
  {
    id: "daughter",
    icon: require("../../assets/images/onboarding/friend-daughter-inactive-icon.png"),
  },
  {
    id: "hodong",
    icon: require("../../assets/images/onboarding/friend-hodong-inactive-icon.png"),
  },
  {
    id: "heungmin",
    icon: require("../../assets/images/onboarding/friend-heungmin-inactive-icon.png"),
  },
  {
    id: "yeongung",
    icon: require("../../assets/images/onboarding/friend-yeongung-inactive-icon.png"),
  },
  {
    id: "gdragon",
    icon: require("../../assets/images/onboarding/friend-gdragon-inactive-icon.png"),
  },
  {
    id: "yujin",
    icon: require("../../assets/images/onboarding/friend-yujin-inactive-icon.png"),
  },
];

const questions = [
  "오늘 카페에 다녀오셨어요.\n어떤 점이 좋았는데, 기억나세요?",
  "아쉽네요..카페 갔다가\n어디가셨는지 기억나세요?",
  "오늘 가장 기억에 남는 시간은 무엇이었나요?",
];

type TranscriptWord = { key: string; text: string };

function AnimatedWord({
  text,
  textStyle,
  wrapStyle,
}: {
  text: string;
  textStyle: StyleProp<TextStyle>;
  wrapStyle: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: WORD_FADE_MS,
      easing: SIGMOID_EASING,
    });
  }, [progress]);

  // opacity fade + 글리프 모양을 따라가는 흐림(textShadowRadius)을 함께 진행해
  // 흐릿한 글자가 선명해지는 효과. BlurView 사각형 패널이 아니라 네모로 잘리지 않음.
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    textShadowRadius: (1 - progress.value) * MAX_BLUR_RADIUS,
  }));

  return (
    <Reanimated.View
      layout={LinearTransition.duration(REFLOW_MS).easing(SIGMOID_EASING)}
      style={wrapStyle}
    >
      <Reanimated.Text
        maxFontSizeMultiplier={1.1}
        style={[textStyle, WORD_SHADOW, animatedTextStyle]}
      >
        {text}
      </Reanimated.Text>
    </Reanimated.View>
  );
}

function AnimatedTranscript({
  transcript,
  textStyle,
  containerStyle,
  wrapStyle,
}: {
  transcript: string;
  textStyle: StyleProp<TextStyle>;
  containerStyle: StyleProp<ViewStyle>;
  wrapStyle: StyleProp<ViewStyle>;
}) {
  // 신규 단어만 등장 애니메이션이 돌도록 직전 단어 배열과 접두 비교
  const prevRef = useRef<TranscriptWord[]>([]);
  const seqRef = useRef(0);

  const words = useMemo(() => {
    const tokens = transcript.trim().length ? transcript.trim().split(/\s+/) : [];
    const prev = prevRef.current;
    const next = tokens.map((text, index) => {
      if (prev[index] && prev[index].text === text) {
        return prev[index];
      }
      return { key: `w${seqRef.current++}`, text };
    });
    prevRef.current = next;
    return next;
  }, [transcript]);

  return (
    <View style={containerStyle}>
      {words.map((word) => (
        <AnimatedWord
          key={word.key}
          text={word.text}
          textStyle={textStyle}
          wrapStyle={wrapStyle}
        />
      ))}
    </View>
  );
}

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT, 1);
  const circleScale = Math.min(width / BASE_WIDTH, 1);
  const pillBaseScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const pillScale =
    pillBaseScale > 1
      ? 1 + (pillBaseScale - 1) * 0.45
      : Math.max(pillBaseScale, 0.76);
  const fontScale = Math.max(scale, 0.76);
  const styles = useMemo(
    () => createStyles(scale, fontScale, circleScale, pillScale, width, height),
    [circleScale, fontScale, height, pillScale, scale, width],
  );
  const listeningCircleOpacity = useRef(new Animated.Value(0)).current;
  const listeningBadgePulse = useRef(new Animated.Value(0)).current;
  const listeningBlurPulse = useRef(new Animated.Value(0)).current;
  const listeningMicroOffsets = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const completeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [completeStatus, setCompleteStatus] =
    useState<CompleteStatus>("ready");
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  const selectedFriend =
    friends.find((friend) => friend.id === friendId) ?? friends[0];
  const isVoiceActive = isListening || hasResponse;
  const hasTranscript = transcript.trim().length > 0;
  const goBack = () => {
    setIsExitModalVisible(true);
  };

  const clearCompleteTimers = () => {
    completeTimers.current.forEach((timer) => clearTimeout(timer));
    completeTimers.current = [];
  };

  const confirmExit = () => {
    setIsExitModalVisible(false);
    clearCompleteTimers();
    ExpoSpeechRecognitionModule.abort();
    router.replace("/receipt/main");
  };

  useEffect(() => clearCompleteTimers, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setIsExitModalVisible(true);
        return true;
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.timing(listeningCircleOpacity, {
      duration: 360,
      toValue: isVoiceActive ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isVoiceActive, listeningCircleOpacity]);

  useEffect(() => {
    if (!isVoiceActive) {
      listeningBadgePulse.stopAnimation();
      listeningBadgePulse.setValue(0);
      listeningBlurPulse.stopAnimation();
      listeningBlurPulse.setValue(0);
      listeningMicroOffsets.forEach((offset) => {
        offset.stopAnimation();
        offset.setValue(0);
      });
      return;
    }

    const badgeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(listeningBadgePulse, {
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(listeningBadgePulse, {
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(listeningBlurPulse, {
          duration: 760,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(listeningBlurPulse, {
          duration: 760,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    badgeAnimation.start();
    pulseAnimation.start();
    const makeWave = (offset: Animated.Value) =>
      Animated.sequence([
        Animated.timing(offset, {
          duration: 290,
          toValue: -7,
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          duration: 290,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);

    const microAnimation = Animated.loop(
      Animated.sequence([
        Animated.stagger(150, listeningMicroOffsets.map(makeWave)),
        Animated.delay(120),
      ]),
    );

    microAnimation.start();

    return () => {
      badgeAnimation.stop();
      pulseAnimation.stop();
      microAnimation.stop();
    };
  }, [
    isVoiceActive,
    listeningBadgePulse,
    listeningBlurPulse,
    listeningMicroOffsets,
  ]);

  // STT가 확정한 문장 누적분과 현재 transcript(중간결과 포함) 최신값
  const finalizedRef = useRef("");
  const transcriptRef = useRef("");

  const resetTranscript = () => {
    finalizedRef.current = "";
    transcriptRef.current = "";
    setTranscript("");
  };

  useSpeechRecognitionEvent("result", (event) => {
    const segment = event.results[0]?.transcript ?? "";
    const combined = `${finalizedRef.current} ${segment}`.trim();
    transcriptRef.current = combined;
    setTranscript(combined);
    if (event.isFinal) {
      finalizedRef.current = combined;
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    if (transcriptRef.current.trim().length > 0) {
      setHasResponse(true);
      setCompleteStatus("ready");
    }
  });

  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  // 화면 이탈 시 진행 중인 인식 정리
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  const startQuestion = () => {
    clearCompleteTimers();
    resetTranscript();
    setQuestionIndex(0);
    setIsListening(false);
    setHasResponse(false);
    setCompleteStatus("ready");
  };

  const moveToNextQuestion = () => {
    if (questionIndex >= questions.length - 1) {
      router.replace("/receipt/memory-receipt-loading");
      return;
    }

    resetTranscript();
    setQuestionIndex(questionIndex + 1);
    setIsListening(false);
    setHasResponse(false);
    setCompleteStatus("ready");
  };

  const handleCompletePress = () => {
    if (completeStatus !== "ready" || !hasTranscript) {
      return;
    }

    clearCompleteTimers();
    setCompleteStatus("pressed");

    const pressedTimer = setTimeout(() => {
      setCompleteStatus("done");

      const doneTimer = setTimeout(() => {
        moveToNextQuestion();
      }, COMPLETE_DONE_MS);

      completeTimers.current.push(doneTimer);
    }, COMPLETE_PRESSED_MS);

    completeTimers.current.push(pressedTimer);
  };

  const startListening = async () => {
    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    resetTranscript();
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: "ko-KR",
      interimResults: true,
      continuous: true,
    });
  };

  const handleMainAction = () => {
    if (questionIndex === -1) {
      startQuestion();
      return;
    }

    if (hasResponse) {
      handleCompletePress();
      return;
    }

    if (!isListening) {
      void startListening();
      return;
    }

    // 녹음 종료 → "end" 이벤트에서 hasResponse 처리
    ExpoSpeechRecognitionModule.stop();
  };

  const questionNumber = questionIndex + 1;

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="뒤로가기"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text maxFontSizeMultiplier={1.1} style={styles.backButtonText}>
              ‹
            </Text>
          </Pressable>

          <Pressable style={styles.modeButton}>
            <Text maxFontSizeMultiplier={1.1} style={styles.modeButtonText}>
              대화 모드 변경
            </Text>
          </Pressable>
        </View>

        {questionIndex === -1 ? (
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={1.1} style={styles.readyTitle}>
              곧 시작할게요
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.readyDescription}>
              질문을 듣고 편하게 말해주세요.{"\n"}총 3가지 질문을 드릴게요.
            </Text>
          </View>
        ) : (
          <View style={styles.questionBox}>
            <Text maxFontSizeMultiplier={1.1} style={styles.questionCount}>
              질문 <Text style={styles.questionCountCurrent}>{questionNumber}</Text>/
              {questions.length}
            </Text>
            <View style={styles.friendAvatar}>
              <Image
                resizeMode="contain"
                source={selectedFriend.icon}
                style={styles.friendAvatarImage}
              />
            </View>
            <Text maxFontSizeMultiplier={1.1} style={styles.questionText}>
              {questions[questionIndex]}
            </Text>
            {hasTranscript ? (
              <View style={styles.answerArea}>
                <AnimatedTranscript
                  transcript={transcript}
                  textStyle={styles.answerText}
                  containerStyle={styles.answerWords}
                  wrapStyle={styles.answerWordWrap}
                />
              </View>
            ) : null}
            {isListening ? (
              <>
                {!hasTranscript ? (
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.answerPrompt}
                  >
                    지금 응답해주세요...|
                  </Text>
                ) : null}
                <View style={styles.listeningBadge}>
                  <View style={styles.listeningBadgeDotFrame}>
                    <Animated.View
                      style={[
                        styles.listeningBadgeDotOuter,
                        {
                          transform: [
                            {
                              scale: listeningBadgePulse.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.08],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <View style={styles.listeningBadgeDotInner} />
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.listeningBadgeText}
                  >
                    듣고 있어요..
                  </Text>
                </View>
              </>
            ) : null}
            {hasResponse ? (
              <>
                {hasTranscript ? (
                  <Pressable
                  disabled={completeStatus !== "ready"}
                  onPress={handleCompletePress}
                  style={[
                    styles.completeButton,
                    completeStatus === "pressed" && styles.completeButtonPressed,
                  ]}
                >
                  {completeStatus === "ready" ? (
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.completeButtonText}
                      >
                        응답 완료
                      </Text>
                    ) : null}
                    {completeStatus === "done" ? (
                      <Ionicons
                        color="#FFFFFF"
                        name="checkmark-outline"
                        size={scaled(33, pillScale)}
                      />
                    ) : null}
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        )}

        <Pressable style={styles.micArea} onPress={handleMainAction}>
          <View style={styles.voiceCircleFrame}>
            <Animated.Image
              resizeMode="stretch"
              source={voiceIdleCircleImage}
              style={[
                styles.voiceCircleImage,
                {
                  opacity: listeningCircleOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            />
            <Animated.Image
              resizeMode="stretch"
              source={voiceListeningCircleImage}
              style={[
                styles.voiceCircleImage,
                { opacity: listeningCircleOpacity },
              ]}
            />
            <View pointerEvents="none" style={styles.voiceSmallCircleLayer}>
              <Animated.Image
                resizeMode="contain"
                source={voiceIdleSmallCircleImage}
                style={[
                  styles.voiceSmallCircle,
                  {
                    opacity: listeningCircleOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              />
              <Animated.Image
                resizeMode="contain"
                source={voiceListeningSmallCircleBlurImage}
                style={[
                  styles.voiceListeningSmallCircleBlur,
                  {
                    opacity: listeningCircleOpacity,
                    transform: [
                      {
                        scale: listeningBlurPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.92, 1.08],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.Image
                resizeMode="contain"
                source={voiceListeningSmallCircleImage}
                style={[
                  styles.voiceSmallCircle,
                  { opacity: listeningCircleOpacity },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.voiceMicroCircleRow,
                  { opacity: listeningCircleOpacity },
                ]}
              >
                {listeningMicroOffsets.map((offset, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.voiceMicroCircleWrap,
                      {
                        transform: [{ translateY: offset }],
                      },
                    ]}
                  >
                    <Image
                      resizeMode="contain"
                      source={voiceListeningMicroCircleImage}
                      style={styles.voiceMicroCircle}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            </View>
            <View pointerEvents="box-none" style={styles.circleActionPillLayer}>
              {isListening ? (
                <View style={styles.floatingListeningBadge}>
                  <View style={styles.listeningBadgeDotFrame}>
                    <Animated.View
                      style={[
                        styles.listeningBadgeDotOuter,
                        {
                          transform: [
                            {
                              scale: listeningBadgePulse.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.08],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <View style={styles.listeningBadgeDotInner} />
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.listeningBadgeText}
                  >
                    듣고 있어요..
                  </Text>
                </View>
              ) : null}
              {hasResponse && hasTranscript ? (
                <Pressable
                  disabled={completeStatus !== "ready"}
                  onPress={handleCompletePress}
                  style={[
                    styles.floatingCompleteButton,
                    completeStatus === "pressed" && styles.completeButtonPressed,
                  ]}
                >
                  {completeStatus === "ready" ? (
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.completeButtonText}
                    >
                      응답 완료
                    </Text>
                  ) : null}
                  {completeStatus === "done" ? (
                    <Ionicons
                      color="#FFFFFF"
                      name="checkmark-outline"
                      size={scaled(33, pillScale)}
                    />
                  ) : null}
                </Pressable>
              ) : null}
            </View>
          </View>

        </Pressable>

        <View pointerEvents="box-none" style={styles.actionPillLayer}>
          {isListening ? (
            <View style={styles.floatingListeningBadge}>
              <View style={styles.listeningBadgeDotFrame}>
                <Animated.View
                  style={[
                    styles.listeningBadgeDotOuter,
                    {
                      transform: [
                        {
                          scale: listeningBadgePulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.08],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.listeningBadgeDotInner} />
              </View>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.listeningBadgeText}
              >
                듣고 있어요..
              </Text>
            </View>
          ) : null}
          {hasResponse && hasTranscript ? (
            <Pressable
              disabled={completeStatus !== "ready"}
              onPress={handleCompletePress}
              style={[
                styles.floatingCompleteButton,
                completeStatus === "pressed" && styles.completeButtonPressed,
              ]}
            >
              {completeStatus === "ready" ? (
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.completeButtonText}
                >
                  응답 완료
                </Text>
              ) : null}
              {completeStatus === "done" ? (
                <Ionicons
                  color="#FFFFFF"
                  name="checkmark-outline"
                  size={scaled(33, pillScale)}
                />
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsExitModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isExitModalVisible}
      >
        <View style={styles.exitModalOverlay}>
          <View style={styles.exitModalBackdrop} />
          <View style={styles.exitModalCenter}>
            <View style={styles.exitModalCard}>
              <Text maxFontSizeMultiplier={1.1} style={styles.exitModalTitle}>
                오늘의 대화를{"\n"}종료할까요?
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.exitModalDescription}>
                지금 나가면 진행 중인 대화는{"\n"}다시 이어갈 수 없어요.
              </Text>
              <View style={styles.exitModalButtonRow}>
                <Pressable
                  onPress={() => setIsExitModalVisible(false)}
                  style={[styles.exitModalButton, styles.exitModalCancelButton]}
                >
                  <Text maxFontSizeMultiplier={1.1} style={styles.exitModalCancelText}>
                    계속하기
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmExit}
                  style={[styles.exitModalButton, styles.exitModalConfirmButton]}
                >
                  <Text maxFontSizeMultiplier={1.1} style={styles.exitModalConfirmText}>
                    홈으로 가기
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  circleScale: number,
  pillScale: number,
  width: number,
  height: number,
) => {
  const actionPillWidth = scaled(146, pillScale);
  const actionPillHeight = scaled(49, pillScale);
  const actionPillBottom = scaled(304, pillScale);
  const largePhonePillLift = Math.round(Math.max(pillScale - 1, 0) * 220);
  const exitModalHorizontalInset = scaled(26, scale);
  const exitModalWidth = Math.min(
    width - exitModalHorizontalInset * 2,
    scaled(350, scale),
  );

  return StyleSheet.create({
    container: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    inner: {
      flex: 1,
      paddingHorizontal: scaled(24, scale),
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    backButton: {
      alignItems: "center",
      backgroundColor: "#ECECEC",
      borderRadius: scaled(18.5, scale),
      height: scaled(37, scale),
      justifyContent: "center",
      width: scaled(37, scale),
    },
    backButtonText: {
      color: "#7A7A7A",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(31, fontScale),
      lineHeight: fontScaled(31, fontScale),
      marginTop: scaled(-4, scale),
    },
    modeButton: {
      alignItems: "center",
      backgroundColor: "#EEEEEE",
      borderRadius: scaled(18.5, scale),
      height: scaled(37, scale),
      justifyContent: "center",
      paddingHorizontal: scaled(16, scale),
    },
    modeButtonText: {
      color: "#6D6D6D",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(14, fontScale),
    },
    exitModalOverlay: {
      flex: 1,
      height,
      width: "100%",
    },
    exitModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.28)",
    },
    exitModalCenter: {
      alignItems: "center",
      height,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      width,
    },
    exitModalCard: {
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(16, scale),
      paddingBottom: scaled(18, scale),
      paddingHorizontal: scaled(20, scale),
      paddingTop: scaled(24, scale),
      width: exitModalWidth,
    },
    exitModalTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(22, fontScale),
      lineHeight: fontScaled(30, fontScale),
      textAlign: "center",
    },
    exitModalDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, fontScale),
      lineHeight: fontScaled(22, fontScale),
      marginTop: scaled(8, scale),
      textAlign: "center",
    },
    exitModalButtonRow: {
      flexDirection: "row",
      gap: scaled(10, scale),
      marginTop: scaled(24, scale),
    },
    exitModalButton: {
      alignItems: "center",
      borderRadius: scaled(8, scale),
      flex: 1,
      height: scaled(50, scale),
      justifyContent: "center",
    },
    exitModalCancelButton: {
      backgroundColor: "#EEEEEE",
    },
    exitModalConfirmButton: {
      backgroundColor: "#444444",
    },
    exitModalCancelText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(17, fontScale),
    },
    exitModalConfirmText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(17, fontScale),
    },
    header: {
      marginTop: scaled(36, scale),
    },
    readyTitle: {
      color: "#2ABD83",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(30, fontScale),
    },
    readyDescription: {
      color: "#9C9C9C",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(29, fontScale),
      marginTop: scaled(12, scale),
    },
    questionBox: {
      marginTop: scaled(26, scale),
      position: "relative",
    },
    questionCount: {
      color: "#333333",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, fontScale),
    },
    questionCountCurrent: {
      color: "#B9B9B9",
    },
    friendAvatar: {
      height: scaled(58, scale),
      marginTop: scaled(14, scale),
      width: scaled(58, scale),
    },
    friendAvatarImage: {
      height: "100%",
      width: "100%",
    },
    questionText: {
      color: "#2ABD83",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(28, fontScale),
      lineHeight: fontScaled(37, fontScale),
      marginTop: scaled(14, scale),
    },
    answerPrompt: {
      color: "#A0A0A0",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(25, fontScale),
      lineHeight: fontScaled(34, fontScale),
      marginTop: scaled(88, scale),
      textAlign: "right",
    },
    answerArea: {
      justifyContent: "center",
      marginTop: scaled(36, scale),
      minHeight: scaled(126, scale),
    },
    answerText: {
      color: "#3B3B3B",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(25, fontScale),
      lineHeight: fontScaled(34, fontScale),
      textAlign: "right",
    },
    answerWords: {
      alignItems: "flex-end",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    answerWordWrap: {
      marginLeft: scaled(7, scale),
      position: "relative",
    },
    actionPillLayer: {
      alignItems: "center",
      bottom: actionPillBottom,
      display: "none",
      left: 0,
      pointerEvents: "box-none",
      position: "absolute",
      right: 0,
      zIndex: 20,
    },
    circleActionPillLayer: {
      alignItems: "center",
      left: 0,
      pointerEvents: "box-none",
      position: "absolute",
      right: 0,
      top: scaled(-8, circleScale) - largePhonePillLift,
      zIndex: 30,
    },
    listeningBadge: {
      display: "none",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: actionPillHeight / 2,
      elevation: 6,
      flexDirection: "row",
      height: actionPillHeight,
      justifyContent: "center",
      gap: scaled(10, pillScale),
      left: "50%",
      position: "absolute",
      shadowColor: "#13BB78",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      transform: [{ translateX: -actionPillWidth / 2 }],
      width: actionPillWidth,
    },
    floatingListeningBadge: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: actionPillHeight / 2,
      elevation: 20,
      flexDirection: "row",
      gap: scaled(10, pillScale),
      height: actionPillHeight,
      justifyContent: "center",
      shadowColor: "#13BB78",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      width: actionPillWidth,
      zIndex: 20,
    },
    listeningBadgeDotFrame: {
      alignItems: "center",
      height: scaled(26, pillScale),
      justifyContent: "center",
      width: scaled(26, pillScale),
    },
    listeningBadgeDotOuter: {
      backgroundColor: "#9FF3D1",
      borderRadius: scaled(13, pillScale),
      height: scaled(26, pillScale),
      position: "absolute",
      width: scaled(26, pillScale),
    },
    listeningBadgeDotInner: {
      backgroundColor: "#54E5AC",
      borderRadius: scaled(8, pillScale),
      height: scaled(16, pillScale),
      width: scaled(16, pillScale),
    },
    listeningBadgeText: {
      color: "#9A9A9A",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(17, pillScale),
      lineHeight: fontScaled(24, pillScale),
    },
    completeButton: {
      display: "none",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#3F3F3F",
      borderRadius: actionPillHeight / 2,
      elevation: 8,
      height: actionPillHeight,
      justifyContent: "center",
      left: "50%",
      position: "absolute",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      transform: [{ translateX: -actionPillWidth / 2 }],
      width: actionPillWidth,
    },
    floatingCompleteButton: {
      alignItems: "center",
      backgroundColor: "#3F3F3F",
      borderRadius: actionPillHeight / 2,
      elevation: 20,
      height: actionPillHeight,
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      width: actionPillWidth,
      zIndex: 20,
    },
    completeButtonPressed: {
      backgroundColor: "#5D5D5D",
    },
    completeButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(17, pillScale),
      lineHeight: fontScaled(24, pillScale),
    },
    listeningPill: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(22, scale),
      elevation: 3,
      flexDirection: "row",
      gap: 8,
      height: scaled(44, scale),
      marginTop: scaled(50, scale),
      paddingHorizontal: scaled(18, scale),
      shadowColor: "#BBBBBB",
      shadowOpacity: 0.25,
      shadowRadius: 14,
    },
    listeningDot: {
      backgroundColor: "#62DDAF",
      borderRadius: scaled(6, scale),
      height: scaled(12, scale),
      width: scaled(12, scale),
    },
    listeningText: {
      color: "#9A9A9A",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(18, fontScale),
    },
    micArea: {
      alignItems: "center",
      bottom: scaled(-118, scale),
      height: scaled(375, scale),
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
    },
    voiceCircleFrame: {
      alignItems: "center",
      height: scaled(525, circleScale),
      justifyContent: "center",
      overflow: "visible",
      position: "absolute",
      width: scaled(525, circleScale),
    },
    voiceCircleImage: {
      height: "100%",
      position: "absolute",
      width: "100%",
    },
    voiceSmallCircleLayer: {
      alignItems: "center",
      height: scaled(380, circleScale),
      justifyContent: "center",
      position: "absolute",
      width: scaled(380, circleScale),
    },
    voiceListeningSmallCircleBlur: {
      height: "100%",
      position: "absolute",
      width: "100%",
    },
    voiceSmallCircle: {
      height: scaled(288, circleScale),
      position: "absolute",
      width: scaled(288, circleScale),
    },
    voiceMicroCircleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: scaled(10, circleScale),
      justifyContent: "center",
      position: "absolute",
    },
    voiceMicroCircleWrap: {
      height: scaled(15, circleScale),
      width: scaled(15, circleScale),
    },
    voiceMicroCircle: {
      height: "100%",
      width: "100%",
    },
  });
};
