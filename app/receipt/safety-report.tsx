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
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

const BASE_WIDTH = 402;
const BASE_HEIGHT = 874;
const BOTTOM_SHEET_ANIMATION_MS = 220;

const detailScores = [
  { label: "언어 내용", max: "50점", score: 42, total: 50 },
  { label: "말 시작 흐름", max: "30점", score: 20, total: 30 },
  { label: "운율 · 음향", max: "20점", score: 16, total: 20 },
];

const reportFlows = [
  { barHeight: 82, label: "1회차", score: 76 },
  { barHeight: 68, label: "2회차", score: 75 },
  { barHeight: 94, current: true, label: "3회차", score: 78 },
  { barHeight: 82, label: "4회차" },
];

const topPlaces = [
  { count: "12번 갔어요.", name: "이마트 강남점", rank: 1 },
  { count: "10번 갔어요.", name: "투썸플레이스 역삼점", rank: 2 },
  { count: "7번 갔어요.", name: "서울내과의원", rank: 3 },
];

const recommendedServices = [
  {
    category: "하나은행 · 마이데이터 서비스",
    description: "개인 맞춤형 디지털 마이데이터(자산관리) 서비스",
    name: "하나 합(마이데이터)",
  },
  {
    category: "하나은행 · 퇴직연금 서비스",
    description: "개인별 맞춤 진단부터 상품 추천, 정기적인 사후 관리까지 제공하는 연금 자산관리 서비스",
    name: "하나 연금 닥터",
  },
  {
    category: "하나더넥스트 · 교육 프로그램",
    description: "치매 예방 정보부터 발병 후 자산관리 및 법적 보호까지 포괄적인 단계별 솔루션을 제공하는 시니어 특화 금융 프로그램",
    name: "치매안심 아카데미",
  },
  {
    category: "하나더넥스트 · 대면 상담",
    description: "은퇴설계, 상속·증여, 퇴직연금 등에 걸쳐 전문 매니저의 1:1 맞춤형 진단과 솔루션을 제공하는 서비스",
    name: "은퇴설계 상담",
  },
];

export default function SafetyReportScreen() {
  const { width, height } = useWindowDimensions();
  const scale = getScreenScale(width, height);
  const fontScale = getFontScale(width, height);
  const styles = useMemo(
    () => createStyles(scale, fontScale, width, height),
    [fontScale, height, scale, width],
  );
  const [isShareEnabled, setIsShareEnabled] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<
    (typeof recommendedServices)[number] | null
  >(null);
  const productSheetProgress = useRef(new Animated.Value(1)).current;

  const handleShareTogglePress = () => {
    if (isShareEnabled) {
      setIsShareEnabled(false);
      return;
    }

    setIsShareModalVisible(true);
  };

  const handleShareAgree = () => {
    setIsShareEnabled(true);
    setIsShareModalVisible(false);
  };
  const openProductSheet = (service: (typeof recommendedServices)[number]) => {
    productSheetProgress.setValue(1);
    setSelectedService(service);
    requestAnimationFrame(() => {
      Animated.timing(productSheetProgress, {
        duration: BOTTOM_SHEET_ANIMATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });
  };
  const closeProductSheet = () => {
    Animated.timing(productSheetProgress, {
      duration: BOTTOM_SHEET_ANIMATION_MS,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setSelectedService(null);
      }
    });
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
            <Ionicons color="#9F9F9F" name="chevron-back" size={scaled(24, scale)} />
          </Pressable>
          <Text maxFontSizeMultiplier={1.1} style={styles.headerTitle}>
            안심 리포트
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.reportCard}>
          <View style={styles.roundBadge}>
            <Text maxFontSizeMultiplier={1.1} style={styles.roundBadgeText}>
              3회차 리포트
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1.1} style={styles.reportTitle}>
            김하나 고객님의 안심 리포트
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.reportDate}>
            2026년 7월 1일(수) ~ 7월 15일(수)
          </Text>
          <View style={styles.shareBox}>
            <View style={styles.shareLeft}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/safety-report/safety-report-guardian.png")}
                style={styles.guardianIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.shareText}>
                보호자에게 자동 공유
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: isShareEnabled }}
              hitSlop={scaled(8, scale)}
              onPress={handleShareTogglePress}
              style={[
                styles.shareToggle,
                isShareEnabled ? styles.shareToggleOn : styles.shareToggleOff,
              ]}
            >
              <View style={styles.shareToggleThumb} />
            </Pressable>
          </View>
        </View>

        <View style={styles.band} />

        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          종합 점수
        </Text>
        <View style={styles.totalScoreCard}>
          <View style={styles.statusBadge}>
            <Text maxFontSizeMultiplier={1.1} style={styles.statusBadgeText}>
              ㅇ 정상 · 1단계(85~100점)
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text maxFontSizeMultiplier={1.1} style={styles.totalScore}>
              78
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.totalScoreUnit}>
              / 100점
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1.1} style={styles.totalDescription}>
            인지 건강 우수 · 예방 중심의 자산 기반 구축 시기
          </Text>
        </View>

        <Text maxFontSizeMultiplier={1.1} style={styles.detailSectionTitle}>
          상세 점수
        </Text>
        <View style={styles.detailScoreCard}>
          {detailScores.map((item, index) => (
            <View key={item.label} style={styles.detailScoreItem}>
              <Text maxFontSizeMultiplier={1.1} style={styles.detailLabel}>
                {item.label}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(item.score / item.total) * 100}%` },
                  ]}
                />
              </View>
              <Text maxFontSizeMultiplier={1.1} style={styles.detailScoreText}>
                {item.score}
                <Text style={styles.detailScoreMuted}>/ {item.max}</Text>
              </Text>
              {index < detailScores.length - 1 ? <View style={styles.detailDivider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.band} />

        <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitle}>
          최근 4회차 점수 흐름
        </Text>
        <View style={styles.flowChart}>
          <View style={styles.flowBars}>
            <Svg height={scaled(2, scale)} style={styles.flowBaseline} width="100%">
              <Line
                stroke="#D9D9D9"
                strokeDasharray="2.19 2.19"
                strokeLinecap="butt"
                strokeWidth="1.1"
                x1="0"
                x2="100%"
                y1="1"
                y2="1"
              />
            </Svg>
            {reportFlows.map((item) => (
              <View key={item.label} style={styles.flowColumn}>
                <View style={styles.flowScoreArea}>
                  {typeof item.score === "number" ? (
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={[
                        styles.flowScoreText,
                        item.current && styles.currentFlowScoreText,
                      ]}
                    >
                      {item.score}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.flowBar,
                      item.current && styles.currentFlowBar,
                      !item.score && styles.futureFlowBar,
                      { height: `${item.barHeight}%` },
                    ]}
                  >
                    {item.current ? (
                      <Text maxFontSizeMultiplier={1.1} style={styles.currentBadgeText}>
                        현재
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.flowLabelRow}>
            {reportFlows.map((item) => (
              <Text
                key={item.label}
                maxFontSizeMultiplier={1.1}
                style={[styles.flowLabel, item.current && styles.currentFlowLabel]}
              >
                {item.label}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text maxFontSizeMultiplier={1.1} style={styles.statLabel}>
              대화 횟수
            </Text>
            <View style={styles.statValueRow}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/safety-report/safety-report-conversation-count.png")}
                style={styles.statIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.statNumber}>
                24
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.statUnit}>
                회
              </Text>
            </View>
            <View style={styles.statDivider} />
          </View>
          <View style={styles.statItem}>
            <Text maxFontSizeMultiplier={1.1} style={styles.statLabel}>
              컨디션 난조
            </Text>
            <View style={styles.statValueRow}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/safety-report/safety-report-emotion-status.png")}
                style={styles.statIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.statNumber}>
                2
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.statUnit}>
                회
              </Text>
            </View>
          </View>
        </View>

        <InfoBox
          icon={require("../../assets/images/safety-report/safety-report-check.png")}
          styles={styles}
          text="지난 회차보다 3점 올랐어요."
          type="success"
        />
        <View style={styles.noteRow}>
          <Text maxFontSizeMultiplier={1.1} style={styles.noteBullet}>
            ●
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.noteText}>
            본 점수는 AI 음성 분석 기반의 참고 지표입니다. 의학적 진단을 대체하지 않습니다.
          </Text>
        </View>

        <View style={styles.band} />

        <View style={styles.placeHeader}>
          <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitleNoMargin}>
            자주 간 곳 TOP3
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.monthReferenceText}>
            7월 기준
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

        <View style={[styles.infoBox, styles.warningBox]}>
          <Image
            resizeMode="contain"
            source={require("../../assets/images/safety-report/safety-report-danger.png")}
            style={[styles.infoIcon, styles.warningIcon]}
          />
          <Text maxFontSizeMultiplier={1.1} style={styles.infoText}>
            <Text style={styles.warningStrongText}>5월 12일 심야 마트 결제</Text>
            가 있었으나, 대화 결과 손주 선물을 사기 위해 가셨던 것으로 확인했어요.
          </Text>
        </View>
        <InfoBox
          icon={require("../../assets/images/safety-report/safety-report-check.png")}
          styles={styles}
          text="이번 달은 평소와 비슷한 소비 행태를 보이고 있어요."
          type="success"
          variant="consumption"
        />

        <View style={styles.band} />

        <View style={styles.serviceHeader}>
          <View>
            <Text maxFontSizeMultiplier={1.1} style={styles.sectionTitleNoMargin}>
              맞춤 하나 상품 및 서비스
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.serviceDescription}>
              인지 단계에 맞는 하나 금융 서비스를 추천할게요.
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text maxFontSizeMultiplier={1.1} style={styles.levelBadgeText}>
              ㅇ 1단계
            </Text>
          </View>
        </View>

        <View style={styles.serviceList}>
          {recommendedServices.map((service) => (
            <Pressable
              key={service.name}
              onPress={() => openProductSheet(service)}
              style={styles.serviceCard}
            >
              <View style={styles.serviceTextBox}>
                <Text maxFontSizeMultiplier={1.1} style={styles.serviceCategory}>
                  {service.category}
                </Text>
                <Text maxFontSizeMultiplier={1.1} style={styles.serviceName}>
                  {service.name}
                </Text>
                <Text
                  maxFontSizeMultiplier={1.1}
                  numberOfLines={2}
                  style={styles.serviceCardDescription}
                >
                  {service.description}
                </Text>
              </View>
              <Ionicons color="#54E5AC" name="chevron-forward" size={scaled(16, scale)} />
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomInfoCard}>
          <Image
            resizeMode="contain"
            source={require("../../assets/images/safety-report/safety-report-check.png")}
            style={[styles.infoIcon, styles.bottomInfoIcon]}
          />
          <Text maxFontSizeMultiplier={1.1} style={styles.bottomInfoText}>
            정상 단계 에서 하나 합에 자산을 연결해두면 이후 이상 패턴 탐지 기준선이 돼요. 지금이 가장 좋은 준비 시기에요.
          </Text>
        </View>
        </ScrollView>

        <Modal
          animationType="fade"
          onRequestClose={() => setIsShareModalVisible(false)}
          transparent
          visible={isShareModalVisible}
        >
          <View style={styles.shareModalOverlay}>
            <View style={styles.shareModalCard}>
              <Image
                resizeMode="contain"
                source={require("../../assets/images/safety-report/safety-report-notification.png")}
                style={styles.shareModalIcon}
              />
              <Text maxFontSizeMultiplier={1.1} style={styles.shareModalTitle}>
                보호자 자동 공유에{"\n"}대해 미리 알려드려요.
              </Text>
              <Text maxFontSizeMultiplier={1.1} style={styles.shareModalDescription}>
                안심 리포트는 2주마다 만들어지고,{"\n"}설정한 보호자와 함께 나눌 수 있어요.
              </Text>
              <View style={styles.shareNoticeBox}>
                <View style={styles.shareNoticeHeader}>
                  <Image
                    resizeMode="contain"
                    source={require("../../assets/images/safety-report/safety-report-danger.png")}
                    style={styles.shareNoticeIcon}
                  />
                  <Text maxFontSizeMultiplier={1.1} style={styles.shareNoticeTitle}>
                    꼭 확인해주세요.
                  </Text>
                </View>
                <Text maxFontSizeMultiplier={1.1} style={styles.shareNoticeText}>
                  인지 상태가 3단계(주의) 이상으로 판단될 경우, 설정 여부와 관계없이
                  보호자에게 자동으로 전달돼요. 소중한 분을 더 잘 보살피기 위해서예요.
                </Text>
              </View>
              <View style={styles.shareModalButtonRow}>
                <Pressable
                  onPress={() => setIsShareModalVisible(false)}
                  style={[styles.shareModalButton, styles.shareModalCloseButton]}
                >
                  <Text maxFontSizeMultiplier={1.1} style={styles.shareModalCloseText}>
                    닫기
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShareAgree}
                  style={[styles.shareModalButton, styles.shareModalAgreeButton]}
                >
                  <Text maxFontSizeMultiplier={1.1} style={styles.shareModalAgreeText}>
                    동의하기
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="none"
          onRequestClose={closeProductSheet}
          transparent
          visible={selectedService !== null}
        >
          <View style={styles.productSheetOverlay}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.productSheetBackdrop,
                {
                  opacity: productSheetProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.35, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.productSheet,
                {
                  transform: [
                    {
                      translateY: productSheetProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.productSheetHandle} />
              <View style={styles.productSheetContent}>
                <Text maxFontSizeMultiplier={1.1} style={styles.productSheetCategory}>
                  {selectedService?.category ?? "하나은행 · 마이데이터 서비스"}
                </Text>
                <Text maxFontSizeMultiplier={1.1} style={styles.productSheetName}>
                  {selectedService?.name ?? "하나 합(마이데이터)"}
                </Text>
                <Text maxFontSizeMultiplier={1.1} style={styles.productSheetDescription}>
                  전 금융기관 자산을 하나원큐 앱 하나로 통합 조회하고 실시간 소비·자산 변화를
                  AI가 분석해요. 기억 Hana의 이상 패턴 탐지 기준선이 되는 핵심 데이터 소스예요.
                </Text>

                <View style={styles.productTagRow}>
                  <View style={styles.productTag}>
                    <Text maxFontSizeMultiplier={1.1} style={styles.productTagText}>
                      하나원큐 앱
                    </Text>
                  </View>
                  <View style={styles.productTag}>
                    <Text maxFontSizeMultiplier={1.1} style={styles.productTagText}>
                      자산 통합 조회
                    </Text>
                  </View>
                  <View style={[styles.productTag, styles.productGreenTag]}>
                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={[styles.productTagText, styles.productGreenTagText]}
                    >
                      무료
                    </Text>
                  </View>
                </View>

                <View style={styles.productDivider} />

                <Text maxFontSizeMultiplier={1.1} style={styles.timelineTitle}>
                  서비스 연계 과정
                </Text>
                <View style={styles.timelineList}>
                  <View style={styles.timelineLine} />
                  {[
                    {
                      description: "지금이 데이터 쌓기 가장 좋은 시점이에요.",
                      step: "STEP 1",
                      title: "정상 단계 확인 · 자산 베이스 라인 구축 시작",
                    },
                    {
                      description: "은행·증권·보험·연금 전 기관 마이데이터 동의를 받아요.",
                      step: "STEP 2",
                      title: "하나원큐에서 하나 합 자산 연결",
                    },
                    {
                      description: "이상 소비·중복 결제·충동 구매 이상 탐지에 활용할거예요.",
                      step: "STEP 3",
                      title: "소비 · 자산 패턴 AI 자동 분석",
                    },
                  ].map((item) => (
                    <View key={item.step} style={styles.timelineItem}>
                      <View style={styles.timelineDotOuter}>
                        <View style={styles.timelineDotInner} />
                      </View>
                      <View style={styles.timelineTextBox}>
                        <Text maxFontSizeMultiplier={1.1} style={styles.timelineStep}>
                          {item.step}
                        </Text>
                        <Text maxFontSizeMultiplier={1.1} style={styles.timelineItemTitle}>
                          {item.title}
                        </Text>
                        <Text
                          maxFontSizeMultiplier={1.1}
                          style={styles.timelineItemDescription}
                        >
                          {item.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Pressable style={styles.productMainButton}>
                  <Text maxFontSizeMultiplier={1.1} style={styles.productMainButtonText}>
                    하나원큐에서 하나 합 열기
                  </Text>
                </Pressable>
                <Pressable onPress={closeProductSheet}>
                  <Text maxFontSizeMultiplier={1.1} style={styles.productCloseText}>
                    닫기
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function InfoBox({
  icon,
  styles,
  text,
  type,
  variant = "default",
}: {
  icon: number;
  styles: ReturnType<typeof createStyles>;
  text: string;
  type: "success" | "warning";
  variant?: "consumption" | "default";
}) {
  return (
    <View
      style={[
        styles.infoBox,
        type === "warning" && styles.warningBox,
        variant === "consumption" && styles.consumptionInfoBox,
      ]}
    >
      <Image
        resizeMode="contain"
        source={icon}
        style={[styles.infoIcon, type === "warning" && styles.warningIcon]}
      />
      <Text maxFontSizeMultiplier={1.1} style={styles.infoText}>
        {text}
      </Text>
    </View>
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
  const horizontalPadding = Math.round(
    (screenWidth < 380 ? 20 : 24) * Math.min(widthScale, 1.08),
  );
  const contentWidth = screenWidth - horizontalPadding * 2;
  const modalWidth = Math.min(350, screenWidth - 48);
  const modalScale = Math.min(modalWidth / 350, 1);
  const productSheetHeight = Math.min(
    Math.round(690 * Math.min(heightScale, 1.04)),
    Math.round(screenHeight * 0.92),
  );
  const fixed = (value: number) => Math.round(value * layoutScale);
  const modalFixed = (value: number) => Math.round(value * modalScale);
  const vertical = (value: number) => Math.round(value * Math.min(heightScale, 1.04));
  const font = (value: number) => fontScaled(value, Math.min(fontScale, layoutScale));
  const modalFont = (value: number) => fontScaled(value, Math.min(fontScale, modalScale));

  return StyleSheet.create({
    safeArea: {
      backgroundColor: "#FFFFFF",
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingTop: vertical(18),
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
      color: "#6C6C6C",
      fontFamily: "PretendardMedium",
      fontSize: font(20),
    },
    content: {
      paddingBottom: vertical(139),
    },
    reportCard: {
      alignSelf: "center",
      backgroundColor: "#FFFFFF",
      borderColor: "#F8F8F8",
      borderRadius: fixed(10),
      borderWidth: fixed(1),
      minHeight: fixed(174),
      marginTop: vertical(20),
      paddingBottom: vertical(17),
      paddingHorizontal: fixed(12),
      paddingTop: vertical(20),
      shadowColor: "#000000",
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      width: contentWidth,
    },
    roundBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "#54E5AC",
      borderRadius: fixed(45),
      height: fixed(22),
      justifyContent: "center",
      paddingHorizontal: fixed(12),
    },
    roundBadgeText: {
      color: "#FFFFFF",
      fontFamily: "PretendardBold",
      fontSize: font(14),
    },
    reportTitle: {
      color: "#000000",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
      marginTop: vertical(8),
    },
    reportDate: {
      color: "#13BB78",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
      marginTop: vertical(4),
    },
    shareBox: {
      alignItems: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(5),
      flexDirection: "row",
      height: fixed(43),
      justifyContent: "space-between",
      marginTop: vertical(13),
      paddingHorizontal: fixed(12),
    },
    shareLeft: {
      alignItems: "center",
      flexDirection: "row",
    },
    guardianIcon: {
      height: fixed(24),
      marginRight: fixed(7),
      width: fixed(24),
    },
    shareText: {
      color: "#353535",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
    },
    shareToggle: {
      borderRadius: fixed(15),
      height: fixed(30),
      justifyContent: "center",
      paddingHorizontal: fixed(2),
      width: fixed(57),
    },
    shareToggleOn: {
      alignItems: "flex-end",
      backgroundColor: "#54E5AC",
    },
    shareToggleOff: {
      alignItems: "flex-start",
      backgroundColor: "#E5E5E5",
    },
    shareToggleThumb: {
      backgroundColor: "#FFFFFF",
      borderRadius: fixed(13),
      height: fixed(26),
      width: fixed(26),
    },
    band: {
      backgroundColor: "#F8F8F8",
      height: vertical(10),
      marginTop: vertical(18),
      width: screenWidth,
    },
    sectionTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
      marginHorizontal: horizontalPadding,
      marginTop: vertical(24),
    },
    totalScoreCard: {
      alignSelf: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(5),
      height: fixed(141),
      marginTop: vertical(20),
      padding: fixed(16),
      width: contentWidth,
    },
    statusBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "#D5FAEB",
      borderRadius: fixed(45),
      height: fixed(32),
      justifyContent: "center",
      paddingHorizontal: fixed(10),
    },
    statusBadgeText: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
    },
    scoreRow: {
      alignItems: "baseline",
      flexDirection: "row",
      marginTop: vertical(4),
    },
    totalScore: {
      color: "#13BB78",
      fontFamily: "PretendardBold",
      fontSize: font(36),
      lineHeight: font(43),
    },
    totalScoreUnit: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      marginLeft: fixed(4),
    },
    totalDescription: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
      marginTop: vertical(8),
    },
    detailSectionTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
      marginHorizontal: horizontalPadding,
      marginTop: vertical(28),
    },
    detailScoreCard: {
      alignSelf: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(5),
      flexDirection: "row",
      height: fixed(100),
      marginTop: vertical(10),
      paddingVertical: vertical(16),
      width: contentWidth,
    },
    detailScoreItem: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      position: "relative",
    },
    detailLabel: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
    },
    progressTrack: {
      backgroundColor: "#E5E5E5",
      borderRadius: fixed(10),
      height: fixed(12),
      marginTop: vertical(8),
      overflow: "hidden",
      width: fixed(90),
    },
    progressFill: {
      backgroundColor: "#23CC89",
      borderRadius: fixed(10),
      height: "100%",
    },
    detailScoreText: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
      lineHeight: font(22),
      marginTop: vertical(6),
    },
    detailScoreMuted: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
    },
    detailDivider: {
      backgroundColor: "#F8F8F8",
      bottom: fixed(15),
      position: "absolute",
      right: 0,
      top: fixed(16),
      width: fixed(2),
    },
    flowChart: {
      alignSelf: "center",
      height: fixed(200),
      justifyContent: "flex-end",
      marginTop: vertical(17),
      width: fixed(350),
    },
    flowBars: {
      alignItems: "flex-end",
      flexDirection: "row",
      height: fixed(137),
      justifyContent: "space-between",
      position: "relative",
    },
    flowBaseline: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
    },
    flowColumn: {
      alignItems: "center",
      width: fixed(62.83),
    },
    flowScoreArea: {
      alignItems: "center",
      height: fixed(137),
      justifyContent: "flex-end",
      width: fixed(62.83),
    },
    flowScoreText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      lineHeight: font(23),
      marginBottom: vertical(3),
    },
    currentFlowScoreText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
    },
    currentBadgeText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: font(17.55),
      lineHeight: font(23),
      marginTop: vertical(7),
    },
    flowBar: {
      alignItems: "center",
      backgroundColor: "#D9D9D9",
      borderTopLeftRadius: fixed(6.83),
      borderTopRightRadius: fixed(6.83),
      width: fixed(62.83),
    },
    currentFlowBar: {
      backgroundColor: "#54DFA7",
    },
    futureFlowBar: {
      opacity: 0.9,
    },
    flowLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(6),
    },
    flowLabel: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(18),
      lineHeight: font(23),
      textAlign: "center",
      width: fixed(62.83),
    },
    currentFlowLabel: {
      color: "#5D5D5D",
    },
    statCard: {
      alignSelf: "center",
      backgroundColor: "#F8F8F8",
      borderRadius: fixed(10),
      flexDirection: "row",
      height: fixed(97),
      marginTop: vertical(14),
      width: contentWidth,
    },
    statItem: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      position: "relative",
    },
    statLabel: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
    },
    statValueRow: {
      alignItems: "center",
      flexDirection: "row",
      marginTop: vertical(5),
    },
    statIcon: {
      height: fixed(34),
      marginRight: fixed(7),
      width: fixed(34),
    },
    statNumber: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: font(28),
      lineHeight: font(34),
    },
    statUnit: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(26),
      marginLeft: fixed(2),
    },
    statDivider: {
      backgroundColor: "#F8F8F8",
      bottom: fixed(14),
      position: "absolute",
      right: 0,
      top: fixed(14),
      width: fixed(2),
    },
    infoBox: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#EBFCF5",
      borderRadius: fixed(5),
      flexDirection: "row",
      minHeight: fixed(44),
      marginTop: vertical(10),
      paddingHorizontal: fixed(10),
      paddingVertical: vertical(11),
      width: contentWidth,
    },
    warningBox: {
      backgroundColor: "#FFF8DE",
      borderRadius: fixed(10),
      minHeight: fixed(66),
      marginTop: vertical(10),
      padding: fixed(10),
    },
    consumptionInfoBox: {
      borderRadius: fixed(6),
      minHeight: fixed(45),
      marginTop: vertical(8),
      padding: fixed(10),
    },
    infoIcon: {
      height: fixed(18),
      marginRight: fixed(8),
      width: fixed(18),
    },
    warningIcon: {
      height: fixed(16.68),
    },
    infoText: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(20),
    },
    warningStrongText: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
      lineHeight: font(20),
    },
    noteRow: {
      alignSelf: "center",
      flexDirection: "row",
      marginTop: vertical(10),
      width: contentWidth,
    },
    noteBullet: {
      color: "#23CC89",
      fontFamily: "PretendardMedium",
      fontSize: font(6),
      lineHeight: font(18),
      marginRight: fixed(5),
    },
    noteText: {
      color: "#9F9F9F",
      flex: 1,
      fontFamily: "PretendardRegular",
      fontSize: font(14),
      lineHeight: font(20),
    },
    placeHeader: {
      alignItems: "center",
      alignSelf: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(24),
      width: contentWidth,
    },
    sectionTitleNoMargin: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
    },
    monthReferenceText: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: font(16),
      lineHeight: font(22),
    },
    topPlaceCard: {
      alignSelf: "center",
      backgroundColor: "#FAF9F6",
      borderRadius: fixed(10),
      height: fixed(150),
      justifyContent: "center",
      marginTop: vertical(12),
      paddingHorizontal: fixed(12),
      width: contentWidth,
    },
    topPlaceRow: {
      alignItems: "center",
      flexDirection: "row",
      height: fixed(40),
    },
    rankBadge: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: fixed(12),
      height: fixed(24),
      justifyContent: "center",
      marginRight: fixed(10),
      shadowColor: "#000000",
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      width: fixed(24),
    },
    rankText: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: font(14.6),
    },
    topPlaceName: {
      color: "#353535",
      flex: 1,
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
    },
    topPlaceCount: {
      color: "#13BB78",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
      lineHeight: font(22),
      marginLeft: fixed(8),
      textAlign: "right",
    },
    serviceHeader: {
      alignItems: "flex-start",
      alignSelf: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: vertical(24),
      width: contentWidth,
    },
    levelBadge: {
      alignItems: "center",
      backgroundColor: "#E0F9EF",
      borderRadius: fixed(45),
      height: fixed(29),
      justifyContent: "center",
      paddingHorizontal: fixed(10),
    },
    levelBadgeText: {
      color: "#0ABD76",
      fontFamily: "PretendardSemiBold",
      fontSize: font(13),
    },
    serviceDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardRegular",
      fontSize: font(16),
      lineHeight: font(22),
      marginTop: vertical(8),
    },
    serviceList: {
      alignSelf: "center",
      marginTop: vertical(10),
      width: contentWidth,
    },
    serviceCard: {
      alignItems: "center",
      backgroundColor: "#FAF9F6",
      borderRadius: fixed(10),
      flexDirection: "row",
      minHeight: fixed(90),
      justifyContent: "space-between",
      marginBottom: vertical(10),
      paddingHorizontal: fixed(14),
      paddingVertical: vertical(12),
      width: contentWidth,
    },
    serviceTextBox: {
      flex: 1,
      marginRight: fixed(10),
    },
    serviceCategory: {
      color: "#23CC89",
      fontFamily: "PretendardMedium",
      fontSize: font(14),
      lineHeight: font(18),
    },
    serviceName: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(18),
      lineHeight: font(24),
      marginTop: vertical(4),
    },
    serviceCardDescription: {
      color: "#5D5D5D",
      fontFamily: "PretendardRegular",
      fontSize: font(16),
      lineHeight: font(18),
      marginTop: vertical(4),
    },
    bottomInfoCard: {
      alignItems: "flex-start",
      alignSelf: "center",
      backgroundColor: "#EBFCF5",
      borderRadius: fixed(8),
      flexDirection: "row",
      marginTop: vertical(10),
      padding: fixed(12),
      width: contentWidth,
    },
    bottomInfoText: {
      color: "#5D5D5D",
      flex: 1,
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(20),
    },
    bottomInfoIcon: {
      marginTop: vertical(1),
    },
    shareModalOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    shareModalCard: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: modalFixed(24),
      elevation: 4,
      minHeight: modalFixed(454.15),
      paddingBottom: modalFixed(20),
      paddingHorizontal: modalFixed(15),
      paddingTop: modalFixed(30),
      shadowColor: "#000000",
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      width: modalWidth,
    },
    shareModalIcon: {
      height: modalFixed(81.15),
      width: modalFixed(91.8),
    },
    shareModalTitle: {
      color: "#353535",
      fontFamily: "PretendardBold",
      fontSize: modalFont(24),
      lineHeight: modalFont(32.4),
      marginTop: modalFixed(14),
      textAlign: "center",
    },
    shareModalDescription: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: modalFont(16),
      lineHeight: modalFont(21.6),
      marginTop: modalFixed(14),
      textAlign: "center",
    },
    shareNoticeBox: {
      alignSelf: "stretch",
      backgroundColor: "#F8F8F8",
      borderRadius: modalFixed(10),
      marginTop: modalFixed(15),
      minHeight: modalFixed(110),
      padding: modalFixed(14),
    },
    shareNoticeHeader: {
      alignItems: "center",
      flexDirection: "row",
    },
    shareNoticeIcon: {
      height: modalFixed(24),
      marginRight: modalFixed(9),
      width: modalFixed(23.74),
    },
    shareNoticeTitle: {
      color: "#ECAF34",
      fontFamily: "PretendardSemiBold",
      fontSize: modalFont(16),
      lineHeight: modalFont(21.6),
    },
    shareNoticeText: {
      color: "#5D5D5D",
      fontFamily: "PretendardRegular",
      fontSize: modalFont(14),
      lineHeight: modalFont(18.9),
      marginTop: modalFixed(8),
    },
    shareModalButtonRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: modalFixed(8),
      marginTop: modalFixed(16),
    },
    shareModalButton: {
      alignItems: "center",
      borderRadius: modalFixed(8),
      flex: 1,
      height: modalFixed(45),
      justifyContent: "center",
    },
    shareModalCloseButton: {
      backgroundColor: "#F2F2F2",
    },
    shareModalAgreeButton: {
      backgroundColor: "#FFC44D",
    },
    shareModalCloseText: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: modalFont(16),
    },
    shareModalAgreeText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: modalFont(16),
    },
    productSheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    productSheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000000",
    },
    productSheet: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: fixed(20),
      borderTopRightRadius: fixed(20),
      maxHeight: productSheetHeight,
      paddingBottom: vertical(34),
      width: screenWidth,
    },
    productSheetHandle: {
      alignSelf: "center",
      backgroundColor: "#D9D9D9",
      borderRadius: fixed(45),
      height: fixed(4),
      marginTop: vertical(20),
      width: fixed(95),
    },
    productSheetContent: {
      paddingBottom: vertical(14),
      paddingHorizontal: horizontalPadding,
      paddingTop: vertical(48),
    },
    productSheetCategory: {
      color: "#9F9F9F",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
    },
    productSheetName: {
      color: "#13BB78",
      fontFamily: "PretendardBold",
      fontSize: font(24),
      lineHeight: font(32),
      marginTop: vertical(6),
    },
    productSheetDescription: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(21.6),
      marginTop: vertical(8),
    },
    productTagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: fixed(10),
      marginTop: vertical(8),
    },
    productTag: {
      alignItems: "center",
      backgroundColor: "#F2F2F2",
      borderRadius: fixed(45),
      height: fixed(34),
      justifyContent: "center",
      paddingHorizontal: fixed(12),
    },
    productTagText: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(16),
      lineHeight: font(22),
    },
    productGreenTag: {
      backgroundColor: "#EBFCF5",
    },
    productGreenTagText: {
      color: "#13BB78",
    },
    productDivider: {
      backgroundColor: "#F8F8F8",
      height: 1,
      marginTop: vertical(20),
    },
    timelineTitle: {
      color: "#5D5D5D",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
      marginTop: vertical(19),
    },
    timelineList: {
      marginTop: vertical(16),
      position: "relative",
    },
    timelineLine: {
      backgroundColor: "#F8F8F8",
      bottom: vertical(18),
      left: fixed(6),
      position: "absolute",
      top: fixed(7),
      width: 1,
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: vertical(25),
    },
    timelineDotOuter: {
      alignItems: "center",
      backgroundColor: "#9FF3D1",
      borderRadius: fixed(6.5),
      height: fixed(13),
      justifyContent: "center",
      marginTop: vertical(2),
      width: fixed(13),
      zIndex: 1,
    },
    timelineDotInner: {
      backgroundColor: "#23CC89",
      borderRadius: fixed(3.5),
      height: fixed(7),
      width: fixed(7),
    },
    timelineTextBox: {
      flex: 1,
      marginLeft: fixed(22),
    },
    timelineStep: {
      color: "#9F9F9F",
      fontFamily: "PretendardSemiBold",
      fontSize: font(14),
      lineHeight: font(19),
    },
    timelineItemTitle: {
      color: "#353535",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
      marginTop: vertical(5),
    },
    timelineItemDescription: {
      color: "#5D5D5D",
      fontFamily: "PretendardMedium",
      fontSize: font(14),
      lineHeight: font(18.9),
      marginTop: vertical(4),
    },
    productMainButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#23CC89",
      borderRadius: fixed(8),
      height: fixed(55),
      justifyContent: "center",
      marginTop: vertical(5),
      width: contentWidth,
    },
    productMainButtonText: {
      color: "#FFFFFF",
      fontFamily: "PretendardSemiBold",
      fontSize: font(20),
      lineHeight: font(27),
    },
    productCloseText: {
      color: "#9F9F9F",
      fontFamily: "PretendardSemiBold",
      fontSize: font(16),
      lineHeight: font(22),
      marginTop: vertical(16),
      textAlign: "center",
    },
  });
};
