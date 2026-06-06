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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canLogin = id.trim().length > 0;

  const handleLogin = () => {
    if (!canLogin || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      router.push("/receipt/design-loading");
    }, 700);
  };

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
            editable={!isSubmitting}
            placeholder="아이디를 입력하세요."
            placeholderTextColor="#9F9F9F"
            style={styles.input}
            value={id}
            onChangeText={setId}
          />
        </View>

        <Pressable
          disabled={!canLogin || isSubmitting}
          style={[
            styles.loginButton,
            canLogin && styles.loginButtonActive,
          ]}
          onPress={handleLogin}
        >
          {isSubmitting ? (
            <View style={styles.loadingDots}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          ) : (
            <Text
              style={[
                styles.loginButtonText,
                canLogin && styles.loginButtonTextActive,
              ]}
            >
              로그인
            </Text>
          )}
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
  loginButtonActive: {
    backgroundColor: "#23CC89",
  },
  loginButtonText: {
    color: "#6C6C6C",
    fontSize: 20,
    fontFamily: "PretendardSemiBold",
  },
  loginButtonTextActive: {
    color: "#FFFFFF",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 10,
  },
  loadingDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#FFFFFF",
  },
});
