import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemoryReceipt() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#6C6C6C" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
            <Text style={{ fontSize: 20, fontWeight: "500", color: "#6C6C6C" }}>
              기억 영수증
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}