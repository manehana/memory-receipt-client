import { scaled } from "@/constants/responsive";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
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
};

const GREEN_BOTTOM = "#2ABD83";
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
    // 소리가 없으면 움츠러들고(0.94) 소리가 크면 커진다(최대 ~1.06)
    const grow = activeProgress.value * (-0.06 + level * 0.12);
    const amplitude = 0.006 + activeProgress.value * 0.008;
    return {
      opacity:
        idleOpacity +
        (baseOpacity - idleOpacity) * activeProgress.value +
        wave * 0.1 * activeProgress.value * (0.3 + level * 0.7),
      transform: [{ scale: 1 + grow + wave * amplitude }],
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
  wave,
  volume,
  circleScale,
  style,
}: {
  wave: SharedValue<number>;
  volume: SharedValue<number>;
  circleScale: number;
  style: object;
}) {
  // worklet 안에서는 미리 계산한 숫자만 캡처한다
  const baseAmplitude = scaled(6, circleScale);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          wave.value,
          [0, 1],
          [0, -baseAmplitude * (0.6 + volume.value * 1.6)]
        ),
      },
      { scale: 1 + wave.value * 0.25 },
    ],
  }));
  return <Reanimated.View style={[style, dotStyle]} />;
}

export default function VoiceCircle({
  size,
  innerSize: _innerSize,
  active,
  volume,
  volumeSlow,
  micIcon,
  circleScale,
}: VoiceCircleProps) {
  // idle↔listening 전환(기존 PNG 크로스페이드 대체)
  const activeProgress = useSharedValue(0);
  // 모든 링이 공유하는 시계 (0..1 반복, sin으로 물결 위상 계산)
  const clock = useSharedValue(0);
  const microWaves = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: 420 });
    if (active) {
      microWaves.forEach((wave, index) => {
        wave.value = withDelay(
          index * 150,
          withRepeat(
            withSequence(
              withTiming(1, {
                duration: 340,
                easing: Easing.out(Easing.quad),
              }),
              withTiming(0, { duration: 340, easing: Easing.in(Easing.quad) }),
              withTiming(0, { duration: 420 })
            ),
            -1
          )
        );
      });
    } else {
      microWaves.forEach((wave) => {
        cancelAnimation(wave);
        wave.value = withTiming(0, { duration: 240 });
      });
    }
    return () => {
      cancelAnimation(activeProgress);
      microWaves.forEach((wave) => cancelAnimation(wave));
    };
    // microWaves 배열 항목은 마운트 동안 동일 객체
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

  const discStyle = useAnimatedStyle(() => {
    const wave = Math.sin(TWO_PI * clock.value);
    return {
      transform: [
        {
          scale:
            1 +
            wave *
              (0.006 + activeProgress.value * (0.008 + volume.value * 0.03)),
        },
      ],
    };
  });

  const micStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
    transform: [{ scale: 1 - activeProgress.value * 0.2 }],
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
        {microWaves.map((wave, index) => (
          <MicroDot
            circleScale={circleScale}
            key={index}
            style={styles.microDot}
            volume={volume}
            wave={wave}
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
      transform: [{ translateY: scaled(-40, circleScale) }],
      width: scaled(70, circleScale),
    },
    microRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: scaled(15, circleScale),
      justifyContent: "center",
      position: "absolute",
      transform: [{ translateY: scaled(-35, circleScale) }],
    },
    microDot: {
      backgroundColor: GREEN_BOTTOM,
      borderRadius: scaled(7.5, circleScale),
      height: scaled(15, circleScale),
      width: scaled(15, circleScale),
    },
  });
};
