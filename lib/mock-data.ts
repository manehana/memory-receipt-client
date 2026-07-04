import type {
  LoginResponse,
  RecallSessionListItem,
  RecallSessionResponse,
  StatsResponse,
  UserFullResponse,
  VoiceResponse,
} from "./types";

export const USE_DEMO_MOCK_DATA = true;

const mockLoginResponse: LoginResponse = {
  access_token: "demo-memory-receipt-token",
  token_type: "bearer",
};

const mockPayments = [
  {
    id: 1,
    merchant: "하나마트",
    item: "장보기",
    amount: 45200,
    category: "편의점/마트",
    payment_method: "하나카드",
    paid_at: "2026-07-01T10:24:00+09:00",
    created_at: "2026-07-01T10:24:05+09:00",
  },
  {
    id: 2,
    merchant: "온유 카페",
    item: "아메리카노와 샌드위치",
    amount: 12800,
    category: "카페/간식",
    payment_method: "하나카드",
    paid_at: "2026-06-29T14:12:00+09:00",
    created_at: "2026-06-29T14:12:05+09:00",
  },
  {
    id: 3,
    merchant: "중앙약국",
    item: "영양제",
    amount: 27000,
    category: "건강/운동",
    payment_method: "하나카드",
    paid_at: "2026-06-24T16:40:00+09:00",
    created_at: "2026-06-24T16:40:05+09:00",
  },
  {
    id: 4,
    merchant: "시내버스",
    item: "교통비",
    amount: 1550,
    category: "교통/차량",
    payment_method: "하나카드",
    paid_at: "2026-06-18T09:08:00+09:00",
    created_at: "2026-06-18T09:08:05+09:00",
  },
];

function createMockRecallSession({
  id,
  score,
  summary,
  targetDate,
  time,
  title,
}: {
  id: number;
  score: number;
  summary: string;
  targetDate: string;
  time: string;
  title: string;
}): RecallSessionListItem {
  return {
    id,
    session_date: `${targetDate}T${time}+09:00`,
    target_date: targetDate,
    status: "completed",
    title,
    summary,
    image_url: `/mock/recall-sessions/${id}/image`,
    final_score: score,
  };
}

const mockRecallSessions: RecallSessionListItem[] = [
  createMockRecallSession({
    id: 101,
    targetDate: "2026-07-01",
    time: "20:15:00",
    title: "하나마트에서 장을 본 하루",
    summary: "오전에 하나마트에서 장을 보고 저녁 식사 재료를 준비했어요.",
    score: 86,
  }),
  createMockRecallSession({
    id: 102,
    targetDate: "2026-07-06",
    time: "19:40:00",
    title: "동네 공원에서 산책한 날",
    summary: "저녁 바람을 맞으며 공원을 한 바퀴 걸었던 기억이에요.",
    score: 88,
  }),
  createMockRecallSession({
    id: 103,
    targetDate: "2026-07-11",
    time: "20:05:00",
    title: "은행 업무를 본 오전",
    summary: "하나은행에 들러 통장을 정리하고 직원과 상담했어요.",
    score: 83,
  }),
  createMockRecallSession({
    id: 104,
    targetDate: "2026-07-16",
    time: "21:10:00",
    title: "가족과 저녁을 먹은 토요일",
    summary: "가족들과 식탁에 둘러앉아 천천히 이야기를 나눴어요.",
    score: 91,
  }),
  createMockRecallSession({
    id: 105,
    targetDate: "2026-07-21",
    time: "18:55:00",
    title: "미용실에 다녀온 오후",
    summary: "머리를 다듬고 시장에 들러 과일을 샀던 하루예요.",
    score: 84,
  }),
  createMockRecallSession({
    id: 106,
    targetDate: "2026-07-30",
    time: "20:45:00",
    title: "도서관에서 책을 빌린 날",
    summary: "도서관에서 새 책을 빌리고 조용히 오후를 보냈어요.",
    score: 90,
  }),
  createMockRecallSession({
    id: 107,
    targetDate: "2026-06-03",
    time: "20:30:00",
    title: "마트에서 반찬거리를 산 날",
    summary: "하나마트에서 반찬거리를 고르며 저녁 메뉴를 떠올렸어요.",
    score: 87,
  }),
  createMockRecallSession({
    id: 108,
    targetDate: "2026-06-08",
    time: "19:20:00",
    title: "친구와 카페에서 만난 날",
    summary: "오랜 친구와 카페에서 만나 근황을 나누며 웃었어요.",
    score: 92,
  }),
  createMockRecallSession({
    id: 109,
    targetDate: "2026-06-13",
    time: "18:45:00",
    title: "버스를 타고 다녀온 외출",
    summary: "오전에 버스를 타고 외출했던 경로를 차근차근 떠올렸어요.",
    score: 82,
  }),
  createMockRecallSession({
    id: 110,
    targetDate: "2026-06-18",
    time: "19:30:00",
    title: "중앙약국에 들른 날",
    summary: "약국에서 영양제를 사고 건강 이야기를 나눴어요.",
    score: 78,
  }),
  createMockRecallSession({
    id: 111,
    targetDate: "2026-06-23",
    time: "21:05:00",
    title: "온유 카페에서 쉬어간 오후",
    summary: "카페에서 커피와 샌드위치를 먹으며 잠깐 쉬었던 기억이에요.",
    score: 91,
  }),
  createMockRecallSession({
    id: 112,
    targetDate: "2026-06-29",
    time: "20:10:00",
    title: "편의점에 들러 간식을 산 밤",
    summary: "집으로 돌아오는 길에 간식과 우유를 샀던 기억이에요.",
    score: 86,
  }),
  createMockRecallSession({
    id: 113,
    targetDate: "2026-05-02",
    time: "20:10:00",
    title: "어버이날 선물을 고른 날",
    summary: "선물 가게에서 가족을 떠올리며 작은 선물을 골랐어요.",
    score: 89,
  }),
  createMockRecallSession({
    id: 114,
    targetDate: "2026-05-07",
    time: "19:55:00",
    title: "병원 검진을 다녀온 날",
    summary: "정기 검진을 받고 건강 관리 이야기를 들었어요.",
    score: 80,
  }),
  createMockRecallSession({
    id: 115,
    targetDate: "2026-05-12",
    time: "18:35:00",
    title: "시장 구경을 한 일요일",
    summary: "시장 골목을 걸으며 제철 과일과 채소를 구경했어요.",
    score: 85,
  }),
  createMockRecallSession({
    id: 116,
    targetDate: "2026-05-17",
    time: "20:25:00",
    title: "손주와 통화한 밤",
    summary: "손주와 영상 통화를 하며 학교 이야기를 들었어요.",
    score: 93,
  }),
  createMockRecallSession({
    id: 117,
    targetDate: "2026-05-22",
    time: "19:45:00",
    title: "꽃집에서 화분을 산 날",
    summary: "작은 화분을 고르고 창가에 둘 자리를 생각했어요.",
    score: 87,
  }),
  createMockRecallSession({
    id: 118,
    targetDate: "2026-05-30",
    time: "19:15:00",
    title: "동네 빵집에 들른 오후",
    summary: "빵집에서 식빵과 단팥빵을 사고 집으로 돌아왔어요.",
    score: 88,
  }),
];

const mockVoices: VoiceResponse[] = [
  {
    id: 1,
    name: "별봄이",
    is_default: true,
    owned: true,
    created_at: "2026-06-01T09:00:00+09:00",
  },
  {
    id: 2,
    name: "강호동1",
    is_default: false,
    owned: true,
    created_at: "2026-06-01T09:00:00+09:00",
  },
];

const mockUser: UserFullResponse = {
  id: 1,
  username: "tlqms",
  created_at: "2026-06-01T09:00:00+09:00",
  payments: mockPayments,
  voices: mockVoices,
  recall_sessions: mockRecallSessions,
  speech_baseline: {
    stats: {
      average_pause_ms: 820,
      speech_rate: 3.4,
      filler_ratio: 0.08,
    },
    session_count: 12,
    updated_at: "2026-07-01T20:30:00+09:00",
  },
};

const mockStats: StatsResponse = {
  engagement: {
    current_streak: 7,
    best_streak: 15,
    last_participated_date: "2026-06-16",
    available_months: [
      { year: 2026, month: 6, days: 3 },
      { year: 2026, month: 5, days: 6 },
    ],
    participation: {
      year: 2026,
      month: 6,
      participated_days: [3, 8, 13],
      count: 3,
    },
  },
  spending: {
    top_merchants: [
      { merchant: "하나마트", count: 4, total_amount: 182000 },
      { merchant: "온유 카페", count: 3, total_amount: 38400 },
      { merchant: "중앙약국", count: 2, total_amount: 54000 },
    ],
    hourly_activity: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: [9, 10, 14, 16, 20].includes(hour) ? hour % 3 + 1 : 0,
      total_amount: [9, 10, 14, 16, 20].includes(hour)
        ? (hour % 3 + 1) * 12000
        : 0,
    })),
    monthly_by_category: {
      year: 2026,
      month: 6,
      categories: [
        { category: "카페 · 간식", total_amount: 354000, count: 7 },
        { category: "의료 · 건강 · 피트니스", total_amount: 158000, count: 3 },
        { category: "편의점 · 마트 · 잡화", total_amount: 254000, count: 5 },
        { category: "교통 · 자동차", total_amount: 96000, count: 8 },
        { category: null, total_amount: 51000, count: 1 },
      ],
      total_amount: 1000000,
    },
  },
};

function createSessionDetail(id: number): RecallSessionResponse | null {
  const listItem = mockRecallSessions.find((session) => session.id === id);
  if (!listItem) {
    return null;
  }

  return {
    id: listItem.id,
    basis: "payment",
    status: "completed",
    session_date: listItem.session_date,
    target_date: listItem.target_date,
    current_index: 3,
    total_turns: 3,
    baseline_calibrated: true,
    voice_id: 1,
    voice_name: "별봄이",
    title: listItem.title,
    summary: listItem.summary,
    image_url: listItem.image_url,
    turns: [
      {
        turn_index: 0,
        stage: "opening",
        payment_id: mockPayments[0]?.id ?? null,
        question_text: "오늘 어떤 곳에 다녀오셨나요?",
        transcript: "하나마트에 가서 저녁 재료를 샀어요.",
        anomaly_confirmed: null,
        answered_at: listItem.session_date,
      },
      {
        turn_index: 1,
        stage: "recall_detail",
        payment_id: mockPayments[0]?.id ?? null,
        question_text: "무엇을 샀는지 기억나시나요?",
        transcript: "채소랑 과일, 그리고 두부를 샀던 것 같아요.",
        anomaly_confirmed: null,
        answered_at: listItem.session_date,
      },
      {
        turn_index: 2,
        stage: "context",
        payment_id: mockPayments[0]?.id ?? null,
        question_text: "그때 기분은 어떠셨나요?",
        transcript: "날씨가 좋아서 기분 좋게 다녀왔어요.",
        anomaly_confirmed: false,
        answered_at: listItem.session_date,
      },
    ],
    payments: mockPayments,
    score_memory_accuracy: 88,
    score_memory_specificity: 84,
    score_fluency_silence: 82,
    score_fluency_rate: 90,
    score_fluency_filler: 86,
    score_prosody_pitch: 80,
    score_prosody_spectrum: 83,
    anomaly_penalty: 0,
    final_score: listItem.final_score,
    score_detail: {
      demo: true,
      note: "데모 영상 촬영용 목데이터",
    },
    error: null,
  };
}

export function getMockApiData<T>(path: string): T | undefined {
  if (path === "/auth/me") {
    return mockUser as T;
  }

  if (path === "/voices") {
    return mockVoices as T;
  }

  if (path === "/recall/sessions") {
    return mockRecallSessions as T;
  }

  if (path.startsWith("/stats")) {
    return mockStats as T;
  }

  const sessionMatch = path.match(/^\/recall\/sessions\/(\d+)$/);
  if (sessionMatch) {
    const session = createSessionDetail(Number(sessionMatch[1]));
    return session ? (session as T) : undefined;
  }

  return undefined;
}

export function getMockApiPostData<T>(path: string): T | undefined {
  if (path === "/auth/login") {
    return mockLoginResponse as T;
  }

  if (path === "/auth/register") {
    return { id: mockUser.id, username: mockUser.username } as T;
  }

  return undefined;
}
