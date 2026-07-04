import {
  fontScaled,
  getFontScale,
  getScreenScale,
  scaled,
} from "@/constants/responsive";
import { apiGet } from "@/lib/api";
import { useStats } from "@/lib/stats";
import type {
  MonthCount,
  RecallSessionListItem,
  RecallSessionResponse,
  SpendingStats,
} from "@/lib/types";
import { goBackToPreviousScreen } from "@/utils/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
const calendarWeekDays = ["월", "화", "수", "목", "금", "토", "일"];
// 시간대 차트는 0–23시를 3시간 버킷으로 묶어 보여준다.
const BUCKET_STARTS = [0, 3, 6, 9, 12, 15, 18, 21];
const activityTicks: { bucketStart?: number; label: string; period?: string }[] =
  [
    { bucketStart: 0, label: "12", period: "오전" },
    { bucketStart: 3, label: "3" },
    { bucketStart: 6, label: "6" },
    { bucketStart: 9, label: "9" },
    { bucketStart: 12, label: "12", period: "오후" },
    { bucketStart: 15, label: "15" },
    { bucketStart: 18, label: "18" },
    { bucketStart: 21, label: "21" },
    { label: "24" },
  ];
// 카테고리별 소비 막대 색(금액 내림차순으로 순환). 마지막 회색은 미사용 시 inline으로 덮어쓴다.
const SEGMENT_COLORS = ["#13BB78", "#23CC89", "#54DFA7", "#9BEED0", "#E5E5E5"];
const uncategorizedIcon = require("../../assets/images/my-activity/consumption_activity_uncategorized.png");

function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatPercent(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";
}

// 가장 활발한 시간(0–23)을 한국어 라벨로. 활동이 없으면 호출하지 않는다.
function formatPeakHour(hour: number): string {
  if (hour === 0) {
    return "자정";
  }
  if (hour === 12) {
    return "낮 12시";
  }
  return hour < 12 ? `오전 ${hour}시` : `오후 ${hour - 12}시`;
}

// 막대 높이 비율(0–1)에 따른 농도 색.
function activityBarColor(ratio: number): string {
  if (ratio >= 0.8) {
    return "#23CC89";
  }
  if (ratio >= 0.5) {
    return "#54DFA7";
  }
  return "#9BEED0";
}

type CalendarDate = {
  date: number;
  monthOffset: -1 | 0 | 1;
};
type ActivityTab = "conversation" | "consumption";

type RecallScoreState = Pick<
  RecallSessionResponse,
  | "score_memory_accuracy"
  | "score_memory_specificity"
  | "score_fluency_silence"
  | "score_fluency_rate"
  | "score_fluency_filler"
  | "score_prosody_pitch"
  | "score_prosody_spectrum"
  | "anomaly_penalty"
  | "final_score"
  | "score_detail"
  | "image_url"
  | "title"
  | "summary"
>;

function getSessionTime(session: RecallSessionListItem): number {
  const time = new Date(session.session_date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getLatestCompletedSession(
  sessions: RecallSessionListItem[] | undefined
): RecallSessionListItem | null {
  return (sessions ?? [])
    .filter((session) => session.status === "completed")
    .reduce<RecallSessionListItem | null>((latest, session) => {
      if (!latest) {
        return session;
      }
      return getSessionTime(session) > getSessionTime(latest)
        ? session
        : latest;
    }, null);
}

function toRecallScoreState(
  session: RecallSessionResponse
): RecallScoreState {
  return {
    anomaly_penalty: session.anomaly_penalty,
    final_score: session.final_score,
    image_url: session.image_url,
    score_detail: session.score_detail,
    score_fluency_filler: session.score_fluency_filler,
    score_fluency_rate: session.score_fluency_rate,
    score_fluency_silence: session.score_fluency_silence,
    score_memory_accuracy: session.score_memory_accuracy,
    score_memory_specificity: session.score_memory_specificity,
    score_prosody_pitch: session.score_prosody_pitch,
    score_prosody_spectrum: session.score_prosody_spectrum,
    summary: session.summary,
    title: session.title,
  };
}

function DashedCircle({ color }: { color: string }) {
  return (
    <Svg
      height="100%"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      width="100%"
    >
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
    cells.push({
      date: cells.length - firstDayIndex - daysInMonth + 1,
      monthOffset: 1,
    });
  }

  const rows: CalendarDate[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
};

export default function MyActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("conversation");
  const [visibleTab, setVisibleTab] = useState<ActivityTab>("conversation");
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const tabIndicatorProgress = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const tabIndicatorTravel = Math.round(
    (width - Math.round(16 * Math.min(width / BASE_WIDTH, 1.1)) * 2) / 2
  );
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width]
  );
  const today = useMemo(() => new Date(), []);
  const todayWeekIndex = today.getDay();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  // 선택 월(0-based). 기본은 이번 달. 월 전환 시 이 값만 바뀐다.
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // 이번 달 기준 통계: 연속 일수·최고 기록·이번주 참여·월 목록("지금", 선택 월과 무관).
  const { data: nowStatsData } = useStats(currentYear, currentMonth + 1);
  // 선택 월 기준 통계: 월별 참여 달력·월별 소비. 선택=현재면 위와 같은 캐시를 공유한다.
  const { data: monthStatsData } = useStats(selectedYear, selectedMonth + 1);
  const [recallScore, setRecallScore] = useState<RecallScoreState | null>(
    null
  );
  const { data: recallSessions, isSuccess: isRecallSessionsSuccess } =
    useQuery({
      queryKey: ["recall-sessions"],
      queryFn: () => apiGet<RecallSessionListItem[]>("/recall/sessions"),
      retry: false,
      staleTime: 1000 * 60 * 5,
    });
  const latestCompletedSession = useMemo(
    () => getLatestCompletedSession(recallSessions),
    [recallSessions]
  );
  const latestCompletedSessionId = latestCompletedSession?.id ?? null;
  const { data: recallSessionDetail, isError: isRecallSessionDetailError } =
    useQuery({
      queryKey: ["recall-session-detail", latestCompletedSessionId],
      queryFn: () =>
        apiGet<RecallSessionResponse>(
          `/recall/sessions/${latestCompletedSessionId}`
        ),
      enabled: latestCompletedSessionId != null,
      retry: false,
      staleTime: 1000 * 60 * 5,
    });

  const engagementNow = nowStatsData?.engagement;
  const engagementSelected = monthStatsData?.engagement;
  const spending = monthStatsData?.spending;

  const currentStreak = engagementNow?.current_streak ?? 0;
  const bestStreak = engagementNow?.best_streak ?? 0;
  const hasNoCompletedRecall =
    isRecallSessionsSuccess && latestCompletedSessionId == null;
  const shouldShowRecallScore =
    recallScore != null && !isRecallSessionDetailError;

  useEffect(() => {
    if (recallSessionDetail) {
      setRecallScore(toRecallScoreState(recallSessionDetail));
      return;
    }
    if (latestCompletedSessionId == null || isRecallSessionDetailError) {
      setRecallScore(null);
    }
  }, [
    isRecallSessionDetailError,
    latestCompletedSessionId,
    recallSessionDetail,
  ]);

  // 이번주(일~토) 참여 여부. 이번 달 참여일과 대조한다(전달로 넘어간 날은 미참여 처리).
  const participatedThisMonth = engagementNow?.participation.participated_days;
  const completedWeekDays = useMemo(() => {
    const days = new Set(participatedThisMonth ?? []);
    const completed: number[] = [];
    for (let index = 0; index < 7; index += 1) {
      const cellDate = new Date(
        currentYear,
        currentMonth,
        currentDate - todayWeekIndex + index
      );
      const inCurrentMonth =
        cellDate.getFullYear() === currentYear &&
        cellDate.getMonth() === currentMonth;
      if (inCurrentMonth && index <= todayWeekIndex && days.has(cellDate.getDate())) {
        completed.push(index);
      }
    }
    return completed;
  }, [
    currentDate,
    currentMonth,
    currentYear,
    participatedThisMonth,
    todayWeekIndex,
  ]);

  // 이번주 지난 날(오늘 포함)을 모두 참여했을 때만 칭찬 배너를 보여준다.
  const allElapsedCompleted =
    completedWeekDays.length > 0 &&
    Array.from({ length: todayWeekIndex + 1 }, (_, index) => index).every(
      (index) => completedWeekDays.includes(index)
    );

  const isSelectedCurrentMonth =
    selectedYear === currentYear && selectedMonth === currentMonth;
  const daysInSelectedMonth = getDaysInMonth(selectedYear, selectedMonth);
  const calendarDates = useMemo(
    () => createCalendarDates(selectedYear, selectedMonth),
    [selectedMonth, selectedYear]
  );
  const participatedSelected = useMemo(
    () => new Set(engagementSelected?.participation.participated_days ?? []),
    [engagementSelected?.participation.participated_days]
  );
  const monthParticipationCount = engagementSelected?.participation.count ?? 0;

  // 월 선택 칩 목록(최신순). 이번 달이 빠져 있으면 항상 돌아올 수 있게 앞에 끼운다.
  const availableMonths = useMemo<MonthCount[]>(() => {
    const months = engagementNow?.available_months ?? [];
    const hasCurrent = months.some(
      (month) => month.year === currentYear && month.month === currentMonth + 1
    );
    if (hasCurrent) {
      return months;
    }
    return [
      {
        days: engagementNow?.participation.count ?? 0,
        month: currentMonth + 1,
        year: currentYear,
      },
      ...months,
    ];
  }, [currentMonth, currentYear, engagementNow]);

  const selectMonth = (year: number, month1Based: number) => {
    setSelectedYear(year);
    setSelectedMonth(month1Based - 1);
    setIsMonthPickerOpen(false);
  };
  // 월별 참여 현황: 이번 달을 기준으로 좌우 화살표로 월을 이동한다(미래로는 이동 불가).
  const changeMonth = (delta: number) => {
    const base = new Date(selectedYear, selectedMonth + delta, 1);
    const nextYear = base.getFullYear();
    const nextMonth = base.getMonth();
    if (
      nextYear > currentYear ||
      (nextYear === currentYear && nextMonth > currentMonth)
    ) {
      return;
    }
    setSelectedYear(nextYear);
    setSelectedMonth(nextMonth);
  };
  const selectTab = (nextTab: ActivityTab) => {
    if (nextTab === activeTab) {
      return;
    }

    setActiveTab(nextTab);
    tabIndicatorProgress.stopAnimation();
    Animated.timing(tabIndicatorProgress, {
      duration: 140,
      toValue: nextTab === "conversation" ? 0 : 1,
      useNativeDriver: true,
    }).start();
    tabContentOpacity.stopAnimation();
    Animated.timing(tabContentOpacity, {
      duration: 90,
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setVisibleTab(nextTab);
      Animated.timing(tabContentOpacity, {
        duration: 160,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
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
            <Animated.View
              style={[
                styles.activeTabIndicator,
                {
                  transform: [
                    {
                      translateX: tabIndicatorProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, tabIndicatorTravel],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Pressable
              onPress={() => selectTab("conversation")}
              style={styles.tabButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.tabText,
                  activeTab === "conversation"
                    ? styles.activeTabText
                    : styles.inactiveTabText,
                ]}
              >
                대화 기록
              </Text>
              <View style={styles.tabBarSlot} />
            </Pressable>
            <Pressable
              onPress={() => selectTab("consumption")}
              style={styles.tabButton}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.tabText,
                  activeTab === "consumption"
                    ? styles.activeTabText
                    : styles.inactiveTabText,
                ]}
              >
                소비 기록
              </Text>
              <View style={styles.tabBarSlot} />
            </Pressable>
          </View>

          <Animated.View
            style={[styles.tabContent, { opacity: tabContentOpacity }]}
          >
            {visibleTab === "conversation" ? (
              <>
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={styles.todaySectionTitle}
                >
                  오늘의 대화 기록
                </Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryColumn}>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.summaryLabel}
                    >
                      현재 연속 일수
                    </Text>
                    <View style={styles.summaryValueRow}>
                      <Image
                        resizeMode="contain"
                        source={require("../../assets/images/my-activity/conversation_history_streak.png")}
                        style={styles.streakIcon}
                      />
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.summaryNumber}
                      >
                        {currentStreak}
                      </Text>
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.summaryUnit}
                      >
                        일째
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryColumn}>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.summaryLabel}
                    >
                      최고 기록
                    </Text>
                    <View style={styles.summaryValueRow}>
                      <Image
                        resizeMode="contain"
                        source={require("../../assets/images/my-activity/conversation_history_best_record.png")}
                        style={styles.bestIcon}
                      />
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.summaryNumber}
                      >
                        {bestStreak}
                      </Text>
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.summaryUnit}
                      >
                        일
                      </Text>
                    </View>
                  </View>
                </View>

                {shouldShowRecallScore ? (
                  <View style={styles.recallReportCard}>
                    <View style={styles.recallReportHeader}>
                      <View style={styles.recallReportTitleBox}>
                        <Text
                          maxFontSizeMultiplier={1.1}
                          style={styles.recallReportLabel}
                        >
                          안전 리포트
                        </Text>
                        <Text
                          maxFontSizeMultiplier={1.1}
                          numberOfLines={1}
                          style={styles.recallReportTitle}
                        >
                          {recallScore.title ?? "최근 회상 결과"}
                        </Text>
                      </View>
                      <View style={styles.recallScoreBadge}>
                        <Text
                          maxFontSizeMultiplier={1.1}
                          style={styles.recallScoreValue}
                        >
                          {recallScore.final_score ?? "-"}
                        </Text>
                      </View>
                    </View>
                    {recallScore.summary ? (
                      <Text
                        maxFontSizeMultiplier={1.1}
                        numberOfLines={2}
                        style={styles.recallReportSummary}
                      >
                        {recallScore.summary}
                      </Text>
                    ) : null}
                  </View>
                ) : hasNoCompletedRecall ? (
                  <View style={styles.recallEmptyCard}>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.recallEmptyText}
                    >
                      회상 결과가 없습니다.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.band} />

                <View style={styles.sectionHeader}>
                  <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
                    이번주 참여 현황
                  </Text>
                  <Text maxFontSizeMultiplier={1.1} style={styles.weekCount}>
                    <Text style={styles.weekCountStrong}>
                      {completedWeekDays.length}
                    </Text>
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
                                <Text
                                  maxFontSizeMultiplier={1.1}
                                  style={styles.todayText}
                                >
                                  오늘
                                </Text>
                              </>
                            ) : null}
                          </View>
                          <Text
                            maxFontSizeMultiplier={1.1}
                            style={styles.weekDayText}
                          >
                            {day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {allElapsedCompleted ? (
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
                ) : null}

                <View style={styles.band} />

                <View style={styles.monthHeader}>
                  <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
                    월별 참여 현황
                  </Text>
                </View>
                <View style={styles.monthCountRow}>
                  <View style={styles.monthCount}>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.monthCountStrong}
                    >
                      {monthParticipationCount}
                    </Text>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.monthCountMuted}
                    >
                      /{daysInSelectedMonth}일
                    </Text>
                  </View>
                  <View style={styles.monthMeta}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => changeMonth(-1)}
                      style={styles.monthArrow}
                    >
                      <Ionicons
                        color="#9F9F9F"
                        name="caret-back"
                        size={styles.monthArrowSize}
                      />
                    </Pressable>
                    <Text maxFontSizeMultiplier={1.1} style={styles.monthText}>
                      {selectedMonth + 1}월
                    </Text>
                    <Pressable
                      disabled={isSelectedCurrentMonth}
                      hitSlop={8}
                      onPress={() => changeMonth(1)}
                      style={styles.monthArrow}
                    >
                      <Ionicons
                        color={isSelectedCurrentMonth ? "#D8D8D8" : "#9F9F9F"}
                        name="caret-forward"
                        size={styles.monthArrowSize}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.calendarCard}>
                  <View style={styles.calendarWeekHeader}>
                    {calendarWeekDays.map((day) => (
                      <Text
                        key={day}
                        maxFontSizeMultiplier={1.1}
                        style={styles.calendarWeekText}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>
                  {calendarDates.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.calendarRow}>
                      {row.map((calendarDate, index) => {
                        const isOutsideMonth = calendarDate.monthOffset !== 0;
                        const isToday =
                          isSelectedCurrentMonth &&
                          calendarDate.monthOffset === 0 &&
                          calendarDate.date === currentDate;
                        const isCompleted =
                          participatedSelected.has(calendarDate.date) &&
                          !isOutsideMonth &&
                          !isToday;
                        return (
                          <View
                            key={`${rowIndex}-${index}`}
                            style={styles.calendarCell}
                          >
                            <View
                              style={[
                                styles.dateCircle,
                                isCompleted && styles.dateCircleCompleted,
                                isToday && styles.dateCircleToday,
                              ]}
                            >
                              {isToday ? (
                                <DashedCircle color="#54E5AC" />
                              ) : null}
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
              <ConsumptionHistoryContent
                onOpenMonthPicker={() => setIsMonthPickerOpen(true)}
                selectedMonth={selectedMonth}
                spending={spending}
                styles={styles}
              />
            )}
          </Animated.View>
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMonthPickerOpen(false)}
        transparent
        visible={isMonthPickerOpen}
      >
        <Pressable
          onPress={() => setIsMonthPickerOpen(false)}
          style={styles.pickerOverlay}
        >
          <Pressable style={styles.pickerSheet}>
            <Text maxFontSizeMultiplier={1.1} style={styles.pickerTitle}>
              월 선택
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.pickerList}
            >
              {availableMonths.map((month) => {
                const isActive =
                  month.year === selectedYear &&
                  month.month === selectedMonth + 1;
                return (
                  <Pressable
                    key={`${month.year}-${month.month}`}
                    onPress={() => selectMonth(month.year, month.month)}
                    style={styles.pickerRow}
                  >
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={[
                        styles.pickerRowText,
                        isActive && styles.pickerRowTextActive,
                      ]}
                    >
                      {month.year}년 {month.month}월
                    </Text>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.pickerRowMeta}
                    >
                      {month.days}일 참여
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ConsumptionHistoryContent({
  onOpenMonthPicker,
  selectedMonth,
  spending,
  styles,
}: {
  onOpenMonthPicker: () => void;
  selectedMonth: number;
  spending: SpendingStats | undefined;
  styles: ReturnType<typeof createStyles>;
}) {
  const topPlaces = (spending?.top_merchants ?? []).map((merchant, index) => ({
    count: `${merchant.count}번 갔어요.`,
    name: merchant.merchant,
    rank: index + 1,
  }));

  // 시간대 활동: 0–23시 건수를 3시간 버킷으로 합산하고 가장 바쁜 시간을 찾는다.
  const hourly = spending?.hourly_activity;
  const { buckets, maxBucket, peakHour } = useMemo(() => {
    const counts = new Array<number>(24).fill(0);
    for (const item of hourly ?? []) {
      if (item.hour >= 0 && item.hour < 24) {
        counts[item.hour] = item.count;
      }
    }
    const bucketMap = new Map<number, number>();
    for (const start of BUCKET_STARTS) {
      bucketMap.set(
        start,
        counts[start] + counts[start + 1] + counts[start + 2]
      );
    }
    let peak = -1;
    let peakCount = 0;
    counts.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peak = hour;
      }
    });
    return {
      buckets: bucketMap,
      maxBucket: Math.max(1, ...bucketMap.values()),
      peakHour: peak,
    };
  }, [hourly]);

  const categories = spending?.monthly_by_category.categories ?? [];
  const monthTotal = spending?.monthly_by_category.total_amount ?? 0;

  // 소비 데이터는 전날 오후 11:59 기준 집계라, "전날" 대신 실제 어제 날짜를 노출한다.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const referenceLabel = `${yesterday.getMonth() + 1}월 ${yesterday.getDate()}일 오후 11:59 기준`;

  return (
    <>
      <View style={styles.consumptionSectionHeader}>
        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          자주 간 곳 TOP3
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={styles.referenceText}>
          {referenceLabel}
        </Text>
      </View>

      <View style={styles.topPlaceCard}>
        {topPlaces.length > 0 ? (
          topPlaces.map((place) => (
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
          ))
        ) : (
          <Text maxFontSizeMultiplier={1.1} style={styles.emptyHint}>
            아직 자주 간 곳이 없어요
          </Text>
        )}
      </View>

      <View style={styles.band} />

      <View style={styles.consumptionSectionHeader}>
        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          시간대 별 활동
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={styles.referenceText}>
          {referenceLabel}
        </Text>
      </View>

      <View style={styles.activityChartCard}>
        <View style={styles.chartPlot}>
          <View pointerEvents="none" style={styles.chartGridLayer}>
            {Array.from({ length: activityTicks.length - 1 }).map(
              (_, index) => (
                <View
                  key={`grid-line-${index}`}
                  style={[
                    styles.chartGridLine,
                    { left: `${((index + 1) / 9) * 100}%` },
                  ]}
                />
              )
            )}
          </View>
          {activityTicks.map((tick, index) => {
            const value =
              tick.bucketStart != null ? buckets.get(tick.bucketStart) ?? 0 : 0;
            const ratio = value / maxBucket;
            return (
              <View
                key={`bar-${tick.label}-${index}`}
                style={styles.activitySlot}
              >
                {value > 0 ? (
                  <View
                    style={[
                      styles.activityBar,
                      {
                        backgroundColor: activityBarColor(ratio),
                        height: `${Math.max(ratio * 100, 6)}%`,
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

      {peakHour >= 0 ? (
        <View style={styles.activityTipBox}>
          <Image
            resizeMode="contain"
            source={require("../../assets/images/my-activity/consumption_activity_search.png")}
            style={styles.activityTipIcon}
          />
          <Text maxFontSizeMultiplier={1.1} style={styles.activityTipText}>
            {formatPeakHour(peakHour)}에 가장 활발하게 활동해요.
          </Text>
        </View>
      ) : null}

      <View style={styles.band} />

      <View style={styles.monthlySpendingHeader}>
        <Pressable onPress={onOpenMonthPicker} style={styles.monthTitleRow}>
          <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
            월별 소비 내역
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.spendingMonthText}>
            {selectedMonth + 1}월
          </Text>
          <Ionicons color="#9F9F9F" name="chevron-down" size={16} />
        </Pressable>
      </View>

      {categories.length > 0 ? (
        <>
          <View style={styles.spendingBar}>
            {categories.map((category, index) => (
              <View
                key={`segment-${index}`}
                style={[
                  styles.spendingSegment,
                  index === 0 && styles.spendingSegmentFirst,
                  index === categories.length - 1 && styles.spendingSegmentLast,
                  {
                    backgroundColor:
                      SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                    flex: Math.max(category.total_amount, 1),
                  },
                ]}
              />
            ))}
          </View>
          <Text maxFontSizeMultiplier={1.1} style={styles.totalAmountText}>
            {formatKRW(monthTotal)}
          </Text>

          <View style={styles.categoryList}>
            {categories.map((category, index) => (
              <View key={`cat-${index}`} style={styles.categoryRow}>
                <Image
                  resizeMode="contain"
                  source={uncategorizedIcon}
                  style={styles.categoryIcon}
                />
                <View style={styles.categoryTextBox}>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    style={styles.categoryName}
                  >
                    {category.category ?? "카테고리 없음"}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.categoryPercent}
                  >
                    {formatPercent(category.total_amount, monthTotal)}
                  </Text>
                </View>
                <Text maxFontSizeMultiplier={1.1} style={styles.categoryAmount}>
                  {formatKRW(category.total_amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text
          maxFontSizeMultiplier={1.1}
          style={[styles.emptyHint, styles.spendingEmpty]}
        >
          이 달 소비 내역이 없어요
        </Text>
      )}
    </>
  );
}

const createStyles = (
  scale: number,
  fontScale: number,
  screenWidth: number,
  screenHeight: number
) => {
  const widthScale = screenWidth / BASE_WIDTH;
  const heightScale = screenHeight / BASE_HEIGHT;
  const layoutScale = Math.min(widthScale, heightScale, 1.04);
  const horizontalPadding = Math.round(16 * Math.min(widthScale, 1.1));
  const contentWidth = screenWidth - horizontalPadding * 2;
  const fixed = (value: number) => Math.round(value * layoutScale);
  const vertical = (value: number) =>
    Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) =>
    fontScaled(value, Math.min(fontScale, layoutScale));
  const calendarCellWidth = Math.floor((contentWidth - fixed(22)) / 7);
  const weekCircleSize = fixed(36.5);
  const dateCircleSize = fixed(39.77);
  // 월 선택 삼각형: 402×874 기준 18을 폰트와 동일한 반응형 스케일로 노출한다.
  const monthArrowSize = font(18);

  const styles = StyleSheet.create({
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
      fontFamily: "PretendardSemiBold",
    },
    inactiveTabText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
    },
    activeTabIndicator: {
      backgroundColor: "#13BB78",
      borderRadius: fixed(2),
      bottom: 0,
      height: fixed(3),
      left: Math.round(contentWidth / 4 - fixed(148) / 2),
      position: "absolute",
      width: fixed(148),
      zIndex: 1,
    },
    tabBarSlot: {
      backgroundColor: "transparent",
      height: fixed(3),
      width: fixed(148),
    },
    tabDivider: {
      alignSelf: "center",
      backgroundColor: "#F8F8F8",
      bottom: 0,
      height: fixed(1),
      position: "absolute",
      width: screenWidth,
    },
    tabContent: {
      width: "100%",
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
      alignItems: "flex-end",
      flexDirection: "row",
      marginTop: vertical(7),
    },
    streakIcon: {
      height: fixed(29.17),
      marginBottom: fixed(2),
      marginRight: fixed(8),
      width: fixed(30),
    },
    bestIcon: {
      height: fixed(27.5),
      marginBottom: fixed(3),
      marginRight: fixed(8),
      width: fixed(29.78),
    },
    summaryNumber: {
      color: "#353535",
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
      backgroundColor: "#F8F8F8",
      height: fixed(69),
      width: fixed(2),
    },
    recallReportCard: {
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      marginTop: vertical(14),
      paddingHorizontal: fixed(18),
      paddingVertical: vertical(16),
      width: contentWidth,
    },
    recallReportHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    recallReportTitleBox: {
      flex: 1,
      minWidth: 0,
    },
    recallReportLabel: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: font(15),
      lineHeight: font(21),
    },
    recallReportTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(19),
      lineHeight: font(26),
      marginTop: vertical(2),
    },
    recallReportSummary: {
      color: "#7A7A7A",
      fontFamily: "PretendardMedium",
      fontSize: font(15),
      lineHeight: font(21),
      marginTop: vertical(10),
    },
    recallScoreBadge: {
      alignItems: "center",
      backgroundColor: "#23CC89",
      borderRadius: fixed(24),
      height: fixed(48),
      justifyContent: "center",
      marginLeft: fixed(14),
      width: fixed(48),
    },
    recallScoreValue: {
      color: "#FFFFFF",
      fontFamily: "PretendardBold",
      fontSize: font(20),
      lineHeight: font(26),
    },
    recallEmptyCard: {
      alignItems: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      marginTop: vertical(14),
      paddingVertical: vertical(18),
      width: contentWidth,
    },
    recallEmptyText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
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
      gap: fixed(2),
    },
    monthArrow: {
      alignItems: "center",
      justifyContent: "center",
    },
    monthText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      minWidth: fixed(32),
      textAlign: "center",
    },
    monthCountRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(5),
    },
    monthCount: {
      alignItems: "baseline",
      flexDirection: "row",
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
    emptyHint: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      textAlign: "center",
      width: "100%",
    },
    spendingEmpty: {
      marginTop: vertical(64),
    },
    pickerOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(53, 53, 53, 0.45)",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: fixed(40),
    },
    pickerSheet: {
      backgroundColor: "#FFFFFF",
      borderRadius: fixed(14),
      maxHeight: vertical(360),
      paddingVertical: vertical(10),
      width: "100%",
    },
    pickerTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      paddingHorizontal: fixed(20),
      paddingVertical: vertical(10),
    },
    pickerList: {
      flexGrow: 0,
    },
    pickerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: fixed(20),
      paddingVertical: vertical(14),
    },
    pickerRowText: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
    },
    pickerRowTextActive: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
    },
    pickerRowMeta: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(15),
    },
  });

  return Object.assign(styles, { monthArrowSize });
};
