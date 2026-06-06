import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemoryReceipt() {
  const receiptHeight = useRef(new Animated.Value(0)).current;
  const receiptOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(receiptHeight, {
        toValue: 560,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(receiptOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [receiptHeight, receiptOpacity]);

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#5E5E5E",
    fontSize: 20,
    fontFamily: "PretendardSemiBold",
  },
  headerSpacer: {
    width: 28,
  },
  receiptArea: {
    marginTop: 16,
    alignItems: "center",
  },
  slot: {
    width: "100%",
    height: 50,
    resizeMode: "contain",
    zIndex: 10,
  },
  receiptPaper: {
    position: "absolute",
    top: 22,
    width: "84%",
    backgroundColor: "#FFFDF7",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  receiptContent: {
    padding: 24,
  },
  receiptTitle: {
    color: "#009B66",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "PretendardBold",
  },
  photoPlaceholder: {
    marginTop: 20,
    height: 124,
    borderRadius: 8,
    backgroundColor: "#E8F7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: {
    color: "#2ABD83",
    fontSize: 16,
    fontFamily: "PretendardBold",
  },
  sectionTitle: {
    marginTop: 18,
    color: "#009B66",
    fontSize: 16,
    fontFamily: "PretendardBold",
  },
  summary: {
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: "#EFEAE0",
    padding: 10,
    color: "#474747",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "PretendardSemiBold",
  },
  item: {
    marginTop: 10,
    color: "#666666",
    fontSize: 14,
    fontFamily: "PretendardSemiBold",
  },
  barcode: {
    marginTop: 24,
    color: "#777777",
    fontSize: 34,
    textAlign: "center",
    letterSpacing: 2,
  },
  date: {
    marginTop: 6,
    color: "#009B66",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "PretendardMedium",
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 76,
  },
  saveButton: {
    height: 56,
    borderRadius: 8,
    backgroundColor: "#363636",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
});
