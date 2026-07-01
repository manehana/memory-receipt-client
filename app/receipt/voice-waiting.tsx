import { fontScaled, scaled } from "@/constants/responsive";
import { ApiError, apiMultipart, apiPost } from "@/lib/api";
import { playBase64Wav, stopCurrent } from "@/lib/audio";
import type {
  AnswerResponse,
  RecallQuestion,
  SessionStartResponse,
} from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Reanimated, {
  LinearTransition,
  Easing as REasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const COMPLETE_PRESSED_MS = 180;
const COMPLETE_DONE_MS = 650;
// 말을 시작한 뒤 이 시간이 지나면 녹음은 계속하되 응답완료 버튼을 추가로 노출한다
const SPEECH_AUTO_COMPLETE_MS = 3000;
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
// 한 줄당 UTF-8 바이트 수를 기준으로 줄바꿈 위치를 직접 계산해
// 폰트/화면 크기와 무관하게 동일한 기준으로 폰트 축소·스크롤을 전환한다
const ANSWER_LINE_MAX_BYTES = 44;
const ANSWER_FONT_SIZE = 25;
const ANSWER_FONT_SIZE_COMPACT = 23;
const ANSWER_LINE_HEIGHT = 34;
const ANSWER_LINE_HEIGHT_COMPACT = 31;
const ANSWER_COMPACT_LINE_THRESHOLD = 5;
const ANSWER_SCROLL_LINE_THRESHOLD = 6;
const LINE_BREAK_STYLE = { height: 0, width: "100%" } as const;

function getUtf8ByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }
  return bytes;
}

// words[index] 앞에서 줄을 바꿔야 하는지 여부를 반환한다
function computeLineBreaks(words: string[], maxBytes: number): boolean[] {
  const breaks = words.map(() => false);
  let lineBytes = 0;
  words.forEach((word, index) => {
    const wordBytes = getUtf8ByteLength(word);
    if (index === 0) {
      lineBytes = wordBytes;
      return;
    }
    const withSpace = lineBytes + 1 + wordBytes;
    if (withSpace > maxBytes) {
      breaks[index] = true;
      lineBytes = wordBytes;
    } else {
      lineBytes = withSpace;
    }
  });
  return breaks;
}
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
  onLineCountChange,
}: {
  transcript: string;
  textStyle: StyleProp<TextStyle>;
  containerStyle: StyleProp<ViewStyle>;
  wrapStyle: StyleProp<ViewStyle>;
  onLineCountChange: (lineCount: number) => void;
}) {
  // 신규 단어만 등장 애니메이션이 돌도록 직전 단어 배열과 접두 비교
  const prevRef = useRef<TranscriptWord[]>([]);
  const seqRef = useRef(0);

  const words = useMemo(() => {
    const tokens = transcript.trim().length
      ? transcript.trim().split(/\s+/)
      : [];
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

  // 줄바꿈 위치는 화면 렌더링이 아니라 단어별 UTF-8 바이트 합산으로 직접 계산한다
  const lineBreaks = useMemo(
    () =>
      computeLineBreaks(
        words.map((word) => word.text),
        ANSWER_LINE_MAX_BYTES
      ),
    [words]
  );
  const lineCount =
    words.length === 0 ? 0 : 1 + lineBreaks.filter(Boolean).length;

  useEffect(() => {
    onLineCountChange(lineCount);
  }, [lineCount, onLineCountChange]);

  return (
    <View style={containerStyle}>
      {words.map((word, index) => (
        <Fragment key={word.key}>
          {lineBreaks[index] ? <View style={LINE_BREAK_STYLE} /> : null}
          <AnimatedWord
            text={word.text}
            textStyle={textStyle}
            wrapStyle={wrapStyle}
          />
        </Fragment>
      ))}
    </View>
  );
}

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();
  const { voiceId } = useLocalSearchParams<{ voiceId?: string }>();
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
    [circleScale, fontScale, height, pillScale, scale, width]
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
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [totalTurns, setTotalTurns] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<RecallQuestion | null>(
    null
  );
  // 세션이 시작되어 질문 화면으로 진입했는지(준비 화면 종료) 여부
  const [started, setStarted] = useState(false);
  // persist 녹음으로 만들어진 답변 오디오 파일 uri
  const answerUriRef = useRef<string | null>(null);
  // 이번 턴에서 음성 입력(STT)이 이미 시작됐는지 — 질문 음성 종료 후 자동 시작과 수동 시작의 중복을 막는다
  const voiceStartedRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [completeStatus, setCompleteStatus] = useState<CompleteStatus>("ready");
  const [isAnswerCompact, setIsAnswerCompact] = useState(false);
  const [isAnswerScrollable, setIsAnswerScrollable] = useState(false);
  const [answerAvailableHeight, setAnswerAvailableHeight] = useState<
    number | null
  >(null);
  const answerAreaRef = useRef<View>(null);
  // 응답 완료 버튼/뱃지가 떠 있는 자리 — 답변 텍스트는 항상 이 위에만 있어야 한다
  const actionPillRef = useRef<View>(null);
  const answerScrollRef = useRef<ScrollView>(null);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  // 음성별 전용 아이콘이 없어 기본 캐릭터 아이콘을 사용한다.
  const selectedFriend = friends[0];
  // 응답 완료를 누르면(completeStatus가 ready를 벗어나면) 음성 입력 원(애니메이션)을 idle로 되돌린다
  const isVoiceActive =
    (isListening || hasResponse) && completeStatus === "ready";
  const hasTranscript = transcript.trim().length > 0;
  const answerTextStyle = useMemo(
    () => [
      styles.answerText,
      isAnswerCompact ? styles.answerTextCompact : null,
    ],
    [isAnswerCompact, styles]
  );
  const answerBottomGap = scaled(20, scale);
  // 스크롤 컨테이너가 6번째 줄까지는 그대로 보여주고 그 다음 줄부터만 스크롤되도록
  // 화면 여유 공간과 무관하게 6줄 높이로 상한을 둔다
  const answerScrollMaxHeight =
    fontScaled(ANSWER_LINE_HEIGHT_COMPACT, fontScale) *
    ANSWER_SCROLL_LINE_THRESHOLD;
  const updateAnswerAvailableHeight = useCallback(() => {
    requestAnimationFrame(() => {
      const answerNode = answerAreaRef.current;
      const pillNode = actionPillRef.current;
      if (!answerNode || !pillNode) {
        return;
      }
      answerNode.measure((_x, _y, _width, _height, _pageX, answerPageY) => {
        pillNode.measure((_px, _py, _pwidth, _pheight, _ppageX, pillPageY) => {
          const available = pillPageY - answerPageY - answerBottomGap;
          if (available > 0) {
            setAnswerAvailableHeight(available);
          }
        });
      });
    });
  }, [answerBottomGap]);
  const handleAnswerLineCountChange = (lineCount: number) => {
    if (!isAnswerCompact && lineCount >= ANSWER_COMPACT_LINE_THRESHOLD) {
      setIsAnswerCompact(true);
    }
    if (!isAnswerScrollable && lineCount >= ANSWER_SCROLL_LINE_THRESHOLD) {
      setIsAnswerScrollable(true);
    }
  };
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
    stopCurrent();
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
      }
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
      ])
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(listeningBlurPulse, {
          duration: 800,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(listeningBlurPulse, {
          duration: 800,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    badgeAnimation.start();
    pulseAnimation.start();
    const makeWave = (offset: Animated.Value) =>
      Animated.sequence([
        Animated.timing(offset, {
          duration: 320,
          toValue: -5,
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          duration: 320,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);

    const microAnimation = Animated.loop(
      Animated.sequence([
        Animated.stagger(150, listeningMicroOffsets.map(makeWave)),
        Animated.delay(120),
      ])
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
  // 말 시작 후 일정 시간이 지나면 녹음은 유지한 채 응답완료 버튼만 띄우는 타이머
  const autoCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearAutoCompleteTimer = () => {
    if (autoCompleteTimerRef.current) {
      clearTimeout(autoCompleteTimerRef.current);
      autoCompleteTimerRef.current = null;
    }
  };

  const resetTranscript = () => {
    finalizedRef.current = "";
    transcriptRef.current = "";
    clearAutoCompleteTimer();
    setTranscript("");
    setIsAnswerCompact(false);
    setIsAnswerScrollable(false);
    setAnswerAvailableHeight(null);
  };

  useSpeechRecognitionEvent("result", (event) => {
    const segment = event.results[0]?.transcript ?? "";
    const combined = `${finalizedRef.current} ${segment}`.trim();
    transcriptRef.current = combined;
    setTranscript(combined);
    if (event.isFinal) {
      finalizedRef.current = combined;
    }
    if (!autoCompleteTimerRef.current && combined.length > 0) {
      autoCompleteTimerRef.current = setTimeout(() => {
        autoCompleteTimerRef.current = null;
        setHasResponse(true);
        setCompleteStatus("ready");
      }, SPEECH_AUTO_COMPLETE_MS);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    clearAutoCompleteTimer();
    setIsListening(false);
    if (transcriptRef.current.trim().length > 0) {
      setHasResponse(true);
      setCompleteStatus((prev) => (prev === "ready" ? "ready" : prev));
    }
  });

  useSpeechRecognitionEvent("error", () => {
    clearAutoCompleteTimer();
    setIsListening(false);
  });

  // 화면 이탈 시 진행 중인 인식/재생 정리
  useEffect(() => {
    return () => {
      clearAutoCompleteTimer();
      stopCurrent();
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  // persist 녹음으로 만들어진 답변 오디오 파일 uri를 잡아둔다
  useSpeechRecognitionEvent("audioend", (event) => {
    if (event.uri) {
      answerUriRef.current = event.uri;
    }
  });

  // 스크롤 중에도 새로 인식된 텍스트가 항상 보이도록 끝으로 따라간다
  useEffect(() => {
    if (isAnswerScrollable) {
      answerScrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript, isAnswerScrollable]);

  const goToLoading = useCallback((id: number) => {
    router.replace({
      pathname: "/receipt/memory-receipt-loading",
      params: { sessionId: String(id) },
    });
  }, []);

  // in_progress 턴으로 진입: 질문 텍스트 표시 + 오디오 재생
  const enterTurn = useCallback(
    (question: RecallQuestion, index: number) => {
      clearCompleteTimers();
      resetTranscript();
      answerUriRef.current = null;
      voiceStartedRef.current = false;
      setCurrentQuestion(question);
      setCurrentIndex(index);
      setStarted(true);
      setIsListening(false);
      setHasResponse(false);
      setCompleteStatus("ready");
      // 질문 음성 재생이 끝나면 자동으로 음성 입력을 시작한다.
      // 사용자가 재생 중 직접 시작했다면(voiceStartedRef) 중복 시작하지 않는다.
      void playBase64Wav(question.audio, () => {
        if (!voiceStartedRef.current) {
          void startListening();
        }
      });
    },
    // resetTranscript/clearCompleteTimers는 매 렌더 재생성되지만 동작이 안정적이라 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const applySessionStart = useCallback(
    (data: SessionStartResponse) => {
      setSessionId(data.session_id);
      setTotalTurns(data.total_turns);
      setCurrentIndex(data.current_index);

      // 분석 중/완료 상태면 질문이 없으므로 로딩 화면으로 넘어가 폴링한다.
      if (data.status === "analyzing" || data.status === "completed") {
        goToLoading(data.session_id);
        return;
      }

      if (data.question) {
        enterTurn(data.question, data.current_index);
      }
    },
    [enterTurn, goToLoading]
  );

  const startSessionMutation = useMutation({
    mutationFn: () =>
      apiPost<SessionStartResponse>("/recall/sessions", {
        voice_id: voiceId ? Number(voiceId) : undefined,
      }),
    // Gemini 혼잡(503)이면 잠시 후 재시도한다.
    retry: (failureCount, error) =>
      error instanceof ApiError && error.status === 503 && failureCount < 3,
    retryDelay: 1500,
    onSuccess: applySessionStart,
    onError: () => {
      Alert.alert("대화를 시작할 수 없어요", "잠시 후 다시 시도해주세요.", [
        { text: "확인", onPress: () => router.replace("/receipt/main") },
      ]);
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      const uri = answerUriRef.current;
      if (uri) {
        form.append("file", {
          uri,
          name: "answer.wav",
          type: "audio/wav",
        } as unknown as Blob);
      }
      form.append("transcript", transcriptRef.current.trim());
      return apiMultipart<AnswerResponse>(
        "POST",
        `/recall/sessions/${sessionId}/answer`,
        form
      );
    },
    onSuccess: (data) => {
      if (data.is_last) {
        goToLoading(data.session_id);
        return;
      }
      enterTurn(data.question, data.current_index);
    },
    onError: () => {
      Alert.alert("답변 전송 실패", "다시 시도해주세요.");
      setCompleteStatus("ready");
    },
  });

  // 화면 진입 시 세션을 시작/재진입한다.
  const sessionStartRef = useRef(false);
  useEffect(() => {
    if (sessionStartRef.current) {
      return;
    }
    sessionStartRef.current = true;
    startSessionMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompletePress = () => {
    if (completeStatus !== "ready" || !hasTranscript) {
      return;
    }

    // 말 시작 3초 후 자동 노출된 응답완료를 누른 경우, 아직 녹음 중일 수 있어 여기서 종료한다
    if (isListening) {
      clearAutoCompleteTimer();
      ExpoSpeechRecognitionModule.stop();
    }

    clearCompleteTimers();
    setCompleteStatus("pressed");

    const pressedTimer = setTimeout(() => {
      setCompleteStatus("done");

      const doneTimer = setTimeout(() => {
        submitAnswerMutation.mutate();
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

    voiceStartedRef.current = true;
    resetTranscript();
    answerUriRef.current = null;
    setIsListening(true);
    // persist로 답변 오디오를 캐시에 저장해 transcript와 함께 서버로 전송한다.
    ExpoSpeechRecognitionModule.start({
      lang: "ko-KR",
      interimResults: true,
      continuous: true,
      recordingOptions: { persist: true },
    });
  };

  const handleMainAction = () => {
    // 세션 시작 전(준비 화면)에는 자동 시작을 기다린다.
    if (!started) {
      return;
    }

    if (hasResponse) {
      return;
    }

    if (isListening) {
      return;
    }

    void startListening();
  };

  const questionNumber = currentIndex + 1;
  const isMicActionDisabled = isListening || hasResponse;

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

        {!started ? (
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={1.1} style={styles.readyTitle}>
              곧 시작할게요
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.readyDescription}>
              질문을 듣고 편하게 말해주세요.{"\n"}질문을 준비하고 있어요.
            </Text>
          </View>
        ) : (
          <View style={styles.questionBox}>
            <Text maxFontSizeMultiplier={1.1} style={styles.questionCount}>
              질문{" "}
              <Text style={styles.questionCountCurrent}>{questionNumber}</Text>/
              {totalTurns}
            </Text>
            <View style={styles.friendAvatar}>
              <Image
                resizeMode="contain"
                source={selectedFriend.icon}
                style={styles.friendAvatarImage}
              />
            </View>
            <Text maxFontSizeMultiplier={1.1} style={styles.questionText}>
              {currentQuestion?.text ?? ""}
            </Text>
            {hasTranscript ? (
              <View
                onLayout={updateAnswerAvailableHeight}
                ref={answerAreaRef}
                style={styles.answerArea}
              >
                {isAnswerScrollable ? (
                  <ScrollView
                    ref={answerScrollRef}
                    showsVerticalScrollIndicator={false}
                    style={[
                      styles.answerScroll,
                      {
                        maxHeight:
                          answerAvailableHeight != null
                            ? Math.min(
                                answerAvailableHeight,
                                answerScrollMaxHeight
                              )
                            : answerScrollMaxHeight,
                      },
                    ]}
                  >
                    <AnimatedTranscript
                      transcript={transcript}
                      textStyle={answerTextStyle}
                      containerStyle={styles.answerWords}
                      wrapStyle={styles.answerWordWrap}
                      onLineCountChange={handleAnswerLineCountChange}
                    />
                  </ScrollView>
                ) : (
                  <AnimatedTranscript
                    transcript={transcript}
                    textStyle={answerTextStyle}
                    containerStyle={styles.answerWords}
                    wrapStyle={styles.answerWordWrap}
                    onLineCountChange={handleAnswerLineCountChange}
                  />
                )}
              </View>
            ) : null}
            {isListening ? (
              <>
                {!hasTranscript ? (
                  <Text maxFontSizeMultiplier={1.1} style={styles.answerPrompt}>
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
                      completeStatus === "pressed" &&
                        styles.completeButtonPressed,
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

        <View style={styles.micArea}>
          <View style={styles.voiceCircleFrame}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isMicActionDisabled }}
              disabled={isMicActionDisabled}
              onPress={handleMainAction}
              style={styles.voiceCirclePressLayer}
            >
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
                        outputRange: [0, 0.2],
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
            </Pressable>
            <View
              onLayout={updateAnswerAvailableHeight}
              pointerEvents="box-none"
              ref={actionPillRef}
              style={styles.circleActionPillLayer}
            >
              {isListening && !hasResponse ? (
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
                    completeStatus === "pressed" &&
                      styles.completeButtonPressed,
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
        </View>

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
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.exitModalDescription}
              >
                지금 나가면 진행 중인 대화는{"\n"}다시 이어갈 수 없어요.
              </Text>
              <View style={styles.exitModalButtonRow}>
                <Pressable
                  onPress={() => setIsExitModalVisible(false)}
                  style={[styles.exitModalButton, styles.exitModalCancelButton]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.exitModalCancelText}
                  >
                    계속하기
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmExit}
                  style={[
                    styles.exitModalButton,
                    styles.exitModalConfirmButton,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.exitModalConfirmText}
                  >
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
  height: number
) => {
  const actionPillWidth = scaled(146, pillScale);
  const actionPillHeight = scaled(49, pillScale);
  const actionPillBottom = scaled(304, pillScale);
  const largePhonePillLift = Math.round(Math.max(pillScale - 1, 0) * 220);
  const exitModalHorizontalInset = scaled(26, scale);
  const exitModalWidth = Math.min(
    width - exitModalHorizontalInset * 2,
    scaled(350, scale)
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
      fontSize: fontScaled(ANSWER_FONT_SIZE, fontScale),
      lineHeight: fontScaled(ANSWER_LINE_HEIGHT, fontScale),
      textAlign: "right",
    },
    answerTextCompact: {
      fontSize: fontScaled(ANSWER_FONT_SIZE_COMPACT, fontScale),
      lineHeight: fontScaled(ANSWER_LINE_HEIGHT_COMPACT, fontScale),
    },
    answerScroll: {
      width: "100%",
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
      elevation: 10,
      flexDirection: "row",
      gap: scaled(10, pillScale),
      height: actionPillHeight,
      justifyContent: "center",
      shadowColor: "#CDCDCD",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      width: actionPillWidth,
      zIndex: 0,
    },
    listeningBadgeDotFrame: {
      alignItems: "center",
      height: scaled(26, pillScale),
      justifyContent: "center",
      width: scaled(26, pillScale),
    },
    listeningBadgeDotOuter: {
      backgroundColor: "#9FF3D1",
      borderRadius: scaled(10, pillScale),
      height: scaled(18, pillScale),
      position: "absolute",
      width: scaled(18, pillScale),
    },
    listeningBadgeDotInner: {
      backgroundColor: "#54E5AC",
      borderRadius: scaled(6, pillScale),
      height: scaled(10, pillScale),
      width: scaled(10, pillScale),
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
    voiceCirclePressLayer: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      width: "100%",
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
