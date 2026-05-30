import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const LoadingBg1 = require('@/assets/images/memory-receipt-loading/memory-receipt-loading1-bg.png');
const LoadingBg2 = require('@/assets/images/memory-receipt-loading/memory-receipt-loading2-bg.png');
const LoadingBg3 = require('@/assets/images/memory-receipt-loading/memory-receipt-loading3-bg.png');
const LoadingBg4 = require('@/assets/images/memory-receipt-loading/memory-receipt-loading4-bg.png');

export default function MemoryReceiptLoading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        return prev + 1;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const backgroundSource =
    progress >= 100
      ? LoadingBg4
      : progress >= 80
        ? LoadingBg3
        : progress >= 20
          ? LoadingBg2
          : LoadingBg1;

  return (
    <View style={styles.root}>
      <Image
        source={backgroundSource}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

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

        <View style={styles.centerArea} />

        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>진행률 </Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>

        <Pressable style={styles.helpButton}>
          <Text style={styles.helpText}>제작이 안돼요</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: -8,
    right: -8,
    bottom: 0,
    width: undefined,
    height: undefined,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 62,
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
    flex: 1,
  },
  progressBox: {
    marginBottom: 180,
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