import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  "누구와 함께 시간을 보내셨나요?",
  "오늘 가장 기억에 남는 시간은 무엇이었나요?",
];

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale],
  );
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);

  const selectedFriend =
    friends.find((friend) => friend.id === friendId) ?? friends[0];

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
          <Pressable
            accessibilityLabel="뒤로가기"
            onPress={() => router.replace("/receipt/main")}
            style={styles.backButton}
          >
            <Ionicons color="#7A7A7A" name="chevron-back" size={22} />
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
              질문 {questionNumber}/3
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
            {isListening ? (
              <>
                <Text maxFontSizeMultiplier={1.1} style={styles.answerPrompt}>
                  지금 응답해주세요...
                </Text>
                <View style={styles.listeningPill}>
                  <View style={styles.listeningDot} />
                  <Text maxFontSizeMultiplier={1.1} style={styles.listeningText}>
                    듣고 있어요..
                  </Text>
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
              <Text maxFontSizeMultiplier={1.1} style={styles.micDots}>
                ...
              </Text>
            ) : (
              <Ionicons color="#A1A1A1" name="mic" size={48} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const isIOS = Platform.OS === "ios";

const createStyles = (scale: number, fontScale: number) =>
  StyleSheet.create({
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
    },
    questionCount: {
      color: "#333333",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(14, fontScale),
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
      fontSize: fontScaled(27, fontScale),
      lineHeight: fontScaled(36, fontScale),
      marginTop: scaled(14, scale),
    },
    answerPrompt: {
      color: "#A0A0A0",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(24, fontScale),
      marginTop: scaled(42, scale),
      textAlign: "right",
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
      bottom: scaled(-16, scale),
      height: scaled(260, scale),
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
    },
    waveCircle: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      elevation: 4,
      position: "absolute",
      shadowColor: "#DADADA",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isIOS ? 0.45 : 0.9,
      shadowRadius: isIOS ? 18 : 36,
    },
    micCircle: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: isIOS ? "#F5F5F5" : "#F1F1F1",
      borderRadius: scaled(87, scale),
      borderWidth: 1,
      elevation: 6,
      height: scaled(174, scale),
      justifyContent: "center",
      shadowColor: "#A1A1A1",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isIOS ? 0.45 : 0.22,
      shadowRadius: isIOS ? 34 : 28,
      width: scaled(174, scale),
    },
    micCircleActive: {
      borderColor: "#DFF8ED",
    },
    micDots: {
      color: "#2ABD83",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(36, fontScale),
      marginTop: scaled(-28, scale),
    },
  });
