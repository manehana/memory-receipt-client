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
        {/* 상단 */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={20}
              color="#7A7A7A"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeButton}>
            <Text style={styles.modeButtonText}>
              대화 모드 변경
            </Text>
          </TouchableOpacity>
        </View>

        {/* 텍스트 */}
        <View style={styles.header}>
          <Text style={styles.title}>곧 시작할게요</Text>

          <Text style={styles.description}>
            질문하면 생각하시고, 답변해주세요.{"\n"}
            모르면 모른다고 하셔도 돼요.
          </Text>
        </View>

        {/* 마이크 영역 */}
        <View style={styles.micArea}>
          {Array.from({ length: 10 }).map((_, index) => {
            const size = 426 - index * 24;

            return (
              <View
                key={index}
                style={[
                  styles.waveCircle,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                  },
                ]}
              />
            );
          })}

          <View style={styles.micCircle}>
            <View style={styles.customMic}>
              <View style={styles.micHead} />

              <View style={styles.micArc} />

              <View style={styles.micStem} />

              <View style={styles.micBase} />
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
    fontSize: 16,
    fontFamily: "PretendardMedium",
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

  micArea: {
    position: "absolute",

    left: 0,
    right: 0,

    bottom: -20,

    justifyContent: "center",
    alignItems: "center",
  },

  waveCircle: {
  position: "absolute",

  backgroundColor: "#FFFFFF",

  borderWidth: 1,
  borderColor: "#F4F4F4",

  shadowColor: "#FFFFFF",
  shadowOffset: {
    width: 0,
    height: 0,
  },

  shadowOpacity: 0.9,
  shadowRadius: 36,

  elevation: 4,
},

  micCircle: {
  width: 174,
  height: 174,
  borderRadius: 87,

  backgroundColor: "#FFFFFF",

  borderWidth: 1,
  borderColor: "#F1F1F1",

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#A1A1A1",
  shadowOffset: {
    width: 0,
    height: 0,
  },

  shadowOpacity: 0.22,
  shadowRadius: 28,

  elevation: 6,
},

  customMic: {
    width: 52,
    height: 70,
    marginTop: -20,

    alignItems: "center",
    justifyContent: "flex-start",
  },

  micHead: {
    marginTop: 10,
    width: 22,
    height: 40,
    borderRadius: 11,

    backgroundColor: "#D6D6D6",
  },

  micArc: {
    position: "absolute",
    top: 28,

    width: 42,
    height: 34,

    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,

    borderColor: "#A1A1A1",
    borderTopWidth: 0,

    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  micStem: {
    marginTop: 8,

    width: 5,
    height: 18,

    borderRadius: 3,

    backgroundColor: "#A1A1A1",
  },

  micBase: {
    width: 28,
    height: 5,

    borderRadius: 3,

    backgroundColor: "#A1A1A1",
  },
});