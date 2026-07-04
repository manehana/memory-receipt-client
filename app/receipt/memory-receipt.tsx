import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { useImageAuthHeaders } from "@/hooks/use-image-auth-headers";
import { apiGet, sessionImageUrl } from "@/lib/api";
import { USE_DEMO_MOCK_DATA } from "@/lib/mock-data";
import type { PaymentResponse, RecallSessionResponse } from "@/lib/types";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams } from "expo-router";
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

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const SLOT_BASE_WIDTH = 370;
const SLOT_BASE_HEIGHT = 44.25;
const RECEIPT_BASE_WIDTH = 331;
const PHOTO_BASE_WIDTH = 296;
const PHOTO_BASE_HEIGHT = 154;
const BARCODE_BASE_WIDTH = 210;
const BARCODE_BASE_HEIGHT = 44;
const TEAR_BASE_HEIGHT = 32;

type Footprint = {
  id: string;
  amount: string;
  place: string;
  time: string;
};

function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

// "2026-06-13T12:30:00+09:00" → "오전 11:43" 형태
function formatPaidTime(paidAt: string): string {
  const date = new Date(paidAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const meridiem = hours < 12 ? "오전" : "오후";
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  return `${meridiem} ${hours}:${minutes}`;
}

// "2026-05-25" → "2026.05.25"
function formatSessionDate(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.replaceAll("-", ".");
}

function paymentToFootprint(payment: PaymentResponse, index: number): Footprint {
  return {
    id: String(index + 1).padStart(2, "0"),
    amount: formatKRW(payment.amount),
    place: payment.merchant,
    time: formatPaidTime(payment.paid_at),
  };
}

const shareGuardians = [
  {
    id: "son",
    avatar: require("../../assets/images/memory-receipt/share_friend_son.png"),
    name: "아들",
  },
  {
    id: "daughter",
    avatar: require("../../assets/images/memory-receipt/share_friend_daughter.png"),
    name: "딸",
  },
];

export default function MemoryReceipt() {
  const { width, height } = useWindowDimensions();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const id = sessionId ? Number(sessionId) : null;
  // 로딩 화면에서 같은 키로 캐시된 세션을 그대로 사용한다.
  const { data: session } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiGet<RecallSessionResponse>(`/recall/sessions/${id}`),
    enabled: id != null,
  });
  const footprints = useMemo(
    () => (session?.payments ?? []).map(paymentToFootprint),
    [session?.payments],
  );
  const dayTitle = session?.title ?? "";
  const summary = session?.summary ?? "";
  const friendName = session?.voice_name ?? "";
  const dateText = formatSessionDate(session?.session_date);

  const authHeaders = useImageAuthHeaders();

  const [isReceiptRevealed, setIsReceiptRevealed] = useState(false);
  const receiptReveal = useRef(new Animated.Value(0)).current;
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const shareSheetProgress = useRef(new Animated.Value(1)).current;
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [toast, setToast] = useState<{
    type: "save" | "send";
    message: string;
  } | null>(null);
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
  const shareBarHeight = getShareBarHeight(height, insets.bottom);
  const receiptMaxRevealHeight = Math.max(height * 2, scaled(1200, scale));
  useEffect(() => {
    receiptReveal.setValue(0);
    setIsReceiptRevealed(false);

    const timer = setTimeout(() => {
      Animated.timing(receiptReveal, {
        duration: 950,
        toValue: 1,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setIsReceiptRevealed(true);
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [receiptReveal]);

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

  const showToast = (type: "save" | "send", message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });
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

  const renderToast = () => {
    if (!toast) {
      return null;
    }

    const isSave = toast.type === "save";

    return (
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
          source={
            isSave
              ? require("../../assets/images/memory-receipt/memory-receipt-save-success.png")
              : require("../../assets/images/memory-receipt/memory-receipt-share-send.png")
          }
          style={isSave ? styles.toastSaveIcon : styles.toastSendIcon}
        />
        <Text
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={isSave ? styles.toastSaveText : styles.toastSendText}
        >
          {toast.message}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로가기"
            hitSlop={scaled(12, scale)}
            onPress={goBackToPreviousScreen}
            style={styles.headerButton}
          >
            <Ionicons color="#5D5D5D" name="chevron-back" size={scaled(24, scale)} />
          </Pressable>

          <Pressable
            accessibilityLabel="저장"
            hitSlop={scaled(12, scale)}
            onPress={() => setIsSaveModalVisible(true)}
          >
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

                    {session?.image_url && id != null && !USE_DEMO_MOCK_DATA ? (
                      <ExpoImage
                        contentFit="cover"
                        source={{
                          uri: sessionImageUrl(id),
                          headers: authHeaders,
                        }}
                        style={styles.heroImage}
                      />
                    ) : session?.image_url && USE_DEMO_MOCK_DATA ? (
                      <Image
                        resizeMode="cover"
                        source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
                        style={styles.heroImage}
                      />
                    ) : (
                      <Image
                        resizeMode="cover"
                        source={require("../../assets/images/memory-notebook/weekly-memory-receipt-thumbnail.png")}
                        style={styles.heroImage}
                      />
                    )}

                    {dayTitle ? (
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.dayTitle}
                      >
                        {dayTitle}
                      </Text>
                    ) : null}

                    <SectionTitle label="오늘의 한줄" styles={styles} />
                    <View style={styles.summaryBox}>
                      <Text maxFontSizeMultiplier={1.1} style={styles.summaryText}>
                        {summary}
                      </Text>
                    </View>

                    {footprints.length > 0 ? (
                      <>
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
                            <Text maxFontSizeMultiplier={1.1} style={styles.timeText}>
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
                      </>
                    ) : null}

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
                        {friendName}
                      </Text>
                    </View>

                    <View style={styles.barcodeTopLine} />
                    <Image
                      resizeMode="contain"
                      source={require("../../assets/images/memory-receipt/memory-receipt-barcode.png")}
                      style={styles.barcode}
                    />
                    <Text maxFontSizeMultiplier={1.1} style={styles.dateText}>
                      {dateText}
                    </Text>
                  </View>
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
            onPress={openShareSheet}
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
                        showToast("send", `${guardian.name}에게 전송했어요`)
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

          {toast?.type === "send" ? (
            <View
              pointerEvents="none"
              style={[
                styles.toastWrapper,
                { bottom: shareSheetMeasuredHeight + scaled(12, scale) },
              ]}
            >
              {renderToast()}
            </View>
          ) : null}
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsSaveModalVisible(false)}
        transparent
        visible={isSaveModalVisible}
      >
        <View style={styles.saveModalOverlay}>
          <View style={styles.saveModalCard}>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/memory-receipt/memory-receipt-save-alert.png")}
              style={styles.saveModalIcon}
            />
            <Text maxFontSizeMultiplier={1.1} style={styles.saveModalTitle}>
              기억 영수증을 저장할까요?
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.saveModalDescription}>
              저장하면 나중에 기억 수첩에서{"\n"}
              다시 볼 수 있어요.
            </Text>
            <View style={styles.saveModalButtonRow}>
              <Pressable
                onPress={() => setIsSaveModalVisible(false)}
                style={[styles.saveModalButton, styles.saveModalCancelButton]}
              >
                <Text maxFontSizeMultiplier={1.1} style={styles.saveModalCancelText}>
                  취소
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsSaveModalVisible(false);
                  showToast("save", "기억영수증이 저장됐어요");
                }}
                style={[styles.saveModalButton, styles.saveModalConfirmButton]}
              >
                <Text maxFontSizeMultiplier={1.1} style={styles.saveModalConfirmText}>
                  저장하기
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toast?.type === "save" ? (
        <View
          pointerEvents="none"
          style={[
            styles.toastWrapper,
            { bottom: shareBarHeight + scaled(12, scale) },
          ]}
        >
          {renderToast()}
        </View>
      ) : null}
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

const getShareBarHeight = (screenHeight: number, bottomInset: number) => {
  const heightScale = screenHeight / BASE_HEIGHT;
  const vertical = (value: number) => Math.round(value * Math.min(heightScale, 1.04));
  return vertical(157) + bottomInset;
};

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
  const modalWidth = Math.min(350, screenWidth - 48);
  const modalScale = Math.min(modalWidth / 350, 1);
  const modalFixed = (value: number) => Math.round(value * modalScale);
  const modalFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, modalScale));
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
  const tearHeight = Math.round(receiptWidth * (TEAR_BASE_HEIGHT / RECEIPT_BASE_WIDTH));
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
    dayTitle: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: receiptFont(18),
      lineHeight: receiptFont(26),
      marginTop: receiptFixed(16),
      textAlign: "center",
      width: "100%",
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
      flexDirection: "row",
      height: vertical(48),
      justifyContent: "space-between",
      paddingLeft: fixed(24),
      paddingRight: fixed(24),
    },
    headerButton: {
      alignItems: "center",
      height: fixed(24),
      justifyContent: "center",
      width: fixed(24),
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
      paddingBottom: receiptFixed(24),
      paddingHorizontal: receiptFixed(18),
      paddingTop: receiptFixed(24),
      zIndex: 2,
    },
    receiptPaper: {
      backgroundColor: "#F7F5EF",
      borderTopLeftRadius: receiptFixed(18),
      borderTopRightRadius: receiptFixed(18),
      boxShadow: "inset 0px 8px 6px rgba(144, 144, 144, 0.20)",
      overflow: "hidden",
      width: receiptWidth,
    },
    receiptReveal: {
      marginTop: -receiptFixed(45),
      overflow: "hidden",
      paddingBottom: receiptFixed(20),
      paddingHorizontal: receiptFixed(20),
      paddingTop: receiptFixed(20),
      width: receiptWidth + receiptFixed(40),
      zIndex: 4,
    },
    receiptRevealVisible: {
      overflow: "visible",
    },
    receiptSlot: {
      height: slotHeight,
      position: "relative",
      width: slotWidth,
      zIndex: 1,
    },
    receiptStage: {
      alignItems: "center",
      marginTop: vertical(8),
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
    receiptWrap: {
      alignItems: "center",
      filter: [{ dropShadow: "0px -3px 20px rgba(0, 0, 0, 0.10)" }],
      overflow: "visible",
      width: receiptWidth,
      zIndex: 3,
    },
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    saveModalButton: {
      alignItems: "center",
      borderRadius: modalFixed(8),
      flex: 1,
      height: modalFixed(55),
      justifyContent: "center",
    },
    saveModalButtonRow: {
      flexDirection: "row",
      gap: modalFixed(10),
      marginTop: modalFixed(30),
      width: "100%",
    },
    saveModalCancelButton: {
      backgroundColor: "#F2F2F2",
    },
    saveModalCancelText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: modalFont(20),
      textAlign: "center",
    },
    saveModalCard: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: modalFixed(15),
      paddingBottom: modalFixed(15),
      paddingHorizontal: modalFixed(15),
      paddingTop: modalFixed(25),
      width: modalWidth,
    },
    saveModalConfirmButton: {
      backgroundColor: "#23CC89",
    },
    saveModalConfirmText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: modalFont(20),
      textAlign: "center",
    },
    saveModalDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: modalFont(20),
      lineHeight: Math.round(modalFont(20) * 1.35),
      marginTop: modalFixed(16),
      textAlign: "center",
      width: "100%",
    },
    saveModalIcon: {
      height: modalFixed(55),
      width: modalFixed(55),
    },
    saveModalOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    saveModalTitle: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: modalFont(28),
      lineHeight: modalFont(36),
      marginTop: modalFixed(20),
      textAlign: "center",
      width: "100%",
    },
    saveText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(28),
    },
    screen: {
      backgroundColor: "#FFFFFF",
      flex: 1,
      overflow: "visible",
      paddingTop: vertical(30),
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
    toastSaveIcon: {
      height: fixed(23.74),
      width: fixed(23.74),
    },
    toastSaveText: {
      color: "#FFFFFF",
      flexShrink: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      marginLeft: fixed(10.13),
    },
    toastSendIcon: {
      height: fixed(23.79),
      width: fixed(24.31),
    },
    toastSendText: {
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
