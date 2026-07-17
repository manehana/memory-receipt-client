import { scaled } from "@/constants/responsive";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

type VoiceCircleProps = {
  // 큰 원(그린 링) 지름
  size: number;
  // 안쪽 halo 기준 지름 (레이아웃 호환용, 내부 링 스케일에 사용)
  innerSize: number;
  active: boolean;
  // 실제 녹음 음량 0..1 (화면에서 volumechange 이벤트로 갱신)
  // volume: 즉각 반응하는 값, volumeSlow: 느린 포락선
  volume: SharedValue<number>;
  volumeSlow: SharedValue<number>;
  micIcon: ImageSourcePropType;
  circleScale: number;
  // 응답 완료 버튼 등장과 함께 바깥 링이 수축하는 모핑
  condensed?: boolean;
};

const microCircleImage = require("../assets/images/voice/voice-listening-micro-circle.png");
// 점 파도 한 사이클(위+아래) 길이
const MICRO_WAVE_CYCLE_MS = 1600;
// 점 사이 위상차 1/4 사이클 — 첫 점이 최하단일 때 마지막 점이 최상단, 가운데 점은 정중앙
const MICRO_WAVE_PHASE_STEP = 0.25;
const mint = (alpha: number) => `rgba(42, 189, 131, ${alpha})`;

// 흰 원 안쪽의 촘촘한 동심원들 (바깥 → 안). 중심으로 갈수록 살짝 짙어진다.
const INNER_RINGS = [
  { ratio: 0.92, alpha: 0.04 },
  { ratio: 0.84, alpha: 0.05 },
  { ratio: 0.76, alpha: 0.06 },
  { ratio: 0.68, alpha: 0.07 },
  { ratio: 0.6, alpha: 0.08 },
  { ratio: 0.52, alpha: 0.09 },
  { ratio: 0.44, alpha: 0.1 },
];

const TWO_PI = Math.PI * 2;

function Ring({
  diameter,
  color,
  clock,
  phase,
  activeProgress,
  condenseProgress,
  volume,
  volumeSlow,
  band,
  baseOpacity,
  idleOpacity,
}: {
  diameter: number;
  color: string;
  clock: SharedValue<number>;
  // 링마다 어긋난 위상 → 중심에서 바깥으로 퍼지는 물결
  phase: number;
  activeProgress: SharedValue<number>;
  // 0..1, 바깥 링일수록 크게 수축·페이드
  condenseProgress: SharedValue<number>;
  volume: SharedValue<number>;
  volumeSlow: SharedValue<number>;
  // 0 = 바깥 링(고음 성분에 민감) .. 1 = 안쪽 링(저음/포락선에 민감)
  band: number;
  baseOpacity: number;
  idleOpacity: number;
}) {
  const ringStyle = useAnimatedStyle(() => {
    const wave = Math.sin(TWO_PI * (clock.value + phase));
    // 빠른 변화(고음 성분 근사): fast가 slow보다 얼마나 앞서는지
    const hi = Math.min(
      Math.max(volume.value - volumeSlow.value, 0) * 2.5 + volume.value * 0.25,
      1
    );
    // 저음/전체 에너지: 느린 포락선
    const lo = volumeSlow.value;
    // 바깥 링일수록 hi, 안쪽 링일수록 lo 비중이 크다
    const level = hi * (1 - band) + lo * band;
    // 소리가 없으면 움츠러들고(0.93) 소리가 크면 커진다(최대 ~1.13)
    const grow = activeProgress.value * (-0.07 + level * 0.25);
    const amplitude = 0.006 + activeProgress.value * 0.008;
    const condense = condenseProgress.value;
    return {
      opacity:
        (idleOpacity +
          (baseOpacity - idleOpacity) * activeProgress.value +
          wave * 0.1 * activeProgress.value * (0.3 + level * 0.7)) *
        (1 - condense * 0.75 * (1 - band)),
      transform: [
        {
          scale:
            (1 + grow + wave * amplitude) *
            (1 - condense * (0.05 + 0.18 * (1 - band))),
        },
      ],
    };
  });

  return (
    <Reanimated.View
      style={[
        {
          backgroundColor: color,
          borderRadius: diameter / 2,
          height: diameter,
          position: "absolute",
          width: diameter,
        },
        ringStyle,
      ]}
    />
  );
}

function MicroDot({
  activeProgress,
  microClock,
  phase,
  volume,
  circleScale,
  style,
}: {
  activeProgress: SharedValue<number>;
  // 파도 박자를 만드는 공유 클럭(0..1 반복). sin에 위상을 더해 그대로 위치로 쓴다.
  microClock: SharedValue<number>;
  // 점마다 어긋난 위상 → 세 점이 이어지는 파도
  phase: number;
  volume: SharedValue<number>;
  circleScale: number;
  style: object;
}) {
  // worklet 안에서는 미리 계산한 숫자만 캡처한다
  const baseAmplitude = scaled(6, circleScale);

  const dotStyle = useAnimatedStyle(() => {
    // 0(최하단)..1(최상단)의 완전한 사인 파형
    const wave = (Math.sin(TWO_PI * (microClock.value + phase)) + 1) / 2;
    return {
      transform: [
        {
          translateY:
            -wave *
            baseAmplitude *
            (0.6 + volume.value * 1.6) *
            activeProgress.value,
        },
      ],
    };
  });
  return (
    <Reanimated.Image
      resizeMode="contain"
      source={microCircleImage}
      style={[style, dotStyle]}
    />
  );
}

export default function VoiceCircle({
  size,
  innerSize: _innerSize,
  active,
  volume,
  volumeSlow,
  micIcon,
  circleScale,
  condensed = false,
}: VoiceCircleProps) {
  // idle↔listening 전환(기존 PNG 크로스페이드 대체)
  const activeProgress = useSharedValue(0);
  // 모든 링이 공유하는 시계 (0..1 반복, sin으로 물결 위상 계산)
  const clock = useSharedValue(0);
  // 점 파도 전용 박자 (0..1 반복) — 듣는 중에만 돈다
  const microClock = useSharedValue(0);
  // 응답 완료 버튼 등장 시 바깥 링 수축 (버튼과 같은 spring 질감)
  const condenseProgress = useSharedValue(0);

  useEffect(() => {
    condenseProgress.value = withSpring(condensed ? 1 : 0, {
      damping: 14,
      stiffness: 130,
    });
    return () => cancelAnimation(condenseProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condensed]);

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: 420 });
    if (active) {
      microClock.value = 0;
      microClock.value = withRepeat(
        withTiming(1, { duration: MICRO_WAVE_CYCLE_MS, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(microClock);
    }
    return () => {
      cancelAnimation(activeProgress);
      cancelAnimation(microClock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.linear }),
      -1
    );
    return () => cancelAnimation(clock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 맨 바깥 흰 원판: idle에서는 은은한 숨쉬기, 듣는 중에는 음량을 따라 커지고 작아진다
  const discStyle = useAnimatedStyle(() => {
    const wave = Math.sin(TWO_PI * clock.value);
    const level = volumeSlow.value * 0.6 + volume.value * 0.4;
    const grow = activeProgress.value * (-0.05 + level * 0.18);
    return {
      transform: [
        {
          scale:
            (1 +
              grow +
              wave * (0.006 + activeProgress.value * (0.004 + level * 0.015))) *
            (1 - condenseProgress.value * 0.08),
        },
      ],
    };
  });

  // 애니메이션 transform이 정적 transform을 통째로 대체하므로 translateY도 여기서 함께 적용한다
  const micOffsetY = scaled(-70, circleScale);
  const micStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
    transform: [
      { translateY: micOffsetY },
      { scale: 1 - activeProgress.value * 0.2 },
    ],
  }));

  const microRowStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  const styles = createStyles(size, circleScale);
  // 물결이 중심 → 바깥으로 퍼지도록 안쪽 링일수록 위상이 앞선다
  const phaseStep = 0.55 / INNER_RINGS.length;

  return (
    <View pointerEvents="none" style={styles.frame}>
      <Reanimated.View style={[styles.disc, discStyle]}>
        <LinearGradient
          colors={["#FFFFFF", "#F7FBF9"]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>
      {INNER_RINGS.map((ring, index) => (
        <Ring
          activeProgress={activeProgress}
          band={index / (INNER_RINGS.length - 1)}
          baseOpacity={1}
          clock={clock}
          condenseProgress={condenseProgress}
          color={mint(ring.alpha)}
          diameter={size * ring.ratio}
          idleOpacity={0.3}
          key={`inner-${index}`}
          phase={-index * phaseStep}
          volume={volume}
          volumeSlow={volumeSlow}
        />
      ))}
      <Reanimated.Image
        resizeMode="contain"
        source={micIcon}
        style={[styles.mic, micStyle]}
      />
      <Reanimated.View style={[styles.microRow, microRowStyle]}>
        {[0, 1, 2].map((index) => (
          <MicroDot
            activeProgress={activeProgress}
            circleScale={circleScale}
            key={index}
            microClock={microClock}
            phase={-index * MICRO_WAVE_PHASE_STEP}
            style={styles.microDot}
            volume={volume}
          />
        ))}
      </Reanimated.View>
    </View>
  );
}

const createStyles = (size: number, circleScale: number) => {
  return StyleSheet.create({
    frame: {
      alignItems: "center",
      height: size,
      justifyContent: "center",
      width: size,
    },
    disc: {
      borderRadius: size / 2,
      height: size,
      overflow: "hidden",
      position: "absolute",
      width: size,
    },
    mic: {
      height: scaled(80, circleScale),
      position: "absolute",
      width: scaled(70, circleScale),
    },
    microRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: scaled(9, circleScale),
      justifyContent: "center",
      position: "absolute",
      transform: [{ translateY: scaled(-35, circleScale) }],
    },
    microDot: {
      height: scaled(21, circleScale),
      width: scaled(21, circleScale),
    },
  });
};
