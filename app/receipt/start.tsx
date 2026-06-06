import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReceiptStartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoBars}>|||</Text>
          </View>
          <Text style={styles.title}>기억 HANA</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push("/receipt/login")}>
          <Text style={styles.primaryButtonText}>시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FFFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 56,
    justifyContent: "space-between",
  },
  logoBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: "#2ABD83",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBars: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "PretendardBold",
  },
  title: {
    marginTop: 24,
    color: "#2ABD83",
    fontSize: 36,
    fontFamily: "PretendardBold",
  },
  primaryButton: {
    height: 56,
    borderRadius: 8,
    backgroundColor: "#29CB88",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
});
