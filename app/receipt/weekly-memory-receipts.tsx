import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { useImageAuthHeaders } from "@/hooks/use-image-auth-headers";
import { sessionImageUrl } from "@/lib/api";
import type { RecallSessionListItem } from "@/lib/types";
import { useCurrentUser } from "@/lib/user";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const CARD_BASE_WIDTH = 330;
const CARD_BASE_HEIGHT = 220;
const IMAGE_BASE_WIDTH = 307.37;
const IMAGE_BASE_HEIGHT = 145;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-05-20" → "5월 20일 (수)"
function formatReceiptDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

type WeeklyReceipt = {
  id: number;
  date: string;
  title: string;
  meta: string;
  hasImage: boolean;
};

// 완료되어 제목이 생성된 세션만 기억 영수증 목록으로 노출한다.
function toWeeklyReceipt(session: RecallSessionListItem): WeeklyReceipt | null {
  if (session.status !== "completed" || !session.title) {
    return null;
  }
  return {
    id: session.id,
    date: formatReceiptDate(session.session_date),
    title: session.title,
    meta: session.summary ?? "",
    hasImage: session.image_url != null,
  };
}

export default function WeeklyMemoryReceiptsScreen() {
  const { width, height } = useWindowDimensions();
  const { data: user } = useCurrentUser();
  const imageHeaders = useImageAuthHeaders();
  const receipts = useMemo(
    () =>
      (user?.recall_sessions ?? [])
        .map(toWeeklyReceipt)
        .filter((receipt): receipt is WeeklyReceipt => receipt !== null),
    [user?.recall_sessions]
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollContentHeight, setScrollContentHeight] = useState(1);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(1);
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(width, height, scale, fontScale),
    [fontScale, height, scale, width]
  );
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const fixed = (value: number) => Math.round(value * layoutScale);
  const scrollbarTrackHeight = Math.max(fixed(300), height - fixed(204));
  const scrollbarThumbHeight =
    scrollContentHeight > scrollViewportHeight
      ? Math.max(
          fixed(46),
          scrollbarTrackHeight * (scrollViewportHeight / scrollContentHeight)
        )
      : scrollbarTrackHeight;
  const scrollbarTranslateY = scrollY.interpolate({
    extrapolate: "clamp",
    inputRange: [0, Math.max(1, scrollContentHeight - scrollViewportHeight)],
    outputRange: [0, Math.max(0, scrollbarTrackHeight - scrollbarThumbHeight)],
  });
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로가기"
            hitSlop={scaled(12, scale)}
            onPress={goBackToPreviousScreen}
            style={styles.backButton}
          >
            <Ionicons
              color="#5D5D5D"
              name="chevron-back"
              size={scaled(24, scale)}
            />
          </Pressable>

          <Text
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.1}
            numberOfLines={1}
            style={styles.headerTitle}
          >
            5월 첫째주(5.1~5.8)
          </Text>

          <Pressable
            accessibilityLabel="더보기"
            hitSlop={scaled(12, scale)}
            style={styles.moreButton}
          >
            <Ionicons
              color="#5D5D5D"
              name="ellipsis-vertical"
              size={scaled(24, scale)}
            />
          </Pressable>
        </View>

        <View style={styles.listWrap}>
          <Animated.ScrollView
            contentContainerStyle={styles.receiptList}
            onContentSizeChange={(_, contentHeight) => {
              setScrollContentHeight(contentHeight);
            }}
            onLayout={(event) => {
              setScrollViewportHeight(event.nativeEvent.layout.height);
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.receiptScroller}
          >
            {receipts.map((receipt) => (
              <WeeklyReceiptCard
                key={receipt.id}
                imageHeaders={imageHeaders}
                onPress={() => {
                  router.push({
                    params: { date: receipt.date },
                    pathname: "/receipt/weekly-memory-receipt-detail",
                  });
                }}
                receipt={receipt}
                styles={styles}
              />
            ))}
          </Animated.ScrollView>

          <View pointerEvents="none" style={styles.scrollbarTrack}>
            <Animated.View
              style={[
                styles.scrollbarThumb,
                {
                  height: scrollbarThumbHeight,
                  transform: [{ translateY: scrollbarTranslateY }],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type WeeklyReceiptCardProps = {
  imageHeaders: Record<string, string> | undefined;
  onPress: () => void;
  receipt: WeeklyReceipt;
  styles: ReturnType<typeof createStyles>;
};

function WeeklyReceiptCard({
  imageHeaders,
  onPress,
  receipt,
  styles,
}: WeeklyReceiptCardProps) {
  const motionProgress = useRef(new Animated.Value(0)).current;
  const hoverProgress = useRef(new Animated.Value(0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const isHoveredRef = useRef(false);
  const isPressedRef = useRef(false);

  const animateMotion = (toValue: number, duration: number) => {
    Animated.timing(motionProgress, {
      duration,
      toValue,
      useNativeDriver: false,
    }).start();
  };

  const syncMotionProgress = () => {
    const nextValue = isHoveredRef.current || isPressedRef.current ? 1 : 0;
    animateMotion(nextValue, nextValue > 0 ? 220 : 360);
  };

  const handlePress = () => {
    isPressedRef.current = true;
    Animated.sequence([
      Animated.timing(pressProgress, {
        duration: 160,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(pressProgress, {
        duration: 160,
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        isPressedRef.current = false;
        pressProgress.setValue(0);
        syncMotionProgress();
      }
    });
    animateMotion(1, 180);
    setTimeout(onPress, 240);
  };

  const handleHoverIn = () => {
    isHoveredRef.current = true;
    hoverProgress.setValue(1);
    animateMotion(1, 180);
  };

  const handleHoverOut = () => {
    isHoveredRef.current = false;
    hoverProgress.setValue(0);
    if (!isPressedRef.current) {
      animateMotion(0, 260);
    }
  };

  const animatedStyle = {
    elevation: motionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 12],
    }),
    shadowColor: motionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["#000000", "#54E5AC"],
    }),
    shadowOpacity: motionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.14, 0.34],
    }),
    shadowRadius: motionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 22],
    }),
    shadowOffset: {
      height: motionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 0],
      }),
      width: motionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0],
      }),
    },
  };
  const cardMotionStyle = {
    transform: [
      {
        rotate: motionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "7deg"],
        }),
      },
      {
        scale: motionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.01],
        }),
      },
    ],
  };

  return (
    <Pressable
      accessibilityRole="button"
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPointerEnter={handleHoverIn}
      onPointerLeave={handleHoverOut}
      onPress={handlePress}
      style={styles.cardPressable}
    >
      <Animated.View style={[styles.card, cardMotionStyle, animatedStyle]}>
        <View style={styles.imageWrap}>
          {receipt.hasImage ? (
            <ExpoImage
              contentFit="cover"
              source={{
                uri: sessionImageUrl(receipt.id),
                headers: imageHeaders,
              }}
              style={styles.cardImage}
            />
          ) : (
            <Image
              resizeMode="cover"
              source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
              style={styles.cardImage}
            />
          )}
          <View style={styles.dateBadge}>
            <Text maxFontSizeMultiplier={1.1} style={styles.dateBadgeText}>
              {receipt.date}
            </Text>
          </View>
        </View>

        <Text
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={styles.cardTitle}
        >
          {receipt.title}
        </Text>
        <Text
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={styles.cardMeta}
        >
          {receipt.meta}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const createStyles = (
  screenWidth: number,
  screenHeight: number,
  scale: number,
  fontScale: number
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const horizontalPadding = Math.max(
    32,
    Math.round(36 * Math.min(widthScale, 1))
  );
  const cardWidth = Math.min(
    Math.round(screenWidth * 0.821),
    screenWidth - horizontalPadding * 2,
    CARD_BASE_WIDTH
  );
  const cardScale = cardWidth / CARD_BASE_WIDTH;
  const cardHeight = Math.round(CARD_BASE_HEIGHT * cardScale);
  const imageWidth = Math.round(cardWidth - 22.63 * cardScale);
  const imageHeight = Math.round(
    imageWidth * (IMAGE_BASE_HEIGHT / IMAGE_BASE_WIDTH)
  );
  const fixed = (value: number) => Math.round(value * layoutScale);
  const cardFixed = (value: number) => Math.round(value * cardScale);
  const font = (value: number) =>
    fontScaled(value, Math.min(fontScale, layoutScale));
  const cardFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, cardScale));

  return StyleSheet.create({
    backButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      marginLeft: fixed(20),
      width: fixed(34),
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: cardFixed(15),
      elevation: 4,
      height: cardHeight,
      paddingBottom: cardFixed(15),
      paddingHorizontal: cardFixed(11.31),
      paddingTop: cardFixed(10),
      shadowColor: "#000000",
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      width: cardWidth,
    },
    cardImage: {
      height: imageHeight,
      width: imageWidth,
    },
    cardMeta: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: cardFont(16),
      lineHeight: cardFont(22),
      marginTop: cardFixed(6),
    },
    cardPressable: {
      position: "relative",
    },
    cardTitle: {
      color: "#000000",
      fontFamily: "PretendardMedium",
      fontSize: cardFont(16),
      lineHeight: cardFont(22),
      marginTop: cardFixed(6),
    },
    dateBadge: {
      alignItems: "center",
      backgroundColor: "rgba(53, 53, 53, 0.85)",
      borderRadius: cardFixed(45),
      height: cardFixed(34),
      justifyContent: "center",
      paddingHorizontal: cardFixed(18),
      position: "absolute",
      right: cardFixed(9),
      top: cardFixed(6),
    },
    dateBadgeText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: cardFont(16),
      lineHeight: cardFont(22),
    },
    header: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      height: fixed(48),
      width: "100%",
      zIndex: 20,
    },
    headerTitle: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: font(20),
      lineHeight: font(28),
      marginLeft: fixed(12),
      marginRight: fixed(12),
      textAlign: "left",
    },
    imageWrap: {
      borderRadius: cardFixed(10),
      height: imageHeight,
      overflow: "hidden",
      width: imageWidth,
    },
    listWrap: {
      flex: 1,
      marginTop: Math.round(8 * Math.min(heightScale, 1.04)),
      overflow: "hidden",
      zIndex: 0,
    },
    moreButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      marginRight: fixed(20),
      width: fixed(34),
    },
    receiptList: {
      alignItems: "center",
      gap: fixed(28),
      paddingBottom: fixed(44),
      paddingHorizontal: horizontalPadding,
      paddingTop: fixed(28),
    },
    receiptScroller: {
      overflow: "hidden",
      zIndex: 0,
    },
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    screen: {
      backgroundColor: "#F8F8F8",
      flex: 1,
    },
    scrollbarThumb: {
      backgroundColor: "#5D5D5D",
      borderRadius: fixed(45),
      width: fixed(5),
    },
    scrollbarTrack: {
      backgroundColor: "#E6E6E6",
      borderRadius: fixed(45),
      height: Math.max(fixed(220), screenHeight - fixed(244)),
      overflow: "hidden",
      position: "absolute",
      right: fixed(20),
      top: Math.round(34 * Math.min(heightScale, 1.04)),
      width: fixed(5),
    },
  });
};
