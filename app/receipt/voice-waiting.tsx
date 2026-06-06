import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const questions = [
  "오늘 카페 다녀오셨네요.\n날씨도 좋았는데, 어떠셨어요?",
  "누구와 함께 시간을 보내셨나요?",
  "오늘 가장 기억에 남는 순간은 무엇이었나요?",
];

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();
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
            const size = 426 - index * 24;

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  modeButton: {
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    color: "#6D6D6D",
    fontSize: 14,
    fontFamily: "PretendardMedium",
  },
  header: {
    marginTop: 48,
  },
  readyTitle: {
    color: "#2ABD83",
    fontSize: 30,
    fontFamily: "PretendardBold",
  },
  readyDescription: {
    marginTop: 12,
    color: "#9C9C9C",
    fontSize: 20,
    lineHeight: 29,
    fontFamily: "PretendardSemiBold",
  },
  questionBox: {
    marginTop: 34,
  },
  questionCount: {
    color: "#333333",
    fontSize: 14,
    fontFamily: "PretendardBold",
  },
  friendAvatar: {
    marginTop: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D7F8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: {
    color: "#2ABD83",
    fontSize: 24,
    fontFamily: "PretendardBold",
  },
  questionText: {
    marginTop: 14,
    color: "#2ABD83",
    fontSize: 27,
    lineHeight: 36,
    fontFamily: "PretendardBold",
  },
  answerPrompt: {
    marginTop: 74,
    color: "#A0A0A0",
    fontSize: 24,
    textAlign: "right",
    fontFamily: "PretendardSemiBold",
  },
  listeningPill: {
    alignSelf: "center",
    marginTop: 86,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#BBBBBB",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 3,
  },
  listeningDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#62DDAF",
  },
  listeningText: {
    color: "#9A9A9A",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
  micArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -20,
    height: 260,
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
    width: 174,
    height: 174,
    borderRadius: 87,
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
    marginTop: -28,
    color: "#2ABD83",
    fontSize: 36,
    fontFamily: "PretendardBold",
  },
});
