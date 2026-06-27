import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
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
  description?: string;
  descriptionSize?: number;
  mainImage: ImageSourcePropType;
  mainImageScale?: number;
  mainImageOffsetX?: number;
  cards: OnboardingCard[];
};

type FriendGroupId = "protector" | "celebrity" | "default";

type ConversationFriend = {
  id: string;
  name: string;
  description: string;
  group: FriendGroupId;
  activeIcon: ImageSourcePropType;
  inactiveIcon: ImageSourcePropType;
};

const steps: OnboardingStep[] = [
  {
    mainImage: require("../../assets/images/onboarding/onboarding1-main-icon.png"),
    mainImageScale: 1.14,
    mainImageOffsetX: -4,
    title: "오늘의 대화는\n음성으로 진행돼요",
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

const friends: ConversationFriend[] = [
  {
    id: "son",
    name: "아들",
    description: "아들의 목소리로\n편하게 대화해봐요!",
    group: "protector",
    activeIcon: require("../../assets/images/onboarding/friend-son-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-son-inactive-icon.png"),
  },
  {
    id: "daughter",
    name: "딸",
    description: "딸의 목소리로\n다정하게 대화해봐요!",
    group: "protector",
    activeIcon: require("../../assets/images/onboarding/friend-daughter-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-daughter-inactive-icon.png"),
  },
  {
    id: "hodong",
    name: "강호동",
    description: "힘 있고 유쾌한 목소리로\n대화해봐요!",
    group: "celebrity",
    activeIcon: require("../../assets/images/onboarding/friend-hodong-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-hodong-inactive-icon.png"),
  },
  {
    id: "heungmin",
    name: "손흥민",
    description: "차분하고 밝은 목소리로\n편하게 대화해봐요!",
    group: "celebrity",
    activeIcon: require("../../assets/images/onboarding/friend-heungmin-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-heungmin-inactive-icon.png"),
  },
  {
    id: "yeongung",
    name: "임영웅",
    description: "부드럽고 깊은 목소리로\n마음을 나눠봐요!",
    group: "celebrity",
    activeIcon: require("../../assets/images/onboarding/friend-yeongung-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-yeongung-inactive-icon.png"),
  },
  {
    id: "gdragon",
    name: "지드래곤",
    description: "감각적이고 개성 있는 목소리로\n대화해봐요!",
    group: "celebrity",
    activeIcon: require("../../assets/images/onboarding/friend-gdragon-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-gdragon-inactive-icon.png"),
  },
  {
    id: "yujin",
    name: "안유진",
    description: "밝고 또렷한 목소리로\n대화를 이끌어줘요!",
    group: "celebrity",
    activeIcon: require("../../assets/images/onboarding/friend-yujin-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-yujin-inactive-icon.png"),
  },
  {
    id: "hanaboy",
    name: "별봄이",
    description: "따뜻한 목소리로\n마음을 들어줘요!",
    group: "default",
    activeIcon: require("../../assets/images/onboarding/friend-hanaboy-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-hanaboy-inactive-icon.png"),
  },
  {
    id: "hanagirl",
    name: "별송이",
    description: "상냥한 목소리로\n편안하게 대화해요!",
    group: "default",
    activeIcon: require("../../assets/images/onboarding/friend-hanagirl-active-icon.png"),
    inactiveIcon: require("../../assets/images/onboarding/friend-hanagirl-inactive-icon.png"),
  },
];

const friendGroups: {
  id: FriendGroupId;
  label: string;
  suffix?: string;
}[] = [
  { id: "protector", label: "보호자", suffix: "(딥보이스)" },
  { id: "celebrity", label: "하나 연예인" },
  { id: "default", label: "기본" },
];

export default function ConversationOnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale),
    [fontScale, scale]
  );
  const [step, setStep] = useState(0);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [friendSheetVisible, setFriendSheetVisible] = useState(false);
  const [friendSheetMode, setFriendSheetMode] = useState<"confirm" | "select">(
    "confirm"
  );
  const [selectedFriendId, setSelectedFriendId] = useState("hanaboy");
  const friendBackdropProgress = useRef(new Animated.Value(1)).current;
  const friendSheetProgress = useRef(new Animated.Value(1)).current;
  const friendSheetTranslateX = useRef(new Animated.Value(0)).current;
  const pageTurnProgress = useRef(new Animated.Value(0)).current;
  const isPageTurningRef = useRef(false);
  const shouldReturnToInlineConfirmRef = useRef(false);

  const selectedFriend =
    friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];

  const turnToStep = (targetStep: number) => {
    if (isPageTurningRef.current || targetStep === step) {
      return;
    }

    isPageTurningRef.current = true;
    setSlideDirection(targetStep > step ? 1 : -1);
    setNextStep(targetStep);
    pageTurnProgress.setValue(0);
    Animated.timing(pageTurnProgress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setStep(targetStep);
      }
      setNextStep(null);
      pageTurnProgress.setValue(0);
      isPageTurningRef.current = false;
    });
  };

  const goPrevious = () => {
    if (step <= 0) {
      return;
    }

    turnToStep(step - 1);
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      turnToStep(step + 1);
      return;
    }

    setFriendSheetMode("confirm");
    openFriendSheet();
  };

  const openFriendSheet = () => {
    friendBackdropProgress.setValue(1);
    friendSheetProgress.setValue(1);
    friendSheetTranslateX.setValue(0);
    setFriendSheetVisible(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(friendBackdropProgress, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(friendSheetProgress, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const openFriendSelectSheet = () => {
    shouldReturnToInlineConfirmRef.current = false;
    friendSheetProgress.setValue(1);
    friendSheetTranslateX.setValue(0);
    setFriendSheetMode("select");
    requestAnimationFrame(() => {
      Animated.timing(friendSheetProgress, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });
  };

  const openInlineFriendSelectSheet = () => {
    shouldReturnToInlineConfirmRef.current = true;
    setFriendSheetMode("select");
    openFriendSheet();
  };

  const openFriendConfirmSheet = () => {
    setFriendSheetMode("confirm");
    friendSheetTranslateX.setValue(-width);
    Animated.timing(friendSheetTranslateX, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const completeFriendSelection = () => {
    if (shouldReturnToInlineConfirmRef.current) {
      closeFriendSheet(() => {
        shouldReturnToInlineConfirmRef.current = false;
      });
      return;
    }

    openFriendConfirmSheet();
  };

  const closeFriendSheet = (onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(friendBackdropProgress, {
        duration: 220,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(friendSheetProgress, {
        duration: 220,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setFriendSheetVisible(false);
        setFriendSheetMode("confirm");
        friendSheetTranslateX.setValue(0);
        onClosed?.();
      }
    });
  };

  const startConversation = () => {
    if (!friendSheetVisible) {
      router.replace({
        pathname: "/receipt/voice-waiting",
        params: { friendId: selectedFriendId },
      });
      return;
    }

    closeFriendSheet(() => {
      router.push({
        pathname: "/receipt/voice-waiting",
        params: { friendId: selectedFriendId },
      });
    });
  };

  const skipOnboarding = () => {
    setFriendSheetMode("confirm");
    openFriendSheet();
  };
  const goBack = () => {
    if (step > 0) {
      goPrevious();
      return;
    }

    router.replace("/receipt/main");
  };
  const swipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 18 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25,
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) < 48) {
        return;
      }

      if (gestureState.dx < 0) {
        if (step < steps.length - 1) {
          goNext();
        }
        return;
      }

      if (step > 0) {
        goPrevious();
      }
    },
  });
  const progressStep = nextStep ?? step;
  const outgoingPageStyle = {
    transform: [
      {
        translateX: pageTurnProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -width * slideDirection],
        }),
      },
    ],
  };
  const incomingPageStyle = {
    transform: [
      {
        translateX: pageTurnProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [width * slideDirection, 0],
        }),
      },
    ],
  };

  const renderFriendConfirmContent = (
    onChangeFriend: () => void,
    isInteractive = true
  ) => (
    <>
      <View style={styles.sheetHandle} />
      <Text maxFontSizeMultiplier={1.1} style={styles.confirmTitle}>
        오늘의 대화 친구
      </Text>
      <Text maxFontSizeMultiplier={1.1} style={styles.confirmDescription}>
        원하는 목소리로 언제든 변경할 수 있어요.
      </Text>

      <View style={styles.currentFriendRow}>
        <Image
          resizeMode="contain"
          source={selectedFriend.inactiveIcon}
          style={styles.currentFriendImage}
        />
        <View style={styles.currentFriendTextBox}>
          <Text maxFontSizeMultiplier={1.1} style={styles.currentFriendName}>
            {selectedFriend.name}
          </Text>
          <Text
            maxFontSizeMultiplier={1.1}
            style={styles.currentFriendDescription}
          >
            {selectedFriend.description}
          </Text>
        </View>
        <Pressable
          disabled={!isInteractive}
          onPress={onChangeFriend}
          style={styles.changeFriendButton}
        >
          <Text maxFontSizeMultiplier={1.1} style={styles.changeFriendText}>
            변경
          </Text>
        </Pressable>
      </View>

      <Pressable
        disabled={!isInteractive}
        onPress={startConversation}
        style={styles.startButton}
      >
        <Text maxFontSizeMultiplier={1.1} style={styles.startButtonText}>
          시작하기
        </Text>
      </Pressable>
    </>
  );

  const renderInlineFriendCard = (isInteractive: boolean) => (
    <View style={styles.inlineFriendSection}>
      <View style={styles.inlineFriendCard}>
        <Text maxFontSizeMultiplier={1.1} style={styles.inlineFriendTitle}>
          오늘의 대화 친구
        </Text>
        <View style={styles.inlineFriendDivider} />
        <View style={styles.inlineFriendRow}>
          <Image
            resizeMode="contain"
            source={selectedFriend.inactiveIcon}
            style={styles.inlineFriendImage}
          />
          <View style={styles.inlineFriendTextBox}>
            <Text maxFontSizeMultiplier={1.1} style={styles.inlineFriendName}>
              {selectedFriend.name}
            </Text>
            <Text
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              style={styles.inlineFriendDescription}
            >
              {selectedFriend.description.replace(/\n/g, " ")}
            </Text>
          </View>
          <Pressable
            disabled={!isInteractive}
            onPress={openInlineFriendSelectSheet}
            style={styles.inlineChangeButton}
          >
            <Text maxFontSizeMultiplier={1.1} style={styles.inlineChangeText}>
              변경
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        disabled={!isInteractive}
        onPress={startConversation}
        style={styles.inlineStartButton}
      >
        <Text maxFontSizeMultiplier={1.1} style={styles.inlineStartButtonText}>
          시작할게요
        </Text>
      </Pressable>
    </View>
  );

  const renderPage = (pageStep: number, isInteractive: boolean) => {
    const item = steps[pageStep];
    const isLastStep = pageStep === steps.length - 1;

    return (
      <View style={styles.page}>
        <View style={styles.content}>
          <View style={styles.mainIconFrame}>
            <Image
              resizeMode="contain"
              source={item.mainImage}
              style={[
                styles.mainIcon,
                {
                  transform: [
                    {
                      translateX: scaled(item.mainImageOffsetX ?? 0, scale),
                    },
                    { scale: item.mainImageScale ?? 1 },
                  ],
                },
              ]}
            />
          </View>

          <Text maxFontSizeMultiplier={1.1} style={styles.title}>
            {item.title}
          </Text>

          {item.description ? (
            <Text
              maxFontSizeMultiplier={1.1}
              style={[
                styles.description,
                item.descriptionSize
                  ? {
                      fontSize: fontScaled(item.descriptionSize, fontScale),
                      lineHeight: fontScaled(
                        item.descriptionSize + 9,
                        fontScale
                      ),
                    }
                  : null,
              ]}
            >
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.bottomArea}>
          {item.cards.length > 0 ? (
            <View style={styles.cardList}>
              {item.cards.map((card, index) => (
                <View key={index} style={styles.infoCard}>
                  <Image
                    resizeMode="contain"
                    source={card.icon}
                    style={styles.cardIcon}
                  />
                  <Text maxFontSizeMultiplier={1.1} style={styles.cardText}>
                    {card.text ? (
                      card.text
                    ) : (
                      <>
                        {card.beforeHighlight}
                        <Text style={styles.highlightText}>
                          {card.highlight}
                        </Text>
                        {card.afterHighlight}
                      </>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {isLastStep ? (
            renderInlineFriendCard(isInteractive)
          ) : (
            <>
              <Pressable
                disabled={!isInteractive}
                onPress={goNext}
                style={styles.primaryButton}
              >
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.primaryButtonText}
                >
                  이해했어요
                </Text>
              </Pressable>

              <Pressable disabled={!isInteractive} onPress={skipOnboarding}>
                <Text maxFontSizeMultiplier={1.1} style={styles.skipText}>
                  건너뛰기
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="뒤로가기"
            hitSlop={10}
            onPress={goBack}
            style={styles.backButton}
          >
            <Ionicons
              color="#7E7E7E"
              name="chevron-back"
              size={scaled(22, scale)}
            />
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          {steps.map((_, index) =>
            index === progressStep ? (
              <LinearGradient
                colors={["#22CB88", "#14BC79"]}
                end={{ x: 1, y: 0 }}
                key={index}
                start={{ x: 0, y: 0 }}
                style={styles.progressActive}
              />
            ) : (
              <View key={index} style={styles.progressInactive} />
            )
          )}
        </View>

        <View style={styles.pageStage} {...swipeResponder.panHandlers}>
          {nextStep === null ? (
            renderPage(step, true)
          ) : (
            <>
              <Animated.View style={[styles.turnPage, outgoingPageStyle]}>
                {renderPage(step, false)}
              </Animated.View>
              <Animated.View style={[styles.turnPage, incomingPageStyle]}>
                {renderPage(nextStep, false)}
              </Animated.View>
            </>
          )}
        </View>
      </View>

      <Modal
        animationType="none"
        onRequestClose={() => closeFriendSheet()}
        transparent
        visible={friendSheetVisible}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.modalBackdropDim,
              {
                opacity: friendBackdropProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.28, 0],
                }),
              },
            ]}
          />
          <Pressable
            accessibilityLabel="대화 친구 설정 닫기"
            onPress={() => closeFriendSheet()}
            style={StyleSheet.absoluteFill}
          />

          {friendSheetMode === "confirm" ? (
            <Animated.View
              style={[
                styles.sheet,
                styles.confirmSheet,
                {
                  transform: [
                    {
                      translateX: friendSheetTranslateX,
                    },
                    {
                      translateY: friendSheetProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                      }),
                    },
                  ],
                },
              ]}
            >
              {renderFriendConfirmContent(openFriendSelectSheet)}
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.sheet,
                styles.selectSheet,
                {
                  transform: [
                    {
                      translateX: friendSheetTranslateX,
                    },
                    {
                      translateY: friendSheetProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.sheetHandle} />
              <Text maxFontSizeMultiplier={1.1} style={styles.sheetTitle}>
                대화 친구 선택
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.sheetDescription}>
                이름을 누르면 목소리를 미리 들을 수 있어요.
              </Text>

              <View style={styles.friendGrid}>
                {friendGroups.map((group) => (
                  <View key={group.id} style={styles.friendGroup}>
                    <View style={styles.friendGroupHeader}>
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.friendGroupLabel}
                      >
                        {group.label}
                        {group.suffix ? (
                          <Text style={styles.friendGroupHighlight}>
                            {group.suffix}
                          </Text>
                        ) : null}
                      </Text>
                      <View style={styles.friendGroupLine} />
                    </View>

                    <View style={styles.friendGroupList}>
                      {friends
                        .filter((friend) => friend.group === group.id)
                        .map((friend) => {
                          const isSelected = friend.id === selectedFriendId;

                          return (
                            <Pressable
                              key={friend.id}
                              onPress={() => setSelectedFriendId(friend.id)}
                              style={styles.friendItem}
                            >
                              <View style={styles.friendAvatarBox}>
                                <Image
                                  resizeMode="contain"
                                  source={
                                    isSelected
                                      ? friend.activeIcon
                                      : friend.inactiveIcon
                                  }
                                  style={styles.friendAvatarImage}
                                />
                                {isSelected ? (
                                  <Image
                                    resizeMode="contain"
                                    source={require("../../assets/images/onboarding/friend-check-icon.png")}
                                    style={styles.friendCheckIcon}
                                  />
                                ) : null}
                              </View>
                              <Text
                                maxFontSizeMultiplier={1.1}
                                style={styles.friendName}
                              >
                                {friend.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={completeFriendSelection}
                style={styles.selectDoneButton}
              >
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.selectDoneButtonText}
                >
                  선택 완료
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (scale: number, fontScale: number) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    container: {
      flex: 1,
      paddingBottom: scaled(47, scale),
    },
    topRow: {
      height: scaled(80, scale),
      justifyContent: "center",
      paddingHorizontal: scaled(20, scale),
    },
    backButton: {
      alignItems: "center",
      backgroundColor: "#ECECEC",
      borderRadius: scaled(18.5, scale),
      height: scaled(37, scale),
      justifyContent: "center",
      width: scaled(37, scale),
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: scaled(8, scale),
      justifyContent: "center",
      marginTop: scaled(4, scale),
    },
    progressActive: {
      borderRadius: scaled(45, scale),
      height: scaled(13, scale),
      width: scaled(45, scale),
    },
    progressInactive: {
      backgroundColor: "#D9D9D9",
      borderRadius: scaled(45, scale),
      height: scaled(12, scale),
      width: scaled(13, scale),
    },
    content: {
      alignItems: "center",
      flex: 1,
    },
    page: {
      flex: 1,
    },
    pageStage: {
      flex: 1,
      overflow: "hidden",
      paddingHorizontal: scaled(23, scale),
    },
    turnPage: {
      ...StyleSheet.absoluteFillObject,
      backfaceVisibility: "hidden",
    },
    mainIconFrame: {
      height: scaled(150, scale),
      marginTop: scaled(58, scale),
      width: scaled(205, scale),
    },
    mainIcon: {
      height: scaled(127, scale),
      left: scaled(15, scale),
      position: "absolute",
      top: scaled(12, scale),
      width: scaled(174, scale),
    },
    title: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(32, fontScale),
      lineHeight: fontScaled(43, fontScale),
      marginTop: scaled(32, scale),
      textAlign: "center",
    },
    description: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(29, fontScale),
      marginTop: scaled(32, scale),
      textAlign: "center",
    },
    bottomArea: {
      alignItems: "center",
    },
    cardList: {
      gap: scaled(16, scale),
      marginBottom: scaled(32, scale),
      maxWidth: scaled(370, scale),
      width: "100%",
    },
    infoCard: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(8, scale),
      flexDirection: "row",
      minHeight: scaled(74, scale),
      paddingHorizontal: scaled(22, scale),
      paddingVertical: scaled(12, scale),
      width: "100%",
    },
    cardIcon: {
      height: scaled(34, scale),
      marginRight: scaled(25, scale),
      width: scaled(34, scale),
    },
    cardText: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(19, fontScale),
      lineHeight: fontScaled(26, fontScale),
    },
    highlightText: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
    },
    exitModalBackdrop: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.28)",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: scaled(26, scale),
    },
    exitModalCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(16, scale),
      maxWidth: scaled(350, scale),
      paddingBottom: scaled(18, scale),
      paddingHorizontal: scaled(20, scale),
      paddingTop: scaled(24, scale),
      width: "100%",
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
    primaryButton: {
      alignItems: "center",
      backgroundColor: "#444444",
      borderRadius: scaled(8, scale),
      height: scaled(55, scale),
      justifyContent: "center",
      maxWidth: scaled(370, scale),
      width: "100%",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
    },
    skipText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, fontScale),
      marginTop: scaled(25, scale),
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdropDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000000",
    },
    sheet: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: scaled(20, scale),
      borderTopRightRadius: scaled(20, scale),
      paddingBottom: scaled(25, scale),
      paddingHorizontal: scaled(23, scale),
      paddingTop: scaled(9, scale),
    },
    confirmSheet: {
      paddingBottom: scaled(29, scale),
    },
    selectSheet: {
      minHeight: scaled(575, scale),
    },
    inlineFriendSection: {
      alignSelf: "center",
      gap: scaled(32, scale),
      maxWidth: scaled(370, scale),
      paddingBottom: scaled(49, scale),
      width: "100%",
    },
    inlineFriendCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(14, scale),
      paddingBottom: scaled(22, scale),
      paddingHorizontal: scaled(25, scale),
      paddingTop: scaled(20, scale),
      width: "100%",
    },
    inlineFriendTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(28, fontScale),
    },
    inlineFriendDivider: {
      backgroundColor: "#EEEEEE",
      height: 1,
      marginTop: scaled(12, scale),
    },
    inlineFriendRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: scaled(14, scale),
    },
    inlineFriendImage: {
      height: scaled(52, scale),
      marginRight: scaled(13, scale),
      width: scaled(52, scale),
    },
    inlineFriendTextBox: {
      flex: 1,
      minWidth: 0,
    },
    inlineFriendName: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(27, fontScale),
    },
    inlineFriendDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: fontScaled(16, fontScale),
      lineHeight: fontScaled(22, fontScale),
      marginTop: scaled(1, scale),
    },
    inlineChangeButton: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: scaled(12, scale),
      minHeight: scaled(44, scale),
      minWidth: scaled(50, scale),
    },
    inlineChangeText: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(27, fontScale),
    },
    inlineStartButton: {
      alignItems: "center",
      backgroundColor: "#23CC89",
      borderRadius: scaled(8, scale),
      height: scaled(55, scale),
      justifyContent: "center",
      width: "100%",
    },
    inlineStartButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
      lineHeight: fontScaled(28, fontScale),
    },
    sheetHandle: {
      alignSelf: "center",
      backgroundColor: "#D9D9D9",
      borderRadius: scaled(2, scale),
      height: scaled(4, scale),
      marginBottom: scaled(25, scale),
      width: scaled(95, scale),
    },
    confirmTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
    },
    confirmDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, fontScale),
      marginTop: scaled(8, scale),
    },
    currentFriendRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: scaled(28, scale),
    },
    currentFriendImage: {
      height: scaled(64, scale),
      marginRight: scaled(15, scale),
      width: scaled(64, scale),
    },
    currentFriendTextBox: {
      flex: 1,
    },
    currentFriendName: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, fontScale),
    },
    currentFriendDescription: {
      color: "#8A8A8A",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, fontScale),
      lineHeight: fontScaled(22, fontScale),
      marginTop: scaled(4, scale),
    },
    changeFriendButton: {
      alignItems: "center",
      backgroundColor: "#EEEEEE",
      borderRadius: scaled(45, scale),
      height: scaled(50, scale),
      justifyContent: "center",
      width: scaled(92, scale),
    },
    changeFriendText: {
      color: "#111111",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, fontScale),
    },
    sheetTitle: {
      color: "#222222",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(18, fontScale),
    },
    sheetDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(14, fontScale),
      marginTop: scaled(9, scale),
    },
    friendGrid: {
      gap: scaled(16, scale),
      marginTop: scaled(23, scale),
    },
    friendGroup: {
      gap: scaled(12, scale),
    },
    friendGroupHeader: {
      alignItems: "center",
      flexDirection: "row",
    },
    friendGroupLabel: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, fontScale),
    },
    friendGroupHighlight: {
      color: "#13BB78",
      fontFamily: "PretendardMedium",
    },
    friendGroupLine: {
      backgroundColor: "#E2E2E2",
      flex: 1,
      height: 1,
      marginLeft: scaled(8, scale),
    },
    friendGroupList: {
      columnGap: scaled(17, scale),
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: scaled(14, scale),
    },
    friendItem: {
      alignItems: "center",
      gap: scaled(6, scale),
      width: scaled(58, scale),
    },
    friendAvatarBox: {
      height: scaled(52, scale),
      width: scaled(52, scale),
    },
    friendAvatarImage: {
      height: "100%",
      width: "100%",
    },
    friendCheckIcon: {
      height: scaled(22, scale),
      position: "absolute",
      right: scaled(-4, scale),
      top: scaled(-3, scale),
      width: scaled(22, scale),
    },
    friendName: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(14, fontScale),
      textAlign: "center",
    },
    startButton: {
      alignItems: "center",
      backgroundColor: "#23CC89",
      borderRadius: scaled(8, scale),
      height: scaled(55, scale),
      justifyContent: "center",
      marginTop: scaled(28, scale),
      width: "100%",
    },
    startButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
    },
    selectDoneButton: {
      alignItems: "center",
      backgroundColor: "#444444",
      borderRadius: scaled(8, scale),
      height: scaled(55, scale),
      justifyContent: "center",
      marginTop: scaled(16, scale),
      width: "100%",
    },
    selectDoneButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, fontScale),
    },
  });
