import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.backText}>‹ 뒤로가기</Text>

        <View style={styles.header}>
          <Text style={styles.title}>
            오늘 하루에 대해{"\n"}
            같이 대화해봐요.
          </Text>

          <Text style={styles.description}>
            오늘 하루를 함께 돌아보며,{"\n"}
            자연스럽게 기억을 기록해드려요.
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              상황에 맞게 말씀해 주세요
            </Text>

            <Text style={styles.cardDescription}>
              말하기 불편한 상황으로 길게 잇지 못할 땐{"\n"}
              키워드 중심의 대화를 수 있어요.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              오늘 소비 내역을 돌아봐요
            </Text>

            <Text style={styles.cardDescription}>
              하루동안 결제 내역을 바탕으로{"\n"}
              자연스러운 질문을 드려요.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              오늘의 기억 명세서가 만들어져요
            </Text>

            <Text style={styles.cardDescription}>
              대화가 끝나면 하루 기억이 예쁘게{"\n"}
              기록되어 저장돼요.
            </Text>
          </View>
        </View>

        <View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>시작하기</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            ⓘ 음성 응답은 못하는 상황이에요
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: "space-between",
  },

  backText: {
    fontSize: 17,
    fontFamily: "PretendardRegular",
    color: "#B0B0B0",
  },

  header: {
    marginTop: 20,
  },

  title: {
    fontSize: 32,
    fontFamily: "PretendardBold",
    lineHeight: 40,
    color: "#2ABD83",
  },

  description: {
    marginTop: 18,
    fontSize: 16,
    fontFamily: "PretendardRegular",
    lineHeight: 24,
    color: "#9A9A9A",
  },

  cardContainer: {
    gap: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },

  cardTitle: {
    fontSize: 16,
    fontFamily: "PretendardBold",
    color: "#333333",
  },

  cardDescription: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: "PretendardRegular",
    lineHeight: 20,
    color: "#9A9A9A",
  },

  button: {
    height: 56,
    backgroundColor: "#2F2F2F",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 17,
    fontFamily: "PretendardBold",
    color: "#FFFFFF",
  },

  footerText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "PretendardRegular",
    color: "#6D6D6D",
  },
});