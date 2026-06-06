import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OnboardingCard = {
  icon: ImageSourcePropType;
  text?: string;
  beforeHighlight?: string;
  highlight?: string;
  afterHighlight?: string;
};

type OnboardingStep = {
  title: string;
  description: string;
  descriptionSize?: number;
  mainImage: ImageSourcePropType;
  mainImageScale?: number;
  mainImageOffsetX?: number;
  cards: OnboardingCard[];
};

const steps: OnboardingStep[] = [
  {
    mainImage: require("../../assets/images/onboarding/onboarding1-main-icon.png"),
    mainImageScale: 1.14,
    mainImageOffsetX: -4,
    title: "오늘의 대화는\n음성으로 진행돼요",
    description: "",
    cards: [
      {
        icon: require("../../assets/images/onboarding/onboarding1-microphone.png"),
        text: "시작 전에 마이크 허용 팝업이 떠요.\n허용을 눌러주세요.",
      },
      {
        icon: require("../../assets/images/onboarding/onboarding1-finger.png"),
        text: "말하기 어려울 땐 카드를 선택해서\n대답할 수 있어요.",
      },
    ],
  },
  {
    mainImage: require("../../assets/images/onboarding/onboarding2-main-icon.png"),
    title: "질문을 듣고\n바로 말하면 돼요",
    description: "모르겠다면 “모르겠어요”\n라고 말씀하셔도 괜찮아요.",
    descriptionSize: 22,
    cards: [
      {
        icon: require("../../assets/images/onboarding/onboarding2-hand-gestures.png"),
        beforeHighlight: "화면에 “",
        highlight: "듣고 있어요",
        afterHighlight: "”가 뜨면 바로\n말하면 돼요.",
      },
    ],
  },
  {
    mainImage: require("../../assets/images/onboarding/onboarding3-tick.png"),
    title: "다 말했으면 응답\n완료 버튼을 눌러주세요",
    description: "말을 시작하면 완료 버튼이 나타나요.\n다 말했으면 눌러주세요.",
    descriptionSize: 22,
    cards: [],
  },
];

const friends = [
  "아들",
  "딸",
  "강호동",
  "손흥민",
  "임영웅",
  "지드래곤",
  "안유진",
  "별봄이",
  "별송이",
];

function OnboardingCardText({
  card,
  styles,
}: {
  card: OnboardingCard;
  styles: ReturnType<typeof createStyles>;
}) {
  if (card.text) {
    return (
      <Text maxFontSizeMultiplier={1.1} style={styles.cardText}>
        {card.text}
      </Text>
    );
  }

  return (
    <Text maxFontSizeMultiplier={1.1} style={styles.cardText}>
      {card.beforeHighlight}
      <Text style={styles.cardTextHighlight}>{card.highlight}</Text>
      {card.afterHighlight}
    </Text>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [friendSheetVisible, setFriendSheetVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale]
  );
  const current = steps[step];

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setFriendSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            <Ionicons name="chevron-back" size={22} color="#7A7A7A" />
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === step && styles.progressDotActive,
              ]}
            >
              {index === step ? (
                <LinearGradient
                  colors={["#22CB88", "#14BC79"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.mainIconFrame}>
            {steps.map((item, index) => (
              <Image
                key={index}
                source={item.mainImage}
                fadeDuration={0}
                style={[
                  styles.mainIcon,
                  {
                    opacity: index === step ? 1 : 0,
                    transform: [
                      {
                        translateX: item.mainImageOffsetX
                          ? scaled(item.mainImageOffsetX, scale)
                          : 0,
                      },
                    ],
                  },
                  item.mainImageScale
                    ? {
                        width: scaled(174 * item.mainImageScale, scale),
                        height: scaled(127 * item.mainImageScale, scale),
                      }
                    : null,
                ]}
                resizeMode="contain"
              />
            ))}
          </View>

          <Text maxFontSizeMultiplier={1.1} style={styles.title}>
            {current.title}
          </Text>
          {current.description ? (
            <Text
              maxFontSizeMultiplier={1.1}
              style={[
                styles.description,
                current.descriptionSize
                  ? {
                      fontSize: fontScaled(
                        current.descriptionSize,
                        fontScale
                      ),
                      lineHeight: fontScaled(31, fontScale),
                    }
                  : null,
              ]}
            >
              {current.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.cardList}>
            {current.cards.map((card, index) => (
              <View key={`${step}-${index}`} style={styles.infoCard}>
                <Image
                  source={card.icon}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
                <OnboardingCardText card={card} styles={styles} />
              </View>
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text maxFontSizeMultiplier={1.1} style={styles.primaryButtonText}>
              {step === steps.length - 1 ? "대화 친구 확인하기" : "이해했어요"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.replace("/receipt/voice-waiting")}>
            <Text maxFontSizeMultiplier={1.1} style={styles.skipText}>
              건너뛰기
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={friendSheetVisible} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text maxFontSizeMultiplier={1.1} style={styles.sheetTitle}>
              대화 친구 선택
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.sheetDescription}>
              이름을 누르면 목소리를 미리 들을 수 있어요.
            </Text>

            <View style={styles.friendGrid}>
              {friends.map((friend, index) => (
                <Pressable key={friend} style={styles.friendItem}>
                  <View
                    style={[
                      styles.avatar,
                      index === 5 && styles.avatarSelected,
                    ]}
                  >
                    <Text maxFontSizeMultiplier={1.1} style={styles.avatarText}>
                      {friend.slice(0, 1)}
                    </Text>
                  </View>
                  <Text maxFontSizeMultiplier={1.1} style={styles.friendName}>
                    {friend}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/receipt/voice-waiting")}
            >
              <Text maxFontSizeMultiplier={1.1} style={styles.primaryButtonText}>
                선택 완료
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(scale: number, fontScale: number) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F7F7F7",
    },
    container: {
      flex: 1,
      paddingHorizontal: 23,
      paddingBottom: scaled(47, scale),
    },
    topRow: {
      height: scaled(50, scale),
      justifyContent: "center",
    },
    backButton: {
      width: 37,
      height: 37,
      marginTop: scaled(10, scale),
      borderRadius: 18.5,
      backgroundColor: "#ECECEC",
      alignItems: "center",
      justifyContent: "center",
    },
    progressRow: {
      marginTop: scaled(34, scale),
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    progressDot: {
      width: 13,
      height: 12,
      borderRadius: 45,
      backgroundColor: "#D9D9D9",
      overflow: "hidden",
    },
    progressDotActive: {
      width: 45,
      height: 13,
      backgroundColor: "#22CB88",
    },
    content: {
      alignItems: "center",
      flexShrink: 1,
    },
    mainIconFrame: {
      width: scaled(205, scale),
      height: scaled(150, scale),
      marginTop: scaled(60, scale),
      alignItems: "center",
      justifyContent: "center",
    },
    mainIcon: {
      position: "absolute",
      width: scaled(174, scale),
      height: scaled(127, scale),
    },
    title: {
      marginTop: scaled(36, scale),
      color: "#353535",
      fontSize: fontScaled(32, fontScale),
      lineHeight: fontScaled(43, fontScale),
      textAlign: "center",
      fontFamily: "PretendardBold",
    },
    description: {
      marginTop: scaled(28, scale),
      color: "#9F9F9F",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(29, fontScale),
      textAlign: "center",
      fontFamily: "PretendardMedium",
    },
    bottomArea: {
      marginTop: "auto",
    },
    cardList: {
      width: "100%",
      maxWidth: 370,
      alignSelf: "center",
      gap: scaled(14, scale),
      marginBottom: scaled(32, scale),
    },
    infoCard: {
      minHeight: scaled(75, scale),
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: scaled(24, scale),
      paddingVertical: scaled(15, scale),
      flexDirection: "row",
      alignItems: "center",
    },
    cardIcon: {
      width: scaled(34, scale),
      height: scaled(34, scale),
      marginRight: scaled(25, scale),
    },
    cardText: {
      flex: 1,
      color: "#5D5D5D",
      fontSize: fontScaled(19, fontScale),
      lineHeight: fontScaled(26, fontScale),
      fontFamily: "PretendardMedium",
    },
    cardTextHighlight: {
      color: "#13BB78",
    },
    primaryButton: {
      width: "100%",
      maxWidth: 370,
      height: scaled(55, scale),
      alignSelf: "center",
      borderRadius: 8,
      backgroundColor: "#444444",
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    skipText: {
      marginTop: scaled(25, scale),
      color: "#9F9F9F",
      fontSize: fontScaled(20, fontScale),
      textAlign: "center",
      fontFamily: "PretendardMedium",
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.28)",
    },
    sheet: {
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      backgroundColor: "#FFFFFF",
      padding: 24,
      paddingTop: 8,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 94,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#D9D9D9",
      marginBottom: 20,
    },
    sheetTitle: {
      color: "#222222",
      fontSize: fontScaled(18, fontScale),
      fontFamily: "PretendardBold",
    },
    sheetDescription: {
      marginTop: 6,
      color: "#A0A0A0",
      fontSize: fontScaled(14, fontScale),
      fontFamily: "PretendardMedium",
    },
    friendGrid: {
      marginVertical: 24,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    friendItem: {
      width: 58,
      alignItems: "center",
      gap: 6,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#EFEFEF",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarSelected: {
      borderWidth: 3,
      borderColor: "#2ABD83",
    },
    avatarText: {
      color: "#333333",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardBold",
    },
    friendName: {
      color: "#333333",
      fontSize: fontScaled(14, fontScale),
      fontFamily: "PretendardSemiBold",
    },
  });
}
