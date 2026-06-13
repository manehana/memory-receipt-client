import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const questions = [
  "오늘 카페 다녀오셨네요.\n날씨도 좋았는데, 어떠셨어요?",
  "누구와 함께 시간을 보내셨나요?",
  "오늘 가장 기억에 남는 순간은 무엇이었나요?",
];

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale],
  );
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);

  const startQuestion = () => {
    setQuestionIndex(0);
    setIsListening(false);
  };

  const handleMainAction = () => {
    if (questionIndex === -1) {
      startQuestion();
      return;
    }

    if (!isListening) {
      setIsListening(true);
      return;
    }

    if (questionIndex >= questions.length - 1) {
      router.replace("/receipt/memory-receipt-loading");
      return;
    }

    setQuestionIndex(questionIndex + 1);
    setIsListening(false);
  };

  const questionNumber = questionIndex + 1;

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#7A7A7A" />
          </Pressable>

          <Pressable style={styles.modeButton}>
            <Text style={styles.modeButtonText}>대화 모드 변경</Text>
          </Pressable>
        </View>

        {questionIndex === -1 ? (
          <View style={styles.header}>
            <Text style={styles.readyTitle}>곧 시작할게요.</Text>
            <Text style={styles.readyDescription}>
              질문을 듣고 편하게 답해주세요.{"\n"}총 3가지 질문을 드릴게요.
            </Text>
          </View>
        ) : (
          <View style={styles.questionBox}>
            <Text style={styles.questionCount}>질문 {questionNumber}/3</Text>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>지</Text>
            </View>
            <Text style={styles.questionText}>{questions[questionIndex]}</Text>
            {isListening ? (
              <>
                <Text style={styles.answerPrompt}>지금 응답해주세요...</Text>
                <View style={styles.listeningPill}>
                  <View style={styles.listeningDot} />
                  <Text style={styles.listeningText}>듣고 있어요...</Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        <Pressable style={styles.micArea} onPress={handleMainAction}>
          {Array.from({ length: 10 }).map((_, index) => {
            const size = scaled(426 - index * 24, scale);

            return (
              <View
                key={index}
                style={[
                  styles.waveCircle,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: isListening ? "#DFF8ED" : "#F4F4F4",
                  },
                ]}
              />
            );
          })}

          <View style={[styles.micCircle, isListening && styles.micCircleActive]}>
            {isListening ? (
              <Text style={styles.micDots}>...</Text>
            ) : (
              <Ionicons name="mic" size={48} color="#A1A1A1" />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const isIOS = Platform.OS === "ios";

const createStyles = (scale: number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  inner: {
    flex: 1,
    paddingHorizontal: scaled(24, scale),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: scaled(37, scale),
    height: scaled(37, scale),
    borderRadius: scaled(18.5, scale),
    backgroundColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    height: scaled(37, scale),
    borderRadius: scaled(18.5, scale),
    backgroundColor: "#EEEEEE",
    paddingHorizontal: scaled(16, scale),
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    color: "#6D6D6D",
    fontSize: fontScaled(14, fontScale),
    fontFamily: "PretendardMedium",
  },
  header: {
    marginTop: scaled(36, scale),
  },
  readyTitle: {
    color: "#2ABD83",
    fontSize: fontScaled(30, fontScale),
    fontFamily: "PretendardBold",
  },
  readyDescription: {
    marginTop: scaled(12, scale),
    color: "#9C9C9C",
    fontSize: fontScaled(20, fontScale),
    lineHeight: fontScaled(29, fontScale),
    fontFamily: "PretendardSemiBold",
  },
  questionBox: {
    marginTop: scaled(26, scale),
  },
  questionCount: {
    color: "#333333",
    fontSize: fontScaled(14, fontScale),
    fontFamily: "PretendardBold",
  },
  friendAvatar: {
    marginTop: scaled(14, scale),
    width: scaled(52, scale),
    height: scaled(52, scale),
    borderRadius: scaled(26, scale),
    backgroundColor: "#D7F8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: {
    color: "#2ABD83",
    fontSize: fontScaled(24, fontScale),
    fontFamily: "PretendardBold",
  },
  questionText: {
    marginTop: scaled(14, scale),
    color: "#2ABD83",
    fontSize: fontScaled(27, fontScale),
    lineHeight: fontScaled(36, fontScale),
    fontFamily: "PretendardBold",
  },
  answerPrompt: {
    marginTop: scaled(42, scale),
    color: "#A0A0A0",
    fontSize: fontScaled(24, fontScale),
    textAlign: "right",
    fontFamily: "PretendardSemiBold",
  },
  listeningPill: {
    alignSelf: "center",
    marginTop: scaled(50, scale),
    height: scaled(44, scale),
    borderRadius: scaled(22, scale),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scaled(18, scale),
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#BBBBBB",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 3,
  },
  listeningDot: {
    width: scaled(12, scale),
    height: scaled(12, scale),
    borderRadius: scaled(6, scale),
    backgroundColor: "#62DDAF",
  },
  listeningText: {
    color: "#9A9A9A",
    fontSize: fontScaled(18, fontScale),
    fontFamily: "PretendardBold",
  },
  micArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: scaled(-16, scale),
    height: scaled(260, scale),
    alignItems: "center",
    justifyContent: "center",
  },
  waveCircle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    shadowColor: "#DADADA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isIOS ? 0.45 : 0.9,
    shadowRadius: isIOS ? 18 : 36,
    elevation: 4,
  },
  micCircle: {
    width: scaled(174, scale),
    height: scaled(174, scale),
    borderRadius: scaled(87, scale),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: isIOS ? "#F5F5F5" : "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A1A1A1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isIOS ? 0.45 : 0.22,
    shadowRadius: isIOS ? 34 : 28,
    elevation: 6,
  },
  micCircleActive: {
    borderColor: "#DFF8ED",
  },
  micDots: {
    marginTop: scaled(-28, scale),
    color: "#2ABD83",
    fontSize: fontScaled(36, fontScale),
    fontFamily: "PretendardBold",
  },
});
