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
const topPlaces = [
  { count: "12번 갔어요.", name: "이마트 강남점", rank: 1 },
  { count: "10번 갔어요.", name: "투썸플레이스 역삼점", rank: 2 },
  { count: "7번 갔어요.", name: "서울내과의원", rank: 3 },
];
const activityBars = [
  { color: "#9BEED0", hour: "3", value: 40 },
  { color: "#54DFA7", hour: "6", value: 70 },
  { color: "#54DFA7", hour: "9", value: 80 },
  { color: "#23CC89", hour: "12", value: 100 },
  { color: "#54DFA7", hour: "15", value: 62 },
  { color: "#9BEED0", hour: "21", value: 52 },
];
const activityTicks = [
  { label: "12", period: "오전" },
  { barKey: "3", label: "3" },
  { barKey: "6", label: "6" },
  { barKey: "9", label: "9" },
  { barKey: "12", label: "12", period: "오후" },
  { barKey: "15", label: "15" },
  { label: "18" },
  { barKey: "21", label: "21" },
  { label: "24" },
];
const spendingCategories: {
  amount: string;
  icon: ImageSourcePropType;
  name: string;
  percent: string;
}[] = [
  {
    amount: "56,200원",
    icon: require("../../assets/images/my-activity/consumption_activity_cafe_snack.png"),
    name: "카페 · 간식",
    percent: "35.4%",
  },
  {
    amount: "28,200원",
    icon: require("../../assets/images/my-activity/consumption_activity_health_fitness.png"),
    name: "의료 · 건강 · 피트니스",
    percent: "15.8%",
  },
  {
    amount: "34,200원",
    icon: require("../../assets/images/my-activity/consumption_activity_convenience_mart.png"),
    name: "편의점 · 마트 · 잡화",
    percent: "25.4%",
  },
  {
    amount: "12,000원",
    icon: require("../../assets/images/my-activity/consumption_activity_transport_vehicle.png"),
    name: "교통 · 자동차",
    percent: "9.6%",
  },
  {
    amount: "9,800원",
    icon: require("../../assets/images/my-activity/consumption_activity_uncategorized.png"),
    name: "카테고리 없음",
    percent: "5.1%",
  },
];

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
  const [activeTab, setActiveTab] = useState<"conversation" | "consumption">("conversation");
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
            <Pressable
              onPress={() => setActiveTab("conversation")}
              style={styles.tabButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.tabText,
                  activeTab === "conversation" ? styles.activeTabText : styles.inactiveTabText,
                ]}
              >
                대화 기록
              </Text>
              {activeTab === "conversation" ? <View style={styles.activeTabBar} /> : null}
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("consumption")}
              style={styles.tabButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.tabText,
                  activeTab === "consumption" ? styles.activeTabText : styles.inactiveTabText,
                ]}
              >
                소비 기록
              </Text>
              {activeTab === "consumption" ? <View style={styles.activeTabBar} /> : null}
            </Pressable>
          </View>

          {activeTab === "conversation" ? (
            <>
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
            </>
          ) : (
            <ConsumptionHistoryContent styles={styles} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ConsumptionHistoryContent({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <View style={styles.consumptionSectionHeader}>
        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          자주 간 곳 TOP3
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={styles.referenceText}>
          전날 오후 11:59 기준
        </Text>
      </View>

      <View style={styles.topPlaceCard}>
        {topPlaces.map((place) => (
          <View key={place.rank} style={styles.topPlaceRow}>
            <View style={styles.rankBadge}>
              <Text maxFontSizeMultiplier={1.1} style={styles.rankText}>
                {place.rank}
              </Text>
            </View>
            <Text
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              style={styles.topPlaceName}
            >
              {place.name}
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.topPlaceCount}>
              {place.count}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.band} />

      <View style={styles.consumptionSectionHeader}>
        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          시간대 별 활동
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={styles.referenceText}>
          전날 오후 11:59 기준
        </Text>
      </View>

      <View style={styles.activityChartCard}>
        <View style={styles.chartPlot}>
          <View pointerEvents="none" style={styles.chartGridLayer}>
            {Array.from({ length: activityTicks.length - 1 }).map((_, index) => (
              <View
                key={`grid-line-${index}`}
                style={[styles.chartGridLine, { left: `${((index + 1) / 9) * 100}%` }]}
              />
            ))}
          </View>
          {activityTicks.map((tick, index) => {
            const bar = activityBars.find((item) => item.hour === tick.barKey);
            return (
              <View key={`bar-${tick.label}-${index}`} style={styles.activitySlot}>
                {bar ? (
                  <View
                    style={[
                      styles.activityBar,
                      {
                        backgroundColor: bar.color,
                        height: `${bar.value}%`,
                      },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={styles.chartAxis}>
          {activityTicks.map((tick, index) => (
            <Text
              key={`hour-${tick.label}-${index}`}
              maxFontSizeMultiplier={1.1}
              style={styles.chartHour}
            >
              {tick.label}
            </Text>
          ))}
        </View>
        <View style={styles.dayPartRow}>
          {activityTicks.map((tick, index) => (
            <Text
              key={`period-${tick.label}-${index}`}
              maxFontSizeMultiplier={1.1}
              style={styles.dayPartText}
            >
              {tick.period ?? ""}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.activityTipBox}>
        <Image
          resizeMode="contain"
          source={require("../../assets/images/my-activity/consumption_activity_search.png")}
          style={styles.activityTipIcon}
        />
        <Text maxFontSizeMultiplier={1.1} style={styles.activityTipText}>
          낮 12시에 가장 활발하게 활동해요.
        </Text>
      </View>

      <View style={styles.band} />

      <View style={styles.monthlySpendingHeader}>
        <View style={styles.monthTitleRow}>
          <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
            월별 소비 내역
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.spendingMonthText}>
            6월
          </Text>
          <Ionicons color="#9F9F9F" name="chevron-down" size={16} />
        </View>
      </View>

      <View style={styles.spendingBar}>
        <View style={[styles.spendingSegment, styles.spendingSegmentFirst, { flex: 35.4 }]} />
        <View style={[styles.spendingSegment, { backgroundColor: "#23CC89", flex: 25.4 }]} />
        <View style={[styles.spendingSegment, { backgroundColor: "#54DFA7", flex: 15.8 }]} />
        <View style={[styles.spendingSegment, { backgroundColor: "#9BEED0", flex: 9.6 }]} />
        <View style={[styles.spendingSegment, styles.spendingSegmentLast, { flex: 13.8 }]} />
      </View>
      <Text maxFontSizeMultiplier={1.1} style={styles.totalAmountText}>
        334,590원
      </Text>

      <View style={styles.categoryList}>
        {spendingCategories.map((category) => (
          <View key={category.name} style={styles.categoryRow}>
            <Image resizeMode="contain" source={category.icon} style={styles.categoryIcon} />
            <View style={styles.categoryTextBox}>
              <Text
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.categoryName}
              >
                {category.name}
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.categoryPercent}>
                {category.percent}
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.1} style={styles.categoryAmount}>
              {category.amount}
            </Text>
          </View>
        ))}
      </View>
    </>
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
    tabButton: {
      alignItems: "center",
      justifyContent: "flex-end",
      width: Math.round(contentWidth / 2),
    },
    tabText: {
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      marginBottom: vertical(16),
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
    },
    inactiveTabText: {
      color: "#9F9F9F",
    },
    activeTabBar: {
      backgroundColor: "#13BB78",
      borderRadius: fixed(2),
      height: fixed(3),
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
    consumptionSectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(30),
      width: contentWidth,
    },
    referenceText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
    },
    topPlaceCard: {
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      height: fixed(132),
      justifyContent: "center",
      marginTop: vertical(12),
      paddingHorizontal: fixed(18),
      width: contentWidth,
    },
    topPlaceRow: {
      alignItems: "center",
      flexDirection: "row",
      height: fixed(36),
    },
    rankBadge: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: fixed(12),
      height: fixed(24),
      justifyContent: "center",
      marginRight: fixed(16),
      shadowColor: "#000000",
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.14,
      shadowRadius: 4,
      width: fixed(24),
    },
    rankText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
    },
    topPlaceName: {
      color: "#353535",
      flex: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
    },
    topPlaceCount: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: font(17),
      marginLeft: fixed(12),
      textAlign: "right",
    },
    activityChartCard: {
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      height: fixed(214),
      marginTop: vertical(16),
      paddingHorizontal: fixed(14),
      paddingTop: vertical(14),
      width: contentWidth,
    },
    chartPlot: {
      alignItems: "flex-end",
      borderColor: "#D9D9D9",
      borderWidth: fixed(1),
      flexDirection: "row",
      height: fixed(146),
      overflow: "hidden",
      paddingTop: vertical(16),
      position: "relative",
    },
    chartGridLine: {
      borderColor: "#D9D9D9",
      borderLeftWidth: fixed(1),
      borderStyle: "dashed",
      height: "100%",
      position: "absolute",
      width: fixed(1),
    },
    chartGridLayer: {
      bottom: 0,
      flexDirection: "row",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    activitySlot: {
      alignItems: "center",
      alignSelf: "stretch",
      flex: 1,
      justifyContent: "flex-end",
      zIndex: 1,
    },
    activityBar: {
      borderTopLeftRadius: fixed(10),
      borderTopRightRadius: fixed(10),
      width: fixed(18),
    },
    chartAxis: {
      flexDirection: "row",
      marginTop: vertical(4),
    },
    chartHour: {
      color: "#000000",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      flex: 1,
      lineHeight: font(19),
      textAlign: "center",
    },
    dayPartRow: {
      height: fixed(18),
      marginTop: vertical(3),
      flexDirection: "row",
    },
    dayPartText: {
      color: "#BDBDBD",
      fontFamily: "PretendardMedium",
      fontSize: font(13),
      flex: 1,
      lineHeight: font(16),
      textAlign: "center",
    },
    activityTipBox: {
      alignItems: "center",
      backgroundColor: "#FFF6DA",
      borderRadius: fixed(5),
      flexDirection: "row",
      height: fixed(44),
      marginTop: vertical(16),
      paddingHorizontal: fixed(14),
      width: contentWidth,
    },
    activityTipIcon: {
      height: fixed(26),
      marginRight: fixed(10),
      width: fixed(26),
    },
    activityTipText: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: font(16),
    },
    monthlySpendingHeader: {
      marginTop: vertical(30),
      width: contentWidth,
    },
    monthTitleRow: {
      alignItems: "center",
      flexDirection: "row",
    },
    spendingMonthText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      marginLeft: fixed(8),
      marginRight: fixed(2),
    },
    spendingBar: {
      borderRadius: fixed(10),
      flexDirection: "row",
      height: fixed(32),
      marginTop: vertical(18),
      overflow: "hidden",
      width: contentWidth,
    },
    spendingSegment: {
      backgroundColor: "#13BB78",
      height: "100%",
    },
    spendingSegmentFirst: {
      borderBottomLeftRadius: fixed(10),
      borderTopLeftRadius: fixed(10),
    },
    spendingSegmentLast: {
      backgroundColor: "#E5E5E5",
      borderBottomRightRadius: fixed(10),
      borderTopRightRadius: fixed(10),
    },
    totalAmountText: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: font(26),
      lineHeight: font(34),
      marginTop: vertical(10),
      textAlign: "right",
      width: contentWidth,
    },
    categoryList: {
      marginTop: vertical(22),
      width: contentWidth,
    },
    categoryRow: {
      alignItems: "center",
      flexDirection: "row",
      marginBottom: vertical(28),
      width: contentWidth,
    },
    categoryIcon: {
      height: fixed(40),
      marginRight: fixed(14),
      width: fixed(40),
    },
    categoryTextBox: {
      flex: 1,
      minWidth: 0,
    },
    categoryName: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
    },
    categoryPercent: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(21),
      marginTop: vertical(1),
    },
    categoryAmount: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
      marginLeft: fixed(12),
      minWidth: fixed(88),
      textAlign: "right",
    },
  });
};
