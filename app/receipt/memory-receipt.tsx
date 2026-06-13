import {
  fontScaled,
  getButtonWidth,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
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

export default function MemoryReceipt() {
  const receiptHeight = useRef(new Animated.Value(0)).current;
  const receiptOpacity = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width),
    [fontScale, scale, width],
  );
  const receiptMaxHeight = Math.max(
    460,
    Math.min(560, height - scaled(220, scale)),
  );

  useEffect(() => {
    receiptHeight.setValue(0);
    receiptOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(receiptHeight, {
        toValue: receiptMaxHeight,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(receiptOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [receiptHeight, receiptMaxHeight, receiptOpacity]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#9F9F9F" />
          </Pressable>

          <Text style={styles.headerTitle}>기억 영수증</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.receiptArea}>
          <Image
            source={require("../../assets/images/memory-receipt/receipt-slot.png")}
            style={styles.slot}
          />

          <Animated.View style={[styles.receiptPaper, { height: receiptHeight }]}>
            <Animated.View style={[styles.receiptContent, { opacity: receiptOpacity }]}>
              <Text style={styles.receiptTitle}>기억 영수증</Text>

              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoText}>오늘의 사진</Text>
              </View>

              <Text style={styles.sectionTitle}>오늘의 한줄</Text>
              <Text style={styles.summary}>
                친구들과 투썸플레이스에서 음료를 마시며 수다를 떠는 시간을 가졌어요.
              </Text>

              <Text style={styles.sectionTitle}>오늘의 발자취</Text>
              <Text style={styles.item}>01 투썸플레이스 종로점  4,800원</Text>
              <Text style={styles.item}>02 하나로마트 종로점  34,000원</Text>
              <Text style={styles.item}>03 Hana 택시 귀가  7,000원</Text>

              <Text style={styles.barcode}>||||||||||||||||||||</Text>
              <Text style={styles.date}>2026.05.25(월) 18:34</Text>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={() => router.replace("/receipt/start")}>
            <Text style={styles.saveButtonText}>저장하기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (scale: number, fontScale: number, screenWidth: number) => {
  const receiptWidth = Math.round(Math.min(screenWidth * 0.64, 272));
  const slotWidth = Math.round(Math.min(receiptWidth + scaled(44, scale), 324));
  const buttonWidth = getButtonWidth(screenWidth);

  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  container: {
    flex: 1,
    paddingHorizontal: scaled(24, scale),
    paddingTop: scaled(12, scale),
  },
  header: {
    height: scaled(58, scale),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#5E5E5E",
    fontSize: fontScaled(20, fontScale),
    fontFamily: "PretendardSemiBold",
  },
  headerSpacer: {
    width: scaled(28, scale),
  },
  receiptArea: {
    marginTop: scaled(12, scale),
    alignItems: "center",
  },
  slot: {
    width: slotWidth,
    height: scaled(50, scale),
    resizeMode: "contain",
    zIndex: 10,
  },
  receiptPaper: {
    position: "absolute",
    top: scaled(22, scale),
    width: receiptWidth,
    backgroundColor: "#FFFDF7",
    borderBottomLeftRadius: scaled(12, scale),
    borderBottomRightRadius: scaled(12, scale),
    zIndex: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  receiptContent: {
    padding: scaled(20, scale),
  },
  receiptTitle: {
    color: "#009B66",
    fontSize: fontScaled(18, fontScale),
    textAlign: "center",
    fontFamily: "PretendardBold",
  },
  photoPlaceholder: {
    marginTop: scaled(16, scale),
    height: scaled(104, scale),
    borderRadius: scaled(8, scale),
    backgroundColor: "#E8F7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: {
    color: "#2ABD83",
    fontSize: fontScaled(16, fontScale),
    fontFamily: "PretendardBold",
  },
  sectionTitle: {
    marginTop: scaled(14, scale),
    color: "#009B66",
    fontSize: fontScaled(16, fontScale),
    fontFamily: "PretendardBold",
  },
  summary: {
    marginTop: scaled(8, scale),
    borderRadius: scaled(6, scale),
    backgroundColor: "#EFEAE0",
    padding: scaled(10, scale),
    color: "#474747",
    fontSize: fontScaled(14, fontScale),
    lineHeight: fontScaled(21, fontScale),
    fontFamily: "PretendardSemiBold",
  },
  item: {
    marginTop: scaled(8, scale),
    color: "#666666",
    fontSize: fontScaled(14, fontScale),
    fontFamily: "PretendardSemiBold",
  },
  barcode: {
    marginTop: scaled(16, scale),
    color: "#777777",
    fontSize: fontScaled(34, fontScale),
    textAlign: "center",
    letterSpacing: 1,
  },
  date: {
    marginTop: scaled(6, scale),
    color: "#009B66",
    fontSize: fontScaled(14, fontScale),
    textAlign: "center",
    fontFamily: "PretendardMedium",
  },
  footer: {
    marginTop: "auto",
    paddingBottom: scaled(44, scale),
  },
  saveButton: {
    alignSelf: "center",
    height: scaled(56, scale),
    borderRadius: scaled(8, scale),
    backgroundColor: "#363636",
    alignItems: "center",
    justifyContent: "center",
    width: buttonWidth,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: fontScaled(18, fontScale),
    fontFamily: "PretendardBold",
  },
  });
};
