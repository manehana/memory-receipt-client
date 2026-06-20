import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;

type SortOption = "latest" | "oldest";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
];

const memoryNotebookMonths = [
  {
    month: "5월",
    weeks: [
      { id: "5-1", period: "5.1~5.8(첫째주)" },
      { id: "5-2", period: "5.9~5.16(둘째주)" },
      { id: "5-3", period: "5.17~5.24(셋째주)" },
      { id: "5-4", period: "5.25~5.31(넷째주)" },
    ],
  },
  {
    month: "7월",
    weeks: [
      { id: "7-1", period: "7.1~7.6(첫째주)" },
      { id: "7-2", period: "7.7~7.12(둘째주)" },
      { id: "7-3", period: "7.13~7.18(셋째주)" },
      { id: "7-4", period: "7.19~7.24(넷째주)" },
      { id: "7-5", period: "7.25~7.31(다섯째주)" },
    ],
  },
  {
    month: "8월",
    weeks: [
      { id: "8-1", period: "8.1~8.8(첫째주)" },
      { id: "8-2", period: "8.9~8.16(둘째주)" },
      { id: "8-3", period: "8.17~8.24(셋째주)" },
      { id: "8-4", period: "8.25~8.31(넷째주)" },
    ],
  },
];

export default function MemoryNotebookScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [isSortSheetVisible, setIsSortSheetVisible] = useState(false);
  const sortSheetProgress = useRef(new Animated.Value(1)).current;
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height, insets.bottom),
    [fontScale, height, insets.bottom, scale, width],
  );
  const selectedSortLabel =
    sortOptions.find((option) => option.value === selectedSort)?.label ??
    sortOptions[0].label;
  const sortedMemoryNotebookMonths = useMemo(
    () =>
      selectedSort === "latest"
        ? [...memoryNotebookMonths].reverse()
        : memoryNotebookMonths,
    [selectedSort],
  );

  const openSortSheet = () => {
    sortSheetProgress.setValue(1);
    setIsSortSheetVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(sortSheetProgress, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeSortSheet = () => {
    Animated.timing(sortSheetProgress, {
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsSortSheetVisible(false);
      }
    });
  };

  const handleSelectSort = (value: SortOption) => {
    setSelectedSort(value);
    closeSortSheet();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            hitSlop={scaled(12, scale)}
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons
              color="#9F9F9F"
              name="chevron-back"
              size={scaled(24, scale)}
            />
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.headerTitle}>
            기억 수첩
          </Text>
          <Pressable hitSlop={scaled(12, scale)} style={styles.headerButton}>
            <Ionicons
              color="#5D5D5D"
              name="ellipsis-vertical"
              size={scaled(24, scale)}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isSortSheetVisible }}
            onPress={openSortSheet}
            style={styles.sortButton}
          >
            <Text maxFontSizeMultiplier={1.1} style={styles.sortButtonText}>
              {selectedSortLabel}
            </Text>
            <Ionicons
              color="#5D5D5D"
              name="chevron-down"
              size={scaled(24, scale)}
            />
          </Pressable>

          {sortedMemoryNotebookMonths.map((section) => (
            <View key={section.month} style={styles.monthSection}>
              <View style={styles.monthTitleRow}>
                <Text maxFontSizeMultiplier={1.1} style={styles.monthTitle}>
                  {section.month}
                </Text>
                <View style={styles.monthDivider} />
              </View>

              <ScrollView
                contentContainerStyle={styles.cardList}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
              >
                {section.weeks.map((week) => (
                  <Pressable
                    key={week.id}
                    onPress={() => router.push("/receipt/weekly-memory-receipts")}
                    style={styles.card}
                  >
                    <Image
                      resizeMode="cover"
                      source={require("../../assets/images/memory-notebook/memory-note-thumbnail.png")}
                      style={styles.cardImage}
                    />
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.cardPeriodText}
                    >
                      {week.period}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
      <Modal
        animationType="none"
        onRequestClose={closeSortSheet}
        transparent
        visible={isSortSheetVisible}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeSortSheet}
          style={styles.sortSheetOverlay}
        >
          <Animated.View
            style={[
              styles.sortSheet,
              {
                transform: [
                  {
                    translateY: sortSheetProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, height],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.sortSheetContent}>
            <View style={styles.sortSheetHandle} />
            <View style={styles.sortOptionArea}>
              {sortOptions.map((option, index) => {
                const isSelected = option.value === selectedSort;

                return (
                  <View key={option.value}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleSelectSort(option.value)}
                      style={styles.sortOptionButton}
                    >
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={[
                          styles.sortOptionText,
                          isSelected
                            ? styles.sortOptionTextSelected
                            : styles.sortOptionTextUnselected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                    {index < sortOptions.length - 1 ? (
                      <View style={styles.sortOptionDivider} />
                    ) : null}
                  </View>
                );
              })}
            </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const sheetScale = Math.max(Math.min(widthScale, heightScale, 1), 0.92);
  const horizontalPadding = Math.round(
    (screenWidth < 380 ? 20 : 24) * Math.min(widthScale, 1.08),
  );
  const fixed = (value: number) => Math.round(value * layoutScale);
  const sheetFixed = (value: number) => Math.round(value * sheetScale);
  const vertical = (value: number) =>
    Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) =>
    fontScaled(value, Math.min(fontScale, layoutScale));
  const sheetFont = (value: number) =>
    fontScaled(value, Math.min(fontScale, sheetScale));

  return StyleSheet.create({
    card: {
      borderRadius: fixed(15),
      height: fixed(160),
      overflow: "hidden",
      width: fixed(160),
    },
    cardImage: {
      height: "100%",
      width: "100%",
    },
    cardList: {
      gap: fixed(20),
      paddingLeft: horizontalPadding,
      paddingRight: horizontalPadding,
      paddingTop: fixed(16),
    },
    cardPeriodText: {
      bottom: fixed(12),
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
      left: fixed(10),
      position: "absolute",
    },
    content: {
      paddingBottom: vertical(40),
      paddingTop: vertical(12),
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      height: vertical(48),
      justifyContent: "space-between",
      paddingHorizontal: horizontalPadding,
    },
    headerButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      width: fixed(34),
    },
    headerTitle: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
    },
    monthDivider: {
      backgroundColor: "#EAEAEA",
      flex: 1,
      height: 1,
      marginLeft: fixed(12),
    },
    monthSection: {
      marginTop: vertical(27),
    },
    monthTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(24),
    },
    monthTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: horizontalPadding,
    },
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingTop: vertical(18),
    },
    sortButton: {
      alignItems: "center",
      alignSelf: "flex-end",
      backgroundColor: "#F2F2F2",
      borderRadius: fixed(45),
      flexDirection: "row",
      gap: fixed(2),
      height: fixed(36),
      justifyContent: "center",
      marginRight: fixed(16),
      width: fixed(101),
    },
    sortButtonText: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      textAlign: "center",
    },
    sortOptionArea: {
      marginTop: sheetFixed(24),
      paddingHorizontal: sheetFixed(22),
      width: "100%",
    },
    sortOptionButton: {
      justifyContent: "center",
      minHeight: sheetFixed(56),
      width: "100%",
    },
    sortOptionDivider: {
      alignSelf: "center",
      backgroundColor: "#F2F2F2",
      height: 1,
      marginBottom: sheetFixed(6),
      marginTop: sheetFixed(6),
      width: "100%",
    },
    sortOptionText: {
      fontFamily: "PretendardMedium",
      fontSize: sheetFont(20),
      lineHeight: sheetFont(28),
      textAlign: "left",
    },
    sortOptionTextSelected: {
      color: "#353535",
    },
    sortOptionTextUnselected: {
      color: "#9F9F9F",
    },
    sortSheet: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: sheetFixed(20),
      borderTopRightRadius: sheetFixed(20),
      minHeight: sheetFixed(165) + bottomInset,
      paddingBottom: sheetFixed(24) + bottomInset,
      paddingTop: sheetFixed(17),
      width: "100%",
    },
    sortSheetContent: {
      alignItems: "center",
      width: "100%",
    },
    sortSheetHandle: {
      backgroundColor: "#D9D9D9",
      borderRadius: sheetFixed(45),
      height: sheetFixed(4),
      width: sheetFixed(95),
    },
    sortSheetOverlay: {
      backgroundColor: "rgba(0, 0, 0, 0.36)",
      flex: 1,
      justifyContent: "flex-end",
    },
  });
};
