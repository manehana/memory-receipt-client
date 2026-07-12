import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { clearToken } from "@/lib/auth";
import { isPresentationMode, setPresentationMode } from "@/lib/presentation";
import { useCurrentUser } from "@/lib/user";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
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

const conversationItems = [
  { gapTop: 20, label: "최근 대화 기록" },
  { gapTop: 25, label: "대화 친구 설정 및 변경", sideText: "별봄이" },
  {
    gapTop: 21,
    label: "가족 음성 등록",
    description: "자녀나 보호자의 목소리를 등록할 수 있어요.",
  },
];

const guardianItems = [
  { gapTop: 19.4, label: "보호자 등록 및 수정" },
  {
    gapTop: 16.93,
    label: "마이데이터 연동 현황",
    description: "연결된 카드와 동의 내용을 확인할 수 있어요.",
  },
  { gapTop: 16, label: "보호자 공유 설정", toggle: true },
];

const supportItems = [
  { gapTop: 19.62, label: "알림 설정" },
  { gapTop: 25.38, label: "공지사항" },
  { gapTop: 25, label: "고객센터" },
];

export default function MoreScreen() {
  const [isGuardianSharingEnabled, setIsGuardianSharingEnabled] = useState(true);
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width],
  );

  // '고객센터' 10회 연속 터치(3초 무입력 시 리셋) → 발표(presentation) 모드 토글.
  const supportTapCount = useRef(0);
  const supportTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSupportPress = () => {
    if (supportTapTimer.current) {
      clearTimeout(supportTapTimer.current);
    }
    supportTapTimer.current = setTimeout(() => {
      supportTapCount.current = 0;
    }, 3000);
    supportTapCount.current += 1;
    if (supportTapCount.current < 10) {
      return;
    }
    supportTapCount.current = 0;
    const next = !isPresentationMode();
    void setPresentationMode(next).then(() => {
      // 실제/데모 응답이 캐시에 섞이지 않게 전부 비운다.
      queryClient.clear();
      Alert.alert(
        "발표 모드",
        next ? "발표 모드가 켜졌어요." : "발표 모드가 꺼졌어요.",
      );
    });
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          queryClient.clear();
          router.replace("/receipt/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            hitSlop={scaled(12, scale)}
            onPress={goBackToPreviousScreen}
            style={styles.headerButton}
          >
            <Ionicons color="#9F9F9F" name="chevron-back" size={scaled(24, scale)} />
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.headerTitle}>
            더보기
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
        >
          <View style={[styles.card, styles.profileCard]}>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/more/more-profile.png")}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.profileName}
              >
                {user?.username ?? ""}
              </Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text maxFontSizeMultiplier={1.1} style={styles.statusText}>
                  정상
                </Text>
              </View>
            </View>
            <Ionicons
              color="#9F9F9F"
              name="chevron-forward"
              size={scaled(24, scale)}
              style={styles.profileChevron}
            />
          </View>

          <View style={[styles.card, styles.conversationCard]}>
            <Text maxFontSizeMultiplier={1.1} style={styles.groupTitle}>
              대화 설정
            </Text>
            {conversationItems.map((item) => (
              <MenuRow key={item.label} item={item} styles={styles} />
            ))}
          </View>

          <View style={[styles.card, styles.guardianCard]}>
            <Text maxFontSizeMultiplier={1.1} style={styles.groupTitle}>
              보호자・안심 관리
            </Text>
            {guardianItems.map((item) => (
              <MenuRow
                isToggleOn={isGuardianSharingEnabled}
                key={item.label}
                onToggle={() => setIsGuardianSharingEnabled((value) => !value)}
                item={item}
                styles={styles}
              />
            ))}
          </View>

          <View style={[styles.card, styles.supportCard]}>
            <Text maxFontSizeMultiplier={1.1} style={styles.groupTitle}>
              알림・고객지원
            </Text>
            {supportItems.map((item) => (
              <MenuRow
                key={item.label}
                item={item}
                onPress={item.label === "고객센터" ? handleSupportPress : undefined}
                styles={styles}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text maxFontSizeMultiplier={1.1} style={styles.logoutText}>
              로그아웃
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type MenuItem = {
  description?: string;
  gapTop: number;
  label: string;
  sideText?: string;
  toggle?: boolean;
};

type MoreStyles = ReturnType<typeof createStyles>;

function MenuRow({
  isToggleOn,
  item,
  onPress,
  onToggle,
  styles,
}: {
  isToggleOn?: boolean;
  item: MenuItem;
  onPress?: () => void;
  onToggle?: () => void;
  styles: MoreStyles;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuRow,
        { marginTop: styles.itemGapScale.height * item.gapTop },
      ]}
    >
      <View style={styles.menuTextBox}>
        <Text maxFontSizeMultiplier={1.1} style={styles.menuText}>
          {item.label}
        </Text>
        {item.description ? (
          <Text maxFontSizeMultiplier={1.1} style={styles.menuDescription}>
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.sideText ? (
        <Text maxFontSizeMultiplier={1.1} style={styles.sideText}>
          {item.sideText}
        </Text>
      ) : null}
      {item.toggle ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: Boolean(isToggleOn) }}
          onPress={onToggle}
          style={[styles.toggle, isToggleOn ? styles.toggleOn : styles.toggleOff]}
        >
          <View style={styles.toggleThumb} />
        </Pressable>
      ) : (
        <Ionicons color="#9F9F9F" name="chevron-forward" size={styles.chevronSize.width} />
      )}
    </Pressable>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number,
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const isCompactHeight = screenHeight < 750;
  const availableHeightScale = Math.max((screenHeight - 86) / (BASE_HEIGHT - 86), 0.62);
  const layoutScale = Math.min(widthScale, availableHeightScale, 1.06);
  const menuFontScale = Math.min(fontScale, layoutScale);
  const horizontalPadding = Math.round(16 * Math.min(widthScale, 1.12));
  const contentWidth = screenWidth - horizontalPadding * 2;
  const fixed = (value: number) => Math.round(value * layoutScale);
  const vertical = (value: number) => Math.round(value * Math.min(heightScale, 1.04));
  const cardRadius = fixed(15);
  const sectionGap = isCompactHeight ? vertical(14) : vertical(12);

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: isCompactHeight ? vertical(10) : vertical(28),
    },
    contentScroll: {
      flex: 1,
    },
    content: {
      paddingBottom: vertical(28),
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      height: isCompactHeight ? vertical(28) : vertical(45),
      justifyContent: "space-between",
    },
    headerButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      width: fixed(34),
    },
    headerTitle: {
      color: "#6C6C6C",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, menuFontScale),
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: cardRadius,
      width: contentWidth,
    },
    profileCard: {
      alignItems: "center",
      flexDirection: "row",
      height: fixed(95) + (isCompactHeight ? fixed(18) : 0),
      marginTop: isCompactHeight ? vertical(6) : vertical(16),
      paddingHorizontal: fixed(16),
    },
    profileImage: {
      height: fixed(57),
      width: fixed(57),
    },
    profileInfo: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      marginLeft: fixed(13),
      minWidth: 0,
    },
    profileName: {
      color: "#353535",
      flexShrink: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, menuFontScale),
      minWidth: 0,
    },
    statusBadge: {
      alignItems: "center",
      backgroundColor: "#D5FAEB",
      borderRadius: fixed(45),
      flexShrink: 0,
      flexDirection: "row",
      height: fixed(30),
      marginLeft: fixed(12),
      paddingHorizontal: fixed(11),
    },
    profileChevron: {
      marginLeft: fixed(10),
    },
    statusDot: {
      backgroundColor: "#0ABD76",
      borderRadius: fixed(5),
      height: fixed(9),
      marginRight: fixed(5),
      width: fixed(9),
    },
    statusText: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, menuFontScale),
    },
    conversationCard: {
      marginTop: sectionGap,
      minHeight: fixed(211),
      paddingBottom: fixed(18),
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    guardianCard: {
      marginTop: sectionGap,
      minHeight: fixed(195),
      paddingBottom: fixed(18),
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    supportCard: {
      marginTop: sectionGap,
      minHeight: fixed(198),
      paddingBottom: fixed(18),
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    logoutButton: {
      alignItems: "center",
      alignSelf: "center",
      justifyContent: "center",
      marginTop: sectionGap,
      paddingVertical: fixed(10),
    },
    logoutText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(16, menuFontScale),
      textDecorationLine: "underline",
    },
    groupTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, menuFontScale),
      lineHeight: fontScaled(22, menuFontScale),
    },
    menuRow: {
      alignItems: "center",
      columnGap: fixed(8),
      flexDirection: "row",
      minHeight: fixed(25),
    },
    menuTextBox: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },
    menuText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(20, menuFontScale),
      lineHeight: fontScaled(27, menuFontScale),
    },
    menuDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: fontScaled(16, menuFontScale),
      lineHeight: fontScaled(21, menuFontScale),
      marginTop: fixed(3),
    },
    sideText: {
      color: "#13BB78",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(18, menuFontScale),
      marginRight: fixed(5),
    },
    chevronSize: {
      height: scaled(20, scale),
      width: scaled(20, scale),
    },
    itemGapScale: {
      height: fixed(1),
    },
    toggle: {
      alignItems: "center",
      backgroundColor: "#54E5AC",
      borderRadius: fixed(12),
      flexDirection: "row",
      height: Math.max(fixed(21.49), 16),
      paddingHorizontal: fixed(3),
      width: Math.max(fixed(45.6), 34),
    },
    toggleOn: {
      backgroundColor: "#54E5AC",
      justifyContent: "flex-end",
    },
    toggleOff: {
      backgroundColor: "#D8D8D8",
      justifyContent: "flex-start",
    },
    toggleThumb: {
      backgroundColor: "#FFFFFF",
      borderRadius: Math.max(fixed(8), 6),
      height: Math.max(fixed(16), 12),
      width: Math.max(fixed(16), 12),
    },
  });
};
