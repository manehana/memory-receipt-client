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
  volume: SharedValue<number>;
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
  baseOpacity: number;
  idleOpacity: number;
}) {
  const ringStyle = useAnimatedStyle(() => {
    const wave = Math.sin(TWO_PI * (clock.value + phase));
    // idle: 아주 미세한 숨쉬기 / active: 음량이 물결 진폭을 키운다
    const amplitude =
      0.006 + activeProgress.value * (0.012 + volume.value * 0.045);
    return {
      opacity:
        idleOpacity +
        (baseOpacity - idleOpacity) * activeProgress.value +
        wave * 0.12 * activeProgress.value * (0.3 + volume.value * 0.7),
      transform: [{ scale: 1 + wave * amplitude }],
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
          baseOpacity={1}
          clock={clock}
          color={mint(ring.alpha)}
          diameter={size * ring.ratio}
          idleOpacity={0.3}
          key={`inner-${index}`}
          phase={-index * phaseStep}
          volume={volume}
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
