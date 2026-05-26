import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 12 },
        ]}
      >
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity style={styles.backButton}>
          <Ionicons
            name="chevron-back"
            size={20}
            color="#7A7A7A"
          />
        </TouchableOpacity>

        {/* 헤더 */}
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

        {/* 카드 영역 */}
        <View style={styles.cardContainer}>
          {/* 카드 1 */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircleYellow}>
                <Ionicons
                  name="mic"
                  size={18}
                  color="#F6B545"
                />
              </View>

              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>
                  상황에 맞게 말씀해 주세요
                </Text>

                <Text style={styles.cardDescription}>
                  말하기 불편할 땐 음성으로{"\n"}
                  그렇지 않을 땐 카드를 골라 대화할 수 있어요.
                </Text>
              </View>
            </View>
          </View>

          {/* 카드 2 */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircleGreen}>
                <Ionicons
                  name="card"
                  size={18}
                  color="#2ABD83"
                />
              </View>

              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>
                  오늘 소비 내역을 돌아봐요
                </Text>

                <Text style={styles.cardDescription}>
                  하나카드 결제 내역을 바탕으로{"\n"}
                  자연스러운 질문을 드려요.
                </Text>
              </View>
            </View>
          </View>

          {/* 카드 3 */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircleOrange}>
                <Ionicons
                  name="chatbubble"
                  size={18}
                  color="#F4A640"
                />
              </View>

              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>
                  오늘의 기억 명세서가 만들어져요
                </Text>

                <Text style={styles.cardDescription}>
                  대화가 끝나면 하루 기억이 예쁘게{"\n"}
                  기록되어 저장돼요.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 하단 */}
        <View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>시작하기</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              <Text style={{ color: "#2ABD83" }}>ⓘ</Text>
              {" "}음성 응답을 못하는 상황이에요
            </Text>

            <View style={styles.footerUnderline} />
          </View>
        </View>
      </View>
    </View>
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
    paddingBottom: 32,
    justifyContent: "space-between",
  },

  backButton: {
    width: 37,
    height: 37,
    marginTop: 5,
    borderRadius: 18.5,
    backgroundColor: "#ECECEC",

    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginTop: 0,
  },

  title: {
    fontSize: 32,
    fontFamily: "PretendardBold",
    lineHeight: 40,
    color: "#2ABD83",
  },

  description: {
    marginTop: 18,
    fontSize: 20,
    fontFamily: "PretendardRegular",
    lineHeight: 28,
    color: "#9C9C9C",
  },

  cardContainer: {
    gap: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTextContainer: {
    marginLeft: 14,
    flex: 1,
  },

  iconCircleYellow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF4DE",

    justifyContent: "center",
    alignItems: "center",
  },

  iconCircleGreen: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5F8F0",

    justifyContent: "center",
    alignItems: "center",
  },

  iconCircleOrange: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1DF",

    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 17,
    fontFamily: "PretendardSemiBold",
    color: "#505050",
  },

  cardDescription: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: "PretendardMedium",
    lineHeight: 22,
    color: "#9C9C9C",
  },

  button: {
    height: 58,
    backgroundColor: "#2F2F2F",
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 17,
    fontFamily: "PretendardBold",
    color: "#FFFFFF",
  },

  footerContainer: {
    marginTop: 14,
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    fontFamily: "PretendardRegular",
    color: "#6D6D6D",
  },

  footerUnderline: {
    marginTop: 3,
    width: 170,
    height: 1,
    backgroundColor: "#D9D9D9",
  },
});