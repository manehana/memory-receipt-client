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
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
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
const MIN_BOTTOM_SPACE = 32;
const RECENT_SECTION_TOP = 24;
const RECEIPT_CARD_WIDTH = 270;
const RECEIPT_CARD_HEIGHT = 185;
const RECEIPT_IMAGE_WIDTH = 250;
const RECEIPT_IMAGE_HEIGHT = 134;
const SAFETY_SHEET_HEIGHT = 410;
const SAFETY_ICON_WIDTH = 103.05;
const SAFETY_ICON_HEIGHT = 105;

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

type RecentReceipt = {
  id: number;
  date: string;
  sortTime: number;
  title: string;
  hasImage: boolean;
};

// 완료되어 제목이 생성된 세션만 최근 기억 영수증으로 노출한다.
function toRecentReceipt(session: RecallSessionListItem): RecentReceipt | null {
  if (session.status !== "completed" || !session.title) {
    return null;
  }
  const sessionDate = new Date(session.session_date);
  if (Number.isNaN(sessionDate.getTime())) {
    return null;
  }

  return {
    id: session.id,
    date: formatReceiptDate(session.session_date),
    sortTime: sessionDate.getTime(),
    title: session.title,
    hasImage: session.image_url != null,
  };
}

export default function MainScreen() {
  const { data: user } = useCurrentUser();
  const userName = user?.username ?? "";
  const recentReceipts = useMemo(
    () =>
      (user?.recall_sessions ?? [])
        .map(toRecentReceipt)
        .filter((receipt): receipt is RecentReceipt => receipt !== null),
    [user?.recall_sessions]
  );
  const imageHeaders = useImageAuthHeaders();
  const [isSafetyReportVisible, setIsSafetyReportVisible] = useState(true);
  const safetyBackdropProgress = useRef(new Animated.Value(0)).current;
  const safetySheetTranslateY = useRef(new Animated.Value(0)).current;
  const isDismissingSafetyReport = useRef(false);
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width]
  );
  const goToRecentReceiptMore = useCallback(() => {
    router.push("/receipt/memory-notebook");
  }, []);
  const dismissSafetyReport = useCallback(() => {
    if (isDismissingSafetyReport.current) {
      return;
    }

    isDismissingSafetyReport.current = true;
    safetySheetTranslateY.stopAnimation((currentTranslateY) => {
      safetySheetTranslateY.setValue(currentTranslateY);
      Animated.parallel([
        Animated.timing(safetyBackdropProgress, {
          duration: 180,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(safetySheetTranslateY, {
          duration: 180,
          toValue: height,
          useNativeDriver: true,
        }),
      ]).start(() => {
        safetyBackdropProgress.setValue(0);
        safetySheetTranslateY.setValue(0);
        isDismissingSafetyReport.current = false;
        setIsSafetyReportVisible(false);
      });
    });
  }, [height, safetyBackdropProgress, safetySheetTranslateY]);
  const safetySheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          safetySheetTranslateY.setValue(Math.max(gestureState.dy, 0));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90 || gestureState.vy > 0.7) {
            dismissSafetyReport();
            return;
          }
          Animated.spring(safetySheetTranslateY, {
            damping: 18,
            stiffness: 220,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dismissSafetyReport, safetySheetTranslateY]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        <View style={styles.header}>
          <View>
            <Text maxFontSizeMultiplier={1.1} style={styles.greeting}>
              어서오세요.
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.userLine}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userSuffix}> 님</Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/main/main-notification.png")}
                style={styles.notificationIcon}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/receipt/more")}
              style={styles.iconButton}
            >
              <Image
                resizeMode="contain"
                source={require("../../assets/images/main/main-burger.png")}
                style={styles.burgerIcon}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Pressable
            onPress={() => router.push("/receipt/conversation-onboarding")}
            style={styles.squareCard}
          >
            <Image
              resizeMode="stretch"
              source={require("../../assets/images/main/main_today_card.png")}
              style={styles.squareCardImage}
            />
            <View pointerEvents="none" style={styles.squareCardContent}>
              <Text
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.squareCardTitle}
              >
                오늘의 대화
              </Text>
              <Text
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.squareCardDescription}
              >
                소비 이력 기반 음성 대화
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/receipt/memory-notebook")}
            style={styles.squareCard}
          >
            <Image
              resizeMode="stretch"
              source={require("../../assets/images/main/main_diary_card.png")}
              style={styles.squareCardImage}
            />
            <View pointerEvents="none" style={styles.squareCardContent}>
              <Text
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.squareCardTitle}
              >
                기억 수첩
              </Text>
              <Text
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.squareCardDescription}
              >
                기억 영수증 모음
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/receipt/my-activity")}
          style={styles.reportCard}
        >
          <Image
            resizeMode="contain"
            source={require("../../assets/images/main/main-search.png")}
            style={styles.reportIcon}
          />
          <View style={styles.reportTextWrap}>
            <Text maxFontSizeMultiplier={1.1} style={styles.reportTitle}>
              MY 상세
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.reportDescription}>
              나의 인지 상태, 소비 상태를 한눈에
            </Text>
          </View>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
              최근 기억 영수증
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={goToRecentReceiptMore}
              style={styles.makeButton}
            >
              <Text maxFontSizeMultiplier={1.1} style={styles.makeText}>
                더보기
              </Text>
              <Ionicons
                color="#A1A1A1"
                name="chevron-forward"
                size={scaled(24, scale)}
              />
            </Pressable>
          </View>

          {recentReceipts.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.receiptList}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.receiptScroller}
            >
              {recentReceipts.map((receipt) => (
                <Pressable
                  key={receipt.id}
                  onPress={() => {
                    router.push({
                      params: {
                        date: receipt.date,
                        hasImage: receipt.hasImage ? "1" : "0",
                        sessionId: String(receipt.id),
                      },
                      pathname: "/receipt/weekly-memory-receipt-detail",
                    });
                  }}
                  style={styles.receiptCard}
                >
                  <View style={styles.receiptImageWrap}>
                    {receipt.hasImage ? (
                      <ExpoImage
                        contentFit="cover"
                        source={{
                          uri: sessionImageUrl(receipt.id),
                          headers: imageHeaders,
                        }}
                        style={styles.receiptImage}
                      />
                    ) : (
                      <Image
                        resizeMode="cover"
                        source={require("../../assets/images/memory-receipt/receipt-thumbnail.png")}
                        style={styles.receiptImage}
                      />
                    )}
                    <View style={styles.receiptDateBadge}>
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.receiptDateText}
                      >
                        {receipt.date}
                      </Text>
                    </View>
                  </View>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    style={styles.receiptTitle}
                  >
                    {receipt.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons
                color="#D8D8D8"
                name="document"
                size={scaled(62, scale)}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.emptyText}>
                기억 영수증이 없어요
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="none"
        onRequestClose={dismissSafetyReport}
        transparent
        visible={isSafetyReportVisible}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.modalBackdrop,
              {
                opacity: safetyBackdropProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
          />
          <Animated.View
            {...safetySheetPanResponder.panHandlers}
            style={[
              styles.safetySheet,
              { transform: [{ translateY: safetySheetTranslateY }] },
            ]}
          >
            <Pressable
              onPress={dismissSafetyReport}
              style={styles.sheetHandleButton}
            >
              <View style={styles.sheetHandle} />
            </Pressable>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/main/main-report-safety-icon.png")}
              style={styles.safetyIcon}
            />
            <Text maxFontSizeMultiplier={1.1} style={styles.safetyTitle}>
              안심 리포트 도착
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.safetyDescription}>
              2주 동안의 오늘의 대화, 소비 데이터
              {"\n"}
              기반으로 인지 상세 정보를 담았어요.
            </Text>

            <View style={styles.safetyButtonRow}>
              <Pressable
                onPress={dismissSafetyReport}
                style={[styles.safetyButton, styles.safetyCloseButton]}
              >
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.safetyCloseText}
                >
                  닫기
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsSafetyReportVisible(false);
                  router.push("/receipt/safety-report");
                }}
                style={[styles.safetyButton, styles.safetyViewButton]}
              >
                <Text maxFontSizeMultiplier={1.1} style={styles.safetyViewText}>
                  보러가기
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = Math.min(screenHeight / BASE_HEIGHT, 1);
  const modalScale = Math.min(
    screenWidth / BASE_WIDTH,
    screenHeight / BASE_HEIGHT,
    1
  );
  const horizontalScale = Math.min(widthScale, 1);
  const verticalScaled = (value: number) => Math.round(value * heightScale);
  const tallScreenOffset = Math.round(
    Math.min(Math.max(screenHeight - BASE_HEIGHT, 0) * 0.5, 18)
  );
  const recentTallOffset = screenHeight >= 920 ? 4 : tallScreenOffset;
  const recentTitleLift = Math.round(
    Math.min(Math.max(screenHeight - 900, 0) * 0.3, 8)
  );
  const longScreenReceiptBoost =
    screenWidth >= 390
      ? Math.min(Math.max(screenHeight - 760, 0) * 0.00048, 0.06)
      : 0;
  const receiptScale = Math.min(
    Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT) +
      longScreenReceiptBoost,
    1.1
  );
  const receiptScaled = (value: number) => Math.round(value * receiptScale);
  const horizontalPadding = Math.round(23 * horizontalScale);
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardGap = Math.round(12 * horizontalScale);
  const maxCardWidth = Math.floor((contentWidth - cardGap) / 2);
  const cardWidth = maxCardWidth;
  const cardHeight = Math.round(cardWidth * (250 / 176));
  const reportHeight = Math.round(contentWidth * (90 / 370));
  const receiptListTop = verticalScaled(26);
  const recentSectionTop =
    verticalScaled(RECENT_SECTION_TOP) + recentTallOffset - recentTitleLift;
  const modalScaled = (value: number) => Math.round(value * modalScale);

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    screen: {
      flex: 1,
    },
    screenContent: {
      flexGrow: 1,
      paddingTop: verticalScaled(28),
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: horizontalPadding,
    },
    greeting: {
      color: "#444444",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(31, fontScale),
      lineHeight: fontScaled(40, fontScale),
    },
    userLine: {
      fontFamily: "PretendardBold",
      fontSize: fontScaled(28, fontScale),
      lineHeight: fontScaled(38, fontScale),
      marginTop: scaled(2, scale),
    },
    userName: {
      color: "#23CC89",
    },
    userSuffix: {
      color: "#444444",
    },
    headerActions: {
      flexDirection: "row",
      gap: scaled(10, scale),
      marginTop: scaled(2, scale),
    },
    iconButton: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(23, scale),
      height: scaled(46, scale),
      justifyContent: "center",
      shadowColor: "#DADADA",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      width: scaled(46, scale),
    },
    notificationIcon: {
      height: scaled(30, scale),
      width: scaled(30, scale),
    },
    burgerIcon: {
      height: scaled(24, scale),
      width: scaled(24, scale),
    },
    cardRow: {
      flexDirection: "row",
      gap: cardGap,
      justifyContent: "center",
      marginTop: verticalScaled(22),
      paddingHorizontal: horizontalPadding,
    },
    squareCard: {
      height: cardHeight,
      overflow: "hidden",
      width: cardWidth,
    },
    squareCardImage: {
      height: "100%",
      width: "100%",
    },
    squareCardContent: {
      left: Math.round(cardWidth * 0.08),
      position: "absolute",
      right: Math.round(cardWidth * 0.08),
      top: Math.round(cardHeight * 0.08),
    },
    squareCardTitle: {
      color: "#444444",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(22, fontScale),
      lineHeight: fontScaled(30, fontScale),
    },
    squareCardDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, fontScale),
      lineHeight: fontScaled(21, fontScale),
      marginTop: Math.round(cardHeight * 0.02),
    },
    reportCard: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#707070",
      borderRadius: scaled(8, scale),
      flexDirection: "row",
      gap: Math.round(contentWidth * 0.04),
      height: reportHeight,
      marginTop: verticalScaled(16),
      overflow: "hidden",
      paddingLeft: Math.round(contentWidth * 0.06),
      width: contentWidth,
    },
    reportIcon: {
      height: Math.round(reportHeight * 0.64),
      width: Math.round(reportHeight * 0.64),
    },
    reportTextWrap: {
      flex: 1,
      justifyContent: "center",
    },
    reportTitle: {
      color: "#FFFFFF",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(26, fontScale),
      lineHeight: fontScaled(36, fontScale),
    },
    reportDescription: {
      color: "#FFFFFF",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(18, fontScale),
      lineHeight: fontScaled(26, fontScale),
      marginTop: Math.round(reportHeight * 0.02),
    },
    divider: {
      backgroundColor: "#F2F2F2",
      height: verticalScaled(9),
      marginTop: verticalScaled(16),
      width: "100%",
    },
    recentSection: {
      backgroundColor: "#F7F7F7",
      flex: 1,
      paddingTop: recentSectionTop,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: horizontalPadding,
    },
    sectionTitle: {
      color: "#444444",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(24, fontScale),
    },
    makeButton: {
      alignItems: "center",
      flexDirection: "row",
    },
    makeText: {
      color: "#A1A1A1",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, fontScale),
    },
    receiptList: {
      gap: receiptScaled(12),
      paddingBottom: verticalScaled(MIN_BOTTOM_SPACE),
      paddingLeft: horizontalPadding,
      paddingRight: horizontalPadding,
      paddingTop: receiptListTop,
    },
    receiptScroller: {},
    receiptCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: receiptScaled(15),
      elevation: 4,
      height: receiptScaled(RECEIPT_CARD_HEIGHT),
      marginVertical: receiptScaled(16),
      paddingHorizontal: receiptScaled(10),
      paddingTop: receiptScaled(10),
      shadowColor: "#000000",
      shadowOffset: { height: 0, width: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      width: receiptScaled(RECEIPT_CARD_WIDTH),
    },
    receiptImageWrap: {
      borderRadius: receiptScaled(10),
      height: receiptScaled(RECEIPT_IMAGE_HEIGHT),
      overflow: "hidden",
      width: receiptScaled(RECEIPT_IMAGE_WIDTH),
    },
    receiptImage: {
      height: "100%",
      width: "100%",
    },
    receiptDateBadge: {
      alignItems: "center",
      backgroundColor: "rgba(53, 53, 53, 0.85)",
      borderRadius: receiptScaled(18),
      paddingHorizontal: receiptScaled(14),
      paddingVertical: receiptScaled(6),
      position: "absolute",
      right: receiptScaled(7),
      top: receiptScaled(7),
    },
    receiptDateText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptScaled(16),
      lineHeight: receiptScaled(21),
    },
    receiptTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: receiptScaled(18),
      lineHeight: receiptScaled(25),
      marginTop: receiptScaled(6),
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(85, 85, 85, 0.5)",
    },
    safetySheet: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: modalScaled(20),
      borderTopRightRadius: modalScaled(20),
      height: modalScaled(SAFETY_SHEET_HEIGHT),
      paddingTop: modalScaled(8),
      width: "100%",
    },
    sheetHandleButton: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      justifyContent: "center",
      marginBottom: modalScaled(16),
      overflow: "visible",
      paddingBottom: modalScaled(12),
      paddingTop: 0,
      width: modalScaled(120),
    },
    sheetHandle: {
      backgroundColor: "#E5E5E5",
      borderRadius: modalScaled(2),
      height: modalScaled(4),
      width: modalScaled(72),
    },
    safetyIcon: {
      height: modalScaled(SAFETY_ICON_HEIGHT),
      width: modalScaled(SAFETY_ICON_WIDTH),
    },
    safetyTitle: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: modalScaled(28),
      lineHeight: modalScaled(36),
      marginTop: modalScaled(20),
    },
    safetyDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: modalScaled(20),
      lineHeight: modalScaled(28),
      marginTop: modalScaled(12),
      textAlign: "center",
    },
    safetyButtonRow: {
      flexDirection: "row",
      gap: modalScaled(12),
      marginTop: modalScaled(26),
    },
    safetyButton: {
      alignItems: "center",
      borderRadius: modalScaled(8),
      height: modalScaled(55),
      justifyContent: "center",
      width: modalScaled(180),
    },
    safetyCloseButton: {
      backgroundColor: "#F2F2F2",
    },
    safetyViewButton: {
      backgroundColor: "#FFC44D",
    },
    safetyCloseText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: modalScaled(20),
      lineHeight: modalScaled(26),
    },
    safetyViewText: {
      color: "#FFFFFF",
      fontFamily: "PretendardMedium",
      fontSize: modalScaled(20),
      lineHeight: modalScaled(26),
    },
    emptyBox: {
      alignItems: "center",
      marginTop: scaled(64, scale),
    },
    emptyText: {
      color: "#B1B1B1",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, fontScale),
      marginTop: scaled(12, scale),
    },
  });
};
