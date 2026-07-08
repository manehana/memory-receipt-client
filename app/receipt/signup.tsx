import {
  fontScaled,
  getButtonWidth,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { ApiError, apiPost } from "@/lib/api";
import { setToken } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnUI,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const GENDER_OPTIONS = [
  { label: "여성", value: "female" },
  { label: "남성", value: "male" },
] as const;
const SIGNUP_SCROLL_DURATION = 520;
const SIGNUP_SCROLL_BOTTOM_SPACE = 180;
const SIGNUP_TITLE_FONT_SIZE = 26;

type Gender = (typeof GENDER_OPTIONS)[number]["value"] | "";

type SignUpForm = {
  name: string;
  gender: Gender;
  age: string;
  id: string;
  password: string;
  passwordConfirm: string;
};

type SignUpField =
  | "name"
  | "gender"
  | "age"
  | "id"
  | "password"
  | "passwordConfirm";

type SignUpTouched = Partial<Record<SignUpField, boolean>>;

async function registerAndLogin(form: SignUpForm): Promise<LoginResponse> {
  const body = {
    username: form.id.trim(),
    password: form.password,
    name: form.name.trim(),
    age: Number(form.age.trim()),
    gender: form.gender,
  };

  await apiPost("/auth/register", body);
  return apiPost<LoginResponse>("/auth/login", body);
}

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [age, setAge] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [focusedField, setFocusedField] = useState<SignUpField | null>(null);
  const [touchedFields, setTouchedFields] = useState<SignUpTouched>({});
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const fieldLayoutY = useRef<Partial<Record<SignUpField, number>>>({});
  const formLayoutY = useRef(0);
  const scrollY = useSharedValue(0);
  const animatedScrollY = useSharedValue(0);
  const ageInputRef = useRef<TextInput>(null);
  const idInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordConfirmInputRef = useRef<TextInput>(null);
  const dotAnimations = useRef([
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
    new RNAnimated.Value(0),
  ]).current;
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width),
    [fontScale, scale, width]
  );
  const trimmedName = name.trim();
  const trimmedAge = age.trim();
  const trimmedId = id.trim();
  const ageNumber = Number(trimmedAge);
  const isAgeValid =
    /^\d+$/.test(trimmedAge) && ageNumber >= 0 && ageNumber <= 120;
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= 30;
  const isIdValid = trimmedId.length >= 3 && trimmedId.length <= 20;
  const isPasswordValid = password.length >= 8 && password.length <= 20;
  const isPasswordConfirmValid =
    passwordConfirm.length > 0 && password === passwordConfirm;
  const canSignUp =
    isNameValid &&
    gender.length > 0 &&
    isAgeValid &&
    isIdValid &&
    isPasswordValid &&
    isPasswordConfirmValid;
  const fieldErrors: Partial<Record<SignUpField, string>> = {
    name:
      trimmedName.length === 0
        ? "이름을 입력해주세요"
        : trimmedName.length > 30
        ? "이름은 30자 이내로 입력해주세요"
        : undefined,
    gender: gender.length === 0 ? "성별을 선택해주세요" : undefined,
    age:
      trimmedAge.length === 0
        ? "나이를 입력해주세요."
        : !isAgeValid
        ? "나이는 0부터 120까지 숫자로 입력해주세요"
        : undefined,
    id:
      trimmedId.length === 0
        ? "아이디를 입력해주세요"
        : !isIdValid
        ? "아이디는 3자 이상 20자 이하로 입력해주세요"
        : undefined,
    password:
      password.length === 0
        ? "비밀번호를 입력해주세요"
        : !isPasswordValid
        ? "비밀번호는 8자 이상 20자 이하로 입력해주세요"
        : undefined,
    passwordConfirm:
      passwordConfirm.length === 0
        ? "비밀번호 확인을 입력해주세요"
        : !isPasswordConfirmValid
        ? "비밀번호가 서로 달라요"
        : undefined,
  };

  const signUpMutation = useMutation({
    mutationFn: () =>
      registerAndLogin({
        name,
        gender,
        age,
        id,
        password,
        passwordConfirm,
      }),
    onSuccess: async (data) => {
      await setToken(data.access_token);
      router.replace("/receipt/terms-agreement");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        Alert.alert("회원가입 실패", "이미 사용 중인 아이디예요.");
        return;
      }

      Alert.alert("회원가입 실패", "잠시 후 다시 시도해주세요.");
    },
  });
  const isSubmitting = signUpMutation.isPending;

  useEffect(() => {
    if (!isSubmitting) {
      dotAnimations.forEach((animation) => animation.setValue(0));
      return;
    }

    const makeWave = (animation: RNAnimated.Value) =>
      RNAnimated.sequence([
        RNAnimated.timing(animation, {
          toValue: -7,
          duration: 240,
          useNativeDriver: true,
        }),
        RNAnimated.timing(animation, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]);

    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.stagger(150, dotAnimations.map(makeWave)),
        RNAnimated.delay(120),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [dotAnimations, isSubmitting]);

  const handleFieldLayout =
    (field: SignUpField) => (event: LayoutChangeEvent) => {
      fieldLayoutY.current[field] = event.nativeEvent.layout.y;
    };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => animatedScrollY.value,
    (value) => {
      scrollTo(scrollViewRef, 0, value, false);
    }
  );

  const scrollToField = (field: SignUpField) => {
    const fieldY = fieldLayoutY.current[field];

    if (fieldY === undefined) {
      return;
    }

    const targetY = Math.max(
      formLayoutY.current + fieldY - scaled(64, scale),
      0
    );

    runOnUI((target: number) => {
      "worklet";
      animatedScrollY.value = scrollY.value;
      animatedScrollY.value = withTiming(target, {
        duration: SIGNUP_SCROLL_DURATION,
        easing: Easing.inOut(Easing.cubic),
      });
    })(targetY);
  };

  const handleFocus = (field: SignUpField) => {
    setFocusedField(field);
    scrollToField(field);
  };

  const handleBlur = (field: SignUpField) => {
    setTouchedFields((currentFields) => ({
      ...currentFields,
      [field]: true,
    }));
    setFocusedField((currentField) =>
      currentField === field ? null : currentField
    );
  };

  const placeholderFor = (field: SignUpField, placeholder: string) =>
    focusedField === field ? "" : placeholder;

  const shouldShowFieldError = (field: SignUpField) =>
    Boolean(fieldErrors[field] && touchedFields[field]);

  const renderFieldError = (field: SignUpField) =>
    shouldShowFieldError(field) ? (
      <Text maxFontSizeMultiplier={1.1} style={styles.fieldErrorText}>
        {fieldErrors[field]}
      </Text>
    ) : null;

  const handleSignUp = () => {
    if (isSubmitting) {
      return;
    }

    if (!canSignUp) {
      if (password !== passwordConfirm) {
        Alert.alert("회원가입 실패", "비밀번호가 서로 달라요.");
        return;
      }

      if (!isNameValid && trimmedName.length > 30) {
        Alert.alert("회원가입 실패", "이름은 30자 이내로 입력해주세요");
        return;
      }

      if (!isAgeValid && trimmedAge.length > 0) {
        Alert.alert(
          "회원가입 실패",
          "나이는 0부터 120까지 숫자로 입력해주세요"
        );
        return;
      }

      if (!isIdValid && trimmedId.length > 0) {
        Alert.alert(
          "회원가입 실패",
          "아이디는 3자 이상 20자 이하로 입력해주세요"
        );
        return;
      }

      if (!isPasswordValid && password.length > 0) {
        Alert.alert(
          "회원가입 실패",
          "비밀번호는 8자 이상 20자 이하로 입력해주세요"
        );
        return;
      }

      Alert.alert("회원가입 실패", "모든 항목을 입력해주세요.");
      return;
    }

    signUpMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          disabled={isSubmitting}
          hitSlop={12}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            color="#5D5D5D"
            name="chevron-back"
            size={scaled(28, scale)}
          />
        </Pressable>

        <Animated.ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.titleBox}>
            <Text maxFontSizeMultiplier={1.1} style={styles.title}>
              회원가입
            </Text>
          </View>

          <View
            style={styles.form}
            onLayout={(event) => {
              formLayoutY.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.field} onLayout={handleFieldLayout("name")}>
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                이름
              </Text>
              <TextInput
                blurOnSubmit={false}
                editable={!isSubmitting}
                maxLength={30}
                maxFontSizeMultiplier={1.1}
                placeholder={placeholderFor("name", "이름을 입력하세요.")}
                placeholderTextColor="#9F9F9F"
                returnKeyType="next"
                style={[
                  styles.input,
                  focusedField === "name" && styles.inputFocused,
                ]}
                value={name}
                onBlur={() => handleBlur("name")}
                onChangeText={setName}
                onFocus={() => handleFocus("name")}
                onSubmitEditing={() => ageInputRef.current?.focus()}
              />
              {renderFieldError("name")}
            </View>

            <View style={styles.field} onLayout={handleFieldLayout("gender")}>
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                성별
              </Text>
              <View style={styles.genderOptions}>
                {GENDER_OPTIONS.map((option) => {
                  const selected = gender === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      disabled={isSubmitting}
                      style={[
                        styles.genderOption,
                        selected && styles.genderOptionActive,
                      ]}
                      onPress={() => {
                        setGender(option.value);
                        setFocusedField("gender");
                        setTouchedFields((currentFields) => ({
                          ...currentFields,
                          gender: true,
                        }));
                        scrollToField("gender");
                      }}
                    >
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={[
                          styles.genderOptionText,
                          selected && styles.genderOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {renderFieldError("gender")}
            </View>

            <View style={styles.field} onLayout={handleFieldLayout("age")}>
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                나이
              </Text>
              <TextInput
                ref={ageInputRef}
                blurOnSubmit={false}
                editable={!isSubmitting}
                keyboardType="number-pad"
                maxLength={3}
                maxFontSizeMultiplier={1.1}
                placeholder={placeholderFor("age", "나이를 입력하세요.")}
                placeholderTextColor="#9F9F9F"
                returnKeyType="next"
                style={[
                  styles.input,
                  focusedField === "age" && styles.inputFocused,
                ]}
                value={age}
                onBlur={() => handleBlur("age")}
                onChangeText={setAge}
                onFocus={() => handleFocus("age")}
                onSubmitEditing={() => idInputRef.current?.focus()}
              />
              {renderFieldError("age")}
            </View>

            <View style={styles.field} onLayout={handleFieldLayout("id")}>
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                아이디
              </Text>
              <TextInput
                ref={idInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                editable={!isSubmitting}
                maxLength={20}
                maxFontSizeMultiplier={1.1}
                placeholder={placeholderFor("id", "아이디를 입력하세요.")}
                placeholderTextColor="#9F9F9F"
                returnKeyType="next"
                style={[
                  styles.input,
                  focusedField === "id" && styles.inputFocused,
                ]}
                value={id}
                onBlur={() => handleBlur("id")}
                onChangeText={setId}
                onFocus={() => handleFocus("id")}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              {renderFieldError("id")}
            </View>

            <View style={styles.field} onLayout={handleFieldLayout("password")}>
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                비밀번호
              </Text>
              <TextInput
                ref={passwordInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                editable={!isSubmitting}
                maxLength={20}
                maxFontSizeMultiplier={1.1}
                placeholder={placeholderFor(
                  "password",
                  "비밀번호를 입력하세요."
                )}
                placeholderTextColor="#9F9F9F"
                returnKeyType="next"
                secureTextEntry
                style={[
                  styles.input,
                  focusedField === "password" && styles.inputFocused,
                ]}
                value={password}
                onBlur={() => handleBlur("password")}
                onChangeText={setPassword}
                onFocus={() => handleFocus("password")}
                onSubmitEditing={() => passwordConfirmInputRef.current?.focus()}
              />
              {renderFieldError("password")}
            </View>

            <View
              style={styles.field}
              onLayout={handleFieldLayout("passwordConfirm")}
            >
              <Text maxFontSizeMultiplier={1.1} style={styles.label}>
                비밀번호 확인
              </Text>
              <TextInput
                ref={passwordConfirmInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                maxLength={20}
                maxFontSizeMultiplier={1.1}
                placeholder={placeholderFor(
                  "passwordConfirm",
                  "비밀번호를 다시 입력하세요."
                )}
                placeholderTextColor="#9F9F9F"
                returnKeyType="done"
                secureTextEntry
                style={[
                  styles.input,
                  focusedField === "passwordConfirm" && styles.inputFocused,
                ]}
                value={passwordConfirm}
                onBlur={() => handleBlur("passwordConfirm")}
                onChangeText={setPasswordConfirm}
                onFocus={() => handleFocus("passwordConfirm")}
                onSubmitEditing={handleSignUp}
              />
              {renderFieldError("passwordConfirm")}
            </View>
          </View>
        </Animated.ScrollView>

        <View style={styles.bottomActions}>
          <LinearGradient
            colors={["rgba(247, 247, 247, 0)", "#F7F7F7"]}
            pointerEvents="none"
            style={styles.bottomActionsFade}
          />

          <Pressable
            disabled={!canSignUp || isSubmitting}
            style={[
              styles.signUpButton,
              canSignUp && styles.signUpButtonActive,
            ]}
            onPress={handleSignUp}
          >
            {isSubmitting ? (
              <View style={styles.loadingDots}>
                {dotAnimations.map((animation, index) => (
                  <RNAnimated.View
                    key={index}
                    style={[
                      styles.loadingDot,
                      { transform: [{ translateY: animation }] },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.signUpButtonText,
                  canSignUp && styles.signUpButtonTextActive,
                ]}
              >
                회원가입
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(scale: number, fontScale: number, screenWidth: number) {
  const buttonWidth = getButtonWidth(screenWidth);

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F7F7F7",
    },
    container: {
      flex: 1,
      paddingHorizontal: scaled(23, scale),
      paddingBottom: scaled(62, scale),
      justifyContent: "space-between",
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
      width: scaled(44, scale),
      height: scaled(44, scale),
      marginTop: scaled(8, scale),
      marginLeft: scaled(-8, scale),
    },
    scrollArea: {
      flex: 1,
      marginTop: scaled(4, scale),
    },
    scrollContent: {
      paddingBottom: scaled(SIGNUP_SCROLL_BOTTOM_SPACE, scale),
    },
    titleBox: {
      marginTop: scaled(32, scale),
      gap: scaled(8, scale),
      alignItems: "center",
    },
    title: {
      color: "#23CC89",
      fontSize: fontScaled(SIGNUP_TITLE_FONT_SIZE, fontScale),
      fontFamily: "Hana2Bold",
      textAlign: "center",
    },
    description: {
      color: "#8A8A8A",
      fontSize: fontScaled(16, fontScale),
      fontFamily: "PretendardMedium",
      lineHeight: fontScaled(23, fontScale),
      textAlign: "center",
    },
    form: {
      marginTop: scaled(28, scale),
      gap: scaled(18, scale),
    },
    field: {
      gap: scaled(10, scale),
    },
    label: {
      color: "#3D3D3A",
      fontSize: fontScaled(18, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    fieldErrorText: {
      color: "#E5484D",
      fontSize: fontScaled(18, fontScale),
      fontFamily: "PretendardMedium",
      lineHeight: fontScaled(22, fontScale),
    },
    input: {
      height: scaled(55, scale),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#DADADA",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: scaled(16, scale),
      color: "#3D3D3A",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardMedium",
    },
    inputFocused: {
      borderColor: "#23CC89",
    },
    genderOptions: {
      flexDirection: "row",
      gap: scaled(10, scale),
    },
    genderOption: {
      flex: 1,
      height: scaled(52, scale),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#DADADA",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    genderOptionActive: {
      borderColor: "#23CC89",
      backgroundColor: "#E9FBF4",
    },
    genderOptionText: {
      color: "#7A7A7A",
      fontSize: fontScaled(18, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    genderOptionTextActive: {
      color: "#12B876",
    },
    bottomActions: {
      alignItems: "center",
      marginHorizontal: scaled(-23, scale),
      paddingHorizontal: scaled(23, scale),
      paddingTop: scaled(24, scale),
      backgroundColor: "#F7F7F7",
    },
    bottomActionsFade: {
      position: "absolute",
      top: scaled(-30, scale),
      left: 0,
      right: 0,
      height: scaled(30, scale),
    },
    signUpButton: {
      width: buttonWidth,
      height: scaled(55, scale),
      alignSelf: "center",
      borderRadius: 8,
      backgroundColor: "#E2E2E2",
      alignItems: "center",
      justifyContent: "center",
    },
    signUpButtonActive: {
      backgroundColor: "#23CC89",
    },
    signUpButtonText: {
      color: "#6C6C6C",
      fontSize: fontScaled(20, fontScale),
      fontFamily: "PretendardSemiBold",
    },
    signUpButtonTextActive: {
      color: "#FFFFFF",
    },
    loadingDots: {
      flexDirection: "row",
      gap: scaled(10, scale),
    },
    loadingDot: {
      width: scaled(11, scale),
      height: scaled(11, scale),
      borderRadius: scaled(5.5, scale),
      backgroundColor: "#FFFFFF",
    },
  });
}
