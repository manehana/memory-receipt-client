// api_spec.md 응답 모델 중 코어 회상 플로우가 소비하는 것만 정의한다.

export type SessionStatus =
  | "in_progress"
  | "analyzing"
  | "completed"
  | "failed";

export type RecallStage =
  | "opening"
  | "recall_detail"
  | "context"
  | "anomaly"
  | "free";

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type VoiceResponse = {
  id: number;
  name: string;
  is_default: boolean;
  owned: boolean;
  created_at: string;
};

export type RecallQuestion = {
  text: string;
  // 합성된 WAV의 Base64 인코딩 값
  audio: string;
};

export type SessionStartResponse = {
  session_id: number;
  basis: "payment" | "gps";
  status: SessionStatus;
  total_turns: number;
  current_index: number;
  resumed: boolean;
  stage: RecallStage | null;
  question: RecallQuestion | null;
};

export type AnswerResponse =
  | {
      session_id: number;
      is_last: false;
      status: "in_progress";
      current_index: number;
      stage: RecallStage;
      question: RecallQuestion;
    }
  | {
      session_id: number;
      is_last: true;
      status: "analyzing";
    };

export type PaymentResponse = {
  id: number;
  merchant: string;
  item: string | null;
  amount: number;
  category: string | null;
  payment_method: string | null;
  paid_at: string;
  created_at: string;
};

export type TurnResponse = {
  turn_index: number;
  stage: RecallStage;
  payment_id: number | null;
  question_text: string;
  transcript: string | null;
  anomaly_confirmed: boolean | null;
  answered_at: string | null;
};

// GET /recall/sessions 및 /auth/me 의 recall_sessions 항목 (가벼운 목록)
export type RecallSessionListItem = {
  id: number;
  session_date: string;
  target_date: string;
  status: SessionStatus;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  final_score: number | null;
};

export type SpeechBaseline = {
  stats: Record<string, unknown>;
  session_count: number;
  updated_at: string;
};

// GET /auth/me — 본인 전체 정보 묶음
export type UserFullResponse = {
  id: number;
  username: string;
  created_at: string;
  payments: PaymentResponse[];
  voices: VoiceResponse[];
  recall_sessions: RecallSessionListItem[];
  speech_baseline: SpeechBaseline | null;
};

export type RecallSessionResponse = {
  id: number;
  basis: "payment" | "gps";
  status: SessionStatus;
  session_date: string;
  target_date: string;
  current_index: number;
  total_turns: number;
  baseline_calibrated: boolean;
  // 세션 시작 시 선택한 대화 친구(음성). 기본 음성으로 폴백된 경우에도 채워진다.
  voice_id: number | null;
  voice_name: string | null;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  turns: TurnResponse[];
  payments: PaymentResponse[];
  final_score: number | null;
  error: string | null;
};
