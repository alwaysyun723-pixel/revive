"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  RemodelingDatabase,
  ClinicConfig,
  AcademicFileItem,
  TabKey,
  MerzActivityItem,
} from "@/types/remodeling";
import ReviveProfitSimulator from "./ReviveProfitSimulator";
import {
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Eye,
  Lock,
  Send,
  X,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Settings,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Props {
  db: RemodelingDatabase;
  clinic: ClinicConfig;
  academicFiles: AcademicFileItem[];
  requirePin?: boolean;
  isPreviewMode?: boolean;
  editable?: boolean;
  onUpdateDb?: (nextDb: RemodelingDatabase) => void;
  onUpdateClinic?: (updatedClinic: ClinicConfig) => void;
  onRefreshAcademic?: () => void;
}

const DEFAULT_TAB_LABELS: Record<TabKey, string> = {
  home: "HOME",
  overview: "About Revive",
  events: "강남·서초 Trend",
  packages: "Package 현황",
  calculator: "Profit 시뮬레이터",
};

const ACTIVITY_CARD_THEMES = [
  {
    card: "bg-gradient-to-b from-[#E8F3FF] to-[#F4F9FF] border border-[#B6D8FF]",
    badge: "bg-[#3182F6] text-white",
    btn: "bg-[#3182F6] hover:bg-[#1B64DA] text-white shadow-sm shadow-blue-500/20",
  },
  {
    card: "bg-gradient-to-b from-[#F3F0FF] to-[#F9F7FF] border border-[#D0BFFF]",
    badge: "bg-[#6741D9] text-white",
    btn: "bg-[#6741D9] hover:bg-[#5F3DC4] text-white shadow-sm shadow-purple-500/20",
  },
  {
    card: "bg-gradient-to-b from-[#E5F9F0] to-[#F2FCF7] border border-[#96E6C0]",
    badge: "bg-[#00A862] text-white",
    btn: "bg-[#00A862] hover:bg-[#008C52] text-white shadow-sm shadow-emerald-500/20",
  },
  {
    card: "bg-gradient-to-b from-[#FFF8E6] to-[#FFFDF7] border border-[#FFE08A]",
    badge: "bg-[#F59F00] text-white",
    btn: "bg-[#191F28] hover:bg-[#333D4B] text-white",
  },
];

const PROTOCOL_THEMES = [
  {
    box: "bg-[#F0F6FF] border border-[#CFE2FF]",
    pill: "bg-[#3182F6] text-white",
    title: "text-[#1B64DA]",
  },
  {
    box: "bg-[#E8F3FF] border-2 border-[#3182F6]",
    pill: "bg-[#1B64DA] text-white",
    title: "text-[#1B64DA]",
  },
  {
    box: "bg-[#E5F9F0] border border-[#A6E9C8]",
    pill: "bg-[#00A862] text-white",
    title: "text-[#008C52]",
  },
  {
    box: "bg-[#F3F0FF] border border-[#D8CEFF]",
    pill: "bg-[#6741D9] text-white",
    title: "text-[#5F3DC4]",
  },
];

export default function ClientPortalView({
  db,
  clinic,
  academicFiles,
  requirePin = false,
  isPreviewMode = false,
  editable = false,
  onUpdateDb,
  onUpdateClinic,
  onRefreshAcademic,
}: Props) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!requirePin || editable);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Check sessionStorage or URL ?pin= query on mount if requirePin is enabled
  useEffect(() => {
    if (!requirePin || editable) {
      setIsUnlocked(true);
      return;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get("pin")?.trim();
      if (urlPin && urlPin === clinic.pin.trim()) {
        sessionStorage.setItem(`remodeling_unlocked_${clinic.slug}`, clinic.pin.trim());
        setIsUnlocked(true);
        return;
      }
      const savedPin = sessionStorage.getItem(`remodeling_unlocked_${clinic.slug}`);
      if (savedPin && savedPin === clinic.pin.trim()) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    }
  }, [requirePin, editable, clinic.slug, clinic.pin]);

  const getInitialTab = (): TabKey => {
    if (clinic.visibleTabs.home) return "home";
    if (clinic.visibleTabs.overview) return "overview";
    if (clinic.visibleTabs.events) return "events";
    if (clinic.visibleTabs.packages) return "packages";
    return "calculator";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals state
  const [kakaoModalOpen, setKakaoModalOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<MerzActivityItem | null>(null);
  const [activityDate, setActivityDate] = useState<string>("");
  const [activityPhone, setActivityPhone] = useState<string>("");
  const [activityNote, setActivityNote] = useState<string>("");
  const [activitySubmitting, setActivitySubmitting] = useState<boolean>(false);
  const [activitySuccessData, setActivitySuccessData] = useState<{
    title: string;
    alertMessageText: string;
  } | null>(null);

  const [previewFile, setPreviewFile] = useState<AcademicFileItem | null>(null);
  const [eventFilter, setEventFilter] = useState<"all" | "designated" | "ai">("all");

  // Session & Dwell Tracking
  const sessionIdRef = useRef<string>("");
  const activeTabRef = useRef<TabKey>(activeTab);
  activeTabRef.current = activeTab;

  const detectDeviceType = (): "Mobile" | "Tablet" | "PC" => {
    if (typeof window === "undefined") return "PC";
    const ua = navigator.userAgent;
    if (
      /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth >= 768 && window.innerWidth <= 1180)
    ) {
      return "Tablet";
    }
    if (/Mobile|Android|iPhone|iPod/i.test(ua) || window.innerWidth < 768) {
      return "Mobile";
    }
    return "PC";
  };

  const sendLogUpdate = useCallback(
    async (payload: {
      activeTab?: TabKey;
      dwellIncrementSec?: number;
      clickedItem?: {
        type: "event_link" | "academic_file" | "activity_apply" | "contact_action";
        label: string;
      };
    }) => {
      if (editable || !sessionIdRef.current) return;
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            clinicSlug: clinic.slug,
            clinicName: clinic.clinicName,
            directorName: clinic.directorName,
            deviceType: detectDeviceType(),
            ...payload,
          }),
        });
      } catch {
        // Silent fail
      }
    },
    [editable, clinic.slug, clinic.clinicName, clinic.directorName]
  );

  useEffect(() => {
    if (!isUnlocked || editable) return;
    const storedKey = `remodeling_sess_${clinic.slug}`;
    let sid = sessionStorage.getItem(storedKey);
    if (!sid) {
      sid = `sess-${clinic.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      sessionStorage.setItem(storedKey, sid);
    }
    sessionIdRef.current = sid;

    sendLogUpdate({ activeTab: activeTabRef.current, dwellIncrementSec: 1 });

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendLogUpdate({
          activeTab: activeTabRef.current,
          dwellIncrementSec: 5,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isUnlocked, editable, clinic.slug, sendLogUpdate]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (!editable) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      sendLogUpdate({ activeTab: tab, dwellIncrementSec: 0 });
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleOpenKakaoConnect = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(db.repProfile.kakaoId);
    }
    setCopiedField("kakao");
    setTimeout(() => setCopiedField(null), 2500);
    sendLogUpdate({
      clickedItem: {
        type: "contact_action",
        label: `RBS ${db.repProfile.name} 카카오톡(${db.repProfile.kakaoId}) 연결 클릭`,
      },
    });
    const directUrl = db.repProfile.kakaoOpenChatUrl?.trim();
    if (directUrl && typeof window !== "undefined") {
      window.location.href = directUrl;
      return;
    }
    setKakaoModalOpen(true);
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/android/i.test(ua)) {
        window.location.href =
          "intent://main#Intent;scheme=kakaotalk;package=com.kakao.talk;end";
      } else {
        window.location.href = "kakaotalk://launch";
      }
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === clinic.pin.trim()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`remodeling_unlocked_${clinic.slug}`, clinic.pin.trim());
      }
      setIsUnlocked(true);
      setPinError("");
    } else {
      setPinError("보안 PIN 번호가 일치하지 않습니다. 전달받으신 번호를 다시 확인해 주세요.");
    }
  };

  const handleLockScreen = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`remodeling_unlocked_${clinic.slug}`);
    }
    setPinInput("");
    setIsUnlocked(false);
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    setActivitySubmitting(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicSlug: clinic.slug,
          clinicName: clinic.clinicName,
          directorName: clinic.directorName,
          activityId: selectedActivity.id,
          activityCode: selectedActivity.code,
          activityTitle: selectedActivity.title,
          preferredDate: activityDate || "일정 협의 희망",
          contactPhone: activityPhone || "",
          requestNote: activityNote || "",
          sessionId: sessionIdRef.current,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActivitySuccessData({
          title: selectedActivity.title,
          alertMessageText: data.alertMessageText,
        });
        setActivityDate("");
        setActivityPhone("");
        setActivityNote("");
      }
    } finally {
      setActivitySubmitting(false);
    }
  };

  const { repProfile, siteContent, merzActivities, benchmarkEvents, packageTemplates } = db;
  const tabLabels: Record<TabKey, string> = {
    ...DEFAULT_TAB_LABELS,
    ...(siteContent.tabLabels || {}),
  };

  const updateSiteContent = (partial: Partial<typeof siteContent>) => {
    if (!onUpdateDb) return;
    onUpdateDb({
      ...db,
      siteContent: {
        ...siteContent,
        ...partial,
      },
    });
  };

  const clinicEvents = benchmarkEvents.filter((ev) =>
    editable
      ? true
      : clinic.selectedEventIds?.length > 0
      ? clinic.selectedEventIds.includes(ev.id)
      : true
  );

  const filteredEvents = clinicEvents.filter((ev) => {
    if (eventFilter === "designated" && !ev.isDesignated) return false;
    if (eventFilter === "ai" && !ev.isAiDiscovered) return false;
    return true;
  });

  const networkEvents = filteredEvents.filter((ev) => ev.group === "network");
  const premiumEvents = filteredEvents.filter((ev) => ev.group === "premium");

  // PIN Lock Gate Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#191F28] via-[#1B3A6B] to-[#3182F6] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-[32px] p-8 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-3xl bg-[#E8F3FF] text-[#3182F6] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full">
              {clinic.clinicName} 전용
            </span>
            <h1 className="text-2xl font-extrabold text-[#191F28] pt-1">
              비밀번호를 입력해주세요
            </h1>
            <p className="text-xs text-[#8B95A1]">
              전달받으신 4자리 PIN 번호를 입력하면 열려요
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl tracking-[0.5em] font-extrabold text-[#191F28] bg-[#F2F4F6] rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition"
            />
            {pinError && <p className="text-xs text-rose-500 font-bold">{pinError}</p>}

            <button
              type="submit"
              className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold py-4 rounded-2xl transition active:scale-[0.98] text-sm shadow-md shadow-blue-500/20"
            >
              브리핑 열기
            </button>
          </form>

          <div className="pt-2 text-xs text-[#8B95A1]">
            문의: {repProfile.roleTitle} {repProfile.name} ({repProfile.phone})
          </div>
        </div>
      </div>
    );
  }

  const navItems: { key: TabKey; emoji: string; visible: boolean }[] = [
    { key: "home", emoji: "🏠", visible: editable || clinic.visibleTabs.home },
    { key: "overview", emoji: "💧", visible: editable || clinic.visibleTabs.overview },
    { key: "events", emoji: "📍", visible: editable || clinic.visibleTabs.events },
    { key: "packages", emoji: "🎁", visible: editable || clinic.visibleTabs.packages },
    { key: "calculator", emoji: "🧮", visible: editable || clinic.visibleTabs.calculator },
  ];

  const totalSimMonthlyCc = (
    clinic.simulatorDefaults.patientsPerCc || [2, 8, 2, 1, 0, 0, 0, 0]
  ).reduce((acc, count, idx) => acc + count * (idx + 1), 0);
  const simUnitProfit = clinic.simulatorDefaults.sellingPrice - clinic.simulatorDefaults.unitCost;
  const simEstimatedMonthlyProfit = totalSimMonthlyCc * simUnitProfit;

  return (
    <div className="min-h-screen flex flex-col bg-[#EDF2F9] text-[#191F28]">
      {/* Translucent Top Bar */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-30 border-b border-blue-900/[0.06] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#00B4D8] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                Re:
              </div>
              <div className="flex items-center gap-2">
                {editable ? (
                  <input
                    type="text"
                    value={siteContent.brandTitle}
                    onChange={(e) => updateSiteContent({ brandTitle: e.target.value })}
                    className="font-extrabold text-lg text-[#191F28] bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-0.5 w-36"
                    title="사이트 브랜드명 수정"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabChange("home")}
                    className="font-extrabold text-lg tracking-tight text-[#191F28]"
                  >
                    {siteContent.brandTitle}
                  </button>
                )}
                <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-2.5 py-0.5 rounded-full">
                  {clinic.clinicName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editable && requirePin && (
                <button
                  type="button"
                  onClick={handleLockScreen}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-[#4E5968] font-bold px-3 py-2 rounded-2xl flex items-center gap-1 transition"
                  title="화면 다시 잠그기 (PIN 번호 보호)"
                >
                  <Lock className="w-3.5 h-3.5 text-[#3182F6]" />
                  <span>잠금</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenKakaoConnect}
                className="text-xs bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-[#191F28]" />
                <span>{repProfile.name} 카톡</span>
              </button>
            </div>
          </div>

          {/* Segmented Tab Bar with Editable Tab Names */}
          <div className="pb-3 space-y-2">
            {editable && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-900 flex flex-wrap items-center gap-2">
                <span className="font-extrabold">✏️ 상단 메뉴 탭 이름 직접 수정:</span>
                {navItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-300">
                    <span>{item.emoji}</span>
                    <input
                      type="text"
                      value={tabLabels[item.key]}
                      onChange={(e) =>
                        updateSiteContent({
                          tabLabels: {
                            ...tabLabels,
                            [item.key]: e.target.value,
                          },
                        })
                      }
                      className="text-xs font-bold text-[#191F28] w-28 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <nav className="flex items-center gap-1.5 bg-[#E6EEF8] p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
              {navItems
                .filter((item) => item.visible)
                .map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleTabChange(item.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-[#3182F6] text-white shadow-md shadow-blue-500/25"
                          : "text-[#4E5968] hover:bg-white/60 hover:text-[#191F28]"
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{tabLabels[item.key]}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 flex-1 w-full space-y-6">
        {/* ==================== TAB 1: HOME ==================== */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero + RBS 서윤 명함 2-Column Layout with Vibrant Blue Colors */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left 7 Cols: Vibrant Toss Royal Blue Gradient Welcome Card */}
              <div className="lg:col-span-7 rounded-[28px] bg-gradient-to-br from-[#1B64DA] via-[#3182F6] to-[#00A8E8] text-white p-7 sm:p-9 shadow-xl shadow-blue-500/15 flex flex-col justify-between space-y-6">
                {editable ? (
                  <div className="space-y-3 bg-white/10 p-4 rounded-2xl border border-white/25">
                    <span className="text-[11px] font-bold text-[#FEE500] block">
                      ✏️ [{clinic.clinicName}] 상단 배너 맞춤 타이틀 & 원장님 인사말 직접 수정
                    </span>
                    <input
                      type="text"
                      value={siteContent.homeSection.badgeText}
                      onChange={(e) =>
                        updateSiteContent({
                          homeSection: {
                            ...siteContent.homeSection,
                            badgeText: e.target.value,
                          },
                        })
                      }
                      placeholder="상단 배지 문구"
                      className="text-xs font-bold bg-white/20 text-white rounded-xl px-3 py-1.5 w-full"
                    />
                    <input
                      type="text"
                      value={clinic.heroHeadline || siteContent.homeSection.defaultHeadline}
                      onChange={(e) => {
                        if (onUpdateClinic) {
                          onUpdateClinic({
                            ...clinic,
                            heroHeadline: e.target.value,
                          });
                        } else {
                          updateSiteContent({
                            homeSection: {
                              ...siteContent.homeSection,
                              defaultHeadline: e.target.value,
                            },
                          });
                        }
                      }}
                      placeholder="이 거래처 원장님께 보여줄 환영 메인 타이틀"
                      className="text-lg font-extrabold bg-white/20 text-white rounded-xl px-3 py-2 w-full"
                    />
                    <textarea
                      rows={2}
                      value={clinic.customGreeting || repProfile.greetingDefault}
                      onChange={(e) => {
                        if (onUpdateClinic) {
                          onUpdateClinic({
                            ...clinic,
                            customGreeting: e.target.value,
                          });
                        } else if (onUpdateDb) {
                          onUpdateDb({
                            ...db,
                            repProfile: { ...repProfile, greetingDefault: e.target.value },
                          });
                        }
                      }}
                      placeholder="이 거래처 원장님께 전하는 맞춤 인사말"
                      className="text-xs bg-white/20 text-white rounded-xl p-3 w-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="inline-block text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full">
                      {siteContent.homeSection.badgeText} · {clinic.clinicName}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight">
                      {clinic.heroHeadline || siteContent.homeSection.defaultHeadline}
                    </h1>
                    <p className="text-sm text-blue-50 leading-relaxed">
                      {clinic.customGreeting || repProfile.greetingDefault}
                    </p>
                  </div>
                )}

                {/* 3 Glassmorphic Key Numbers Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {siteContent.homeSection.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-1"
                    >
                      {editable ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={hl.title}
                            onChange={(e) => {
                              const next = [...siteContent.homeSection.highlights];
                              next[i] = { ...hl, title: e.target.value };
                              updateSiteContent({
                                homeSection: { ...siteContent.homeSection, highlights: next },
                              });
                            }}
                            className="text-[11px] font-bold bg-white/20 text-white rounded px-2 py-0.5 w-full"
                          />
                          <input
                            type="text"
                            value={hl.metric}
                            onChange={(e) => {
                              const next = [...siteContent.homeSection.highlights];
                              next[i] = { ...hl, metric: e.target.value };
                              updateSiteContent({
                                homeSection: { ...siteContent.homeSection, highlights: next },
                              });
                            }}
                            className="text-sm font-extrabold bg-white/20 text-[#FEE500] rounded px-2 py-0.5 w-full"
                          />
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] font-semibold text-blue-100 block">
                            {hl.title}
                          </span>
                          <strong className="text-base sm:text-lg font-extrabold text-[#FEE500] block">
                            {hl.metric}
                          </strong>
                          <span className="text-[11px] text-white/85 block">{hl.desc}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Deep Navy-Blue Digital Business Card (RBS 서윤) */}
              <div className="lg:col-span-5 rounded-[28px] bg-gradient-to-b from-[#191F28] to-[#1F2D46] text-white p-7 shadow-lg flex flex-col justify-between space-y-5">
                {editable ? (
                  <div className="space-y-2.5 text-xs">
                    <span className="text-[11px] font-bold text-[#FEE500] block">
                      ✏️ 디지털 명함 정보 직접 수정
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={repProfile.roleTitle}
                        onChange={(e) =>
                          onUpdateDb &&
                          onUpdateDb({
                            ...db,
                            repProfile: { ...repProfile, roleTitle: e.target.value },
                          })
                        }
                        placeholder="직책 (RBS)"
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white font-bold"
                      />
                      <input
                        type="text"
                        value={repProfile.name}
                        onChange={(e) =>
                          onUpdateDb &&
                          onUpdateDb({
                            ...db,
                            repProfile: { ...repProfile, name: e.target.value },
                          })
                        }
                        placeholder="이름 (서윤)"
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white font-bold"
                      />
                    </div>
                    <input
                      type="text"
                      value={repProfile.tagline}
                      onChange={(e) =>
                        onUpdateDb &&
                        onUpdateDb({
                          ...db,
                          repProfile: { ...repProfile, tagline: e.target.value },
                        })
                      }
                      placeholder="한줄 소개"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={repProfile.phone}
                        onChange={(e) =>
                          onUpdateDb &&
                          onUpdateDb({
                            ...db,
                            repProfile: { ...repProfile, phone: e.target.value },
                          })
                        }
                        placeholder="전화번호"
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={repProfile.kakaoId}
                        onChange={(e) =>
                          onUpdateDb &&
                          onUpdateDb({
                            ...db,
                            repProfile: { ...repProfile, kakaoId: e.target.value },
                          })
                        }
                        placeholder="카톡 ID"
                        className="bg-[#FEE500]/20 border border-[#FEE500] rounded-xl px-3 py-1.5 text-[#FEE500] font-bold"
                      />
                    </div>
                    <input
                      type="text"
                      value={repProfile.email}
                      onChange={(e) =>
                        onUpdateDb &&
                        onUpdateDb({
                          ...db,
                          repProfile: { ...repProfile, email: e.target.value },
                        })
                      }
                      placeholder="이메일"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#60A5FA] block">
                        MERZ AESTHETICS PARTNER
                      </span>
                      <h2 className="text-xl font-extrabold text-white mt-0.5">
                        {repProfile.roleTitle} : {repProfile.name}
                      </h2>
                      <p className="text-xs text-slate-300 mt-1">{repProfile.tagline}</p>
                    </div>
                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#3182F6] to-[#00C471] text-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow-md">
                      <span className="text-[10px] leading-none opacity-90">
                        {repProfile.roleTitle}
                      </span>
                      <span className="text-base mt-0.5">{repProfile.name}</span>
                    </div>
                  </div>
                )}

                {/* Contact Action Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleOpenKakaoConnect}
                    className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-between transition active:scale-[0.98] shadow-md"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 fill-[#191F28]" />
                      <span>카카오톡 바로 연결</span>
                    </div>
                    <span className="text-xs font-extrabold bg-black/10 px-2.5 py-1 rounded-xl">
                      ID : {repProfile.kakaoId}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${repProfile.phone}`}
                      onClick={() =>
                        sendLogUpdate({
                          clickedItem: {
                            type: "contact_action",
                            label: `명함 전화걸기 (${repProfile.phone})`,
                          },
                        })
                      }
                      className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-1.5 text-xs transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#60A5FA]" />
                      <span>{repProfile.phone}</span>
                    </a>

                    <a
                      href={`mailto:${repProfile.email}`}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-1.5 text-xs truncate transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#00E68A] shrink-0" />
                      <span className="truncate">{repProfile.email}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Merz Activity 4종 신청 (Colorful Toss Cards) */}
            <div className="toss-card p-7 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {editable ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={siteContent.homeSection.activitySectionTitle}
                      onChange={(e) =>
                        updateSiteContent({
                          homeSection: {
                            ...siteContent.homeSection,
                            activitySectionTitle: e.target.value,
                          },
                        })
                      }
                      className="text-lg font-extrabold text-[#191F28] bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5 w-full"
                    />
                    <input
                      type="text"
                      value={siteContent.homeSection.activitySectionSubtitle}
                      onChange={(e) =>
                        updateSiteContent({
                          homeSection: {
                            ...siteContent.homeSection,
                            activitySectionSubtitle: e.target.value,
                          },
                        })
                      }
                      className="text-xs text-[#4E5968] bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5 w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="inline-block text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full mb-1.5">
                      ✨ MERZ ACTIVITY 4종 신청
                    </span>
                    <h2 className="text-xl font-extrabold text-[#191F28]">
                      {siteContent.homeSection.activitySectionTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8B95A1] mt-0.5">
                      {siteContent.homeSection.activitySectionSubtitle}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {merzActivities
                  .filter((act) => editable || act.enabled)
                  .map((act, idx) => {
                    const theme = ACTIVITY_CARD_THEMES[idx % ACTIVITY_CARD_THEMES.length];
                    return (
                      <div
                        key={act.id}
                        className={`rounded-3xl p-5 flex flex-col justify-between space-y-4 transition hover:-translate-y-0.5 ${theme.card}`}
                      >
                        {editable && onUpdateDb ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={act.code}
                                onChange={(e) => {
                                  const next = [...merzActivities];
                                  next[idx] = { ...act, code: e.target.value };
                                  onUpdateDb({ ...db, merzActivities: next });
                                }}
                                className="font-extrabold text-[#191F28] bg-white border border-blue-300 rounded-lg px-2 py-1 w-28"
                              />
                              <label className="flex items-center gap-1 font-bold text-[#3182F6]">
                                <input
                                  type="checkbox"
                                  checked={act.enabled}
                                  onChange={(e) => {
                                    const next = [...merzActivities];
                                    next[idx] = { ...act, enabled: e.target.checked };
                                    onUpdateDb({ ...db, merzActivities: next });
                                  }}
                                />
                                <span>노출</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={act.badge}
                              onChange={(e) => {
                                const next = [...merzActivities];
                                next[idx] = { ...act, badge: e.target.value };
                                onUpdateDb({ ...db, merzActivities: next });
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 font-bold"
                            />
                            <input
                              type="text"
                              value={act.title}
                              onChange={(e) => {
                                const next = [...merzActivities];
                                next[idx] = { ...act, title: e.target.value };
                                onUpdateDb({ ...db, merzActivities: next });
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 font-extrabold"
                            />
                            <textarea
                              rows={2}
                              value={act.description}
                              onChange={(e) => {
                                const next = [...merzActivities];
                                next[idx] = { ...act, description: e.target.value };
                                onUpdateDb({ ...db, merzActivities: next });
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg p-2"
                            />
                            <input
                              type="text"
                              value={act.buttonText}
                              onChange={(e) => {
                                const next = [...merzActivities];
                                next[idx] = { ...act, buttonText: e.target.value };
                                onUpdateDb({ ...db, merzActivities: next });
                              }}
                              className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 font-bold text-[#3182F6]"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${theme.badge}`}
                                >
                                  {act.badge}
                                </span>
                                <span className="text-[11px] font-extrabold text-[#4E5968]">
                                  {act.code}
                                </span>
                              </div>

                              <h3 className="text-base font-extrabold text-[#191F28] pt-1">
                                {act.title}
                              </h3>
                              <p className="text-xs text-[#4E5968] leading-relaxed">
                                {act.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedActivity(act);
                                setActivitySuccessData(null);
                              }}
                              className={`w-full py-3 rounded-2xl font-extrabold text-xs transition active:scale-95 ${theme.btn}`}
                            >
                              {act.buttonText}
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 우리 병원 수익 3초 요약 컬러 배너 */}
            <div className="rounded-[28px] bg-gradient-to-r from-[#191F28] via-[#1B3A6B] to-[#1B64DA] text-white p-7 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#00E68A] bg-white/10 px-3 py-1 rounded-full">
                  💰 {clinic.clinicName} 맞춤 수익 요약
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold pt-1">
                  {clinic.simulatorDefaults.purchaseQty}cc 도입 시 월{" "}
                  <span className="text-[#FEE500]">
                    +{(simEstimatedMonthlyProfit / 10000).toLocaleString()}만원
                  </span>{" "}
                  순수익이 예상돼요
                </h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  1cc 공급가 {(clinic.simulatorDefaults.unitCost / 10000).toFixed(1)}만원 · 권장 수가{" "}
                  {(clinic.simulatorDefaults.sellingPrice / 10000).toFixed(0)}만원 기준
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTabChange("calculator")}
                  className="bg-[#3182F6] hover:bg-[#2563EB] text-white font-extrabold text-xs sm:text-sm px-5 py-3.5 rounded-2xl flex items-center gap-1.5 transition active:scale-95 shadow-md"
                >
                  <span>{tabLabels.calculator} 열기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("events")}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl border border-white/20 transition active:scale-95"
                >
                  {tabLabels.events} 보기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: About Revive & 학술자료 ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Dual Ingredient Card with Rich Blue & Mint Gradients */}
            <div className="toss-card p-7 sm:p-9 space-y-6">
              {editable ? (
                <div className="space-y-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 block">
                    ✏️ About Revive 상단 타이틀 수정
                  </span>
                  <input
                    type="text"
                    value={siteContent.overviewSection.badgeText}
                    onChange={(e) =>
                      updateSiteContent({
                        overviewSection: {
                          ...siteContent.overviewSection,
                          badgeText: e.target.value,
                        },
                      })
                    }
                    className="text-xs font-bold bg-white border border-amber-300 rounded-xl px-3 py-1.5 w-64"
                  />
                  <input
                    type="text"
                    value={siteContent.overviewSection.title}
                    onChange={(e) =>
                      updateSiteContent({
                        overviewSection: {
                          ...siteContent.overviewSection,
                          title: e.target.value,
                        },
                      })
                    }
                    className="text-lg font-extrabold bg-white border border-amber-300 rounded-xl px-3 py-1.5 w-full"
                  />
                  <input
                    type="text"
                    value={siteContent.overviewSection.subtitle}
                    onChange={(e) =>
                      updateSiteContent({
                        overviewSection: {
                          ...siteContent.overviewSection,
                          subtitle: e.target.value,
                        },
                      })
                    }
                    className="text-xs bg-white border border-amber-300 rounded-xl px-3 py-1.5 w-full"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3.5 py-1 rounded-full">
                    {siteContent.overviewSection.badgeText}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191F28] pt-1">
                    {siteContent.overviewSection.title}
                  </h2>
                  <p className="text-sm text-[#4E5968]">{siteContent.overviewSection.subtitle}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* HA Card in Toss Blue Gradient */}
                <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] text-white p-6 sm:p-7 rounded-3xl space-y-2.5 shadow-md shadow-blue-500/15">
                  {editable ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={siteContent.overviewSection.haTitle}
                          onChange={(e) =>
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                haTitle: e.target.value,
                              },
                            })
                          }
                          className="font-extrabold text-sm bg-white/20 text-white rounded-xl px-3 py-1 flex-1"
                        />
                        <input
                          type="text"
                          value={siteContent.overviewSection.haSpec}
                          onChange={(e) =>
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                haSpec: e.target.value,
                              },
                            })
                          }
                          className="font-bold text-xs bg-white/20 text-white rounded-xl px-2 py-1 w-24"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={siteContent.overviewSection.haDesc}
                        onChange={(e) =>
                          updateSiteContent({
                            overviewSection: {
                              ...siteContent.overviewSection,
                              haDesc: e.target.value,
                            },
                          })
                        }
                        className="text-xs bg-white/20 text-white rounded-xl p-2 w-full"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-100">
                          💧 COMPONENT 01 · 수분 충전
                        </span>
                        <span className="text-xs font-extrabold bg-white text-[#1B64DA] px-3 py-1 rounded-full">
                          {siteContent.overviewSection.haSpec}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold">
                        {siteContent.overviewSection.haTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-50 leading-relaxed">
                        {siteContent.overviewSection.haDesc}
                      </p>
                    </>
                  )}
                </div>

                {/* Glycerol Card in Teal/Mint Gradient */}
                <div className="bg-gradient-to-br from-[#00B493] to-[#008C72] text-white p-6 sm:p-7 rounded-3xl space-y-2.5 shadow-md shadow-teal-500/15">
                  {editable ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={siteContent.overviewSection.glycerolTitle}
                          onChange={(e) =>
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                glycerolTitle: e.target.value,
                              },
                            })
                          }
                          className="font-extrabold text-sm bg-white/20 text-white rounded-xl px-3 py-1 flex-1"
                        />
                        <input
                          type="text"
                          value={siteContent.overviewSection.glycerolSpec}
                          onChange={(e) =>
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                glycerolSpec: e.target.value,
                              },
                            })
                          }
                          className="font-bold text-xs bg-white/20 text-white rounded-xl px-2 py-1 w-24"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={siteContent.overviewSection.glycerolDesc}
                        onChange={(e) =>
                          updateSiteContent({
                            overviewSection: {
                              ...siteContent.overviewSection,
                              glycerolDesc: e.target.value,
                            },
                          })
                        }
                        className="text-xs bg-white/20 text-white rounded-xl p-2 w-full"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-teal-100">
                          🛡️ COMPONENT 02 · 수분 잠금 & 장벽
                        </span>
                        <span className="text-xs font-extrabold bg-white text-[#008C72] px-3 py-1 rounded-full">
                          {siteContent.overviewSection.glycerolSpec}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold">
                        {siteContent.overviewSection.glycerolTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-teal-50 leading-relaxed">
                        {siteContent.overviewSection.glycerolDesc}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Colorful Clinical Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {siteContent.overviewSection.clinicalMetrics.map((m, idx) => {
                const cardStyles = [
                  "bg-[#E8F3FF] border border-[#B6D8FF] text-[#1B64DA]",
                  "bg-[#E5F9F0] border border-[#96E6C0] text-[#008C52]",
                  "bg-[#FFF0F6] border border-[#FCC2D7] text-[#C2255C]",
                  "bg-[#F3F0FF] border border-[#D0BFFF] text-[#5F3DC4]",
                ];
                return (
                  <div
                    key={idx}
                    className={`rounded-[28px] p-6 space-y-1.5 ${cardStyles[idx % cardStyles.length]}`}
                  >
                    {editable ? (
                      <div className="space-y-1.5 text-xs">
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => {
                            const next = [...siteContent.overviewSection.clinicalMetrics];
                            next[idx] = { ...m, label: e.target.value };
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                clinicalMetrics: next,
                              },
                            });
                          }}
                          className="w-full bg-white rounded-lg px-2 py-1 font-bold text-[#191F28]"
                        />
                        <input
                          type="text"
                          value={m.value}
                          onChange={(e) => {
                            const next = [...siteContent.overviewSection.clinicalMetrics];
                            next[idx] = { ...m, value: e.target.value };
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                clinicalMetrics: next,
                              },
                            });
                          }}
                          className="w-full bg-white rounded-lg px-2 py-1 text-lg font-extrabold text-[#3182F6]"
                        />
                        <input
                          type="text"
                          value={m.subtext}
                          onChange={(e) => {
                            const next = [...siteContent.overviewSection.clinicalMetrics];
                            next[idx] = { ...m, subtext: e.target.value };
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                clinicalMetrics: next,
                              },
                            });
                          }}
                          className="w-full bg-white rounded-lg px-2 py-1 font-semibold text-[#191F28]"
                        />
                        <input
                          type="text"
                          value={m.description}
                          onChange={(e) => {
                            const next = [...siteContent.overviewSection.clinicalMetrics];
                            next[idx] = { ...m, description: e.target.value };
                            updateSiteContent({
                              overviewSection: {
                                ...siteContent.overviewSection,
                                clinicalMetrics: next,
                              },
                            });
                          }}
                          className="w-full bg-white rounded-lg px-2 py-1 text-[#4E5968]"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold opacity-80">{m.label}</span>
                        <div className="text-3xl font-extrabold">{m.value}</div>
                        <div className="text-xs font-extrabold text-[#191F28]">{m.subtext}</div>
                        <p className="text-xs text-[#4E5968] pt-1">{m.description}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ==================== 용량별 권장 시술 프로토콜 (1cc ~ 4cc 완벽 수정 지원) ==================== */}
            <div className="toss-card p-7 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full">
                    💉 INJECTION PROTOCOL
                  </span>
                  <h3 className="text-xl font-extrabold text-[#191F28] mt-1.5">
                    용량별 권장 시술 프로토콜
                  </h3>
                </div>
                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSiteContent({
                        overviewSection: {
                          ...siteContent.overviewSection,
                          protocols: [
                            ...siteContent.overviewSection.protocols,
                            {
                              name: `${siteContent.overviewSection.protocols.length + 1}cc 프로토콜`,
                              cc: siteContent.overviewSection.protocols.length + 1,
                              desc: "프로토콜 설명을 입력해주세요",
                              targetArea: "권장 부위",
                              cycle: "권장 주기",
                            },
                          ],
                        },
                      })
                    }
                    className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>프로토콜 카드 추가</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {siteContent.overviewSection.protocols.map((proto, idx) => {
                  const theme = PROTOCOL_THEMES[idx % PROTOCOL_THEMES.length];
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-3xl flex flex-col justify-between space-y-3 ${theme.box}`}
                    >
                      {editable ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <input
                              type="text"
                              value={proto.name}
                              onChange={(e) => {
                                const next = [...siteContent.overviewSection.protocols];
                                next[idx] = { ...proto, name: e.target.value };
                                updateSiteContent({
                                  overviewSection: {
                                    ...siteContent.overviewSection,
                                    protocols: next,
                                  },
                                });
                              }}
                              placeholder="프로토콜명"
                              className="font-extrabold text-sm text-[#191F28] bg-white border border-blue-300 rounded-xl px-2.5 py-1 w-full"
                            />
                            <div className="flex items-center gap-0.5 shrink-0">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={proto.cc}
                                onChange={(e) => {
                                  const next = [...siteContent.overviewSection.protocols];
                                  next[idx] = { ...proto, cc: Number(e.target.value) || 1 };
                                  updateSiteContent({
                                    overviewSection: {
                                      ...siteContent.overviewSection,
                                      protocols: next,
                                    },
                                  });
                                }}
                                className="w-12 text-center font-bold bg-white border border-blue-300 rounded-xl py-1"
                              />
                              <span className="font-bold">cc</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = siteContent.overviewSection.protocols.filter(
                                  (_, i) => i !== idx
                                );
                                updateSiteContent({
                                  overviewSection: {
                                    ...siteContent.overviewSection,
                                    protocols: next,
                                  },
                                });
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg"
                              title="프로토콜 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={proto.desc}
                            onChange={(e) => {
                              const next = [...siteContent.overviewSection.protocols];
                              next[idx] = { ...proto, desc: e.target.value };
                              updateSiteContent({
                                overviewSection: {
                                  ...siteContent.overviewSection,
                                  protocols: next,
                                },
                              });
                            }}
                            placeholder="프로토콜 설명"
                            className="w-full bg-white border border-blue-300 rounded-xl p-2 text-[#191F28]"
                          />

                          <input
                            type="text"
                            value={proto.targetArea}
                            onChange={(e) => {
                              const next = [...siteContent.overviewSection.protocols];
                              next[idx] = { ...proto, targetArea: e.target.value };
                              updateSiteContent({
                                overviewSection: {
                                  ...siteContent.overviewSection,
                                  protocols: next,
                                },
                              });
                            }}
                            placeholder="권장 부위 (예: 양볼 전체)"
                            className="w-full bg-white border border-blue-300 rounded-xl px-2.5 py-1 text-[#4E5968]"
                          />

                          <input
                            type="text"
                            value={proto.cycle}
                            onChange={(e) => {
                              const next = [...siteContent.overviewSection.protocols];
                              next[idx] = { ...proto, cycle: e.target.value };
                              updateSiteContent({
                                overviewSection: {
                                  ...siteContent.overviewSection,
                                  protocols: next,
                                },
                              });
                            }}
                            placeholder="권장 주기 (예: 4주 간격 3회)"
                            className="w-full bg-white border border-blue-300 rounded-xl px-2.5 py-1 text-[#4E5968]"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`font-extrabold text-base ${theme.title}`}>
                                {proto.name}
                              </span>
                              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${theme.pill}`}>
                                {proto.cc}cc
                              </span>
                            </div>
                            <p className="text-xs text-[#191F28] font-medium leading-relaxed">
                              {proto.desc}
                            </p>
                          </div>
                          <div className="text-[11px] font-semibold text-[#4E5968] bg-white/80 px-3 py-2 rounded-2xl">
                            📍 {proto.targetArea} · {proto.cycle}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 실시간 학술 자료실 */}
            <div className="toss-card p-7 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-[#191F28]">
                    📚 {siteContent.overviewSection.academicSectionTitle}
                  </h3>
                  <p className="text-xs text-[#8B95A1] mt-0.5">
                    {siteContent.overviewSection.academicSectionSubtitle}
                  </p>
                </div>

                {onRefreshAcademic && (
                  <button
                    type="button"
                    onClick={onRefreshAcademic}
                    className="text-xs bg-[#E8F3FF] hover:bg-[#3182F6] text-[#3182F6] hover:text-white font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>폴더 동기화</span>
                  </button>
                )}
              </div>

              {academicFiles.length === 0 ? (
                <div className="text-center py-8 bg-[#F9FAFB] rounded-3xl text-xs text-[#8B95A1]">
                  폴더에 등록된 학술 자료가 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {academicFiles.map((file) => (
                    <div
                      key={file.fileName}
                      className="bg-[#F8FAFC] hover:bg-[#E8F3FF]/50 border border-slate-200/80 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#3182F6] bg-[#E8F3FF] px-2.5 py-0.5 rounded-full">
                            {file.category || "📄 학술 자료"}
                          </span>
                          <span className="text-[11px] font-bold text-[#8B95A1]">{file.ext}</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-[#191F28]">
                          {file.displayName}
                        </h4>
                        <p className="text-xs text-[#4E5968]">{file.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewFile(file);
                            sendLogUpdate({
                              clickedItem: {
                                type: "academic_file",
                                label: `학술자료 열람: ${file.displayName}`,
                              },
                            });
                          }}
                          className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-extrabold py-2.5 px-4 rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>열어보기</span>
                        </button>
                        <a
                          href={file.url}
                          download={file.fileName}
                          onClick={() =>
                            sendLogUpdate({
                              clickedItem: {
                                type: "academic_file",
                                label: `학술자료 다운로드: ${file.displayName}`,
                              },
                            })
                          }
                          className="p-2.5 bg-white hover:bg-slate-100 text-[#4E5968] rounded-2xl border border-slate-200 transition"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 강남·서초 Trend ==================== */}
        {activeTab === "events" && (
          <div className="space-y-6 animate-fade-in">
            {/* Colorful Blue Market Trend Banner */}
            <div className="rounded-[28px] bg-gradient-to-r from-[#1B64DA] via-[#3182F6] to-[#0096FF] text-white p-7 sm:p-8 shadow-lg shadow-blue-500/15 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {editable ? (
                  <div className="flex-1 space-y-2 bg-white/15 p-4 rounded-2xl">
                    <span className="text-xs font-bold text-[#FEE500] block">
                      ✏️ 강남·서초 Trend 상단 문구 수정
                    </span>
                    <input
                      type="text"
                      value={siteContent.eventsSection.title}
                      onChange={(e) =>
                        updateSiteContent({
                          eventsSection: {
                            ...siteContent.eventsSection,
                            title: e.target.value,
                          },
                        })
                      }
                      className="text-lg font-extrabold bg-white/20 text-white rounded-xl px-3 py-1.5 w-full"
                    />
                    <input
                      type="text"
                      value={siteContent.eventsSection.insightCallout}
                      onChange={(e) =>
                        updateSiteContent({
                          eventsSection: {
                            ...siteContent.eventsSection,
                            insightCallout: e.target.value,
                          },
                        })
                      }
                      className="text-xs bg-white/20 text-white rounded-xl px-3 py-1.5 w-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="inline-block text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                      {siteContent.eventsSection.badgeText}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold pt-1">
                      {siteContent.eventsSection.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-50 font-medium">
                      {siteContent.eventsSection.insightCallout}
                    </p>
                  </div>
                )}

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl self-start shrink-0">
                  {[
                    { key: "all", label: `전체 (${clinicEvents.length})` },
                    {
                      key: "designated",
                      label: `⭐ 지정 병원 (${clinicEvents.filter((e) => e.isDesignated).length})`,
                    },
                    {
                      key: "ai",
                      label: `🤖 AI 탐색 (${clinicEvents.filter((e) => e.isAiDiscovered).length})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setEventFilter(f.key as "all" | "designated" | "ai")}
                      className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition ${
                        eventFilter === f.key
                          ? "bg-white text-[#1B64DA] shadow-sm"
                          : "text-blue-100 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Group A: 대형·네트워크 의원 */}
            {networkEvents.length > 0 && (
              <div className="space-y-3">
                <div className="px-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#191F28]">
                    🏢 {siteContent.eventsSection.networkGroupTitle}
                  </h3>
                  <p className="text-xs text-[#4E5968]">
                    {siteContent.eventsSection.networkGroupDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {networkEvents.map((ev) => {
                    const globalIdx = benchmarkEvents.findIndex((b) => b.id === ev.id);
                    return (
                      <div
                        key={ev.id}
                        className="toss-card toss-card-hover p-6 flex flex-col justify-between space-y-5 border-t-4 border-t-[#3182F6]"
                      >
                        {editable && onUpdateDb ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={ev.clinicName}
                                onChange={(e) => {
                                  const next = [...benchmarkEvents];
                                  next[globalIdx] = { ...ev, clinicName: e.target.value };
                                  onUpdateDb({ ...db, benchmarkEvents: next });
                                }}
                                className="font-extrabold text-sm bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-1 w-full"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateDb({
                                    ...db,
                                    benchmarkEvents: benchmarkEvents.filter((b) => b.id !== ev.id),
                                  })
                                }
                                className="p-1 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={ev.comboDetails}
                              onChange={(e) => {
                                const next = [...benchmarkEvents];
                                next[globalIdx] = { ...ev, comboDetails: e.target.value };
                                onUpdateDb({ ...db, benchmarkEvents: next });
                              }}
                              className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-1"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400">1cc 가격(원)</span>
                                <input
                                  type="number"
                                  step={10000}
                                  value={ev.price1cc || 0}
                                  onChange={(e) => {
                                    const next = [...benchmarkEvents];
                                    next[globalIdx] = {
                                      ...ev,
                                      price1cc: Number(e.target.value) || null,
                                    };
                                    onUpdateDb({ ...db, benchmarkEvents: next });
                                  }}
                                  className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1 font-bold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-[#3182F6] font-bold">
                                  2cc 가격(원)
                                </span>
                                <input
                                  type="number"
                                  step={10000}
                                  value={ev.price2cc || 0}
                                  onChange={(e) => {
                                    const next = [...benchmarkEvents];
                                    next[globalIdx] = {
                                      ...ev,
                                      price2cc: Number(e.target.value) || null,
                                    };
                                    onUpdateDb({ ...db, benchmarkEvents: next });
                                  }}
                                  className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1 font-bold text-[#3182F6]"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={ev.eventUrl}
                              onChange={(e) => {
                                const next = [...benchmarkEvents];
                                next[globalIdx] = { ...ev, eventUrl: e.target.value };
                                onUpdateDb({ ...db, benchmarkEvents: next });
                              }}
                              placeholder="병원 이벤트 URL"
                              className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-1 font-mono text-[11px]"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                  ev.isDesignated
                                    ? "bg-[#3182F6] text-white"
                                    : "bg-[#E8F3FF] text-[#1B64DA]"
                                }`}
                              >
                                {ev.isDesignated ? "⭐ 지정 병원" : "🤖 AI 탐색"}
                              </span>
                              <span className="text-xs font-medium text-[#8B95A1]">
                                {ev.branchName}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-lg font-extrabold text-[#191F28]">
                                {ev.clinicName}
                              </h4>
                              <p className="text-xs text-[#4E5968] mt-0.5">{ev.comboDetails}</p>
                            </div>

                            {/* Price Box with Blue Tint */}
                            <div className="bg-[#F0F6FF] border border-[#CFE2FF] rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
                              <div>
                                <span className="text-[11px] text-[#4E5968] font-semibold block">
                                  1cc 체험가
                                </span>
                                <span className="text-lg font-extrabold text-[#191F28]">
                                  {ev.price1cc ? `${(ev.price1cc / 10000).toFixed(0)}만원` : "-"}
                                </span>
                              </div>
                              <div className="border-l border-[#B6D8FF]">
                                <span className="text-[11px] text-[#1B64DA] font-extrabold block">
                                  2cc 주력가
                                </span>
                                <span className="text-lg font-extrabold text-[#3182F6]">
                                  {ev.price2cc ? `${(ev.price2cc / 10000).toFixed(0)}만원` : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <a
                          href={ev.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            sendLogUpdate({
                              clickedItem: {
                                type: "event_link",
                                label: `${ev.clinicName} 이벤트 페이지 이동`,
                              },
                            })
                          }
                          className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <span>병원 이벤트 페이지 보기</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group B: 프리미엄 클리닉 */}
            {premiumEvents.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="px-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#191F28]">
                    ✨ {siteContent.eventsSection.premiumGroupTitle}
                  </h3>
                  <p className="text-xs text-[#4E5968]">
                    {siteContent.eventsSection.premiumGroupDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumEvents.map((ev) => {
                    const globalIdx = benchmarkEvents.findIndex((b) => b.id === ev.id);
                    return (
                      <div
                        key={ev.id}
                        className="toss-card toss-card-hover p-6 flex flex-col justify-between space-y-5 border-t-4 border-t-[#00A862]"
                      >
                        {editable && onUpdateDb ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={ev.clinicName}
                                onChange={(e) => {
                                  const next = [...benchmarkEvents];
                                  next[globalIdx] = { ...ev, clinicName: e.target.value };
                                  onUpdateDb({ ...db, benchmarkEvents: next });
                                }}
                                className="font-extrabold text-sm bg-slate-50 border border-teal-300 rounded-xl px-2.5 py-1 w-full"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateDb({
                                    ...db,
                                    benchmarkEvents: benchmarkEvents.filter((b) => b.id !== ev.id),
                                  })
                                }
                                className="p-1 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={ev.comboDetails}
                              onChange={(e) => {
                                const next = [...benchmarkEvents];
                                next[globalIdx] = { ...ev, comboDetails: e.target.value };
                                onUpdateDb({ ...db, benchmarkEvents: next });
                              }}
                              className="w-full bg-slate-50 border border-teal-300 rounded-xl px-2.5 py-1"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400">1cc 가격(원)</span>
                                <input
                                  type="number"
                                  step={10000}
                                  value={ev.price1cc || 0}
                                  onChange={(e) => {
                                    const next = [...benchmarkEvents];
                                    next[globalIdx] = {
                                      ...ev,
                                      price1cc: Number(e.target.value) || null,
                                    };
                                    onUpdateDb({ ...db, benchmarkEvents: next });
                                  }}
                                  className="w-full bg-slate-50 border border-teal-300 rounded-xl px-2 py-1 font-bold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-[#00A862] font-bold">
                                  2cc 가격(원)
                                </span>
                                <input
                                  type="number"
                                  step={10000}
                                  value={ev.price2cc || 0}
                                  onChange={(e) => {
                                    const next = [...benchmarkEvents];
                                    next[globalIdx] = {
                                      ...ev,
                                      price2cc: Number(e.target.value) || null,
                                    };
                                    onUpdateDb({ ...db, benchmarkEvents: next });
                                  }}
                                  className="w-full bg-slate-50 border border-teal-300 rounded-xl px-2 py-1 font-bold text-[#00A862]"
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={ev.eventUrl}
                              onChange={(e) => {
                                const next = [...benchmarkEvents];
                                next[globalIdx] = { ...ev, eventUrl: e.target.value };
                                onUpdateDb({ ...db, benchmarkEvents: next });
                              }}
                              placeholder="병원 이벤트 URL"
                              className="w-full bg-slate-50 border border-teal-300 rounded-xl px-2.5 py-1 font-mono text-[11px]"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                  ev.isDesignated
                                    ? "bg-[#00A862] text-white"
                                    : "bg-[#E5F9F0] text-[#008C52]"
                                }`}
                              >
                                {ev.isDesignated ? "⭐ 지정 병원" : "🤖 AI 탐색"}
                              </span>
                              <span className="text-xs font-medium text-[#8B95A1]">
                                {ev.branchName}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-lg font-extrabold text-[#191F28]">
                                {ev.clinicName}
                              </h4>
                              <p className="text-xs text-[#4E5968] mt-0.5">{ev.comboDetails}</p>
                            </div>

                            <div className="bg-[#E5F9F0]/70 border border-[#A6E9C8] rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
                              <div>
                                <span className="text-[11px] text-[#4E5968] font-semibold block">
                                  1cc 프로그램
                                </span>
                                <span className="text-lg font-extrabold text-[#191F28]">
                                  {ev.price1cc
                                    ? `${(ev.price1cc / 10000).toFixed(1).replace(".0", "")}만원`
                                    : "-"}
                                </span>
                              </div>
                              <div className="border-l border-[#8EE5BE]">
                                <span className="text-[11px] text-[#008C52] font-extrabold block">
                                  2cc 시그니처
                                </span>
                                <span className="text-lg font-extrabold text-[#00A862]">
                                  {ev.price2cc ? `${(ev.price2cc / 10000).toFixed(0)}만원` : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <a
                          href={ev.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            sendLogUpdate({
                              clickedItem: {
                                type: "event_link",
                                label: `${ev.clinicName} 이벤트 페이지 이동`,
                              },
                            })
                          }
                          className="w-full bg-[#191F28] hover:bg-[#3182F6] text-white text-xs font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition"
                        >
                          <span>병원 이벤트 페이지 보기</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: Package 현황 ==================== */}
        {activeTab === "packages" && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. 우리 병원 맞춤 추천 패키지 (Vibrant Blue Gradient Box) */}
            {(editable || (clinic.customPackages && clinic.customPackages.length > 0)) && (
              <div className="rounded-[28px] bg-gradient-to-br from-[#1B64DA] via-[#3182F6] to-[#191F28] text-white p-7 sm:p-8 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#FEE500] bg-white/15 px-3 py-1 rounded-full">
                      ⭐ {clinic.clinicName} 맞춤 제안
                    </span>
                    <h2 className="text-2xl font-extrabold mt-2">
                      {clinic.directorName}님 병원에 추천하는 패키지예요
                    </h2>
                  </div>

                  {editable && onUpdateClinic && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateClinic({
                          ...clinic,
                          customPackages: [
                            ...(clinic.customPackages || []),
                            {
                              id: `cust-pkg-${Date.now()}`,
                              category: "custom",
                              name: `${clinic.clinicName} 시그니처 리바이브 2cc 패키지`,
                              tagline: `${clinic.clinicName} 맞춤 제안`,
                              composition: ["리바이브 2cc", "LDM 12분"],
                              targetConcern: "속건조·수분광채 개선 고객",
                              recommendedPrice: 690000,
                              regularPrice: 890000,
                              synergyPoint:
                                "1회 시술당 높은 만족도와 순수익을 동시에 확보하는 구성이에요.",
                              badge: `⭐ ${clinic.clinicName} 맞춤`,
                            },
                          ],
                        })
                      }
                      className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ {clinic.clinicName} 전용 추천 패키지 추가</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(clinic.customPackages || []).map((pkg, pkgIdx) => (
                    <div
                      key={pkg.id}
                      className="bg-white text-[#191F28] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-md"
                    >
                      {editable && onUpdateClinic ? (
                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={pkg.badge}
                              onChange={(e) => {
                                const next = [...(clinic.customPackages || [])];
                                next[pkgIdx] = { ...pkg, badge: e.target.value };
                                onUpdateClinic({ ...clinic, customPackages: next });
                              }}
                              placeholder="배지 문구"
                              className="font-extrabold text-[#3182F6] bg-[#E8F3FF] border border-blue-300 rounded-xl px-2.5 py-1 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = (clinic.customPackages || []).filter(
                                  (_, i) => i !== pkgIdx
                                );
                                onUpdateClinic({ ...clinic, customPackages: next });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl"
                              title="이 맞춤 패키지 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => {
                              const next = [...(clinic.customPackages || [])];
                              next[pkgIdx] = { ...pkg, name: e.target.value };
                              onUpdateClinic({ ...clinic, customPackages: next });
                            }}
                            placeholder="맞춤 패키지명"
                            className="font-extrabold text-sm bg-slate-50 border border-blue-300 rounded-xl px-3 py-1.5 w-full"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                                정상가(원)
                              </span>
                              <input
                                type="number"
                                step={10000}
                                value={pkg.regularPrice}
                                onChange={(e) => {
                                  const next = [...(clinic.customPackages || [])];
                                  next[pkgIdx] = {
                                    ...pkg,
                                    regularPrice: Number(e.target.value) || 0,
                                  };
                                  onUpdateClinic({ ...clinic, customPackages: next });
                                }}
                                className="bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-1 font-bold w-full"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-[#3182F6] font-extrabold block mb-0.5">
                                추천 이벤트가(원)
                              </span>
                              <input
                                type="number"
                                step={10000}
                                value={pkg.recommendedPrice}
                                onChange={(e) => {
                                  const next = [...(clinic.customPackages || [])];
                                  next[pkgIdx] = {
                                    ...pkg,
                                    recommendedPrice: Number(e.target.value) || 0,
                                  };
                                  onUpdateClinic({ ...clinic, customPackages: next });
                                }}
                                className="bg-[#E8F3FF] border border-blue-300 rounded-xl px-2.5 py-1 font-extrabold text-[#1B64DA] w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                              패키지 구성품 (쉼표로 구분)
                            </span>
                            <input
                              type="text"
                              value={pkg.composition.join(", ")}
                              onChange={(e) => {
                                const next = [...(clinic.customPackages || [])];
                                next[pkgIdx] = {
                                  ...pkg,
                                  composition: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                };
                                onUpdateClinic({ ...clinic, customPackages: next });
                              }}
                              className="bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-1 w-full"
                            />
                          </div>

                          <textarea
                            rows={2}
                            value={pkg.synergyPoint}
                            onChange={(e) => {
                              const next = [...(clinic.customPackages || [])];
                              next[pkgIdx] = { ...pkg, synergyPoint: e.target.value };
                              onUpdateClinic({ ...clinic, customPackages: next });
                            }}
                            placeholder="패키지 셀링 포인트 설명"
                            className="bg-slate-50 border border-blue-300 rounded-xl p-2 w-full"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full">
                                {pkg.badge}
                              </span>
                              <div className="text-right">
                                <span className="text-xs text-[#8B95A1] line-through mr-1.5">
                                  {(pkg.regularPrice / 10000).toFixed(0)}만원
                                </span>
                                <span className="text-xl font-extrabold text-[#3182F6]">
                                  {(pkg.recommendedPrice / 10000).toFixed(0)}만원
                                </span>
                              </div>
                            </div>

                            <h3 className="text-lg font-extrabold text-[#191F28]">{pkg.name}</h3>

                            <div className="flex flex-wrap gap-1.5">
                              {pkg.composition.map((comp, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-bold bg-[#F0F6FF] text-[#1B64DA] border border-[#CFE2FF] px-3 py-1 rounded-xl"
                                >
                                  + {comp}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-[#4E5968] pt-3 border-t border-[#F2F4F6] font-medium">
                            💡 {pkg.synergyPoint}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 멀츠 시너지 베스트 조합 */}
            <div className="toss-card p-7 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full">
                  MERZ PORTFOLIO SYNERGY
                </span>
                <h3 className="text-xl font-extrabold text-[#191F28] mt-1.5">
                  {siteContent.packagesSection.merzSynergyTitle}
                </h3>
                <p className="text-xs text-[#8B95A1] mt-0.5">
                  {siteContent.packagesSection.merzSynergySubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packageTemplates
                  .filter((p) => p.category === "merz-synergy")
                  .map((pkg) => {
                    const globalIdx = packageTemplates.findIndex((p) => p.id === pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        className="bg-gradient-to-b from-[#F0F6FF] to-white border border-[#CFE2FF] rounded-3xl p-6 flex flex-col justify-between space-y-4"
                      >
                        {editable && onUpdateDb ? (
                          <div className="space-y-2 text-xs">
                            <input
                              type="text"
                              value={pkg.badge}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, badge: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-blue-300 rounded-lg px-2 py-1 font-bold text-[#3182F6] w-full"
                            />
                            <input
                              type="text"
                              value={pkg.name}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, name: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-blue-300 rounded-lg px-2 py-1 font-extrabold w-full"
                            />
                            <input
                              type="number"
                              step={10000}
                              value={pkg.recommendedPrice}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = {
                                  ...pkg,
                                  recommendedPrice: Number(e.target.value) || 0,
                                };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-blue-300 rounded-lg px-2 py-1 font-bold w-full"
                            />
                            <textarea
                              rows={2}
                              value={pkg.synergyPoint}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, synergyPoint: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-blue-300 rounded-lg p-2 w-full"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-white bg-[#3182F6] px-2.5 py-0.5 rounded-full">
                                  {pkg.badge}
                                </span>
                                <span className="text-base font-extrabold text-[#1B64DA]">
                                  {(pkg.recommendedPrice / 10000).toFixed(0)}만원대
                                </span>
                              </div>
                              <h4 className="text-base font-extrabold text-[#191F28]">
                                {pkg.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {pkg.composition.map((c, i) => (
                                  <span
                                    key={i}
                                    className="text-xs font-bold bg-white text-[#3182F6] border border-[#CFE2FF] px-2.5 py-1 rounded-xl"
                                  >
                                    + {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#4E5968] pt-3 border-t border-[#CFE2FF]">
                              {pkg.synergyPoint}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. 강남·서초 인기 결합 상품 */}
            <div className="toss-card p-7 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-bold text-[#008C52] bg-[#E5F9F0] px-3 py-1 rounded-full">
                  POPULAR COMBINATIONS
                </span>
                <h3 className="text-xl font-extrabold text-[#191F28] mt-1.5">
                  {siteContent.packagesSection.marketPopularTitle}
                </h3>
                <p className="text-xs text-[#8B95A1] mt-0.5">
                  {siteContent.packagesSection.marketPopularSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packageTemplates
                  .filter((p) => p.category === "market-popular")
                  .map((pkg) => {
                    const globalIdx = packageTemplates.findIndex((p) => p.id === pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        className="bg-gradient-to-b from-[#E5F9F0]/60 to-white border border-[#A6E9C8] rounded-3xl p-6 flex flex-col justify-between space-y-4"
                      >
                        {editable && onUpdateDb ? (
                          <div className="space-y-2 text-xs">
                            <input
                              type="text"
                              value={pkg.badge}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, badge: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-teal-300 rounded-lg px-2 py-1 font-bold text-[#008C52] w-full"
                            />
                            <input
                              type="text"
                              value={pkg.name}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, name: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-teal-300 rounded-lg px-2 py-1 font-extrabold w-full"
                            />
                            <input
                              type="number"
                              step={10000}
                              value={pkg.recommendedPrice}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = {
                                  ...pkg,
                                  recommendedPrice: Number(e.target.value) || 0,
                                };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-teal-300 rounded-lg px-2 py-1 font-bold w-full"
                            />
                            <textarea
                              rows={2}
                              value={pkg.synergyPoint}
                              onChange={(e) => {
                                const next = [...packageTemplates];
                                next[globalIdx] = { ...pkg, synergyPoint: e.target.value };
                                onUpdateDb({ ...db, packageTemplates: next });
                              }}
                              className="bg-white border border-teal-300 rounded-lg p-2 w-full"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-white bg-[#00A862] px-2.5 py-0.5 rounded-full">
                                  {pkg.badge}
                                </span>
                                <span className="text-base font-extrabold text-[#008C52]">
                                  {(pkg.recommendedPrice / 10000).toFixed(0)}만원
                                </span>
                              </div>
                              <h4 className="text-base font-extrabold text-[#191F28]">
                                {pkg.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {pkg.composition.map((c, i) => (
                                  <span
                                    key={i}
                                    className="text-xs font-bold bg-white text-[#008C52] border border-[#A6E9C8] px-2.5 py-1 rounded-xl"
                                  >
                                    + {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#4E5968] pt-3 border-t border-[#A6E9C8]">
                              {pkg.synergyPoint}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: Profit 시뮬레이터 ==================== */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            {editable && onUpdateClinic && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900">
                    ✏️ [{clinic.clinicName}] 시뮬레이터 초기 세팅값 (원장님이 처음 열었을 때 표시될 기본 수치)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-2xl border border-amber-200">
                    <label className="block font-bold text-slate-600 mb-1">
                      1cc당 기본 입고 원가 (원)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={clinic.simulatorDefaults.unitCost}
                      onChange={(e) =>
                        onUpdateClinic({
                          ...clinic,
                          simulatorDefaults: {
                            ...clinic.simulatorDefaults,
                            unitCost: Number(e.target.value) || 135000,
                          },
                        })
                      }
                      className="w-full font-extrabold text-sm text-[#191F28] bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-amber-200">
                    <label className="block font-bold text-[#3182F6] mb-1">
                      1cc당 권장 시술 판매가 (원)
                    </label>
                    <input
                      type="number"
                      step={10000}
                      value={clinic.simulatorDefaults.sellingPrice}
                      onChange={(e) =>
                        onUpdateClinic({
                          ...clinic,
                          simulatorDefaults: {
                            ...clinic.simulatorDefaults,
                            sellingPrice: Number(e.target.value) || 440000,
                          },
                        })
                      }
                      className="w-full font-extrabold text-sm text-[#1B64DA] bg-[#E8F3FF] border border-blue-300 rounded-xl px-3 py-1.5"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-amber-200">
                    <label className="block font-bold text-slate-600 mb-1">
                      제안 도입 수량 (박스/시린지)
                    </label>
                    <input
                      type="number"
                      step={5}
                      value={clinic.simulatorDefaults.purchaseQty}
                      onChange={(e) =>
                        onUpdateClinic({
                          ...clinic,
                          simulatorDefaults: {
                            ...clinic.simulatorDefaults,
                            purchaseQty: Number(e.target.value) || 30,
                          },
                        })
                      }
                      className="w-full font-extrabold text-sm text-[#191F28] bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            <ReviveProfitSimulator
              initialDefaults={clinic.simulatorDefaults}
              clinicName={clinic.clinicName}
              directorName={clinic.directorName}
              sectionBadge={siteContent.calculatorSection.badgeText}
              sectionTitle={siteContent.calculatorSection.title}
              sectionSubtitle={siteContent.calculatorSection.subtitle}
              protocols={siteContent.overviewSection.protocols}
              editable={editable}
              onChangeCalculatorSection={(nextCalc) =>
                updateSiteContent({ calculatorSection: nextCalc })
              }
              onChangeProtocols={(nextProtocols) =>
                updateSiteContent({
                  overviewSection: {
                    ...siteContent.overviewSection,
                    protocols: nextProtocols,
                  },
                })
              }
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 text-xs text-[#8B95A1]">
        <div className="rounded-[28px] bg-[#191F28] text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
          <div>
            <strong className="text-white text-sm font-extrabold">
              {siteContent.brandTitle}
            </strong>{" "}
            <span className="mx-1 text-[#60A5FA]">·</span>{" "}
            <span className="text-slate-300">{repProfile.division}</span>
            <p className="text-xs text-slate-400 mt-1">
              {repProfile.roleTitle} : {repProfile.name} | TEL : {repProfile.phone} | Mail :{" "}
              {repProfile.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenKakaoConnect}
            className="bg-[#FEE500] text-[#191F28] font-extrabold px-4 py-2.5 rounded-2xl hover:bg-[#FDD800] transition shadow-sm"
          >
            Kakao ID : {repProfile.kakaoId}
          </button>
        </div>
      </footer>

      {/* ==================== MODAL 1: KAKAO ID (seoyun4) ==================== */}
      {kakaoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-7 shadow-2xl space-y-5 text-center animate-fade-in">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setKakaoModalOpen(false)}
                className="p-1 text-[#8B95A1] hover:text-[#191F28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#3182F6]">복사 완료!</span>
              <h3 className="text-xl font-extrabold text-[#191F28]">
                카톡 ID가 복사되었어요
              </h3>
              <p className="text-xs text-[#8B95A1]">
                카카오톡 [친구 추가 → ID로 추가]에 붙여넣어 주세요
              </p>
            </div>

            <div className="bg-[#F2F4F6] rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs text-[#8B95A1] font-bold">카카오톡 ID</span>
              <div className="flex items-center gap-2">
                <strong className="text-lg font-extrabold text-[#191F28]">
                  {repProfile.kakaoId}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopyText(repProfile.kakaoId, "kakaoModal")}
                  className="p-1.5 bg-white rounded-xl text-[#4E5968]"
                >
                  {copiedField === "kakaoModal" ? (
                    <Check className="w-4 h-4 text-[#00C471]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={repProfile.kakaoOpenChatUrl || "kakaotalk://launch"}
                className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition"
              >
                <MessageCircle className="w-4 h-4 fill-[#191F28]" />
                <span>카카오톡 열기</span>
              </a>
              <a
                href={`tel:${repProfile.phone}`}
                className="w-full bg-[#F2F4F6] text-[#4E5968] font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>전화로 바로 연결 ({repProfile.phone})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: MERZ ACTIVITY 신청 ==================== */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-7 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#3182F6]">{selectedActivity.code}</span>
                <h3 className="text-xl font-extrabold text-[#191F28] mt-0.5">
                  {selectedActivity.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="p-1 text-[#8B95A1] hover:text-[#191F28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activitySuccessData ? (
              <div className="space-y-4 text-center py-2">
                <CheckCircle2 className="w-12 h-12 text-[#00C471] mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-[#191F28]">신청이 완료되었어요!</h4>
                  <p className="text-xs text-[#8B95A1]">
                    {repProfile.roleTitle} {repProfile.name} 담당자 카톡으로 알림이 전송되었어요.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`sms:${repProfile.phone}?body=${encodeURIComponent(
                      activitySuccessData.alertMessageText
                    )}`}
                    className="w-full bg-[#FEE500] text-[#191F28] font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>담당자에게 문자/카톡도 바로 보내기</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="w-full bg-[#F2F4F6] text-[#4E5968] font-bold py-3 rounded-2xl text-xs"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActivitySubmit} className="space-y-4">
                <div className="bg-[#F0F6FF] p-3.5 rounded-2xl text-xs text-[#1B64DA] font-semibold">
                  신청 병원: <strong>{clinic.clinicName} ({clinic.directorName}님)</strong>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4E5968] mb-1.5">
                    편하신 일정이나 시간대 (선택)
                  </label>
                  <input
                    type="text"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    placeholder="예: 다음주 수요일 점심시간 / 카톡 즉시 수신"
                    className="w-full text-sm bg-[#F2F4F6] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4E5968] mb-1.5">
                    요청 메모 (선택)
                  </label>
                  <input
                    type="text"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="원하시는 부위나 요청사항을 간단히 적어주세요"
                    className="w-full text-sm bg-[#F2F4F6] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={activitySubmitting}
                  className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-extrabold py-4 rounded-2xl text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
                >
                  {activitySubmitting ? "전송 중..." : "신청하기"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: ACADEMIC PREVIEW ==================== */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-[32px] max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-white border-b border-[#F2F4F6] flex items-center justify-between gap-4">
              <h3 className="text-sm sm:text-base font-extrabold text-[#191F28] truncate">
                {previewFile.displayName}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-[#F2F4F6] text-[#4E5968] font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                >
                  <span>새 탭</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl bg-[#F2F4F6] text-[#4E5968]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#F2F4F6] w-full h-full">
              <iframe
                src={previewFile.url}
                title={previewFile.displayName}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
