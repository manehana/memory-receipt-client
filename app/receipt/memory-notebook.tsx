import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { useImageAuthHeaders } from "@/hooks/use-image-auth-headers";
import { sessionImageUrl } from "@/lib/api";
import { filterPresentationSessions } from "@/lib/presentation";
import type { RecallSessionListItem } from "@/lib/types";
import { useCurrentUser } from "@/lib/user";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;

type SortOption = "latest" | "oldest";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
];

const WEEK_LABELS = [
  "첫째주",
  "둘째주",
  "셋째주",
  "넷째주",
  "다섯째주",
  "여섯째주",
];

type MemoryNotebookWeek = {
  hasImage: boolean;
  id: string;
  latestReceiptTime: number;
  period: string;
  receiptId: number;
  sortTime: number;
};

type MemoryNotebookMonth = {
  key: string;
  month: string;
  sortTime: number;
  weeks: MemoryNotebookWeek[];
};

function getValidSessionDate(session: RecallSessionListItem): Date | null {
  if (session.status !== "completed" || !session.title) {
    return null;
  }

  const date = new Date(session.session_date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createWeek(
  session: RecallSessionListItem,
  date: Date
): MemoryNotebookWeek {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const month = monthIndex + 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const weekIndex = Math.min(Math.floor((date.getDate() - 1) / 5), 5);
  const startDay = weekIndex === 5 ? 26 : weekIndex * 5 + 1;
  const endDay = weekIndex === 5 ? lastDay : Math.min(startDay + 4, lastDay);
  const weekLabel = WEEK_LABELS[weekIndex] ?? `${weekIndex + 1}주`;

  return {
    hasImage: session.image_url != null,
    id: `${year}-${month}-${weekIndex + 1}`,
    latestReceiptTime: date.getTime(),
    period: `${month}.${startDay}~${month}.${endDay}(${weekLabel})`,
    receiptId: session.id,
    sortTime: new Date(year, monthIndex, startDay).getTime(),
  };
}

function createEmptyCurrentMonth(): MemoryNotebookMonth {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  return {
    key: `${year}-${month}`,
    month: `${month}월`,
    sortTime: new Date(year, month - 1, 1).getTime(),
    weeks: [],
  };
}

function toMemoryNotebookMonths(
  sessions: RecallSessionListItem[]
): MemoryNotebookMonth[] {
  const monthMap = new Map<string, MemoryNotebookMonth>();

  sessions.forEach((session) => {
    const date = getValidSessionDate(session);
    if (!date) {
      return;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${month}`;
    const monthSection =
      monthMap.get(monthKey) ??
      ({
        key: monthKey,
        month: `${month}월`,
        sortTime: new Date(year, month - 1, 1).getTime(),
        weeks: [],
      } satisfies MemoryNotebookMonth);
    const week = createWeek(session, date);
    const existingWeekIndex = monthSection.weeks.findIndex(
      (item) => item.id === week.id
    );

    if (existingWeekIndex === -1) {
      monthSection.weeks.push(week);
    } else if (
      week.latestReceiptTime >
      monthSection.weeks[existingWeekIndex].latestReceiptTime
    ) {
      monthSection.weeks[existingWeekIndex] = week;
    }

    monthMap.set(monthKey, monthSection);
  });

  return Array.from(monthMap.values()).map((section) => ({
    ...section,
    weeks: [...section.weeks].sort((a, b) => a.sortTime - b.sortTime),
  }));
}

export default function MemoryNotebookScreen() {
  const { width, height } = useWindowDimensions();
  const { data: user } = useCurrentUser();
  const imageHeaders = useImageAuthHeaders();
  const insets = useSafeAreaInsets();
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [isSortSheetVisible, setIsSortSheetVisible] = useState(false);
  const sortSheetProgress = useRef(new Animated.Value(1)).current;
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height, insets.bottom),
    [fontScale, height, insets.bottom, scale, width]
  );
  const selectedSortLabel =
    sortOptions.find((option) => option.value === selectedSort)?.label ??
    sortOptions[0].label;
  const memoryNotebookMonths = useMemo(
    () =>
      toMemoryNotebookMonths(
        filterPresentationSessions(user?.recall_sessions ?? [])
      ),
    [user?.recall_sessions]
  );
  const sortedMemoryNotebookMonths = useMemo(() => {
    const sortedMonths = [...memoryNotebookMonths].sort((a, b) =>
      selectedSort === "latest"
        ? b.sortTime - a.sortTime
        : a.sortTime - b.sortTime
    );

    return sortedMonths.length > 0 ? sortedMonths : [createEmptyCurrentMonth()];
  }, [memoryNotebookMonths, selectedSort]);

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
      duration: 220,
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
            onPress={goBackToPreviousScreen}
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

              {section.weeks.length > 0 ? (
                <ScrollView
                  contentContainerStyle={styles.cardList}
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                >
                  {section.weeks.map((week) => (
                    <Pressable
                      key={week.id}
                      onPress={() =>
                        router.push("/receipt/weekly-memory-receipts")
                      }
                      style={styles.card}
                    >
                      {week.hasImage ? (
                        <ExpoImage
                          contentFit="cover"
                          source={{
                            uri: sessionImageUrl(week.receiptId),
                            headers: imageHeaders,
                          }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <Image
                          resizeMode="cover"
                          source={require("../../assets/images/memory-notebook/memory-note-thumbnail.png")}
                          style={styles.cardImage}
                        />
                      )}
                      <LinearGradient
                        colors={[
                          "rgba(0, 0, 0, 0.02)",
                          "rgba(0, 0, 0, 0.4)",
                          "rgba(0, 0, 0, 0.6)",
                        ]}
                        locations={[0, 0.45, 1]}
                        pointerEvents="none"
                        style={styles.cardOverlay}
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
              ) : (
                <View style={styles.emptyBox}>
                  <Ionicons
                    color="#D8D8D8"
                    name="document"
                    size={scaled(62, scale)}
                  />
                  <Text maxFontSizeMultiplier={1.1} style={styles.emptyText}>
                    아직 쌓인 기억 수첩이 없네요.{"\n"}
                    오늘의 대화를 통해 기억 영수증을{"\n"}
                    차곡차곡 쌓아 봐요.
                  </Text>
                </View>
              )}
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
            pointerEvents="none"
            style={[
              styles.sortSheetBackdrop,
              {
                opacity: sortSheetProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.36, 0],
                }),
              },
            ]}
          />
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
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={styles.sortSheetContent}
            >
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
  bottomInset: number
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const sheetScale = Math.max(Math.min(widthScale, heightScale, 1), 0.92);
  const horizontalPadding = Math.round(
    (screenWidth < 380 ? 20 : 24) * Math.min(widthScale, 1.08)
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
    cardOverlay: {
      bottom: 0,
      height: fixed(52),
      left: 0,
      position: "absolute",
      right: 0,
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
      flexGrow: 1,
      paddingBottom: vertical(40),
      paddingTop: vertical(12),
    },
    emptyBox: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: vertical(460),
      paddingHorizontal: horizontalPadding,
    },
    emptyText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(24),
      marginTop: fixed(18),
      textAlign: "center",
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
      backgroundColor: "#F2F2F2",
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
      flex: 1,
      justifyContent: "flex-end",
    },
    sortSheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000000",
    },
  });
};
