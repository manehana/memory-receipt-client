import {
  fontScaled,
  getButtonWidth,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { clearToken } from "@/lib/auth";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type AgreementId =
  | "privacy"
  | "mydata"
  | "location"
  | "automatedDecision"
  | "generativeAi";

const agreements: { id: AgreementId; label: string }[] = [
  { id: "privacy", label: "[필수] 개인정보 수집·이용 동의" },
  { id: "mydata", label: "[필수] 마이데이터 연동 동의" },
  { id: "location", label: "[필수] 위치정보 이용 동의" },
  {
    id: "automatedDecision",
    label: "[필수] AI 자동분석·자동화된 결정 고지 확인",
  },
  { id: "generativeAi", label: "[필수] 생성형 AI 활용 사실 고지 확인" },
];

const checkedIcon = require("../../assets/images/onboarding/icon-checked-check.png");
const uncheckedIcon = require("../../assets/images/onboarding/icon-unckecked-check.png");
const glassCheckIcon = require("../../assets/images/onboarding/icon-glass-check.png");

export default function TermsAgreementScreen() {
  const [checkedIds, setCheckedIds] = useState<AgreementId[]>([]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, insets.bottom),
    [fontScale, insets.bottom, scale, width]
  );
  const isAllChecked = checkedIds.length === agreements.length;
  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [scaled(420, scale), 0],
  });

  useEffect(() => {
    if (!isConfirmVisible) {
      return;
    }

    sheetProgress.setValue(0);
    Animated.timing(sheetProgress, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isConfirmVisible, sheetProgress]);

  const toggleAgreement = (id: AgreementId) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setCheckedIds(
      isAllChecked ? [] : agreements.map((agreement) => agreement.id)
    );
  };

  const goBackToLogin = async () => {
    await clearToken();
    router.replace("/receipt/login");
  };

  const closeConfirmSheet = () => {
    Animated.timing(sheetProgress, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsConfirmVisible(false);
      }
    });
  };

  const confirmAgreement = () => {
    Animated.timing(sheetProgress, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setIsConfirmVisible(false);
      router.replace("/receipt/main");
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={goBackToLogin}
          style={styles.backButton}
        >
          <Text maxFontSizeMultiplier={1.1} style={styles.backButtonText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.content}>
          <Text maxFontSizeMultiplier={1.1} style={styles.title}>
            <Text style={styles.titleBrand}>기억HANA</Text> 사용하기 위한
            {"\n"}약관 동의를 해주세요.
          </Text>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAllChecked }}
            onPress={toggleAll}
            style={[
              styles.allAgreementButton,
              isAllChecked && styles.allAgreementButtonChecked,
            ]}
          >
            <Image
              resizeMode="contain"
              source={isAllChecked ? checkedIcon : uncheckedIcon}
              style={styles.checkIcon}
            />
            <Text
              maxFontSizeMultiplier={1.1}
              style={[
                styles.allAgreementText,
                isAllChecked && styles.allAgreementTextChecked,
              ]}
            >
              필수 항목 모두 체크하기
            </Text>
          </Pressable>

          <View style={styles.agreementList}>
            {agreements.map((agreement) => {
              const isChecked = checkedIds.includes(agreement.id);

              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  key={agreement.id}
                  onPress={() => toggleAgreement(agreement.id)}
                  style={styles.agreementRow}
                >
                  <Image
                    resizeMode="contain"
                    source={isChecked ? checkedIcon : uncheckedIcon}
                    style={styles.checkIcon}
                  />
                  <Text
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.1}
                    minimumFontScale={0.78}
                    numberOfLines={1}
                    style={[
                      styles.agreementText,
                      isChecked && styles.agreementTextChecked,
                    ]}
                  >
                    {agreement.label}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.agreementArrow}
                  >
                    ›
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          disabled={!isAllChecked}
          onPress={() => setIsConfirmVisible(true)}
          style={[
            styles.submitButton,
            isAllChecked && styles.submitButtonEnabled,
          ]}
        >
          <Text
            maxFontSizeMultiplier={1.1}
            style={[
              styles.submitButtonText,
              isAllChecked && styles.submitButtonTextEnabled,
            ]}
          >
            약관 동의 할게요
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="none"
        onRequestClose={closeConfirmSheet}
        transparent
        visible={isConfirmVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="약관 확인 닫기"
            onPress={closeConfirmSheet}
            style={styles.modalBackdrop}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Image
              resizeMode="contain"
              source={glassCheckIcon}
              style={styles.sheetIcon}
            />
            <Text maxFontSizeMultiplier={1.1} style={styles.sheetTitle}>
              내용을 충분히 이해하셨나요?
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.sheetDescription}>
              설명 내용을 제대로 이해하지 못했는데도 이해했다고 확인하는 경우,
              추후 해당 내용과 관련한 권리구제가 어려울 수 있어요.
            </Text>
            <Pressable
              onPress={closeConfirmSheet}
              style={styles.sheetSecondaryButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.sheetSecondaryButtonText}
              >
                닫기
              </Text>
            </Pressable>
            <Pressable
              onPress={confirmAgreement}
              style={styles.sheetPrimaryButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={styles.sheetPrimaryButtonText}
              >
                네, 충분히 이해했어요
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(
  scale: number,
  fontScale: number,
  screenWidth: number,
  safeBottom: number
) {
  const buttonWidth = getButtonWidth(screenWidth);

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#F7F7F7",
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: scaled(40, scale),
      paddingHorizontal: 23,
    },
    backButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      height: scaled(44, scale),
      justifyContent: "center",
      marginTop: scaled(12, scale),
      width: scaled(34, scale),
    },
    backButtonText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(38, fontScale),
      lineHeight: fontScaled(38, fontScale),
      marginTop: scaled(-5, scale),
    },
    content: {
      flex: 1,
      paddingTop: scaled(28, scale),
    },
    title: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(24, fontScale),
      lineHeight: fontScaled(34, fontScale),
    },
    titleBrand: {
      color: "#00BF78",
    },
    allAgreementButton: {
      alignItems: "center",
      backgroundColor: "#EAEAEA",
      borderRadius: 6,
      flexDirection: "row",
      gap: scaled(9, scale),
      height: scaled(59, scale),
      marginTop: scaled(29, scale),
      paddingHorizontal: scaled(14, scale),
    },
    allAgreementButtonChecked: {
      backgroundColor: "#CFFBE7",
    },
    allAgreementText: {
      color: "#565656",
      flex: 1,
      fontFamily: "PretendardBold",
      fontSize: fontScaled(18, fontScale),
    },
    allAgreementTextChecked: {
      color: "#313131",
    },
    agreementList: {
      gap: scaled(22, scale),
      marginTop: scaled(27, scale),
    },
    agreementRow: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: scaled(24, scale),
    },
    checkIcon: {
      height: scaled(24, scale),
      width: scaled(24, scale),
    },
    agreementText: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(17, fontScale),
      marginLeft: scaled(9, scale),
    },
    agreementTextChecked: {
      color: "#3F3F3F",
    },
    agreementArrow: {
      color: "#666666",
      fontFamily: "PretendardRegular",
      fontSize: fontScaled(31, fontScale),
      lineHeight: fontScaled(31, fontScale),
      marginLeft: scaled(8, scale),
      marginTop: scaled(-2, scale),
    },
    submitButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#E2E2E2",
      borderRadius: 6,
      height: scaled(57, scale),
      justifyContent: "center",
      width: buttonWidth,
    },
    submitButtonEnabled: {
      backgroundColor: "#27CC8A",
    },
    submitButtonText: {
      color: "#666666",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(19, fontScale),
    },
    submitButtonTextEnabled: {
      color: "#FFFFFF",
    },
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.34)",
    },
    bottomSheet: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingBottom: Math.max(
        safeBottom + scaled(26, scale),
        scaled(44, scale)
      ),
      paddingHorizontal: scaled(16, scale),
      paddingTop: scaled(12, scale),
    },
    sheetHandle: {
      alignSelf: "center",
      backgroundColor: "#DFDFDF",
      borderRadius: 2,
      height: 4,
      width: scaled(42, scale),
    },
    sheetIcon: {
      height: scaled(76, scale),
      marginTop: scaled(30, scale),
      width: scaled(76, scale),
    },
    sheetTitle: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: fontScaled(24, fontScale),
      lineHeight: fontScaled(31, fontScale),
      marginTop: scaled(22, scale),
    },
    sheetDescription: {
      color: "#565656",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(18, fontScale),
      lineHeight: fontScaled(26, fontScale),
      marginTop: scaled(11, scale),
    },
    sheetSecondaryButton: {
      alignItems: "center",
      backgroundColor: "#F1F1F1",
      borderRadius: 6,
      height: scaled(58, scale),
      justifyContent: "center",
      marginTop: scaled(42, scale),
    },
    sheetSecondaryButtonText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: fontScaled(19, fontScale),
    },
    sheetPrimaryButton: {
      alignItems: "center",
      backgroundColor: "#27CC8A",
      borderRadius: 6,
      height: scaled(58, scale),
      justifyContent: "center",
      marginTop: scaled(12, scale),
    },
    sheetPrimaryButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: fontScaled(19, fontScale),
    },
  });
}
