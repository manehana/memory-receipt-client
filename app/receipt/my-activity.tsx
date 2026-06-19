import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
const completedDates = new Set([3, 4, 5, 9, 10, 11, 14, 15]);
const calendarWeekDays = ["월", "화", "수", "목", "금", "토", "일"];

type CalendarDate = {
  date: number;
  monthOffset: -1 | 0 | 1;
};

function DashedCircle({ color }: { color: string }) {
  return (
    <Svg height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" width="100%">
      <Circle
        cx="50"
        cy="50"
        fill="none"
        r="47"
        stroke={color}
        strokeDasharray="6.15 6.15"
        strokeLinecap="butt"
        strokeWidth="4.6"
      />
    </Svg>
  );
}

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getMondayFirstIndex = (day: number) => (day + 6) % 7;

const createCalendarDates = (year: number, month: number) => {
  const firstDayIndex = getMondayFirstIndex(new Date(year, month, 1).getDay());
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPreviousMonth = getDaysInMonth(year, month - 1);
  const cells: CalendarDate[] = [];

  for (let index = firstDayIndex - 1; index >= 0; index -= 1) {
    cells.push({ date: daysInPreviousMonth - index, monthOffset: -1 });
  }

  for (let date = 1; date <= daysInMonth; date += 1) {
    cells.push({ date, monthOffset: 0 });
  }

  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({ date: cells.length - firstDayIndex - daysInMonth + 1, monthOffset: 1 });
  }

  const rows: CalendarDate[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
};

export default function MyActivityScreen() {
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width],
  );
  const today = useMemo(() => new Date(), []);
  const todayWeekIndex = today.getDay();
  const completedWeekDays = useMemo(
    () => Array.from({ length: todayWeekIndex }, (_, index) => index),
    [todayWeekIndex],
  );
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const calendarDates = useMemo(
    () => createCalendarDates(currentYear, currentMonth),
    [currentMonth, currentYear],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            hitSlop={scaled(12, scale)}
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons color="#9F9F9F" name="chevron-back" size={scaled(24, scale)} />
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.headerTitle}>
            MY 상세
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          style={styles.scroller}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabs}>
            <View style={styles.tabDivider} />
            <View style={styles.activeTab}>
              <Text maxFontSizeMultiplier={1.1} style={styles.activeTabText}>
                대화 기록
              </Text>
              <View style={styles.activeTabBar} />
            </View>
            <View style={styles.inactiveTab}>
              <Text maxFontSizeMultiplier={1.1} style={styles.inactiveTabText}>
                소비 기록
              </Text>
            </View>
          </View>

          <Text maxFontSizeMultiplier={1.1} style={styles.todaySectionTitle}>
            오늘의 대화 기록
          </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryColumn}>
            <Text maxFontSizeMultiplier={1.1} style={styles.summaryLabel}>
              현재 연속 일수
            </Text>
            <View style={styles.summaryValueRow}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/my-activity/conversation_history_streak.png")}
                style={styles.streakIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.summaryNumber}>
                7
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.summaryUnit}>
                일째
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumn}>
            <Text maxFontSizeMultiplier={1.1} style={styles.summaryLabel}>
              최고 기록
            </Text>
            <View style={styles.summaryValueRow}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/my-activity/conversation_history_best_record.png")}
                style={styles.bestIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.summaryNumber}>
                15
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.summaryUnit}>
                일
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.band} />

        <View style={styles.sectionHeader}>
          <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
            이번주 참여 현황
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.weekCount}>
            <Text style={styles.weekCountStrong}>{completedWeekDays.length}</Text>
            <Text style={styles.weekCountMuted}> / 7회</Text>
          </Text>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekIconRow}>
            {weekDays.map((day, index) => {
              const isCompleted = completedWeekDays.includes(index);
              const isToday = index === todayWeekIndex;
              return (
                <View key={day} style={styles.weekDayColumn}>
                  <View
                    style={[
                      styles.weekCircle,
                      isCompleted && styles.weekCircleCompleted,
                      isToday && styles.weekCircleToday,
                    ]}
                  >
                    {isCompleted ? (
                      <Image
                        resizeMode="contain"
                        source={require("../../assets/images/my-activity/conversation_history_daily_attendance.png")}
                        style={styles.dailyIcon}
                      />
                    ) : isToday ? (
                      <>
                        <DashedCircle color="#23CC89" />
                        <Text maxFontSizeMultiplier={1.1} style={styles.todayText}>
                          오늘
                        </Text>
                      </>
                    ) : null}
                  </View>
                  <Text maxFontSizeMultiplier={1.1} style={styles.weekDayText}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.rewardBanner}>
          <Image
            resizeMode="contain"
            source={require("../../assets/images/my-activity/conversation_history_weekly_reward.png")}
            style={styles.rewardIcon}
          />
          <Text maxFontSizeMultiplier={1.1} style={styles.rewardText}>
            이번주 모두 참여했어요. 오늘도 함께해요!
          </Text>
        </View>

        <View style={styles.band} />

        <View style={styles.monthHeader}>
          <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
            월별 참여 현황
          </Text>
          <View style={styles.monthMeta}>
            <Text maxFontSizeMultiplier={1.1} style={styles.monthText}>
              {currentYear}년 {currentMonth + 1}월
            </Text>
            <Ionicons
              color="#9F9F9F"
              name="chevron-down"
              size={scaled(18, scale)}
            />
          </View>
        </View>
        <View style={styles.monthCountRow}>
          <Text maxFontSizeMultiplier={1.1} style={styles.monthCountStrong}>
            8
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.monthCountMuted}>
            /{daysInCurrentMonth}일
          </Text>
        </View>

          <View style={styles.calendarCard}>
          <View style={styles.calendarWeekHeader}>
            {calendarWeekDays.map((day) => (
              <Text key={day} maxFontSizeMultiplier={1.1} style={styles.calendarWeekText}>
                {day}
              </Text>
            ))}
          </View>
          {calendarDates.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.calendarRow}>
              {row.map((calendarDate, index) => {
                const isOutsideMonth = calendarDate.monthOffset !== 0;
                const isToday =
                  calendarDate.monthOffset === 0 && calendarDate.date === currentDate;
                const isCompleted =
                  completedDates.has(calendarDate.date) && !isOutsideMonth && !isToday;
                return (
                  <View key={`${rowIndex}-${index}`} style={styles.calendarCell}>
                    <View
                      style={[
                        styles.dateCircle,
                        isCompleted && styles.dateCircleCompleted,
                        isToday && styles.dateCircleToday,
                      ]}
                    >
                      {isToday ? <DashedCircle color="#54E5AC" /> : null}
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={[
                          styles.dateText,
                          isCompleted && styles.dateTextCompleted,
                          isOutsideMonth && styles.dateTextMuted,
                        ]}
                      >
                        {calendarDate.date}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number,
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const horizontalPadding = Math.round(16 * Math.min(widthScale, 1.1));
  const contentWidth = screenWidth - horizontalPadding * 2;
  const fixed = (value: number) => Math.round(value * layoutScale);
  const vertical = (value: number) => Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) => fontScaled(value, Math.min(fontScale, layoutScale));
  const calendarCellWidth = Math.floor((contentWidth - fixed(22)) / 7);
  const weekCircleSize = fixed(36.5);
  const dateCircleSize = fixed(39.77);

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingTop: vertical(18),
    },
    scroller: {
      marginHorizontal: -horizontalPadding,
    },
    content: {
      paddingHorizontal: horizontalPadding,
      paddingBottom: vertical(240),
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      height: vertical(48),
      justifyContent: "space-between",
    },
    headerButton: {
      alignItems: "center",
      height: fixed(34),
      justifyContent: "center",
      width: fixed(34),
    },
    headerTitle: {
      color: "#6C6C6C",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
    },
    tabs: {
      flexDirection: "row",
      height: vertical(66),
      justifyContent: "center",
      position: "relative",
    },
    activeTab: {
      alignItems: "center",
      justifyContent: "flex-end",
      width: Math.round(contentWidth / 2),
    },
    inactiveTab: {
      alignItems: "center",
      justifyContent: "center",
      width: Math.round(contentWidth / 2),
    },
    activeTabText: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      marginBottom: vertical(16),
    },
    inactiveTabText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
    },
    activeTabBar: {
      backgroundColor: "#13BB78",
      height: fixed(2),
      width: fixed(148),
      zIndex: 1,
    },
    tabDivider: {
      alignSelf: "center",
      backgroundColor: "#F2F2F2",
      bottom: 0,
      height: fixed(1),
      position: "absolute",
      width: screenWidth,
    },
    sectionTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
    },
    todaySectionTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
      marginTop: vertical(30),
    },
    summaryCard: {
      alignItems: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      flexDirection: "row",
      height: fixed(97),
      marginTop: vertical(10),
      width: contentWidth,
    },
    summaryColumn: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    summaryLabel: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
    },
    summaryValueRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: vertical(7),
    },
    streakIcon: {
      height: fixed(29.17),
      marginRight: fixed(6),
      width: fixed(30),
    },
    bestIcon: {
      height: fixed(27.5),
      marginRight: fixed(6),
      width: fixed(29.78),
    },
    summaryNumber: {
      color: "#5D5D5D",
      fontFamily: "PretendardBold",
      fontSize: font(28),
      lineHeight: font(34),
    },
    summaryUnit: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
      lineHeight: font(27),
      marginLeft: fixed(2),
    },
    summaryDivider: {
      backgroundColor: "#F2F2F2",
      height: fixed(69),
      width: fixed(2),
    },
    band: {
      alignSelf: "center",
      backgroundColor: "#F8F8F8",
      height: vertical(8),
      marginTop: vertical(24),
      width: screenWidth,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(30),
    },
    weekCountStrong: {
      color: "#13BB78",
      fontFamily: "PretendardBold",
      fontSize: font(24),
    },
    weekCountMuted: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
    },
    weekCount: {
      lineHeight: font(28),
    },
    weekCard: {
      borderColor: "#D9D9D9",
      borderRadius: fixed(10),
      borderWidth: fixed(1),
      height: fixed(88),
      justifyContent: "center",
      marginTop: vertical(10),
      shadowColor: "#B6B6B6",
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.16,
      shadowRadius: 0,
      width: contentWidth,
    },
    weekIconRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    weekDayColumn: {
      alignItems: "center",
      width: fixed(39),
    },
    weekCircle: {
      alignItems: "center",
      aspectRatio: 1,
      backgroundColor: "#F2F2F2",
      borderRadius: weekCircleSize / 2,
      height: weekCircleSize,
      justifyContent: "center",
      width: weekCircleSize,
    },
    weekCircleCompleted: {
      backgroundColor: "#23CC89",
    },
    weekCircleToday: {
      backgroundColor: "#EBFCF5",
    },
    dailyIcon: {
      aspectRatio: 1,
      height: weekCircleSize,
      width: weekCircleSize,
    },
    todayText: {
      color: "#23CC89",
      fontFamily: "PretendardMedium",
      fontSize: font(13),
    },
    weekDayText: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      marginTop: vertical(5),
    },
    rewardBanner: {
      alignItems: "center",
      backgroundColor: "#EBFCF5",
      borderRadius: fixed(5),
      flexDirection: "row",
      height: fixed(44),
      marginTop: vertical(12),
      paddingHorizontal: fixed(10),
      width: contentWidth,
    },
    rewardIcon: {
      height: fixed(24),
      marginRight: fixed(8),
      width: fixed(24),
    },
    rewardText: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
    },
    monthHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(30),
    },
    monthMeta: {
      alignItems: "center",
      flexDirection: "row",
    },
    monthText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      marginRight: fixed(3),
    },
    monthCountRow: {
      alignItems: "baseline",
      flexDirection: "row",
      marginTop: vertical(5),
    },
    monthCountStrong: {
      color: "#13BB78",
      fontFamily: "PretendardBold",
      fontSize: font(36),
      lineHeight: font(42),
    },
    monthCountMuted: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
    },
    calendarCard: {
      borderColor: "#D9D9D9",
      borderRadius: fixed(10),
      borderWidth: fixed(1),
      height: fixed(318),
      marginTop: vertical(8),
      paddingHorizontal: fixed(11),
      paddingTop: vertical(12),
      width: contentWidth,
    },
    calendarWeekHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: vertical(12),
    },
    calendarWeekText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18.1),
      textAlign: "center",
      width: calendarCellWidth,
    },
    calendarRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: vertical(12),
    },
    calendarCell: {
      alignItems: "center",
      width: calendarCellWidth,
    },
    dateCircle: {
      alignItems: "center",
      aspectRatio: 1,
      borderRadius: dateCircleSize / 2,
      height: dateCircleSize,
      justifyContent: "center",
      width: dateCircleSize,
    },
    dateCircleCompleted: {
      backgroundColor: "#23CC89",
    },
    dateCircleToday: {
      backgroundColor: "#EBFCF5",
    },
    dateText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(14.08),
    },
    dateTextCompleted: {
      color: "#FFFFFF",
    },
    dateTextMuted: {
      color: "#BDBDBD",
    },
  });
};
