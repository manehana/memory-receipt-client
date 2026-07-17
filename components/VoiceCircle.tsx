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
  // 큰 원 지름 (기존 voice-listening-circle.png 프레임과 동일)
  size: number;
  // 민트 halo 지름 (기존 blur PNG 레이어와 동일)
  innerSize: number;
  active: boolean;
  // 실제 녹음 음량 0..1 (화면에서 volumechange 이벤트로 갱신)
  volume: SharedValue<number>;
  micIcon: ImageSourcePropType;
  circleScale: number;
};

const GREEN_TOP = "#3ED598";
const GREEN_BOTTOM = "#2ABD83";
const MICRO_DOT_COUNT = 3;

export default function VoiceCircle({
  size,
  innerSize,
  active,
  volume,
  micIcon,
  circleScale,
}: VoiceCircleProps) {
  // idle↔listening 전환(기존 PNG 크로스페이드 대체)
  const activeProgress = useSharedValue(0);
  // idle 상태에서 천천히 숨쉬는 스케일
  const breath = useSharedValue(0);
  // listening 상태의 기본 맥동 (음량과 섞어서 사용)
  const pulse = useSharedValue(0);
  const microWaves = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: 360 });
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })
        ),
        -1
      );
      microWaves.forEach((wave, index) => {
        wave.value = withDelay(
          index * 150,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 320 }),
              withTiming(0, { duration: 320 }),
              withTiming(0, { duration: 120 + (MICRO_DOT_COUNT - 1) * 150 })
            ),
            -1
          )
        );
      });
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 240 });
      microWaves.forEach((wave) => {
        cancelAnimation(wave);
        wave.value = withTiming(0, { duration: 240 });
      });
    }
    return () => {
      cancelAnimation(activeProgress);
      cancelAnimation(pulse);
      microWaves.forEach((wave) => cancelAnimation(wave));
    };
    // microWaves 배열 항목은 마운트 동안 동일 객체
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
    return () => cancelAnimation(breath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    const energy = activeProgress.value * (0.3 + volume.value * 0.7);
    return {
      opacity: 0.35 + energy * 0.65,
      transform: [{ scale: 1 + breath.value * 0.015 + energy * 0.08 }],
    };
  });

  const discStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          1 +
          breath.value * 0.015 * (1 - activeProgress.value) +
          volume.value * 0.03 * activeProgress.value,
      },
    ],
  }));

  const haloOuterStyle = useAnimatedStyle(() => {
    const level = 0.35 * pulse.value + 0.65 * volume.value;
    return {
      opacity: activeProgress.value * (0.35 + level * 0.4),
      transform: [{ scale: 0.92 + 0.24 * level }],
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const level = 0.35 * pulse.value + 0.65 * volume.value;
    return {
      opacity: activeProgress.value,
      transform: [{ scale: 0.92 + 0.16 * level }],
    };
  });

  const smallDiscStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  const micStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
  }));

  const microRowStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  const styles = createStyles(size, innerSize, circleScale);

  return (
    <View pointerEvents="none" style={styles.frame}>
      <Reanimated.View style={[styles.glow, glowStyle]} />
      <Reanimated.View style={[styles.disc, discStyle]}>
        <LinearGradient
          colors={[GREEN_TOP, GREEN_BOTTOM]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.innerDisc}>
          <LinearGradient
            colors={["#FFFFFF", "#F5F5F5"]}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </Reanimated.View>
      <Reanimated.View style={[styles.haloOuter, haloOuterStyle]} />
      <Reanimated.View style={[styles.halo, haloStyle]} />
      <Reanimated.View style={[styles.smallDisc, smallDiscStyle]} />
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
  const baseAmplitude = scaled(5, circleScale);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          wave.value,
          [0, 1],
          [0, -baseAmplitude * (0.6 + volume.value * 1.6)]
        ),
      },
    ],
  }));
  return <Reanimated.View style={[style, dotStyle]} />;
}

const createStyles = (size: number, innerSize: number, circleScale: number) => {
  const innerDiscSize = size * 0.86;
  const smallDiscSize = size * 0.55;
  return StyleSheet.create({
    frame: {
      alignItems: "center",
      height: size,
      justifyContent: "center",
      width: size,
    },
    glow: {
      backgroundColor: "rgba(42, 189, 131, 0.12)",
      borderRadius: (size * 1.12) / 2,
      height: size * 1.12,
      position: "absolute",
      width: size * 1.12,
    },
    disc: {
      borderRadius: size / 2,
      height: size,
      overflow: "hidden",
      position: "absolute",
      width: size,
    },
    innerDisc: {
      borderRadius: innerDiscSize / 2,
      height: innerDiscSize,
      left: (size - innerDiscSize) / 2,
      overflow: "hidden",
      position: "absolute",
      top: size * 0.055,
      width: innerDiscSize,
    },
    haloOuter: {
      backgroundColor: "rgba(205, 237, 225, 0.28)",
      borderRadius: (innerSize * 1.08) / 2,
      height: innerSize * 1.08,
      position: "absolute",
      width: innerSize * 1.08,
    },
    halo: {
      backgroundColor: "rgba(205, 237, 225, 0.55)",
      borderRadius: innerSize / 2,
      height: innerSize,
      position: "absolute",
      width: innerSize,
    },
    smallDisc: {
      backgroundColor: "#F8F8F8",
      borderRadius: smallDiscSize / 2,
      height: smallDiscSize,
      position: "absolute",
      width: smallDiscSize,
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
