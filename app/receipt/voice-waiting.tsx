import Ionicons from "@expo/vector-icons/Ionicons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VoiceWaitingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={20}
              color="#7A7A7A"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeButton}>
            <Text style={styles.modeButtonText}>대화 모드 변경</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>곧 시작할게요</Text>

          <Text style={styles.description}>
            질문하면 생각하시고, 답변해주세요.{"\n"}
            모르면 모른다고 하셔도 돼요.
          </Text>
        </View>

        <Text style={styles.waitingText}>지금 응답해주세요..</Text>

        <View style={styles.micArea}>
          <View style={styles.waveCircle1}>
            <View style={styles.waveCircle2}>
              <View style={styles.waveCircle3}>
                <View style={styles.micCircle}>
                  <Ionicons
                    name="mic-outline"
                    size={52}
                    color="#BDBDBD"
                  />
                </View>
              </View>
            </View>
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
    paddingBottom: 0,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "#ECECEC",
    justifyContent: "center",
    alignItems: "center",
  },

  modeButton: {
    width: 119.46,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "#3D3D3A",
    justifyContent: "center",
    alignItems: "center",
  },

  modeButtonText: {
    fontSize: 13,
    fontFamily: "PretendardSemiBold",
    color: "#FFFFFF",
  },

  header: {
    marginTop: 74,
  },

  title: {
    fontSize: 28,
    fontFamily: "PretendardBold",
    color: "#2ABD83",
  },

  description: {
    marginTop: 14,
    fontSize: 22,
    fontFamily: "PretendardSemiBold",
    lineHeight: 30,
    color: "#9C9C9C",
  },

  waitingText: {
    marginTop: 118,
    textAlign: "center",
    fontSize: 22,
    fontFamily: "PretendardBold",
    color: "#A6A6A6",
  },

  micArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -85,
    alignItems: "center",
  },

  waveCircle1: {
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },

  waveCircle2: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "rgba(255,255,255,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },

  waveCircle3: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  micCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});