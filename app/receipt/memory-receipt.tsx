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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const SLOT_BASE_WIDTH = 370;
const SLOT_BASE_HEIGHT = 44.25;
const RECEIPT_BASE_WIDTH = 331;
const PHOTO_BASE_WIDTH = 296;
const PHOTO_BASE_HEIGHT = 154;
const BARCODE_BASE_WIDTH = 209;
const BARCODE_BASE_HEIGHT = 32;
const TEAR_BASE_HEIGHT = 32;

const footprints = [
  {
    id: "01",
    amount: "4,800원",
    place: "투썸플레이스 종로점",
    time: "오전 11:43",
  },
  {
    id: "02",
    amount: "34,000원",
    place: "하나로마트 종로점",
    time: "오후 14:03",
  },
  {
    id: "03",
    amount: "7,000원",
    place: "Hana 택시 (귀가)",
    time: "오후 21:12",
  },
];

export default function MemoryReceipt() {
  const { width, height } = useWindowDimensions();
  const [isReceiptRevealed, setIsReceiptRevealed] = useState(false);
  const receiptReveal = useRef(new Animated.Value(0)).current;
  const waitingOpacity = useRef(new Animated.Value(1)).current;
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(width, height, scale, fontScale, insets.bottom),
    [fontScale, height, insets.bottom, scale, width],
  );
  const receiptMaxRevealHeight = Math.max(height * 2, scaled(1200, scale));
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/receipt/main");
  };

  useEffect(() => {
    receiptReveal.setValue(0);
    waitingOpacity.setValue(1);
    setIsReceiptRevealed(false);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(waitingOpacity, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(receiptReveal, {
          duration: 950,
          toValue: 1,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsReceiptRevealed(true);
        }
      });
    }, 950);

    return () => clearTimeout(timer);
  }, [receiptReveal, waitingOpacity]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로가기"
            hitSlop={scaled(12, scale)}
            onPress={goBack}
            style={styles.headerButton}
          >
            <Ionicons
              color="#5D5D5D"
              name="chevron-back"
              size={scaled(24, scale)}
            />
          </Pressable>

          <Pressable accessibilityLabel="저장" hitSlop={scaled(12, scale)}>
            <Text maxFontSizeMultiplier={1.1} style={styles.saveText}>
              저장
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.receiptStage}>
            <Animated.View
              pointerEvents="none"
              style={[styles.waitingState, { opacity: waitingOpacity }]}
            >
              <Image
                resizeMode="contain"
                source={require("../../assets/images/memory-receipt/receipt-setting.png")}
                style={styles.waitingIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.waitingTitle}>
                곧 영수증이 나와요
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.waitingDescription}>
                기억 영수증을 차곡차곡 쌓으며{"\n"}
                보람을 느껴보는건 어떨까요?
              </Text>
            </Animated.View>

            <Image
              resizeMode="contain"
              source={require("../../assets/images/memory-receipt/receipt-slot.png")}
              style={styles.receiptSlot}
            />

            <Animated.View
              style={[
                styles.receiptReveal,
                isReceiptRevealed ? styles.receiptRevealVisible : null,
                {
                  maxHeight: receiptReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, receiptMaxRevealHeight],
                  }),
                },
              ]}
            >
              <View style={styles.receiptWrap}>
                <View style={styles.receiptPaper}>
                  <View style={styles.receiptInner}>
                    <View style={styles.receiptTitleRow}>
                      <View style={styles.titleDash} />
                      <Text maxFontSizeMultiplier={1.1} style={styles.receiptTitle}>
                        기억 영수증
                      </Text>
                      <View style={styles.titleDash} />
                    </View>

                    <Image
                      resizeMode="cover"
                      source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
                      style={styles.heroImage}
                    />

                    <SectionTitle label="오늘의 한줄" styles={styles} />
                    <View style={styles.summaryBox}>
                      <Text maxFontSizeMultiplier={1.1} style={styles.summaryText}>
                        친구들과 투썸플레이스에서 음료를 마시며{"\n"}
                        수다를 떠는 시간을 가졌어요☕
                      </Text>
                    </View>

                    <SectionTitle label="오늘의 발자취" styles={styles} />
                    <View style={styles.footprintList}>
                      {footprints.map((item, index) => (
                        <View key={item.id} style={styles.footprintItem}>
                          <View style={styles.timelineColumn}>
                            <View style={styles.timelineCircle}>
                              <Text
                                maxFontSizeMultiplier={1.1}
                                style={styles.timelineNumber}
                              >
                                {item.id}
                              </Text>
                            </View>
                            {index < footprints.length - 1 ? (
                              <View style={styles.timelineLine} />
                            ) : null}
                          </View>

                          <View style={styles.footprintTextBox}>
                            <Text
                              ellipsizeMode="tail"
                              maxFontSizeMultiplier={1.1}
                              numberOfLines={1}
                              style={styles.placeText}
                            >
                              {item.place}
                            </Text>
                            <Text maxFontSizeMultiplier={1.1} style={styles.timeText}>
                              {item.time}
                            </Text>
                          </View>

                          <Text maxFontSizeMultiplier={1.1} style={styles.amountText}>
                            {item.amount}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <SectionTitle label="오늘의 대화 친구" styles={styles} />
                    <View style={styles.friendRow}>
                      <Image
                        resizeMode="contain"
                        source={require("../../assets/images/onboarding/friend-hanaboy-inactive-icon.png")}
                        style={styles.friendAvatar}
                      />
                      <Text
                        ellipsizeMode="tail"
                        maxFontSizeMultiplier={1.1}
                        numberOfLines={1}
                        style={styles.friendName}
                      >
                        별봄이
                      </Text>
                    </View>

                    <View style={styles.barcodeTopLine} />
                    <Image
                      resizeMode="contain"
                      source={require("../../assets/images/memory-receipt/memory-receipt-barcode.png")}
                      style={styles.barcode}
                    />
                    <Text maxFontSizeMultiplier={1.1} style={styles.dateText}>
                      2026.05.25(월) 18:34
                    </Text>
                  </View>
                  <Image
                    resizeMode="stretch"
                    source={require("../../assets/images/memory-receipt/memory-receipt-shadow.png")}
                    style={styles.receiptTopShadow}
                  />
                </View>

                <Image
                  resizeMode="stretch"
                  source={require("../../assets/images/memory-receipt/memory-receipt-tear-line.png")}
                  style={styles.tearLine}
                />
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        <View style={styles.shareBar}>
          <View style={styles.shareBarGlow} />
          <Pressable accessibilityLabel="공유하기" style={styles.shareButton}>
            <Text maxFontSizeMultiplier={1.1} style={styles.shareButtonText}>
              공유하기
            </Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.shareCaption}>
            가족에게 오늘 하루를 공유해보세요.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

type SectionTitleProps = {
  label: string;
  styles: ReturnType<typeof createStyles>;
};

function SectionTitle({ label, styles }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
        {label}
      </Text>
      <View style={styles.sectionDash} />
    </View>
  );
}

const createStyles = (
  screenWidth: number,
  screenHeight: number,
  scale: number,
  fontScale: number,
  bottomInset: number,
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const fixed = (value: number) => Math.round(value * layoutScale);
  const vertical = (value: number) =>
    Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) =>
    fontScaled(value, Math.min(fontScale, layoutScale));
  const receiptWidth = Math.min(
    fixed(RECEIPT_BASE_WIDTH),
    Math.round(screenWidth * 0.84),
  );
  const receiptScale = receiptWidth / RECEIPT_BASE_WIDTH;
  const receiptFixed = (value: number) => Math.round(value * receiptScale);
  const receiptFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, receiptScale));
  const slotWidth = Math.min(
    fixed(SLOT_BASE_WIDTH),
    Math.round(screenWidth * 0.92),
  );
  const slotHeight = Math.round(slotWidth * (SLOT_BASE_HEIGHT / SLOT_BASE_WIDTH));
  const heroWidth = Math.min(
    receiptFixed(PHOTO_BASE_WIDTH),
    receiptWidth - receiptFixed(36),
  );
  const heroHeight = Math.round(heroWidth * (PHOTO_BASE_HEIGHT / PHOTO_BASE_WIDTH));
  const barcodeWidth = receiptFixed(BARCODE_BASE_WIDTH);
  const barcodeHeight = Math.round(
    barcodeWidth * (BARCODE_BASE_HEIGHT / BARCODE_BASE_WIDTH),
  );
  const tearHeight = receiptFixed(TEAR_BASE_HEIGHT);
  const shareBarHeight = vertical(157) + bottomInset;
  const shareBarGlowBlur = vertical(10);
  const shareBarGlowOvershoot = shareBarGlowBlur * 4;

  return StyleSheet.create({
    amountText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(14),
      lineHeight: receiptFont(20),
      marginLeft: receiptFixed(8),
      minWidth: receiptFixed(74),
      textAlign: "right",
    },
    barcode: {
      alignSelf: "center",
      height: barcodeHeight,
      marginTop: receiptFixed(16),
      width: barcodeWidth,
    },
    barcodeTopLine: {
      borderColor: "#13BB78",
      borderStyle: "dashed",
      borderTopWidth: 1,
      marginTop: receiptFixed(16),
      width: "100%",
    },
    content: {
      alignItems: "center",
      paddingBottom: vertical(150) + bottomInset,
      paddingHorizontal: fixed(20),
    },
    dateText: {
      color: "#00975B",
      fontFamily: "Hana2CM",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(24),
      marginTop: receiptFixed(10),
      textAlign: "center",
    },
    footprintItem: {
      flexDirection: "row",
      minHeight: receiptFixed(58),
      width: "100%",
    },
    footprintList: {
      gap: receiptFixed(16),
      marginTop: receiptFixed(16),
    },
    footprintTextBox: {
      flex: 1,
      marginLeft: receiptFixed(10),
      minWidth: 0,
    },
    friendAvatar: {
      height: receiptFixed(34),
      width: receiptFixed(34),
    },
    friendName: {
      color: "#353535",
      flex: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(23),
      marginLeft: receiptFixed(8),
    },
    friendRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: receiptFixed(16),
      width: "100%",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      height: vertical(48),
      justifyContent: "space-between",
      paddingLeft: fixed(24),
      paddingRight: fixed(24),
    },
    headerButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      width: fixed(34),
    },
    heroImage: {
      alignSelf: "center",
      borderRadius: receiptFixed(10),
      height: heroHeight,
      marginTop: receiptFixed(22),
      overflow: "hidden",
      width: heroWidth,
    },
    placeText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(22),
    },
    receiptInner: {
      paddingBottom: receiptFixed(18),
      paddingHorizontal: receiptFixed(18),
      paddingTop: receiptFixed(24),
      zIndex: 2,
    },
    receiptPaper: {
      backgroundColor: "#F7F5EF",
      borderTopLeftRadius: receiptFixed(18),
      borderTopRightRadius: receiptFixed(18),
      minHeight: receiptFixed(715) - tearHeight,
      overflow: "hidden",
      width: receiptWidth,
    },
    receiptSlot: {
      height: slotHeight,
      width: slotWidth,
      zIndex: 1,
    },
    receiptReveal: {
      marginTop: -receiptFixed(45),
      overflow: "hidden",
      paddingBottom: receiptFixed(20),
      paddingHorizontal: receiptFixed(20),
      paddingTop: receiptFixed(20),
      width: receiptWidth + receiptFixed(40),
      zIndex: 3,
    },
    receiptRevealVisible: {
      overflow: "visible",
    },
    receiptStage: {
      alignItems: "center",
      marginTop: vertical(32),
      minHeight: screenHeight - vertical(150),
      overflow: "visible",
      width: "100%",
    },
    receiptTitle: {
      color: "#00975B",
      fontFamily: "Hana2Bold",
      fontSize: receiptFont(18),
      lineHeight: receiptFont(26),
      marginHorizontal: receiptFixed(18),
      textAlign: "center",
    },
    receiptTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      width: "100%",
    },
    receiptTopShadow: {
      height: receiptFixed(18),
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      width: receiptWidth,
      zIndex: 3,
    },
    receiptWrap: {
      alignItems: "center",
      elevation: 8,
      overflow: "visible",
      shadowColor: "#000000",
      shadowOffset: { height: -3, width: 0 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      width: receiptWidth,
      zIndex: 3,
    },
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    saveText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(28),
    },
    screen: {
      backgroundColor: "#F7F7F7",
      flex: 1,
      overflow: "visible",
      paddingTop: vertical(30),
    },
    shareBar: {
      alignItems: "center",
      bottom: 0,
      height: shareBarHeight,
      left: 0,
      overflow: "visible",
      paddingBottom: bottomInset,
      paddingTop: vertical(20),
      position: "absolute",
      right: 0,
      width: "100%",
    },
    shareBarGlow: {
      backgroundColor: "#FFFFFF",
      bottom: -shareBarGlowOvershoot,
      filter: [{ blur: shareBarGlowBlur }],
      left: -shareBarGlowOvershoot,
      position: "absolute",
      right: -shareBarGlowOvershoot,
      top: 0,
    },
    shareButton: {
      alignItems: "center",
      backgroundColor: "#444444",
      borderRadius: fixed(8),
      height: fixed(55),
      justifyContent: "center",
      width: Math.min(fixed(370), Math.round(screenWidth * 0.92)),
    },
    shareButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(28),
      textAlign: "center",
    },
    shareCaption: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: font(20),
      lineHeight: font(28),
      marginTop: vertical(18),
      textAlign: "center",
    },
    sectionDash: {
      borderColor: "#13BB78",
      borderStyle: "dashed",
      borderTopWidth: 1,
      flex: 1,
      marginLeft: receiptFixed(14),
    },
    sectionTitle: {
      color: "#00975B",
      fontFamily: "Hana2Bold",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(24),
    },
    sectionTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: receiptFixed(21),
      width: "100%",
    },
    summaryBox: {
      backgroundColor: "#EDE9DE",
      borderColor: "#C2B89C",
      borderRadius: receiptFixed(5),
      borderStyle: "dashed",
      borderWidth: 1,
      marginTop: receiptFixed(16),
      minHeight: receiptFixed(64),
      padding: receiptFixed(12),
      width: "100%",
    },
    summaryText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(22),
    },
    tearLine: {
      height: tearHeight,
      marginTop: -1,
      minHeight: tearHeight,
      opacity: 1,
      width: receiptWidth,
    },
    timeText: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: receiptFont(14),
      lineHeight: receiptFont(20),
      marginTop: receiptFixed(3),
    },
    timelineCircle: {
      alignItems: "center",
      backgroundColor: "#F7F5EF",
      borderColor: "#BEB18C",
      borderRadius: receiptFixed(12),
      borderWidth: 0.5,
      height: receiptFixed(24),
      justifyContent: "center",
      width: receiptFixed(24),
      zIndex: 2,
    },
    timelineColumn: {
      alignItems: "center",
      width: receiptFixed(24),
    },
    timelineLine: {
      borderColor: "#C3B69B",
      borderLeftWidth: 1,
      borderStyle: "dashed",
      flex: 1,
      marginTop: receiptFixed(2),
      minHeight: receiptFixed(34),
    },
    timelineNumber: {
      color: "#604800",
      fontFamily: "Hana2Bold",
      fontSize: receiptFont(12),
      lineHeight: receiptFont(16),
    },
    titleDash: {
      borderColor: "#13BB78",
      borderStyle: "dashed",
      borderTopWidth: 1,
      flex: 1,
    },
    waitingDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
      lineHeight: font(30),
      marginTop: vertical(12),
      textAlign: "center",
    },
    waitingIcon: {
      height: fixed(80),
      width: fixed(85),
    },
    waitingState: {
      alignItems: "center",
      left: 0,
      paddingHorizontal: fixed(24),
      position: "absolute",
      right: 0,
      top: Math.max(vertical(210), Math.round(screenHeight * 0.34)),
      zIndex: 0,
    },
    waitingTitle: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(28),
      marginTop: vertical(32),
      textAlign: "center",
    },
  });
};
