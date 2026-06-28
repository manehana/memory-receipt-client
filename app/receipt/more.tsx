import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { useCurrentUser } from "@/lib/user";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
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
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width],
  );
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
          <Pressable hitSlop={scaled(12, scale)} style={styles.headerButton}>
            <Ionicons
              color="#9F9F9F"
              name="chevron-forward"
              size={scaled(24, scale)}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, styles.profileCard]}>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/more/more-profile.png")}
              style={styles.profileImage}
            />
            <Text maxFontSizeMultiplier={1.1} style={styles.profileName}>
              {user?.username ?? ""}
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text maxFontSizeMultiplier={1.1} style={styles.statusText}>
                정상
              </Text>
            </View>
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
              <MenuRow key={item.label} item={item} styles={styles} />
            ))}
          </View>
        </View>
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
  onToggle,
  styles,
}: {
  isToggleOn?: boolean;
  item: MenuItem;
  onToggle?: () => void;
  styles: MoreStyles;
}) {
  return (
    <Pressable style={[styles.menuRow, { marginTop: styles.itemGapScale.height * item.gapTop }]}>
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
  const compactCardExtra = isCompactHeight ? fixed(30) : 0;
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
    content: {
      flex: 1,
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
    profileName: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(20, menuFontScale),
      marginLeft: fixed(13),
    },
    statusBadge: {
      alignItems: "center",
      backgroundColor: "#D5FAEB",
      borderRadius: fixed(45),
      flexDirection: "row",
      height: fixed(30),
      marginLeft: fixed(12),
      paddingHorizontal: fixed(11),
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
      height: fixed(211) + compactCardExtra,
      marginTop: sectionGap,
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    guardianCard: {
      height: fixed(194.7) + compactCardExtra,
      marginTop: sectionGap,
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    supportCard: {
      height: fixed(198) + (isCompactHeight ? fixed(22) : 0),
      marginTop: sectionGap,
      paddingHorizontal: fixed(15),
      paddingTop: fixed(16),
    },
    groupTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, menuFontScale),
      lineHeight: fontScaled(22, menuFontScale),
    },
    menuRow: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: fixed(25),
    },
    menuTextBox: {
      flex: 1,
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
