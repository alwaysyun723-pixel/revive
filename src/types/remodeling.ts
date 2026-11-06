export type TabKey = "home" | "overview" | "events" | "packages" | "calculator";

export interface RepProfile {
  roleTitle: string; // e.g. "RBS"
  name: string; // "서윤"
  division: string; // "Merz Aesthetics Korea"
  phone: string; // "010-4631-7925"
  email: string; // "yun.seo@merz.co.kr"
  kakaoId: string; // "seoyun4"
  kakaoOpenChatUrl: string; // Optional direct open chat URL if added later
  kakaoWebhookToken: string; // Optional Kakao REST API access token for '나에게 보내기'
  customWebhookUrl: string; // Optional Slack/Telegram/Make webhook URL
  tagline: string;
  greetingDefault: string;
}

export interface MerzActivityItem {
  id: string;
  code: string; // "MEX-TALK" | "MEX-PRO" | "MEX-TAILORED" | "SALES-SEMINAR"
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  buttonText: string;
  enabled: boolean;
  isPendingConfirm?: boolean;
  pendingNote?: string;
  highlights: string[];
}

export interface ActivityApplication {
  id: string;
  clinicSlug: string;
  clinicName: string;
  directorName: string;
  activityId: string;
  activityCode: string;
  activityTitle: string;
  preferredDate: string;
  contactPhone: string;
  requestNote: string;
  createdAt: string;
  completedAt?: string;
  adminMemo?: string;
  status: "접수완료" | "일정조율중" | "진행완료";
  kakaoNotified: boolean;
}

export interface BenchmarkClinicEvent {
  id: string;
  clinicName: string;
  branchName: string;
  district: "강남역/신논현" | "청담/압구정" | "신사/논현" | "서초/교대";
  group: "network" | "premium"; // 대형/네트워크 vs 프리미엄/프라이빗
  isDesignated: boolean; // 관리자 지정 4대 병원 여부
  isAiDiscovered: boolean; // AI 서치 발굴 병원 여부
  price1cc: number | null;
  price2cc: number | null;
  price3cc: number | null;
  regularPrice1cc?: number | null;
  eventTitle: string;
  copyKeywords: string[];
  comboDetails: string;
  eventUrl: string;
  updatedAt: string;
}

export interface PackageTemplate {
  id: string;
  category: "merz-synergy" | "market-popular" | "custom";
  name: string;
  tagline: string;
  composition: string[];
  targetConcern: string;
  recommendedPrice: number;
  regularPrice: number;
  synergyPoint: string;
  badge: string;
}

export interface AcademicFileItem {
  fileName: string;
  displayName: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
  ext: string;
  category?: string;
  description?: string;
}

export interface SimulatorDefaults {
  unitCost: number; // 135000 ~ 180000
  sellingPrice: number; // 330000 ~ 660000
  purchaseQty: number; // 8 ~ 500
  patientsPerCc: number[]; // length 8: [1cc, 2cc, 3cc, 4cc, 5cc, 6cc, 7cc, 8cc]
}

export interface ClinicConfig {
  id: string;
  slug: string;
  clinicName: string;
  directorName: string;
  pin: string; // 4~6자리 보안 PIN 번호
  isActive?: boolean; // 접속 권한 허용 여부 (true: 공유받은 상대 접속 가능, false: 접속 차단)
  customGreeting: string;
  heroHeadline: string;
  heroSubtext: string;
  visibleTabs: {
    home: boolean;
    overview: boolean;
    events: boolean;
    packages: boolean;
    calculator: boolean;
  };
  simulatorDefaults: SimulatorDefaults;
  selectedEventIds: string[]; // 노출할 강남/서초 병원 ID 목록
  customPackages: PackageTemplate[]; // 해당 병원 맞춤 추천 패키지/가격표
  customSiteContent?: SiteContentCMS; // 거래처별 개별 문구/프로토콜 오버라이드 (선택)
  createdAt: string;
  updatedAt: string;
}

export interface AccessLogClickItem {
  type: "event_link" | "academic_file" | "activity_apply" | "contact_action";
  label: string;
  timestamp: string;
}

export interface AccessLogSession {
  sessionId: string;
  clinicSlug: string;
  clinicName: string;
  directorName: string;
  deviceType: "Mobile" | "Tablet" | "PC";
  startedAt: string;
  lastActiveAt: string;
  totalDwellSeconds: number;
  tabDwellSeconds: Record<TabKey, number>;
  tabSequence: TabKey[];
  clickedItems: AccessLogClickItem[];
}

export interface ProtocolGuideItem {
  name: string;
  cc: number;
  desc: string;
  targetArea: string;
  cycle: string;
}

export interface ClinicalMetricItem {
  label: string;
  value: string;
  subtext: string;
  description: string;
}

export interface SiteContentCMS {
  brandTitle: string;
  brandSubtitle: string;
  tabLabels: Record<TabKey, string>;
  homeSection: {
    badgeText: string;
    defaultHeadline: string;
    defaultSubheadline: string;
    highlights: {
      title: string;
      metric: string;
      desc: string;
    }[];
    activitySectionTitle: string;
    activitySectionSubtitle: string;
  };
  overviewSection: {
    badgeText: string;
    title: string;
    subtitle: string;
    haTitle: string;
    haSpec: string;
    haDesc: string;
    glycerolTitle: string;
    glycerolSpec: string;
    glycerolDesc: string;
    clinicalMetrics: ClinicalMetricItem[];
    differentiationPoints: {
      title: string;
      desc: string;
      comparisonTag: string;
    }[];
    protocols: ProtocolGuideItem[];
    academicSectionTitle: string;
    academicSectionSubtitle: string;
  };
  eventsSection: {
    badgeText: string;
    title: string;
    subtitle: string;
    networkGroupTitle: string;
    networkGroupDesc: string;
    premiumGroupTitle: string;
    premiumGroupDesc: string;
    insightCallout: string;
  };
  packagesSection: {
    badgeText: string;
    title: string;
    subtitle: string;
    merzSynergyTitle: string;
    merzSynergySubtitle: string;
    marketPopularTitle: string;
    marketPopularSubtitle: string;
    customProposalTitle: string;
    customProposalSubtitle: string;
  };
  calculatorSection: {
    badgeText: string;
    title: string;
    subtitle: string;
  };
}

export interface RemodelingDatabase {
  repProfile: RepProfile;
  merzActivities: MerzActivityItem[];
  siteContent: SiteContentCMS;
  benchmarkEvents: BenchmarkClinicEvent[];
  packageTemplates: PackageTemplate[];
  clinics: ClinicConfig[];
  activityApplications: ActivityApplication[];
  accessLogs: AccessLogSession[];
  academicFileMeta: Record<string, { displayName?: string; category?: string; description?: string }>;
}
