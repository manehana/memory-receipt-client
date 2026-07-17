import { Fragment, useEffect, useMemo, useRef } from "react";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Reanimated, {
  LinearTransition,
  Easing as REasing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// STT 단어 등장 애니메이션: 시그모이드(S-커브) 가속, blur→sharp + fade
const SIGMOID_EASING = REasing.bezier(0.65, 0, 0.35, 1);
const WORD_FADE_MS = 520;
const REFLOW_MS = 360;
// 글자 자체에 거는 흐림 반경(시작값) — BlurView 같은 사각형 패널이 아니라
// 글리프 모양을 따라가는 그림자라 영역이 네모로 잘리지 않는다.
const MAX_BLUR_RADIUS = 9;
const WORD_SHADOW_OFFSET = { width: 0, height: 0 } as const;
const ANSWER_SHADOW_COLOR = "#3B3B3B";
// 한 줄당 UTF-8 바이트 수를 기준으로 줄바꿈 위치를 직접 계산해
// 폰트/화면 크기와 무관하게 동일한 기준으로 폰트 축소·스크롤을 전환한다
const ANSWER_LINE_MAX_BYTES = 44;
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

type TranscriptWord = {
  key: string;
  text: string;
  forcedBreak: boolean;
  delayMs?: number;
};

function AnimatedWord({
  text,
  textStyle,
  wrapStyle,
  shadowColor = ANSWER_SHADOW_COLOR,
  delayMs = 0,
}: {
  text: string;
  textStyle: StyleProp<TextStyle>;
  wrapStyle: StyleProp<ViewStyle>;
  shadowColor?: string;
  delayMs?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: WORD_FADE_MS,
        easing: SIGMOID_EASING,
      }),
    );
  }, [delayMs, progress]);

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
        style={[
          textStyle,
          {
            textShadowColor: shadowColor,
            textShadowOffset: WORD_SHADOW_OFFSET,
          },
          animatedTextStyle,
        ]}
      >
        {text}
      </Reanimated.Text>
    </Reanimated.View>
  );
}

export default function AnimatedTranscript({
  transcript,
  textStyle,
  containerStyle,
  wrapStyle,
  onLineCountChange,
  shadowColor,
  staggerMs = 0,
  manualLineBreaks = true,
}: {
  transcript: string;
  textStyle: StyleProp<TextStyle>;
  containerStyle: StyleProp<ViewStyle>;
  wrapStyle: StyleProp<ViewStyle>;
  onLineCountChange?: (lineCount: number) => void;
  shadowColor?: string;
  staggerMs?: number;
  manualLineBreaks?: boolean;
}) {
  // 신규 단어만 등장 애니메이션이 돌도록 직전 단어 배열과 접두 비교
  const prevRef = useRef<TranscriptWord[]>([]);
  const seqRef = useRef(0);

  const words = useMemo(() => {
    // 명시적 줄바꿈(\n)은 강제 줄바꿈으로 보존하고, 그 외 공백으로 단어를 나눈다
    const lines = transcript.replace(/\r/g, "").split("\n");
    const rawTokens: { text: string; forcedBreak: boolean }[] = [];
    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      const parts = trimmed.length ? trimmed.split(/\s+/) : [];
      parts.forEach((text, partIndex) => {
        rawTokens.push({ text, forcedBreak: lineIndex > 0 && partIndex === 0 });
      });
    });

    const prev = prevRef.current;
    // 이번 렌더에서 새로 등장한 단어들끼리만 시차(stagger)를 계산한다
    let newWordOrder = 0;
    const next = rawTokens.map((token, index) => {
      if (
        prev[index] &&
        prev[index].text === token.text &&
        prev[index].forcedBreak === token.forcedBreak
      ) {
        return prev[index];
      }
      return {
        key: `w${seqRef.current++}`,
        text: token.text,
        forcedBreak: token.forcedBreak,
        delayMs: staggerMs * newWordOrder++,
      };
    });
    prevRef.current = next;
    return next;
  }, [staggerMs, transcript]);

  // 줄바꿈 위치는 화면 렌더링이 아니라 단어별 UTF-8 바이트 합산(또는 명시적 \n)으로 직접 계산한다
  const lineBreaks = useMemo(
    () =>
      manualLineBreaks
        ? computeLineBreaks(
            words.map((word) => word.text),
            ANSWER_LINE_MAX_BYTES,
          )
        : words.map((word) => word.forcedBreak),
    [manualLineBreaks, words],
  );
  const lineCount =
    words.length === 0 ? 0 : 1 + lineBreaks.filter(Boolean).length;

  useEffect(() => {
    onLineCountChange?.(lineCount);
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
            shadowColor={shadowColor}
            delayMs={word.delayMs}
          />
        </Fragment>
      ))}
    </View>
  );
}
