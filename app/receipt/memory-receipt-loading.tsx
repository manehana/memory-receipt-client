import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MemoryReceiptLoading() {
  const progress = 0;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton}>
        <Ionicons name="chevron-back" size={30} color="#9F9F9F" />
      </Pressable>

      <View style={styles.textBox}>
        <Text style={styles.title}>기억 영수증 제작 중..</Text>
        <Text style={styles.description}>
          오늘 나누신 대화를 바탕으로 기억{'\n'}
          영수증을 만들고 있어요.{'\n'}
          조금만 기다려 주세요.
        </Text>
      </View>

      <View style={styles.centerArea}>
        <View style={styles.blurCircle} />

        <View style={styles.iconWrap}>
          <View style={styles.receiptIcon}>
            <View style={styles.receiptLineLong} />
            <View style={styles.receiptLineShort} />
            <View style={styles.receiptLineLong} />
            <View style={styles.receiptLineShort} />
            <View style={styles.receiptLineLong} />
          </View>

          <View style={styles.clockIcon}>
            <Ionicons name="time" size={34} color="#6F8991" />
          </View>
        </View>
      </View>

      <View style={styles.progressBox}>
        <Text style={styles.progressLabel}>진행률 </Text>
        <Text style={styles.progressValue}>{progress}%</Text>
      </View>

      <Pressable style={styles.helpButton}>
        <Text style={styles.helpText}>제작이 안돼요</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 62,
    backgroundColor: '#F7F7F7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -6,
  },
  textBox: {
    marginTop: 68,
  },
  title: {
    color: '#2ABD83',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  description: {
    marginTop: 12,
    color: '#9F9F9F',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
  },
  centerArea: {
    marginTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurCircle: {
  position: 'absolute',
  width: 260,
  height: 260,
  borderRadius: 130,
  backgroundColor: 'rgba(255,255,255,0.9)',

  shadowColor: '#FFFFFF',
  shadowOpacity: 1,
  shadowRadius: 80,
  shadowOffset: {
    width: 0,
    height: 0,
  },

  elevation: 20,
},
  iconWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIcon: {
    width: 78,
    height: 94,
    borderRadius: 12,
    backgroundColor: '#FFBC42',
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  receiptLineLong: {
    width: 36,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginBottom: 11,
  },
  receiptLineShort: {
    position: 'absolute',
    right: 12,
    width: 15,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  clockIcon: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: '#2ABD83',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBox: {
    marginTop: 88,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#9F9F9F',
    fontSize: 24,
    fontWeight: '600',
  },
  progressValue: {
    color: '#2ABD83',
    fontSize: 24,
    fontWeight: '700',
  },
  helpButton: {
  position: 'absolute',
  bottom: 100,
  left: 0,
  right: 0,
  alignItems: 'center',
},
  helpText: {
    color: '#BFBFBF',
    fontSize: 20,
    fontWeight: '500',
  },
});