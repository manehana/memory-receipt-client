import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemoryReceipt() {
  const receiptHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(receiptHeight, {
      toValue: 500,
      duration: 1800,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* 헤더 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#6C6C6C" />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              marginRight: 28,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "500",
                color: "#6C6C6C",
              }}
            >
              기억 영수증
            </Text>
          </View>
        </View>

        {/* 슬롯 + 영수증 */}
        <View
          style={{
            marginTop: 45,
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* 슬롯 */}
          <Image
            source={require("../../assets/images/memory-receipt/receipt-slot.png")}
            style={{
              width: 350,
              height: 50,
              resizeMode: "contain",
              zIndex: 10,
            }}
          />

          {/* 영수증 */}
          <Animated.View
            style={{
              position: "absolute",
              top: 22, // 슬롯 안쪽 위치
              width: 310,
              height: receiptHeight,
              backgroundColor: "#F8F7F3",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              zIndex: 20, // 슬롯보다 위
            }}
          />
        </View>

        <View style={{ flex: 1 }} />

        {/* 저장 버튼 */}
        <TouchableOpacity
          style={{
            width: "100%",
            maxWidth: 370,
            height: 55,
            backgroundColor: "#363636",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            marginBottom: 80,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            저장하기
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}