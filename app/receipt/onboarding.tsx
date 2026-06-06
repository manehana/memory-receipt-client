import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const steps = [
  {
    icon: "megaphone-outline" as const,
    title: "오늘의 대화는\n음성으로 진행돼요",
    description: "시작 전에 마이크 허용 팝업이 떠요.\n허용을 눌러주세요.",
    tip: "말하기 어려울 땐 카드를 선택해서 대답할 수 있어요.",
  },
  {
    icon: "chatbubbles-outline" as const,
    title: "질문을 듣고\n바로 말하면 돼요",
    description: "모르겠다면 “모르겠어요”라고 말씀하셔도 괜찮아요.",
    tip: "화면에 “듣고 있어요”가 뜨면 바로 말하면 돼요.",
  },
  {
    icon: "checkbox-outline" as const,
    title: "다 말했으면 응답\n완료 버튼을 눌러주세요",
    description: "말을 시작하면 완료 버튼이 나타나요.\n다 말했으면 눌러주세요.",
    tip: "",
  },
];

const friends = ["아들", "딸", "강호동", "손흥민", "임영웅", "지드래곤", "안유진", "별봄이", "별송이"];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [friendSheetVisible, setFriendSheetVisible] = useState(false);
  const current = steps[step];

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setFriendSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            <Ionicons name="chevron-back" size={22} color="#7A7A7A" />
          </Pressable>
        </View>

        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === step && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <Ionicons name={current.icon} size={92} color="#62DDAF" />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
          {current.tip ? <Text style={styles.tip}>{current.tip}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>
              {step === steps.length - 1 ? "대화 친구 확인하기" : "이해했어요"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/receipt/voice-waiting")}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={friendSheetVisible} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>대화 친구 선택</Text>
            <Text style={styles.sheetDescription}>이름을 누르면 목소리를 미리 들을 수 있어요.</Text>

            <View style={styles.friendGrid}>
              {friends.map((friend, index) => (
                <Pressable key={friend} style={styles.friendItem}>
                  <View style={[styles.avatar, index === 5 && styles.avatarSelected]}>
                    <Text style={styles.avatarText}>{friend.slice(0, 1)}</Text>
                  </View>
                  <Text style={styles.friendName}>{friend}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/receipt/voice-waiting")}
            >
              <Text style={styles.primaryButtonText}>선택 완료</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 42,
  },
  topRow: {
    height: 48,
    justifyContent: "center",
  },
  backButton: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  dot: {
    width: 18,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D9D9D9",
  },
  dotActive: {
    width: 64,
    backgroundColor: "#2ABD83",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 38,
    color: "#333333",
    fontSize: 30,
    lineHeight: 40,
    textAlign: "center",
    fontFamily: "PretendardBold",
  },
  description: {
    marginTop: 28,
    color: "#9C9C9C",
    fontSize: 20,
    lineHeight: 29,
    textAlign: "center",
    fontFamily: "PretendardSemiBold",
  },
  tip: {
    marginTop: 36,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 18,
    color: "#555555",
    fontSize: 17,
    lineHeight: 24,
    fontFamily: "PretendardMedium",
  },
  footer: {
    gap: 22,
  },
  primaryButton: {
    height: 56,
    borderRadius: 8,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
  skipText: {
    color: "#A2A2A2",
    fontSize: 17,
    textAlign: "center",
    fontFamily: "PretendardMedium",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 94,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D9D9D9",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#222222",
    fontSize: 18,
    fontFamily: "PretendardBold",
  },
  sheetDescription: {
    marginTop: 6,
    color: "#A0A0A0",
    fontSize: 14,
    fontFamily: "PretendardMedium",
  },
  friendGrid: {
    marginVertical: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  friendItem: {
    width: 58,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: "#2ABD83",
  },
  avatarText: {
    color: "#333333",
    fontSize: 20,
    fontFamily: "PretendardBold",
  },
  friendName: {
    color: "#333333",
    fontSize: 14,
    fontFamily: "PretendardSemiBold",
  },
});
