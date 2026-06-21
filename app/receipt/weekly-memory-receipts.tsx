import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
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

const weeklyReceipts = [
  {
    id: "receipt-1",
    date: "5월 1일 (월)",
    title: "친구들과 카페에서 커피 한잔☕",
    meta: "34,000원 · 3곳",
  },
  {
    id: "receipt-2",
    date: "5월 1일 (월)",
    title: "친구들과 카페에서 커피 한잔☕",
    meta: "34,000원 · 3곳",
  },
  {
    id: "receipt-3",
    date: "5월 1일 (월)",
    title: "친구들과 카페에서 커피 한잔☕",
    meta: "34,000원 · 3곳",
  },
  {
    id: "receipt-4",
    date: "5월 1일 (월)",
    title: "친구들과 카페에서 커피 한잔☕",
    meta: "34,000원 · 3곳",
  },
];

export default function WeeklyMemoryReceiptsScreen() {
  const { width, height } = useWindowDimensions();
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(width, height, scale, fontScale),
    [fontScale, height, scale, width],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로가기"
            hitSlop={scaled(12, scale)}
            onPress={() => router.back()}
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
          <ScrollView
            contentContainerStyle={styles.receiptList}
            showsVerticalScrollIndicator={false}
            style={styles.receiptScroller}
          >
            {weeklyReceipts.map((receipt) => (
              <WeeklyReceiptCard
                isSelected={receipt.id === selectedReceiptId}
                key={receipt.id}
                onPress={() => {
                  setSelectedReceiptId(receipt.id);
                  router.push({
                    params: { date: receipt.date },
                    pathname: "/receipt/weekly-memory-receipt-detail",
                  });
                }}
                receipt={receipt}
                styles={styles}
              />
            ))}
          </ScrollView>

          <View pointerEvents="none" style={styles.scrollbarTrack}>
            <View style={styles.scrollbarThumb} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type WeeklyReceiptCardProps = {
  isSelected: boolean;
  onPress: () => void;
  receipt: (typeof weeklyReceipts)[number];
  styles: ReturnType<typeof createStyles>;
};

function WeeklyReceiptCard({
  isSelected,
  onPress,
  receipt,
  styles,
}: WeeklyReceiptCardProps) {
  const selectedProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectedProgress, {
      duration: 200,
      toValue: isSelected ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [isSelected, selectedProgress]);

  const animatedStyle = {
    elevation: selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 10],
    }),
    shadowColor: selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["#000000", "#2ABD83"],
    }),
    shadowOpacity: selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.3],
    }),
    shadowRadius: selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 14],
    }),
    transform: [
      {
        rotate: selectedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "3.02deg"],
        }),
      },
    ],
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={isSelected ? styles.selectedCardPressable : null}
    >
      <Animated.View
        style={[
          styles.card,
          animatedStyle,
          isSelected ? styles.selectedCardLayer : null,
        ]}
      >
        <View style={styles.imageWrap}>
          <Image
            resizeMode="cover"
            source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
            style={styles.cardImage}
          />
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
        <Text maxFontSizeMultiplier={1.1} style={styles.cardMeta}>
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
  fontScale: number,
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const horizontalPadding = Math.max(
    32,
    Math.round(36 * Math.min(widthScale, 1)),
  );
  const cardWidth = Math.min(
    Math.round(screenWidth * 0.821),
    screenWidth - horizontalPadding * 2,
    CARD_BASE_WIDTH,
  );
  const cardScale = cardWidth / CARD_BASE_WIDTH;
  const cardHeight = Math.round(CARD_BASE_HEIGHT * cardScale);
  const imageWidth = Math.round(cardWidth - 22.63 * cardScale);
  const imageHeight = Math.round(imageWidth * (IMAGE_BASE_HEIGHT / IMAGE_BASE_WIDTH));
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
      shadowOffset: { height: 1, width: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
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
      flexDirection: "row",
      height: fixed(48),
      width: "100%",
      zIndex: 1,
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
      overflow: "visible",
      zIndex: 2,
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
      paddingTop: fixed(4),
    },
    receiptScroller: {
      overflow: "visible",
      zIndex: 2,
    },
    safeArea: {
      backgroundColor: "#F8F8F8",
      flex: 1,
    },
    screen: {
      backgroundColor: "#F8F8F8",
      flex: 1,
      paddingTop: Math.round(18 * Math.min(heightScale, 1.04)),
    },
    selectedCardLayer: {
      elevation: 16,
      zIndex: 10,
    },
    selectedCardPressable: {
      elevation: 16,
      zIndex: 10,
    },
    scrollbarThumb: {
      backgroundColor: "#5D5D5D",
      borderRadius: fixed(45),
      height: fixed(220),
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
