import AnimatedTranscript from "@/components/AnimatedTranscript";
import VoiceCircle from "@/components/VoiceCircle";
import { fontScaled, scaled } from "@/constants/responsive";
import { ApiError, apiGet, apiMultipart, apiPost } from "@/lib/api";
import { playBase64Wav, stopCurrent } from "@/lib/audio";
import { isPresentationMode } from "@/lib/presentation";
import type {
  AnswerResponse,
  RecallQuestion,
  SessionStartResponse,
  VoiceResponse,
} from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Reanimated, {
  FadeIn,
  FadeOut,
  Easing as REasing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const COMPLETE_PRESSED_MS = 180;
const COMPLETE_DONE_MS = 650;
// 말을 시작한 뒤 이 시간이 지나면 녹음은 계속하되 응답완료 버튼을 추가로 노출한다
const SPEECH_AUTO_COMPLETE_MS = 3000;
// STT 단어 등장 애니메이션 가속 곡선(전송/버튼/타이핑 점 애니메이션과 공유)
const SIGMOID_EASING = REasing.bezier(0.65, 0, 0.35, 1);
const QUESTION_SHADOW_COLOR = "#2ABD83";
// 질문 전체가 한 번에 도착하므로 단어별 등장 시차를 준다
const QUESTION_STAGGER_MS = 90;
// 응답 완료 후 다음 질문을 기다리는 동안의 로딩(typing dots) 연출.
// API가 너무 빨리 응답해도 로딩이 읽히도록 최소 표시 시간을 둔다.
const NEXT_LOADING_MIN_MS = 700;
const TYPING_DOTS_APPEAR_DELAY_MS = 250;
const TYPING_DOT_STEP_MS = 160;
const TYPING_DOT_BOUNCE_MS = 320;
// 전송 애니메이션: 현재 질문+답변 블록이 위로 날아가며 사라진다
const TURN_EXIT_MS = 380;
const turnExiting = () => {
  "worklet";
  const timing = { duration: TURN_EXIT_MS, easing: SIGMOID_EASING };
  return {
    initialValues: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
    },
    animations: {
      opacity: withTiming(0, timing),
      transform: [
        { translateY: withTiming(-80, timing) },
        { scale: withTiming(0.95, timing) },
      ],
    },
  };
};
// 응답 완료 버튼 등장: VoiceCircle 바깥 링 수축이 먼저 시작된 뒤
// 그 에너지를 이어받듯 spring으로 떠오른다
const completeButtonEntering = () => {
  "worklet";
  const spring = { damping: 40, stiffness: 300 };
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: 24 }, { scale: 0.85 }],
    },
    animations: {
      opacity: withDelay(120, withSpring(1, spring)),
      transform: [
        { translateY: withDelay(120, withSpring(0, spring)) },
        { scale: withDelay(120, withSpring(1, spring)) },
      ],
    },
  };
};
const ANSWER_FONT_SIZE = 25;
const ANSWER_FONT_SIZE_COMPACT = 23;
const ANSWER_LINE_HEIGHT = 34;
const ANSWER_LINE_HEIGHT_COMPACT = 31;
const ANSWER_COMPACT_LINE_THRESHOLD = 5;
const ANSWER_SCROLL_LINE_THRESHOLD = 6;
const voiceMicrophoneImage = require("../../assets/images/voice/voice-microphone.png");
// 발표 데모용: 발표 모드에서는 친구 아바타를 딸 공유 이미지로 고정한다
const presentationFriendAvatarImage = require("../../assets/images/memory-receipt/share_friend_daughter.png");
// 발표 데모용: "대화 모드 변경"으로 턴을 건너뛸 때 step별로 재생할 스크립트.
// 토큰 사이에 " <숫자> "(예: <2>)를 넣으면 그 숫자 초만큼 멈췄다가 다음 단어가 등장한다.
const DUMMY_TRANSCRIPTS = [
  "요즘 밤에도 너무 더워서 자기 전에 에어컨 타이머 맞춰놓고 잤지",
  "어제 아침 산책 겸 나갔다가 하나 빵집 들러서 식빵 샀지 아침에 먹기 간편하더라고",
  "아니 오후엔 대박할인마트 가서 두루마리 휴지 샀어",
  "아 휴지 산 걸 깜빡하고 또 사버렸네 요즘 종종 깜빡한다니까",
  "요즘 장바구니 캐리어를 하나 장만했더니 장 보고 오는 것도 한결 수월해",
];
// 단어별 개별 간격의 기본값(ms). 설정 모달에서 단어마다 따로 조절·저장한다.
const DUMMY_WORD_REVEAL_MS = 150;
// 데모 설정 저장 키(expo-secure-store) 및 스테퍼 파라미터.
// 저장 포맷: { scripts: string[], wordGaps: number[][] }. 스크립트도 편집 가능해지며 config로 키를 올린다.
const WORD_GAP_STORAGE_KEY = "memory_receipt_demo_config_v3";
const WORD_GAP_STEP_MS = 50; // 스테퍼 0.05초 단위
const WORD_GAP_MIN_MS = 0;
const WORD_GAP_MAX_MS = 2000; // 상한 2초

type DummyToken =
  | { type: "word"; text: string }
  | { type: "pause"; ms: number };

// 스크립트를 공백 기준으로 나눠 단어/멈춤(<숫자>) 토큰으로 분류한다
function parseDummyScript(script: string): DummyToken[] {
  return script
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => {
      const match = token.match(/^<(\d+(?:\.\d+)?)>$/);
      if (match) {
        return { type: "pause", ms: parseFloat(match[1]) * 1000 };
      }
      return { type: "word", text: token };
    });
}

// 스크립트에서 "단어 토큰" 텍스트만 뽑는다. 간격 설정 UI(칩)와 저장 배열의 기준.
// (pause 토큰 <숫자>는 제외 — 개별 조절 대상이 아니라 스크립트에 고정된 멈춤이다)
function parseScriptWords(script: string): string[] {
  return parseDummyScript(script)
    .filter((token): token is { type: "word"; text: string } =>
      token.type === "word",
    )
    .map((token) => token.text);
}

function clampGap(ms: number): number {
  return Math.min(Math.max(ms, WORD_GAP_MIN_MS), WORD_GAP_MAX_MS);
}

// 문장 배열에 맞춘 단어별 기본 간격(모두 DUMMY_WORD_REVEAL_MS로 시작).
function makeDefaultWordGaps(scripts: string[]): number[][] {
  return scripts.map((script) =>
    parseScriptWords(script).map(() => DUMMY_WORD_REVEAL_MS),
  );
}

// 스크립트가 바뀌어 단어 수가 달라져도 기존 간격을 최대한 살려 재정렬한다.
// (같은 위치의 단어는 기존 값 유지, 새로 생긴 단어는 기본값)
function reconcileWordGaps(scripts: string[], gaps: number[][]): number[][] {
  return scripts.map((script, sentenceIndex) => {
    const words = parseScriptWords(script);
    const prevRow = gaps[sentenceIndex] ?? [];
    return words.map((_, wordIndex) => {
      const prev = prevRow[wordIndex];
      return typeof prev === "number" && Number.isFinite(prev)
        ? clampGap(prev)
        : DUMMY_WORD_REVEAL_MS;
    });
  });
}

// 저장된 설정(스크립트 + 간격)의 스크립트 부분만 형태 검증한다.
// 문장 수는 기본 스크립트와 같아야 하고, 각 항목은 문자열이어야 한다.
function isValidScripts(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === DUMMY_TRANSCRIPTS.length &&
    value.every((item) => typeof item === "string")
  );
}
// answer API는 file 필드가 필수(multipart)라 스킵 시에도 무음 WAV(16kHz mono 16bit, 50ms)를 첨부한다
const SILENT_WAV_BASE64 =
  "UklGRmQGAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YUAGAAAA" +
  "A".repeat(2132);

type CompleteStatus = "ready" | "pressed" | "done";

type ConversationFriend = {
  id: string;
  name: string;
  icon: ImageSourcePropType;
};

const friends: ConversationFriend[] = [
  {
    id: "hanaboy",
    name: "별봄이",
    icon: require("../../assets/images/onboarding/friend-hanaboy-active-icon.png"),
  },
  {
    id: "hanagirl",
    name: "별송이",
    icon: require("../../assets/images/onboarding/friend-hanagirl-active-icon.png"),
  },
  {
    id: "son",
    name: "아들",
    icon: require("../../assets/images/onboarding/friend-son-active-icon.png"),
  },
  {
    id: "daughter",
    name: "딸",
    icon: require("../../assets/images/onboarding/friend-daughter-active-icon.png"),
  },
  {
    id: "hodong",
    name: "강호동",
    icon: require("../../assets/images/onboarding/friend-hodong-active-icon.png"),
  },
  {
    id: "heungmin",
    name: "손흥민",
    icon: require("../../assets/images/onboarding/friend-heungmin-active-icon.png"),
  },
  {
    id: "yeongung",
    name: "임영웅",
    icon: require("../../assets/images/onboarding/friend-yeongung-active-icon.png"),
  },
  {
    id: "gdragon",
    name: "지드래곤",
    icon: require("../../assets/images/onboarding/friend-gdragon-active-icon.png"),
  },
  {
    id: "yujin",
    name: "안유진",
    icon: require("../../assets/images/onboarding/friend-yujin-active-icon.png"),
  },
];

function getFriendForVoice(
  voices: VoiceResponse[],
  voiceId: string | undefined,
): ConversationFriend {
  const numericVoiceId = voiceId ? Number(voiceId) : null;
  const selectedVoice =
    numericVoiceId != null && !Number.isNaN(numericVoiceId)
      ? voices.find((voice) => voice.id === numericVoiceId)
      : voices.find((voice) => voice.is_default);
  const voiceName = selectedVoice?.name.trim() ?? "";

  return (
    friends.find((friend) => voiceName.startsWith(friend.name)) ?? friends[0]
  );
}

function TypingDot({
  index,
  style,
}: {
  index: number;
  style: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * TYPING_DOT_STEP_MS,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: TYPING_DOT_BOUNCE_MS,
            easing: SIGMOID_EASING,
          }),
          withTiming(0, {
            duration: TYPING_DOT_BOUNCE_MS,
            easing: SIGMOID_EASING,
          }),
        ),
        -1,
        false,
      ),
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: progress.value * -4 }],
  }));

  return <Reanimated.View style={[style, animatedStyle]} />;
}

function TypingDots({
  containerStyle,
  dotStyle,
}: {
  containerStyle: StyleProp<ViewStyle>;
  dotStyle: StyleProp<ViewStyle>;
}) {
  return (
    <Reanimated.View
      entering={FadeIn.delay(TYPING_DOTS_APPEAR_DELAY_MS).duration(260)}
      exiting={FadeOut.duration(180)}
      style={containerStyle}
    >
      {[0, 1, 2].map((index) => (
        <TypingDot index={index} key={index} style={dotStyle} />
      ))}
    </Reanimated.View>
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
    [circleScale, fontScale, height, pillScale, scale, width],
  );
  // 실제 마이크 음량(0..1) — volumechange 이벤트로 갱신, VoiceCircle 애니메이션 구동
  // fast: 즉각 반응(빠른 변화 = 고음 성분 근사), slow: 느린 포락선(저음/전체 에너지)
  const voiceVolume = useSharedValue(0);
  const voiceVolumeSlow = useSharedValue(0);
  const completeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [totalTurns, setTotalTurns] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<RecallQuestion | null>(
    null,
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
  // 응답 완료 후 다음 질문을 기다리는 중(로딩 dots 표시) 여부
  const [isAwaitingNext, setIsAwaitingNext] = useState(false);
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
  // 발표 데모용: 스킵 재생에 쓰는 문장 스크립트와 문장별·단어별 등장 간격(ms).
  // 설정 모달에서 문장 텍스트와 단어 간격을 편집하고 SecureStore에 저장한다.
  const [scripts, setScripts] = useState<string[]>(DUMMY_TRANSCRIPTS);
  const [wordGaps, setWordGaps] = useState<number[][]>(() =>
    makeDefaultWordGaps(DUMMY_TRANSCRIPTS),
  );
  const [isGapModalVisible, setIsGapModalVisible] = useState(false);
  // 모달 편집 중 임시 값(확인 시 scripts/wordGaps로 커밋)
  const [draftScripts, setDraftScripts] = useState<string[]>(DUMMY_TRANSCRIPTS);
  const [draftWordGaps, setDraftWordGaps] = useState<number[][]>(() =>
    makeDefaultWordGaps(DUMMY_TRANSCRIPTS),
  );
  // 모달에서 현재 편집 중인 문장 인덱스와 선택된 단어 인덱스
  const [gapSentenceIndex, setGapSentenceIndex] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const { data: voices = [] } = useQuery({
    queryKey: ["voices"],
    queryFn: () => apiGet<VoiceResponse[]>("/voices"),
  });
  const selectedFriend = useMemo(
    () => getFriendForVoice(voices, voiceId),
    [voiceId, voices],
  );
  // 응답 완료를 누르면(completeStatus가 ready를 벗어나면) 음성 입력 원(애니메이션)을 idle로 되돌린다
  const isVoiceActive =
    (isListening || hasResponse) && completeStatus === "ready";
  const hasTranscript = transcript.trim().length > 0;
  const answerTextStyle = useMemo(
    () => [
      styles.answerText,
      isAnswerCompact ? styles.answerTextCompact : null,
    ],
    [isAnswerCompact, styles],
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

  // 저장된 설정(스크립트 + 단어 간격)을 1회 하이드레이트한다(형태가 어긋나면 기본값 유지)
  useEffect(() => {
    SecureStore.getItemAsync(WORD_GAP_STORAGE_KEY).then((value) => {
      if (value == null) {
        return;
      }
      try {
        const parsed = JSON.parse(value);
        if (parsed && isValidScripts(parsed.scripts)) {
          const nextScripts = parsed.scripts;
          setScripts(nextScripts);
          // 저장된 간격을 현재 스크립트 단어 수에 맞춰 재정렬한다
          setWordGaps(
            reconcileWordGaps(
              nextScripts,
              Array.isArray(parsed.wordGaps) ? parsed.wordGaps : [],
            ),
          );
        }
      } catch {
        // 저장 포맷이 깨졌으면 기본값을 그대로 쓴다
      }
    });
  }, []);

  const openGapModal = () => {
    // 편집용으로 깊은 복사본을 만들어 취소 시 원본이 유지되게 한다
    setDraftScripts([...scripts]);
    setDraftWordGaps(wordGaps.map((row) => [...row]));
    // 지금 재생될 문장을 기본으로 열되, 첫 단어를 선택 상태로 둔다
    setGapSentenceIndex(Math.min(currentIndex, scripts.length - 1));
    setSelectedWordIndex(0);
    setIsGapModalVisible(true);
  };

  const selectGapSentence = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= scripts.length) {
      return;
    }
    setGapSentenceIndex(nextIndex);
    setSelectedWordIndex(0);
  };

  // 현재 문장의 텍스트를 편집하고, 바뀐 단어 수에 맞춰 간격/선택을 재정렬한다
  const editDraftScript = (text: string) => {
    setDraftScripts((prev) =>
      prev.map((script, index) => (index === gapSentenceIndex ? text : script)),
    );
    setDraftWordGaps((prev) =>
      prev.map((row, index) =>
        index === gapSentenceIndex
          ? reconcileWordGaps([text], [row])[0]
          : row,
      ),
    );
    // 단어가 줄면 선택 인덱스를 범위 안으로 당긴다
    const nextWordCount = parseScriptWords(text).length;
    setSelectedWordIndex((index) =>
      Math.min(index, Math.max(0, nextWordCount - 1)),
    );
  };

  const adjustSelectedGap = (deltaMs: number) => {
    setDraftWordGaps((prev) =>
      prev.map((row, sentenceIndex) =>
        sentenceIndex === gapSentenceIndex
          ? row.map((gap, wordIndex) =>
              wordIndex === selectedWordIndex ? clampGap(gap + deltaMs) : gap,
            )
          : row,
      ),
    );
  };

  const confirmGap = () => {
    setScripts(draftScripts);
    setWordGaps(draftWordGaps);
    void SecureStore.setItemAsync(
      WORD_GAP_STORAGE_KEY,
      JSON.stringify({ scripts: draftScripts, wordGaps: draftWordGaps }),
    );
    setIsGapModalVisible(false);
  };

  const clearCompleteTimers = () => {
    completeTimers.current.forEach((timer) => clearTimeout(timer));
    completeTimers.current = [];
  };

  // 발표 데모용 스크립트 재생(단어별 등장) 타이머들
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearRevealTimers = () => {
    revealTimers.current.forEach((timer) => clearTimeout(timer));
    revealTimers.current = [];
  };

  const confirmExit = () => {
    setIsExitModalVisible(false);
    clearCompleteTimers();
    clearRevealTimers();
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
      },
    );

    return () => subscription.remove();
  }, []);

  // 청취가 끝나면 음량 값을 0으로 되돌린다
  useEffect(() => {
    if (!isVoiceActive) {
      voiceVolume.value = withTiming(0, { duration: 300 });
      voiceVolumeSlow.value = withTiming(0, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVoiceActive]);

  // STT가 확정한 문장 누적분과 현재 transcript(중간결과 포함) 최신값
  const finalizedRef = useRef("");
  const transcriptRef = useRef("");
  // 말 시작 후 일정 시간이 지나면 녹음은 유지한 채 응답완료 버튼만 띄우는 타이머
  const autoCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
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

  // 실제 마이크 음량으로 VoiceCircle을 구동한다. 이벤트 값 범위는 -2..10.
  useSpeechRecognitionEvent("volumechange", (event) => {
    const norm = Math.min(Math.max((event.value + 2) / 12, 0), 1);
    // iOS는 낮은 값에 몰려 있어 감마 보정으로 반응성을 키운다
    const level = Math.pow(norm, 0.7);
    // fast는 빠르게 따라가되 부드럽게, slow는 포락선처럼 천천히 따라간다
    voiceVolume.value = withTiming(level, {
      duration: 420,
      easing: REasing.out(REasing.quad),
    });
    voiceVolumeSlow.value = withTiming(level, {
      duration: 650,
      easing: REasing.out(REasing.quad),
    });
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
      clearRevealTimers();
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
      clearRevealTimers();
      resetTranscript();
      answerUriRef.current = null;
      voiceStartedRef.current = false;
      setIsAwaitingNext(false);
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
    [],
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
    [enterTurn, goToLoading],
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
      // 로딩 dots가 읽히도록 최소 표시 시간과 함께 기다린다
      return Promise.all([
        apiMultipart<AnswerResponse>(
          "POST",
          `/recall/sessions/${sessionId}/answer`,
          form,
        ),
        new Promise((resolve) => setTimeout(resolve, NEXT_LOADING_MIN_MS)),
      ]).then(([data]) => data);
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
      setIsAwaitingNext(false);
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
        setIsAwaitingNext(true);
        submitAnswerMutation.mutate();
      }, COMPLETE_DONE_MS);

      completeTimers.current.push(doneTimer);
    }, COMPLETE_PRESSED_MS);

    completeTimers.current.push(pressedTimer);
  };

  // 발표 데모용: step별 스크립트를 단어별로 등장시키고(중간 <숫자>초 멈춤),
  // 마지막 단어가 나오면 실제 흐름처럼 "응답 완료" 버튼을 띄운다.
  const handleSkipTurn = () => {
    if (
      !started ||
      sessionId == null ||
      submitAnswerMutation.isPending ||
      revealTimers.current.length > 0
    ) {
      return;
    }

    // 실제 인식/재생 파이프라인 정리 후 데모 재생으로 대체한다
    clearAutoCompleteTimer();
    clearCompleteTimers();
    clearRevealTimers();
    stopCurrent();
    ExpoSpeechRecognitionModule.abort();
    voiceStartedRef.current = true;

    resetTranscript();
    setHasResponse(false);
    setCompleteStatus("ready");
    // 스크립트 재생 동안 VoiceCircle이 활성 상태로 보이도록 한다
    setIsListening(true);

    const script = scripts[currentIndex] ?? scripts[scripts.length - 1];
    const tokens = parseDummyScript(script);

    // 이 문장의 단어별 간격 배열(저장 인덱스는 DUMMY_TRANSCRIPTS와 정렬됨)
    const gaps = wordGaps[Math.min(currentIndex, wordGaps.length - 1)] ?? [];
    const revealed: string[] = [];
    let elapsed = 0;
    let wordIndex = 0;
    tokens.forEach((token) => {
      if (token.type === "pause") {
        elapsed += token.ms;
        return;
      }
      revealed.push(token.text);
      const textSoFar = revealed.join(" ");
      // 각 단어는 자신의 개별 간격만큼 이전 단어 뒤에 등장한다
      elapsed += gaps[wordIndex] ?? DUMMY_WORD_REVEAL_MS;
      wordIndex += 1;
      const timer = setTimeout(() => {
        transcriptRef.current = textSoFar;
        setTranscript(textSoFar);
      }, elapsed);
      revealTimers.current.push(timer);
    });

    const fullText = revealed.join(" ");
    // 마지막 단어 등장 뒤 실제 답변 완료 상태로 전환한다
    const finishTimer = setTimeout(() => {
      const silentFile = new File(Paths.cache, "skip-answer.wav");
      if (silentFile.exists) {
        silentFile.delete();
      }
      silentFile.create();
      silentFile.write(SILENT_WAV_BASE64, { encoding: "base64" });
      answerUriRef.current = silentFile.uri;
      finalizedRef.current = fullText;
      transcriptRef.current = fullText;
      setIsListening(false);
      setHasResponse(true);
      setCompleteStatus("ready");
      clearRevealTimers();
    }, elapsed);
    revealTimers.current.push(finishTimer);
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
      volumeChangeEventOptions: { enabled: true, intervalMillis: 50 },
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

  // 간격 설정 모달에서 현재 편집 중인 문장의 텍스트·단어들과 선택된 단어의 간격
  const gapScriptText = draftScripts[gapSentenceIndex] ?? "";
  const gapWords = parseScriptWords(gapScriptText);
  const selectedGapMs =
    draftWordGaps[gapSentenceIndex]?.[selectedWordIndex] ??
    DUMMY_WORD_REVEAL_MS;

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

          <Pressable
            onLongPress={openGapModal}
            onPress={handleSkipTurn}
            style={styles.modeButton}
          >
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
            {/* <Text maxFontSizeMultiplier={1.1} style={styles.questionCount}>
              질문{" "}
              <Text style={styles.questionCountCurrent}>{questionNumber}</Text>/
              {totalTurns}
            </Text> */}
            <View style={styles.friendAvatar}>
              <Image
                resizeMode="contain"
                source={
                  isPresentationMode()
                    ? presentationFriendAvatarImage
                    : selectedFriend.icon
                }
                style={styles.friendAvatarImage}
              />
            </View>
            <Reanimated.View exiting={turnExiting} key={currentIndex}>
              <AnimatedTranscript
                transcript={currentQuestion?.text ?? ""}
                textStyle={styles.questionText}
                containerStyle={styles.questionWords}
                wrapStyle={styles.questionWordWrap}
                shadowColor={QUESTION_SHADOW_COLOR}
                staggerMs={QUESTION_STAGGER_MS}
                manualLineBreaks={false}
              />
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
                                  answerScrollMaxHeight,
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
              {isListening && !(hasResponse && hasTranscript) ? (
                <>
                  {!hasTranscript ? (
                    <Reanimated.Text
                      entering={FadeIn.duration(280)}
                      exiting={FadeOut.duration(200)}
                      maxFontSizeMultiplier={1.1}
                      style={styles.answerPrompt}
                    >
                      지금 응답해주세요...|
                    </Reanimated.Text>
                  ) : null}
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
            </Reanimated.View>
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
              <VoiceCircle
                active={isVoiceActive}
                circleScale={circleScale}
                condensed={hasResponse && hasTranscript}
                innerSize={scaled(380, circleScale)}
                micIcon={voiceMicrophoneImage}
                size={scaled(480, circleScale)}
                volume={voiceVolume}
                volumeSlow={voiceVolumeSlow}
              />
            </Pressable>
          </View>
        </View>

        <View
          onLayout={updateAnswerAvailableHeight}
          pointerEvents="box-none"
          ref={actionPillRef}
          style={styles.actionPillLayer}
        >
          {isListening && !(hasResponse && hasTranscript) ? (
            <Reanimated.View
              entering={FadeIn.duration(280)}
              exiting={FadeOut.duration(200)}
              style={styles.listeningNoticeWrap}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.aiVoiceNoticeText}
              >
                지금 나오는 음성은{"\n"}실제 사람이 아닌 AI 음성이에요.
              </Text>
            </Reanimated.View>
          ) : null}
          {hasResponse && hasTranscript ? (
            <Reanimated.View
              entering={completeButtonEntering}
              exiting={FadeOut.duration(200)}
            >
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
                  isAwaitingNext ? (
                    <TypingDots
                      containerStyle={styles.typingDots}
                      dotStyle={styles.typingDot}
                    />
                  ) : (
                    <Reanimated.View exiting={FadeOut.duration(180)}>
                      <Ionicons
                        color="#FFFFFF"
                        name="checkmark-outline"
                        size={scaled(33, pillScale)}
                      />
                    </Reanimated.View>
                  )
                ) : null}
              </Pressable>
            </Reanimated.View>
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

      <Modal
        animationType="fade"
        onRequestClose={() => setIsGapModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isGapModalVisible}
      >
        <View style={styles.exitModalOverlay}>
          <View style={styles.exitModalBackdrop} />
          <View style={styles.exitModalCenter}>
            <View style={styles.exitModalCard}>
              <Text maxFontSizeMultiplier={1.1} style={styles.exitModalTitle}>
                단어 간격 설정
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.exitModalDescription}
              >
                문장을 고쳐 쓰고, 단어를 눌러{"\n"}그 단어가 등장하는 간격을 조절해요.
              </Text>

              {/* 문장 이동: 모든 문장의 텍스트/단어 간격을 여기서 편집한다 */}
              <View style={styles.gapSentenceRow}>
                <Pressable
                  disabled={gapSentenceIndex <= 0}
                  onPress={() => selectGapSentence(gapSentenceIndex - 1)}
                  style={[
                    styles.gapNavButton,
                    gapSentenceIndex <= 0 && styles.gapStepperButtonDisabled,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.gapNavButtonText}
                  >
                    ‹
                  </Text>
                </Pressable>
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.gapSentenceLabel}
                >
                  문장 {gapSentenceIndex + 1}/{scripts.length}
                </Text>
                <Pressable
                  disabled={gapSentenceIndex >= scripts.length - 1}
                  onPress={() => selectGapSentence(gapSentenceIndex + 1)}
                  style={[
                    styles.gapNavButton,
                    gapSentenceIndex >= scripts.length - 1 &&
                      styles.gapStepperButtonDisabled,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.gapNavButtonText}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>

              {/* 문장 텍스트 편집: 저장하면 스킵 재생 스크립트로 쓰인다 */}
              <TextInput
                multiline
                onChangeText={editDraftScript}
                placeholder="문장을 입력하세요"
                placeholderTextColor="#BDBDBD"
                style={styles.gapScriptInput}
                value={gapScriptText}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.gapScriptHint}>
                띄어쓰기로 단어가 나뉘고, {"<0.5>"} 처럼 넣으면 그 초만큼 멈춰요.
              </Text>

              {/* 단어 칩: 탭해서 선택, 각 칩에 현재 간격(초) 표시 */}
              <View style={styles.gapChipsWrap}>
                {gapWords.map((word, wordIndex) => {
                  const isSelected = wordIndex === selectedWordIndex;
                  const chipGapMs =
                    draftWordGaps[gapSentenceIndex]?.[wordIndex] ??
                    DUMMY_WORD_REVEAL_MS;
                  return (
                    <Pressable
                      key={`${gapSentenceIndex}-${wordIndex}`}
                      onPress={() => setSelectedWordIndex(wordIndex)}
                      style={[
                        styles.gapChip,
                        isSelected && styles.gapChipSelected,
                      ]}
                    >
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={[
                          styles.gapChipText,
                          isSelected && styles.gapChipTextSelected,
                        ]}
                      >
                        {word}
                      </Text>
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={[
                          styles.gapChipGap,
                          isSelected && styles.gapChipGapSelected,
                        ]}
                      >
                        {(chipGapMs / 1000).toFixed(2)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 선택된 단어의 간격 스테퍼 */}
              <View style={styles.gapStepperRow}>
                <Pressable
                  disabled={selectedGapMs <= WORD_GAP_MIN_MS}
                  onPress={() => adjustSelectedGap(-WORD_GAP_STEP_MS)}
                  style={[
                    styles.gapStepperButton,
                    selectedGapMs <= WORD_GAP_MIN_MS &&
                      styles.gapStepperButtonDisabled,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.gapStepperButtonText}
                  >
                    −
                  </Text>
                </Pressable>
                <Text maxFontSizeMultiplier={1.1} style={styles.gapValueText}>
                  {(selectedGapMs / 1000).toFixed(2)}초
                </Text>
                <Pressable
                  disabled={selectedGapMs >= WORD_GAP_MAX_MS}
                  onPress={() => adjustSelectedGap(WORD_GAP_STEP_MS)}
                  style={[
                    styles.gapStepperButton,
                    selectedGapMs >= WORD_GAP_MAX_MS &&
                      styles.gapStepperButtonDisabled,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.gapStepperButtonText}
                  >
                    +
                  </Text>
                </Pressable>
              </View>
              <View style={styles.exitModalButtonRow}>
                <Pressable
                  onPress={() => setIsGapModalVisible(false)}
                  style={[styles.exitModalButton, styles.exitModalCancelButton]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.exitModalCancelText}
                  >
                    취소
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmGap}
                  style={[
                    styles.exitModalButton,
                    styles.exitModalConfirmButton,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.exitModalConfirmText}
                  >
                    확인
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
  const actionPillBottom = scaled(250, pillScale);
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
    gapSentenceRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: scaled(16, scale),
      marginTop: scaled(18, scale),
    },
    gapScriptInput: {
      backgroundColor: "#F7F7F7",
      borderColor: "#E4E4E4",
      borderRadius: scaled(10, scale),
      borderWidth: scaled(1, scale),
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(15, fontScale),
      lineHeight: fontScaled(22, fontScale),
      marginTop: scaled(14, scale),
      minHeight: scaled(72, scale),
      paddingHorizontal: scaled(12, scale),
      paddingVertical: scaled(10, scale),
      textAlignVertical: "top",
    },
    gapScriptHint: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(11, fontScale),
      lineHeight: fontScaled(16, fontScale),
      marginTop: scaled(6, scale),
      textAlign: "center",
    },
    gapNavButton: {
      alignItems: "center",
      backgroundColor: "#EEEEEE",
      borderRadius: scaled(20, scale),
      height: scaled(40, scale),
      justifyContent: "center",
      width: scaled(40, scale),
    },
    gapNavButtonText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(24, fontScale),
      lineHeight: fontScaled(28, fontScale),
      marginTop: scaled(-2, scale),
    },
    gapSentenceLabel: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, fontScale),
      minWidth: scaled(84, scale),
      textAlign: "center",
    },
    gapChipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: scaled(8, scale),
      justifyContent: "center",
      marginTop: scaled(16, scale),
    },
    gapChip: {
      alignItems: "center",
      backgroundColor: "#F4F4F4",
      borderColor: "#F4F4F4",
      borderRadius: scaled(10, scale),
      borderWidth: scaled(1.5, scale),
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(6, scale),
    },
    gapChipSelected: {
      backgroundColor: "#EAF1FF",
      borderColor: "#2E7DFF",
    },
    gapChipText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(15, fontScale),
    },
    gapChipTextSelected: {
      color: "#1E4FA8",
      fontFamily: "PretendardSemiBold",
    },
    gapChipGap: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(11, fontScale),
      marginTop: scaled(1, scale),
    },
    gapChipGapSelected: {
      color: "#2E7DFF",
    },
    gapStepperRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: scaled(20, scale),
      marginTop: scaled(18, scale),
    },
    gapStepperButton: {
      alignItems: "center",
      backgroundColor: "#EEEEEE",
      borderRadius: scaled(24, scale),
      height: scaled(48, scale),
      justifyContent: "center",
      width: scaled(48, scale),
    },
    gapStepperButtonDisabled: {
      opacity: 0.4,
    },
    gapStepperButtonText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(26, fontScale),
      lineHeight: fontScaled(30, fontScale),
      marginTop: scaled(-2, scale),
    },
    gapValueText: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(24, fontScale),
      minWidth: scaled(88, scale),
      textAlign: "center",
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
    },
    questionWords: {
      alignItems: "flex-end",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      marginTop: scaled(14, scale),
    },
    questionWordWrap: {
      marginRight: scaled(7, scale),
      position: "relative",
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
    typingDots: {
      alignItems: "center",
      flexDirection: "row",
      gap: scaled(6, pillScale),
    },
    typingDot: {
      backgroundColor: "#D9D9D9",
      borderRadius: scaled(4.5, pillScale),
      height: scaled(9, pillScale),
      width: scaled(9, pillScale),
    },
    answerWordWrap: {
      marginLeft: scaled(7, scale),
      position: "relative",
    },
    actionPillLayer: {
      alignItems: "center",
      bottom: actionPillBottom,
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
    listeningNoticeWrap: {
      alignItems: "center",
    },
    aiVoiceNoticeText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, pillScale),
      lineHeight: fontScaled(21, pillScale),
      marginTop: scaled(12, pillScale),
      textAlign: "center",
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
      bottom: scaled(-195, scale),
      height: scaled(375, scale),
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
    },
    voiceCircleFrame: {
      alignItems: "center",
      height: scaled(480, circleScale),
      justifyContent: "center",
      overflow: "visible",
      position: "absolute",
      width: scaled(480, circleScale),
    },
    voiceCirclePressLayer: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
  });
};
