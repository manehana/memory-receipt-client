import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { useImageAuthHeaders } from "@/hooks/use-image-auth-headers";
import { sessionImageUrl } from "@/lib/api";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
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
import { captureRef } from "react-native-view-shot";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const RECEIPT_BASE_WIDTH = 331;
const PHOTO_BASE_WIDTH = 296;
const PHOTO_BASE_HEIGHT = 154;
const BARCODE_BASE_WIDTH = 210;
const BARCODE_BASE_HEIGHT = 44;
const TEAR_BASE_HEIGHT = 32;

const footprints = [
  {
    id: "01",
    amount: "4,800원",
    place: "제일내과의원 종로점",
    time: "오전 10:43",
  },
  {
    id: "02",
    amount: "12,100원",
    place: "하나약국 종로점",
    time: "오전 11:05",
  },
  {
    id: "03",
    amount: "7,600원",
    place: "Hana 택시",
    time: "오후 12:26",
  },
];

const shareGuardians = [
  {
    id: "daughter",
    avatar: require("../../assets/images/memory-receipt/share_friend_daughter.png"),
    name: "딸",
  },
];

const getShareBarHeight = (screenHeight: number, bottomInset: number) => {
  const heightScale = screenHeight / BASE_HEIGHT;
  const vertical = (value: number) =>
    Math.round(value * Math.min(heightScale, 1.04));
  return vertical(157) + bottomInset;
};

export default function WeeklyMemoryReceiptDetail() {
  const { date, hasImage, sessionId } = useLocalSearchParams<{
    date?: string;
    hasImage?: string;
    sessionId?: string;
  }>();
  const headerTitle = (date ?? "5월 1일").replace(/\s*\([^)]*\)\s*$/, "");
  const imageHeaders = useImageAuthHeaders();
  const heroSessionId =
    hasImage === "1" && sessionId ? Number(sessionId) : null;
  const { width, height } = useWindowDimensions();
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const shareSheetProgress = useRef(new Animated.Value(1)).current;
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(12)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareSheetMeasuredHeight, setShareSheetMeasuredHeight] = useState(0);
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(width, height, scale, fontScale, insets.bottom),
    [fontScale, height, insets.bottom, scale, width],
  );

  const receiptPaperRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      const uri = await captureRef(receiptPaperRef, {
        format: "png",
        quality: 1,
      });
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (error) {
      console.warn("영수증 공유 실패", error);
    }
  };

  const openShareSheet = () => {
    shareSheetProgress.setValue(1);
    setIsShareSheetVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(shareSheetProgress, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeShareSheet = () => {
    Animated.timing(shareSheetProgress, {
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsShareSheetVisible(false);
      }
    });
  };

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(12);
    Animated.parallel([
      Animated.timing(toastOpacity, {
        duration: 250,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        duration: 250,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      toastTimerRef.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          duration: 250,
          toValue: 0,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setToast(null);
          }
        });
      }, 2000);
    });
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
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
            {headerTitle}
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

        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
        >
          <View style={styles.receiptWrap}>
            <View ref={receiptPaperRef} style={styles.receiptPaper}>
              <View style={styles.receiptInner}>
                <View style={styles.receiptTitleRow}>
                  <View style={styles.titleDash} />
                  <Text maxFontSizeMultiplier={1.1} style={styles.receiptTitle}>
                    기억 영수증
                  </Text>
                  <View style={styles.titleDash} />
                </View>

                {heroSessionId != null ? (
                  <ExpoImage
                    contentFit="cover"
                    source={{
                      uri: sessionImageUrl(heroSessionId),
                      headers: imageHeaders,
                    }}
                    style={styles.heroImage}
                  />
                ) : (
                  <Image
                    resizeMode="cover"
                    source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
                    style={styles.heroImage}
                  />
                )}

                <SectionTitle label="오늘의 한줄" styles={styles} />
                <View style={styles.summaryBox}>
                  <Text maxFontSizeMultiplier={1.1} style={styles.summaryText}>
                    오전 10시, 혈압약을 타러 제일내과의원에 다녀왔어요.
                  </Text>
                </View>

                <SectionTitle
                  label="오늘의 발자취"
                  styles={styles}
                  style={styles.footprintTitle}
                />
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
                        <Text
                          maxFontSizeMultiplier={1.1}
                          style={styles.timeText}
                        >
                          {item.time}
                        </Text>
                      </View>

                      <Text
                        maxFontSizeMultiplier={1.1}
                        numberOfLines={1}
                        style={styles.amountText}
                      >
                        {item.amount}
                      </Text>
                    </View>
                  ))}
                </View>

                <SectionTitle
                  label="오늘의 대화 친구"
                  styles={styles}
                  style={styles.friendTitle}
                />
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
                    별빛이
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
            </View>

            <Image
              resizeMode="stretch"
              source={require("../../assets/images/memory-receipt/memory-receipt-tear-line.png")}
              style={styles.tearLine}
            />
          </View>
        </ScrollView>

        <View pointerEvents="box-none" style={styles.shareBar}>
          <View pointerEvents="none" style={styles.shareBarBackground}>
            <Image
              resizeMode="stretch"
              source={require("../../assets/images/memory-receipt/memory-receipt-share-container.png")}
              style={styles.shareBarBackgroundImage}
            />
          </View>
          <Pressable
            accessibilityLabel="공유하기"
            onPress={handleShare}
            style={styles.shareButton}
          >
            <Text maxFontSizeMultiplier={1.1} style={styles.shareButtonText}>
              공유하기
            </Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.shareCaption}>
            가족에게 오늘 하루를 공유해보세요.
          </Text>
        </View>
      </View>

      <Modal
        animationType="none"
        onRequestClose={closeShareSheet}
        transparent
        visible={isShareSheetVisible}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeShareSheet}
          style={styles.shareSheetOverlay}
        >
          <Animated.View
            onLayout={(event) =>
              setShareSheetMeasuredHeight(event.nativeEvent.layout.height)
            }
            style={[
              styles.shareSheet,
              {
                transform: [
                  {
                    translateY: shareSheetProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, height],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={styles.shareSheetContent}
            >
              <View style={styles.shareSheetHandle} />

              <Text maxFontSizeMultiplier={1.1} style={styles.shareSheetTitle}>
                공유하기
              </Text>

              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.shareSheetSectionTitle}
              >
                보호자
              </Text>

              <View style={styles.shareGuardianList}>
                {shareGuardians.map((guardian) => (
                  <View key={guardian.id} style={styles.shareGuardianItem}>
                    <View style={styles.shareGuardianProfile}>
                      <Image
                        resizeMode="contain"
                        source={guardian.avatar}
                        style={styles.shareGuardianAvatar}
                      />
                      <Text
                        ellipsizeMode="tail"
                        maxFontSizeMultiplier={1.1}
                        numberOfLines={1}
                        style={styles.shareGuardianName}
                      >
                        {guardian.name}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityLabel={`${guardian.name}에게 전송`}
                      onPress={() =>
                        showToast(`${guardian.name}에게 전송했어요`)
                      }
                      style={styles.shareSendButton}
                    >
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.shareSendButtonText}
                      >
                        전송
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable
                accessibilityLabel="링크 공유하기"
                style={styles.shareLinkButton}
              >
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.shareLinkButtonText}
                >
                  링크 공유하기
                </Text>
              </Pressable>

              <Text maxFontSizeMultiplier={1.1} style={styles.shareLinkCaption}>
                다른 사람에게는 링크로 공유해요.
              </Text>
            </Pressable>
          </Animated.View>

          {toast ? (
            <View
              pointerEvents="none"
              style={[
                styles.toastWrapper,
                { bottom: shareSheetMeasuredHeight + scaled(12, scale) },
              ]}
            >
              <Animated.View
                style={[
                  styles.toast,
                  {
                    opacity: toastOpacity,
                    transform: [{ translateY: toastTranslateY }],
                  },
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={require("../../assets/images/memory-receipt/memory-receipt-share-send.png")}
                  style={styles.toastIcon}
                />
                <Text
                  maxFontSizeMultiplier={1.1}
                  numberOfLines={1}
                  style={styles.toastText}
                >
                  {toast}
                </Text>
              </Animated.View>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type SectionTitleProps = {
  label: string;
  styles: ReturnType<typeof createStyles>;
  style?: object;
};

function SectionTitle({ label, styles, style }: SectionTitleProps) {
  return (
    <View style={[styles.sectionTitleRow, style]}>
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
  const sheetScale = Math.max(Math.min(widthScale, heightScale, 1), 0.92);
  const fixed = (value: number) => Math.round(value * layoutScale);
  const sheetFixed = (value: number) => Math.round(value * sheetScale);
  const vertical = (value: number) =>
    Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) =>
    fontScaled(value, Math.min(fontScale, layoutScale));
  const sheetFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, sheetScale));
  const receiptWidth = Math.min(
    fixed(RECEIPT_BASE_WIDTH),
    Math.round(screenWidth * 0.84),
  );
  const receiptScale = receiptWidth / RECEIPT_BASE_WIDTH;
  const receiptFixed = (value: number) => Math.round(value * receiptScale);
  const receiptFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, receiptScale));
  const heroWidth = Math.min(
    receiptFixed(PHOTO_BASE_WIDTH),
    receiptWidth - receiptFixed(36),
  );
  const heroHeight = Math.round(
    heroWidth * (PHOTO_BASE_HEIGHT / PHOTO_BASE_WIDTH),
  );
  const barcodeWidth = receiptFixed(BARCODE_BASE_WIDTH);
  const barcodeHeight = Math.round(
    barcodeWidth * (BARCODE_BASE_HEIGHT / BARCODE_BASE_WIDTH),
  );
  const tearHeight = Math.round(
    receiptWidth * (TEAR_BASE_HEIGHT / RECEIPT_BASE_WIDTH),
  );
  const shareBarHeight = getShareBarHeight(screenHeight, bottomInset);

  return StyleSheet.create({
    amountText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(14),
      lineHeight: receiptFont(20),
      marginLeft: receiptFixed(8),
      minWidth: receiptFixed(72),
      textAlign: "right",
    },
    backButton: {
      alignItems: "center",
      height: fixed(24),
      justifyContent: "center",
      width: fixed(24),
    },
    barcode: {
      alignSelf: "center",
      height: barcodeHeight,
      marginTop: receiptFixed(24),
      width: barcodeWidth,
    },
    barcodeTopLine: {
      borderColor: "#009A5B",
      borderStyle: "dashed",
      borderTopWidth: 1,
      marginTop: receiptFixed(28),
      width: "100%",
    },
    content: {
      alignItems: "center",
      paddingBottom: shareBarHeight + vertical(24),
      paddingHorizontal: fixed(16),
    },
    dateText: {
      color: "#009A5B",
      fontFamily: "PretendardMedium",
      fontSize: receiptFont(18),
      lineHeight: receiptFont(25),
      marginTop: receiptFixed(12),
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
    footprintTitle: {
      marginTop: receiptFixed(16),
    },
    friendAvatar: {
      height: receiptFixed(34),
      width: receiptFixed(34),
    },
    friendName: {
      color: "#353535",
      flex: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(18),
      lineHeight: receiptFont(25),
      marginLeft: receiptFixed(12),
    },
    friendRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: receiptFixed(16),
      width: "100%",
    },
    friendTitle: {
      marginTop: receiptFixed(16),
    },
    header: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      height: vertical(56),
      paddingLeft: fixed(24),
      width: "100%",
      zIndex: 10,
    },
    headerTitle: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: font(20),
      lineHeight: font(28),
      marginLeft: fixed(12),
      textAlign: "left",
    },
    heroImage: {
      alignSelf: "center",
      borderRadius: receiptFixed(10),
      height: heroHeight,
      marginTop: receiptFixed(22),
      overflow: "hidden",
      width: heroWidth,
    },
    moreButton: {
      alignItems: "center",
      height: fixed(24),
      justifyContent: "center",
      marginRight: fixed(24),
      width: fixed(24),
    },
    placeText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptFont(16),
      lineHeight: receiptFont(22),
    },
    receiptInner: {
      paddingBottom: receiptFixed(24),
      paddingHorizontal: receiptFixed(18),
      paddingTop: receiptFixed(24),
    },
    receiptPaper: {
      backgroundColor: "#F7F5EF",
      borderTopLeftRadius: receiptFixed(18),
      borderTopRightRadius: receiptFixed(18),
      boxShadow: "inset 0px 8px 6px rgba(144, 144, 144, 0.20)",
      overflow: "hidden",
      width: receiptWidth,
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
    receiptWrap: {
      alignItems: "center",
      filter: [{ dropShadow: "0px -3px 20px rgba(0, 0, 0, 0.10)" }],
      marginTop: vertical(28),
      width: receiptWidth,
    },
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    scrollArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    screen: {
      backgroundColor: "#FFFFFF",
      flex: 1,
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
    shareBar: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      bottom: 0,
      height: shareBarHeight,
      left: 0,
      overflow: "hidden",
      paddingBottom: bottomInset,
      paddingTop: vertical(24),
      position: "absolute",
      right: 0,
      width: "100%",
    },
    shareBarBackground: {
      bottom: 0,
      height: shareBarHeight,
      left: 0,
      position: "absolute",
      right: 0,
      width: screenWidth,
      zIndex: 0,
    },
    shareBarBackgroundImage: {
      height: "100%",
      width: "100%",
    },
    shareButton: {
      alignItems: "center",
      backgroundColor: "#444444",
      borderRadius: fixed(8),
      height: fixed(55),
      justifyContent: "center",
      width: Math.min(fixed(370), Math.round(screenWidth * 0.92)),
      zIndex: 1,
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
      zIndex: 1,
    },
    shareGuardianAvatar: {
      height: sheetFixed(50),
      width: sheetFixed(50),
    },
    shareGuardianItem: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    shareGuardianList: {
      gap: sheetFixed(18),
      marginTop: sheetFixed(14),
      width: "100%",
    },
    shareGuardianName: {
      color: "#353535",
      flex: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      marginLeft: sheetFixed(12),
      minWidth: 0,
    },
    shareGuardianProfile: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      marginRight: sheetFixed(12),
      minWidth: 0,
    },
    shareLinkButton: {
      alignItems: "center",
      backgroundColor: "#444444",
      borderRadius: sheetFixed(8),
      height: sheetFixed(55),
      justifyContent: "center",
      marginTop: sheetFixed(22),
      width: Math.min(sheetFixed(370), Math.round(screenWidth * 0.92)),
    },
    shareLinkButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      textAlign: "center",
    },
    shareLinkCaption: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      marginTop: sheetFixed(30),
      textAlign: "center",
    },
    shareSendButton: {
      alignItems: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: sheetFixed(45),
      height: sheetFixed(54),
      justifyContent: "center",
      width: sheetFixed(95),
    },
    shareSendButtonText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      textAlign: "center",
    },
    shareSheet: {
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: sheetFixed(20),
      borderTopRightRadius: sheetFixed(20),
      overflow: "hidden",
      width: "100%",
    },
    shareSheetContent: {
      alignItems: "center",
      paddingBottom: sheetFixed(30) + bottomInset,
      paddingHorizontal: sheetFixed(16),
      paddingTop: sheetFixed(14),
      width: "100%",
    },
    shareSheetHandle: {
      backgroundColor: "#D9D9D9",
      borderRadius: sheetFixed(999),
      height: sheetFixed(4),
      width: sheetFixed(95),
    },
    shareSheetOverlay: {
      backgroundColor: "rgba(0, 0, 0, 0.36)",
      flex: 1,
      justifyContent: "flex-end",
    },
    shareSheetSectionTitle: {
      color: "#9F9F9F",
      fontFamily: "PretendardSemiBold",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      marginTop: sheetFixed(28),
      width: "100%",
    },
    shareSheetTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      marginTop: sheetFixed(20),
      textAlign: "center",
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
      lineHeight: Math.round(receiptFont(16) * 1.35),
    },
    tearLine: {
      height: tearHeight,
      marginTop: -1,
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
    toast: {
      alignItems: "center",
      backdropFilter: "blur(70px)",
      backgroundColor: "rgba(51, 51, 51, 0.6)",
      borderRadius: fixed(48),
      flexDirection: "row",
      height: fixed(60),
      overflow: "hidden",
      paddingLeft: fixed(31.13),
      width: Math.min(fixed(370), Math.round(screenWidth * 0.92)),
    },
    toastIcon: {
      height: fixed(23.79),
      width: fixed(24.31),
    },
    toastText: {
      color: "#FFFFFF",
      flexShrink: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: font(19.03),
      marginLeft: fixed(10.03),
    },
    toastWrapper: {
      alignItems: "center",
      left: 0,
      position: "absolute",
      right: 0,
    },
  });
};
