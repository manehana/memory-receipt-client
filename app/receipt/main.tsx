import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo } from "react";
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

export default function MainScreen() {
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
          <View>
            <Text maxFontSizeMultiplier={1.1} style={styles.greeting}>
              어서오세요.
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.userLine}>
              <Text style={styles.userName}>만에하나</Text>
              <Text style={styles.userSuffix}> 님</Text>
            </Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/main/main-notification.png")}
              style={styles.notificationIcon}
            />
          </Pressable>
        </View>

        <View style={styles.cardRow}>
          <Pressable
            onPress={() => router.replace("/receipt/conversation-onboarding")}
            style={styles.squareCard}
          >
            <Image
              resizeMode="stretch"
              source={require("../../assets/images/main/main-chat.png")}
              style={styles.squareCardImage}
            />
          </Pressable>

          <Pressable style={styles.squareCard}>
            <Image
              resizeMode="stretch"
              source={require("../../assets/images/main/main-memory-book.png")}
              style={styles.squareCardImage}
            />
          </Pressable>
        </View>

        <Pressable style={styles.reportCard}>
          <Image
            resizeMode="stretch"
            source={require("../../assets/images/main/main-cognitive-report.png")}
            style={styles.reportImage}
          />
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
              최근 기억 영수증
            </Text>
            <Pressable style={styles.makeButton}>
              <Text maxFontSizeMultiplier={1.1} style={styles.makeText}>
                만들기
              </Text>
              <Ionicons
                color="#A1A1A1"
                name="chevron-forward"
                size={scaled(24, scale)}
              />
            </Pressable>
          </View>

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
        </View>
      </View>
    </SafeAreaView>
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
  const layoutScale = Math.min(widthScale, heightScale);
  const horizontalPadding = scaled(23, scale);
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardGap = scaled(12, scale);
  const cardWidth = Math.floor((contentWidth - cardGap) / 2);
  const cardHeight = Math.round(cardWidth * (250 / 176));
  const reportHeight = Math.round(contentWidth * (90 / 370));

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingTop: Math.round(28 * layoutScale),
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
    notificationButton: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: scaled(23, scale),
      height: scaled(46, scale),
      justifyContent: "center",
      marginTop: scaled(2, scale),
      shadowColor: "#DADADA",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      width: scaled(46, scale),
    },
    notificationIcon: {
      height: scaled(34, scale),
      width: scaled(34, scale),
    },
    cardRow: {
      flexDirection: "row",
      gap: cardGap,
      marginTop: scaled(29, scale),
      paddingHorizontal: horizontalPadding,
    },
    squareCard: {
      height: cardHeight,
      width: cardWidth,
    },
    squareCardImage: {
      height: "100%",
      width: "100%",
    },
    reportCard: {
      alignSelf: "center",
      borderRadius: scaled(8, scale),
      height: reportHeight,
      marginTop: scaled(19, scale),
      overflow: "hidden",
      width: contentWidth,
    },
    reportImage: {
      height: "100%",
      width: "100%",
    },
    divider: {
      backgroundColor: "#E8E8E8",
      height: scaled(9, scale),
      marginTop: scaled(23, scale),
      width: "100%",
    },
    recentSection: {
      backgroundColor: "#F7F7F7",
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: scaled(29, scale),
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
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
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(16, fontScale),
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
