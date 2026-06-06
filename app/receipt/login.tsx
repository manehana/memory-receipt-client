import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [id, setId] = useState("");
  const canLogin = id.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brandSub}>HANA</Text>
          <Text style={styles.brandTitle}>기억 명세서</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>아이디</Text>
          <TextInput
            autoCapitalize="none"
            placeholder="아이디를 입력하세요."
            style={styles.input}
            value={id}
            onChangeText={setId}
          />
        </View>

        <Pressable
          disabled={!canLogin}
          style={[styles.loginButton, !canLogin && styles.loginButtonDisabled]}
          onPress={() => router.push("/receipt/design-loading")}
        >
          <Text style={[styles.loginButtonText, !canLogin && styles.loginButtonTextDisabled]}>
            로그인
          </Text>
        </Pressable>
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
    paddingBottom: 88,
  },
  header: {
    marginTop: 92,
    alignItems: "center",
  },
  brandSub: {
    color: "#69DDAE",
    fontSize: 25,
    fontFamily: "PretendardMedium",
  },
  brandTitle: {
    marginTop: 2,
    color: "#2ABD83",
    fontSize: 29,
    fontFamily: "PretendardBold",
  },
  form: {
    marginTop: 64,
  },
  label: {
    marginBottom: 12,
    color: "#3A3A3A",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
  input: {
    height: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    color: "#333333",
    fontSize: 18,
    fontFamily: "PretendardMedium",
  },
  loginButton: {
    marginTop: "auto",
    height: 56,
    borderRadius: 8,
    backgroundColor: "#29CB88",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#DEDEDE",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
  loginButtonTextDisabled: {
    color: "#747474",
  },
});
