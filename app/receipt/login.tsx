import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [id, setId] = useState("");
  const canLogin = id.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/login/login-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.form}>
          <Text style={styles.label}>아이디</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="아이디를 입력하세요."
            placeholderTextColor="#9F9F9F"
            style={styles.input}
            value={id}
            onChangeText={setId}
          />
        </View>

        <Pressable
          disabled={!canLogin}
          style={styles.loginButton}
          onPress={() => router.push("/receipt/design-loading")}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
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
    paddingHorizontal: 23,
    paddingBottom: 84,
  },
  logo: {
    width: 139,
    height: 121,
    marginTop: 76,
    alignSelf: "center",
  },
  form: {
    marginTop: 28,
  },
  label: {
    marginBottom: 14,
    color: "#3D3D3A",
    fontSize: 20,
    fontFamily: "PretendardSemiBold",
  },
  input: {
    height: 55,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DADADA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    color: "#3D3D3A",
    fontSize: 20,
    fontFamily: "PretendardMedium",
  },
  loginButton: {
    width: "100%",
    maxWidth: 370,
    height: 55,
    marginTop: "auto",
    alignSelf: "center",
    borderRadius: 8,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#6C6C6C",
    fontSize: 20,
    fontFamily: "PretendardSemiBold",
  },
});
