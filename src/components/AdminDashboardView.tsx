"use client";

import React, { useState, useEffect } from "react";
import {
  RemodelingDatabase,
  AcademicFileItem,
  ClinicConfig,
  BenchmarkClinicEvent,
  PackageTemplate,
  TabKey,
} from "@/types/remodeling";
import ClientPortalView from "./ClientPortalView";
import Link from "next/link";
import {
  Building2,
  Activity,
  MapPin,
  FolderOpen,
  FileEdit,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Save,
  Sparkles,
  Clock,
  MousePointerClick,
  Upload,
  RefreshCw,
  Eye,
  Lock,
  Search,
  Bell,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

interface Props {
  initialDb: RemodelingDatabase;
  initialAcademicFiles: AcademicFileItem[];
  academicDirPath: string;
}

type AdminTab = "visual" | "clinics" | "logs" | "events" | "academic";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0초";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}초`;
  return `${mins}분 ${secs}초`;
}

const ADMIN_MASTER_PIN = "20170519";

export default function AdminDashboardView({
  initialDb,
  initialAcademicFiles,
  academicDirPath,
}: Props) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminPinError, setAdminPinError] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("remodeling_admin_unlocked");
      if (saved === ADMIN_MASTER_PIN) {
        setIsAdminUnlocked(true);
      }
    }
  }, []);

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === ADMIN_MASTER_PIN) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("remodeling_admin_unlocked", ADMIN_MASTER_PIN);
      }
      setIsAdminUnlocked(true);
      setAdminPinError("");
    } else {
      setAdminPinError("관리자 PIN 번호가 일치하지 않습니다.");
    }
  };

  const handleAdminLock = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("remodeling_admin_unlocked");
    }
    setAdminPinInput("");
    setIsAdminUnlocked(false);
  };

  const [db, setDb] = useState<RemodelingDatabase>(initialDb);
  const [academicFiles, setAcademicFiles] = useState<AcademicFileItem[]>(initialAcademicFiles);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("visual");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [editingClinicId, setEditingClinicId] = useState<string>(
    initialDb.clinics[0]?.id || ""
  );

  // New custom package inputs for editing clinic
  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgTagline, setNewPkgTagline] = useState("");
  const [newPkgComp, setNewPkgComp] = useState("");
  const [newPkgPrice, setNewPkgPrice] = useState(720000);
  const [newPkgRegPrice, setNewPkgRegPrice] = useState(900000);
  const [newPkgSynergy, setNewPkgSynergy] = useState("");

  // Log clinic filter
  const [logClinicFilter, setLogClinicFilter] = useState<string>("all");
  const [refreshingLogs, setRefreshingLogs] = useState<boolean>(false);

  // AI Search state
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiDistrict, setAiDistrict] = useState<BenchmarkClinicEvent["district"]>("강남역/신논현");
  const [aiGroup, setAiGroup] = useState<"network" | "premium">("network");
  const [aiIsDesignated, setAiIsDesignated] = useState<boolean>(false);
  const [aiSearching, setAiSearching] = useState<boolean>(false);
  const [aiResults, setAiResults] = useState<BenchmarkClinicEvent[]>([]);

  // Academic upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<string>("📄 핵심 임상 논문");
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const tabLabels: Record<TabKey, string> = {
    home: db.siteContent.tabLabels?.home || "HOME",
    overview: db.siteContent.tabLabels?.overview || "About Revive",
    events: db.siteContent.tabLabels?.events || "강남·서초 Trend",
    packages: db.siteContent.tabLabels?.packages || "Package 현황",
    calculator: db.siteContent.tabLabels?.calculator || "Profit 시뮬레이터",
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2800);
  };

  const persistDb = async (nextDb: RemodelingDatabase, message = "변경사항이 저장되었어요!") => {
    setSaving(true);
    try {
      const res = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDb),
      });
      const data = await res.json();
      if (data.ok) {
        setDb(data.db);
        if (data.academicFiles) setAcademicFiles(data.academicFiles);
        showToast(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshLogsAndData = async () => {
    setRefreshingLogs(true);
    try {
      const res = await fetch("/api/db");
      const data = await res.json();
      if (data.db) {
        setDb(data.db);
        setAcademicFiles(data.academicFiles || []);
        showToast("최신 데이터를 불러왔어요.");
      }
    } finally {
      setRefreshingLogs(false);
    }
  };

  const editingClinic = db.clinics.find((c) => c.id === editingClinicId) || db.clinics[0];

  const handleUpdateClinic = (updated: ClinicConfig) => {
    const nextClinics = db.clinics.map((c) =>
      c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : c
    );
    const nextDb = { ...db, clinics: nextClinics };
    setDb(nextDb);
  };

  const generateUniqueClinicPin = (): string => {
    const usedPins = new Set(db.clinics.map((c) => c.pin.trim()));
    usedPins.add(ADMIN_MASTER_PIN);
    let candidate = String(Math.floor(1000 + Math.random() * 9000));
    while (usedPins.has(candidate)) {
      candidate = String(Math.floor(1000 + Math.random() * 9000));
    }
    return candidate;
  };

  const handleCreateNewClinic = () => {
    const newId = `clinic-${Date.now()}`;
    const randomPin = generateUniqueClinicPin();
    const newSlug = `clinic-${randomPin}`;
    const newClinic: ClinicConfig = {
      id: newId,
      slug: newSlug,
      clinicName: "신규 거래처 의원",
      directorName: "대표원장",
      pin: randomPin,
      isActive: true,
      customGreeting: db.repProfile.greetingDefault,
      heroHeadline: "신규 거래처 원장님을 위한 리바이브 핵심 브리핑",
      heroSubtext: db.siteContent.homeSection.defaultSubheadline,
      visibleTabs: {
        home: true,
        overview: true,
        events: true,
        packages: true,
        calculator: true,
      },
      simulatorDefaults: {
        unitCost: 135000,
        sellingPrice: 440000,
        purchaseQty: 30,
        patientsPerCc: [2, 8, 2, 1, 0, 0, 0, 0],
      },
      selectedEventIds: db.benchmarkEvents.map((e) => e.id),
      customPackages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextDb = { ...db, clinics: [newClinic, ...db.clinics] };
    setDb(nextDb);
    setEditingClinicId(newId);
    persistDb(nextDb, `새 거래처 페이지(고유 PIN: ${randomPin})가 생성되었어요.`);
  };

  const handleDuplicateClinic = (source: ClinicConfig) => {
    const newId = `clinic-${Date.now()}`;
    const randomPin = generateUniqueClinicPin();
    const newSlug = `${source.slug}-${randomPin}`;
    const cloned: ClinicConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      slug: newSlug,
      clinicName: `${source.clinicName} (복제본)`,
      pin: randomPin,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextDb = { ...db, clinics: [cloned, ...db.clinics] };
    setDb(nextDb);
    setEditingClinicId(newId);
    persistDb(nextDb, `${source.clinicName} 설정을 복제해 새 거래처(PIN: ${randomPin})를 만들었어요.`);
  };

  const handleToggleClinicActive = (clinic: ClinicConfig) => {
    const nextActive = clinic.isActive === false ? true : false;
    const nextClinics = db.clinics.map((c) =>
      c.id === clinic.id ? { ...c, isActive: nextActive, updatedAt: new Date().toISOString() } : c
    );
    const nextDb = { ...db, clinics: nextClinics };
    setDb(nextDb);
    persistDb(
      nextDb,
      nextActive
        ? `${clinic.clinicName} 전용 링크 접속 권한이 [허용 ON] 되었어요.`
        : `${clinic.clinicName} 전용 링크 접속이 [차단 OFF] 되었어요.`
    );
  };

  const handleDeleteClinic = (id: string) => {
    if (db.clinics.length <= 1) {
      alert("최소 1개의 거래처 페이지는 유지되어야 합니다.");
      return;
    }
    const nextClinics = db.clinics.filter((c) => c.id !== id);
    const nextDb = { ...db, clinics: nextClinics };
    setDb(nextDb);
    setEditingClinicId(nextClinics[0].id);
    persistDb(nextDb, "거래처 배포 페이지가 삭제되었어요.");
  };

  const [publicBaseUrl, setPublicBaseUrl] = useState<string>(() => {
    if (typeof window !== "undefined" && !window.location.origin.includes("localhost")) {
      return window.location.origin;
    }
    return "https://3c0d1865f1f281.lhr.life";
  });
  const [shortUrlsMap, setShortUrlsMap] = useState<Record<string, string>>({});
  const [shorteningId, setShorteningId] = useState<string | null>(null);

  const getEffectiveBaseUrl = () => {
    if (typeof window !== "undefined" && !window.location.origin.includes("localhost")) {
      return window.location.origin;
    }
    if (publicBaseUrl.trim()) {
      return publicBaseUrl.trim().replace(/\/+$/, "");
    }
    return "https://3c0d1865f1f281.lhr.life";
  };

  const handleGenerateShortUrl = async (clinic: ClinicConfig) => {
    setShorteningId(clinic.id);
    try {
      const base = getEffectiveBaseUrl();
      const targetUrl = `${base}/${clinic.slug}`;
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl }),
      });
      const data = await res.json();
      if (data.ok && data.shortUrl) {
        setShortUrlsMap((prev) => ({ ...prev, [clinic.id]: data.shortUrl }));
        navigator.clipboard.writeText(data.shortUrl);
        showToast(`타이핑용 초간단 주소(${data.shortUrl})가 생성 및 복사되었어요!`);
      } else {
        navigator.clipboard.writeText(targetUrl);
        showToast(`링크(${targetUrl})가 복사되었어요!`);
      }
    } finally {
      setShorteningId(null);
    }
  };

  const handleCopyClinicShareMessage = (clinic: ClinicConfig) => {
    persistDb(
      db,
      `${clinic.clinicName} 카톡 초대 문구(공통 링크 + 고유 PIN: ${clinic.pin})가 복사 및 저장되었어요!`
    );
    const base = getEffectiveBaseUrl();
    const url = shortUrlsMap[clinic.id] || base;
    const shareText = `[Merz Aesthetics · Re:modeling Consulting Portal]\n\n${clinic.clinicName} ${clinic.directorName}님, 안녕하세요!\n멀츠 에스테틱스 코리아 ${db.repProfile.roleTitle} ${db.repProfile.name}입니다.\n\n${clinic.clinicName}을 위해 준비한 벨로테로 리바이브 강남·서초 트렌드 및 수익 시뮬레이터 포털입니다.\n\n▶ 접속 링크: ${url}\n▶ 전용 PIN 번호: ${clinic.pin}\n\n위 링크에서 PIN 번호(${clinic.pin})를 입력하시고 [Let's Revive]를 누르시면 ${clinic.clinicName} 전용 화면이 열립니다.`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(clinic.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenClinicPage = async (clinic: ClinicConfig) => {
    const cleanSlug = clinic.slug.trim();
    const cleanPin = clinic.pin.trim();
    const targetUrl = `/${cleanSlug}?pin=${encodeURIComponent(cleanPin)}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`remodeling_unlocked_${cleanSlug}`, cleanPin);
      const newWin = window.open("about:blank", "_blank");
      await persistDb(db, `${clinic.clinicName} 전용 페이지를 저장 후 열었어요.`);
      if (newWin) {
        newWin.location.href = targetUrl;
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const handleAddCustomPackageToClinic = () => {
    if (!editingClinic || !newPkgName.trim()) return;
    const newPkg: PackageTemplate = {
      id: `cust-pkg-${Date.now()}`,
      category: "custom",
      name: newPkgName.trim(),
      tagline: newPkgTagline.trim() || `${editingClinic.clinicName} 맞춤 구성 제안`,
      composition: newPkgComp
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      targetConcern: "속건조·수분광채·탄력 복합 개선 고객",
      recommendedPrice: Number(newPkgPrice) || 700000,
      regularPrice: Number(newPkgRegPrice) || 900000,
      synergyPoint: newPkgSynergy.trim() || "높은 시술 만족도와 마진을 동시에 확보하는 주력 구성이에요.",
      badge: `⭐ ${editingClinic.clinicName} 맞춤`,
    };
    const updated: ClinicConfig = {
      ...editingClinic,
      customPackages: [...(editingClinic.customPackages || []), newPkg],
    };
    handleUpdateClinic(updated);
    setNewPkgName("");
    setNewPkgTagline("");
    setNewPkgComp("");
    setNewPkgSynergy("");
  };

  const handleRunAiSearch = async (queryOverride?: string) => {
    setAiSearching(true);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryOverride !== undefined ? queryOverride : aiQuery,
          district: aiDistrict,
          group: aiGroup,
          isDesignated: aiIsDesignated,
        }),
      });
      const data = await res.json();
      if (data.ok && data.results) {
        setAiResults(data.results);
      }
    } finally {
      setAiSearching(false);
    }
  };

  const handleAddEventToDb = (ev: BenchmarkClinicEvent) => {
    const nextEvents = [ev, ...db.benchmarkEvents];
    const nextClinics = db.clinics.map((c) => ({
      ...c,
      selectedEventIds: [...c.selectedEventIds, ev.id],
    }));
    const nextDb = { ...db, benchmarkEvents: nextEvents, clinics: nextClinics };
    setDb(nextDb);
    persistDb(nextDb, `${ev.clinicName} 이벤트 및 링크가 추가되었어요.`);
  };

  const handleAcademicUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("displayName", uploadTitle);
      formData.append("category", uploadCategory);
      formData.append("description", uploadDesc);

      const res = await fetch("/api/academic", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setAcademicFiles(data.files);
        setUploadFile(null);
        setUploadTitle("");
        setUploadDesc("");
        showToast("학술 자료 파일이 실시간 추가되었어요.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAcademicDelete = async (fileName: string) => {
    const res = await fetch(`/api/academic?fileName=${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setAcademicFiles(data.files);
      showToast(`${fileName} 파일이 삭제되었어요.`);
    }
  };

  const filteredLogs = db.accessLogs.filter((log) =>
    logClinicFilter === "all" ? true : log.clinicSlug === logClinicFilter
  );

  // Admin Security PIN Lock Gate (Initial PIN: 20170519)
  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] via-[#E6F4FF] to-[#E3FAFC] flex flex-col justify-center items-center px-4 py-12 text-[#191F28]">
        <div className="w-full max-w-[380px] bg-white rounded-[32px] p-8 text-center space-y-6 shadow-[0_20px_50px_rgba(0,118,255,0.12)] border border-blue-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#00A8E8] text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold text-[#1B64DA] bg-[#E8F3FF] px-3 py-1 rounded-full">
              RBS {db.repProfile.name} 전용
            </span>
            <h1 className="text-xl font-extrabold text-[#191F28] pt-1">
              관리센터 보안 인증
            </h1>
            <p className="text-xs text-[#4E5968]">
              담당자 전용 PIN 번호를 입력해 주세요.
            </p>
          </div>

          <form onSubmit={handleAdminPinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={adminPinInput}
              onChange={(e) => {
                setAdminPinInput(e.target.value);
                setAdminPinError("");
              }}
              placeholder="관리자 PIN 입력"
              autoFocus
              className="w-full text-center text-xl tracking-[0.25em] font-extrabold text-[#191F28] placeholder:text-[#8B95A1] placeholder:tracking-normal placeholder:font-bold placeholder:text-sm bg-[#F4F8FF] border border-[#CFE2FF] rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition"
            />
            {adminPinError && (
              <p className="text-xs text-rose-500 font-bold">{adminPinError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#3182F6] to-[#1B64DA] hover:opacity-95 text-white font-extrabold py-4 rounded-2xl transition active:scale-[0.98] text-sm shadow-md shadow-blue-500/20"
            >
              관리센터 입장
            </button>
          </form>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8B95A1] hover:text-[#1B64DA] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>로그인 화면으로 돌아가기</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF2F9] text-[#191F28] flex flex-col">
      {/* Top Toss-Style Admin Header */}
      <header className="bg-[#191F28] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#3182F6] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
              Re:
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Re:modeling 관리센터
                </h1>
                <span className="text-xs bg-[#3182F6] px-2.5 py-0.5 rounded-full text-white font-bold">
                  {db.repProfile.roleTitle} {db.repProfile.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => persistDb(db, "현재 수정한 모든 내용이 즉시 저장되었어요!")}
              disabled={saving}
              className="bg-[#00C471] hover:bg-[#00A862] text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "저장 중..." : "💾 변경사항 즉시 저장"}</span>
            </button>
            <button
              type="button"
              onClick={handleAdminLock}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition"
              title="관리센터 다시 잠그기"
            >
              <Lock className="w-3.5 h-3.5 text-[#FEE500]" />
              <span>관리센터 잠금</span>
            </button>
            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>로그인 화면(/)</span>
            </Link>
          </div>
        </div>

        {/* Admin Sub-Navigation */}
        <div className="bg-[#222B38] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                {
                  key: "visual",
                  label: `🎨 1. 거래처별 배포 페이지 선택 & 실시간 화면 편집 (${db.clinics.length}개 거래처)`,
                  icon: <FileEdit className="w-4 h-4" />,
                },
                {
                  key: "clinics",
                  label: `🏥 2. 다수 거래처 배포 링크·PIN·권한 상세 관리 (${db.clinics.length})`,
                  icon: <Building2 className="w-4 h-4" />,
                },
                {
                  key: "logs",
                  label: `📊 3. 접속/체류시간 로그 & 액티비티 신청 (${db.activityApplications.length})`,
                  icon: <Activity className="w-4 h-4" />,
                },
                {
                  key: "events",
                  label: `📍 4. 강남·서초 병원 AI 서치 & 추가 (${db.benchmarkEvents.length})`,
                  icon: <MapPin className="w-4 h-4" />,
                },
                {
                  key: "academic",
                  label: `📂 5. 학술 자료 폴더 관리 (${academicFiles.length})`,
                  icon: <FolderOpen className="w-4 h-4" />,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveAdminTab(tab.key as AdminTab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    activeAdminTab === tab.key
                      ? "bg-[#3182F6] text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#191F28] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-2 text-xs sm:text-sm font-extrabold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#00E68A]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ==================== ADMIN TAB 1: 동일한 화면 보며 바로 수정 (VISUAL LIVE EDITOR + MULTI-CLINIC CONTROLLER) ==================== */}
      {activeAdminTab === "visual" && (
        <div className="flex-1 flex flex-col">
          {/* Multi-Clinic Selector & Security Control Bar */}
          <div className="bg-white border-b border-blue-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3.5">
              {/* Row 1: Select Clinic Distribution Page */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-[#1B64DA] bg-[#E8F3FF] px-3 py-1.5 rounded-xl">
                    🏥 배포 페이지 선택 ({db.clinics.length}개 거래처)
                  </span>
                  {db.clinics.map((c) => {
                    const isSelected = editingClinic?.id === c.id;
                    const isActive = c.isActive !== false;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditingClinicId(c.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition ${
                          isSelected
                            ? "bg-[#3182F6] text-white border-[#3182F6] shadow-sm"
                            : "bg-[#F8FAFC] text-[#191F28] border-slate-200 hover:bg-[#E8F3FF]/50"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? "bg-[#00E68A]" : "bg-rose-500"
                          }`}
                          title={isActive ? "접속 허용중" : "접속 차단됨"}
                        />
                        <span>{c.clinicName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          PIN {c.pin}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {editingClinic && (
                    <button
                      type="button"
                      onClick={() => handleDuplicateClinic(editingClinic)}
                      className="bg-[#F0F6FF] hover:bg-[#CFE2FF] text-[#1B64DA] text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>현재 거래처 복제</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateNewClinic}
                    className="bg-[#191F28] hover:bg-[#333D4B] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FEE500]" />
                    <span>+ 신규 거래처 페이지 추가</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Selected Clinic Quick Settings (Name, Director, URL Slug, PIN, Access ON/OFF, Share Link) */}
              {editingClinic && (
                <div className="bg-[#F8FAFC] border border-blue-200/80 rounded-2xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                        거래처 병원명
                      </label>
                      <input
                        type="text"
                        value={editingClinic.clinicName}
                        onChange={(e) =>
                          handleUpdateClinic({ ...editingClinic, clinicName: e.target.value })
                        }
                        onBlur={() => persistDb(db, "병원명이 자동 저장되었어요!")}
                        className="w-full text-xs font-extrabold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                        원장님 성함/호칭
                      </label>
                      <input
                        type="text"
                        value={editingClinic.directorName}
                        onChange={(e) =>
                          handleUpdateClinic({ ...editingClinic, directorName: e.target.value })
                        }
                        onBlur={() => persistDb(db, "원장님 호칭이 자동 저장되었어요!")}
                        className="w-full text-xs font-extrabold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                        전용 공유 URL (/코드)
                      </label>
                      <input
                        type="text"
                        value={editingClinic.slug}
                        onChange={(e) =>
                          handleUpdateClinic({
                            ...editingClinic,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                          })
                        }
                        onBlur={() => persistDb(db, "전용 URL 코드가 자동 저장되었어요!")}
                        className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#1B64DA] mb-0.5">
                        🔒 접속 보안 PIN 번호
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={editingClinic.pin}
                        onChange={(e) =>
                          handleUpdateClinic({ ...editingClinic, pin: e.target.value })
                        }
                        onBlur={() => persistDb(db, `고유 PIN(${editingClinic.pin})이 자동 저장되었어요!`)}
                        className="w-full text-xs font-extrabold text-[#1B64DA] bg-[#E8F3FF] border border-[#90C2FF] rounded-xl px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleClinicActive(editingClinic)}
                      className={`text-xs font-extrabold px-3.5 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                        editingClinic.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {editingClinic.isActive !== false
                          ? "🟢 접속 허용중 (클릭 시 차단)"
                          : "🔴 접속 차단됨 (클릭 시 허용)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateShortUrl(editingClinic)}
                      disabled={shorteningId === editingClinic.id}
                      className="bg-[#6741D9] hover:bg-[#5F3DC4] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FEE500]" />
                      <span>
                        {shorteningId === editingClinic.id
                          ? "단축 주소 생성 중..."
                          : shortUrlsMap[editingClinic.id]
                          ? `단축 URL: ${shortUrlsMap[editingClinic.id]}`
                          : "⚡ 타이핑용 초간단 URL 생성"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyClinicShareMessage(editingClinic)}
                      className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      {copiedId === editingClinic.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>초대 링크+PIN 복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>카톡 공유(URL+PIN) 복사</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenClinicPage(editingClinic)}
                      className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1 transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>전용 페이지 열기</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Row 3: Corporate Security / Network Compatibility Domain Switcher */}
              <div className="bg-[#E8F3FF]/60 border border-[#B6D8FF] rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-[#1B64DA]">
                    🌐 접속 환경별 주소 모드:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublicBaseUrl("https://3c0d1865f1f281.lhr.life")}
                    className={`px-3 py-1 rounded-lg font-extrabold transition ${
                      publicBaseUrl.includes("lhr.life")
                        ? "bg-[#3182F6] text-white"
                        : "bg-white text-[#4E5968] border border-blue-200"
                    }`}
                  >
                    1) 회사 보안 노트북·아이폰 공용 (표준 TLS: 3c0d1865f1f281.lhr.life)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPublicBaseUrl(
                        "https://targets-cottages-consideration-ing.trycloudflare.com"
                      )
                    }
                    className={`px-3 py-1 rounded-lg font-extrabold transition ${
                      publicBaseUrl.includes("trycloudflare")
                        ? "bg-[#3182F6] text-white"
                        : "bg-white text-[#4E5968] border border-blue-200"
                    }`}
                  >
                    2) 아이폰·외부 LTE 보조 링크 (Cloudflare)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicBaseUrl("http://192.168.45.205:3000")}
                    className={`px-3 py-1 rounded-lg font-extrabold transition ${
                      publicBaseUrl.includes("192.168.")
                        ? "bg-[#3182F6] text-white"
                        : "bg-white text-[#4E5968] border border-blue-200"
                    }`}
                  >
                    3) 동일 와이파이 초단축 숫자 주소 (192.168.45.205:3000)
                  </button>
                </div>
                {editingClinic && (
                  <span className="font-mono font-bold text-[#1B64DA]">
                    현재 단축 경로: {getEffectiveBaseUrl()}/{editingClinic.slug} (또는 /1 ~ /5)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#3182F6] to-[#1B64DA] text-white py-2.5 px-4 sm:px-6 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-[#FEE500] text-[#191F28] font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                실시간 화면 편집 모드 · {editingClinic?.clinicName}
              </span>
              <span>
                현재 선택된 <strong>[{editingClinic?.clinicName}]</strong>의 맞춤 타이틀·추천 패키지·시뮬레이터 초기값 및 전체 공통 콘텐츠를 아래 동일한 화면에서 바로 수정한 뒤 우측 상단 <strong>[💾 변경사항 즉시 저장]</strong>을 눌러주세요!
              </span>
            </div>
          </div>

          <ClientPortalView
            db={db}
            clinic={editingClinic}
            academicFiles={academicFiles}
            requirePin={false}
            isPreviewMode={false}
            editable={true}
            onUpdateDb={(nextDb) => setDb(nextDb)}
            onUpdateClinic={handleUpdateClinic}
            onRefreshAcademic={handleRefreshLogsAndData}
          />
        </div>
      )}

      {activeAdminTab !== "visual" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 flex-1 w-full space-y-6">
          {/* ==================== ADMIN TAB 2: 거래처별 배포 페이지 관리 ==================== */}
          {activeAdminTab === "clinics" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 4 Cols: Clinic List & Create Button */}
              <div className="lg:col-span-4 toss-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#191F28]">거래처 배포 목록</h2>
                    <p className="text-xs text-[#8B95A1]">병원별 고유 링크 및 PIN 번호 관리</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewClinic}
                    className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>신규 거래처 추가</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {db.clinics.map((c) => {
                    const isSelected = editingClinic?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setEditingClinicId(c.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-3 ${
                          isSelected
                            ? "bg-[#E8F3FF]/70 border-[#3182F6] shadow-sm"
                            : "bg-[#F8FAFC] border-slate-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  c.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                title={c.isActive !== false ? "접속 허용중" : "접속 차단됨"}
                              />
                              <span className="font-extrabold text-sm text-[#191F28]">
                                {c.clinicName}
                              </span>
                              <span className="text-xs font-bold text-[#3182F6]">
                                ({c.directorName}님)
                              </span>
                            </div>
                            <div className="text-[11px] text-[#4E5968] mt-1 flex flex-wrap items-center gap-2">
                              <span>
                                URL: <code>/c/{c.slug}</code>
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 font-extrabold text-[#1B64DA]">
                                <Lock className="w-3 h-3" /> PIN: {c.pin}
                              </span>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleClinicActive(c);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  c.isActive !== false
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-600"
                                }`}
                              >
                                {c.isActive !== false ? "접속 허용 ON" : "접속 차단 OFF"}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateClinic(c);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#3182F6] rounded-lg"
                              title="이 거래처 복제"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClinic(c.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyClinicShareMessage(c);
                            }}
                            className="flex-1 bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition"
                          >
                            {copiedId === c.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>카톡 문구 복사됨!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>카톡 초대 문구+링크 복사</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenClinicPage(c);
                            }}
                            className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>열기</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 8 Cols: Detailed Editor for Selected Clinic */}
              {editingClinic && (
                <div className="lg:col-span-8 toss-card p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#3182F6] uppercase tracking-wider">
                        CUSTOM CLINIC CONFIGURATOR
                      </span>
                      <h3 className="text-xl font-extrabold text-[#191F28]">
                        {editingClinic.clinicName} ({editingClinic.directorName}님) 배포 페이지 맞춤 설정
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenClinicPage(editingClinic)}
                        className="text-xs bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#191F28] font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
                      >
                        <span>전용 페이지 열기</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          persistDb(db, `${editingClinic.clinicName} 설정이 저장되었어요!`)
                        }
                        className="text-xs bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>이 병원 설정 저장</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. 기본 정보 & 보안 PIN */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-[#191F28]">
                      1) 기본 병원 정보 · 고유 링크 · 보안 PIN
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          병원명
                        </label>
                        <input
                          type="text"
                          value={editingClinic.clinicName}
                          onChange={(e) =>
                            handleUpdateClinic({ ...editingClinic, clinicName: e.target.value })
                          }
                          onBlur={() => persistDb(db, "병원명이 자동 저장되었어요!")}
                          className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          원장님 성함/직함
                        </label>
                        <input
                          type="text"
                          value={editingClinic.directorName}
                          onChange={(e) =>
                            handleUpdateClinic({ ...editingClinic, directorName: e.target.value })
                          }
                          onBlur={() => persistDb(db, "원장님 호칭이 자동 저장되었어요!")}
                          className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          고유 URL 코드 (/코드)
                        </label>
                        <input
                          type="text"
                          value={editingClinic.slug}
                          onChange={(e) =>
                            handleUpdateClinic({
                              ...editingClinic,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                            })
                          }
                          onBlur={() => persistDb(db, "전용 URL 코드가 자동 저장되었어요!")}
                          className="w-full text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#3182F6] mb-1">
                          보안 PIN 번호
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          value={editingClinic.pin}
                          onChange={(e) =>
                            handleUpdateClinic({ ...editingClinic, pin: e.target.value })
                          }
                          onBlur={() => persistDb(db, `고유 PIN(${editingClinic.pin})이 자동 저장되었어요!`)}
                          className="w-full text-sm font-extrabold text-[#1B64DA] bg-[#E8F3FF] border border-[#90C2FF] rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. 노출 메뉴 ON/OFF */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-extrabold text-[#191F28]">
                      2) 메뉴(섹션)별 노출 여부 ON / OFF
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {(Object.keys(tabLabels) as TabKey[]).map((tKey) => {
                        const isOn = editingClinic.visibleTabs[tKey];
                        return (
                          <button
                            key={tKey}
                            type="button"
                            onClick={() =>
                              handleUpdateClinic({
                                ...editingClinic,
                                visibleTabs: {
                                  ...editingClinic.visibleTabs,
                                  [tKey]: !isOn,
                                },
                              })
                            }
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                              isOn
                                ? "bg-[#3182F6] text-white border-[#3182F6]"
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            }`}
                          >
                            <span>{tabLabels[tKey]}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                              {isOn ? "ON" : "OFF"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. 홈 화면 맞춤 마케팅 문구 & 인사말 */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-extrabold text-[#191F28]">
                      3) 이 병원 전용 홈 헤드라인 및 맞춤 인사말 설정
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          홈 메인 헤드라인 문구
                        </label>
                        <input
                          type="text"
                          value={editingClinic.heroHeadline}
                          onChange={(e) =>
                            handleUpdateClinic({ ...editingClinic, heroHeadline: e.target.value })
                          }
                          className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          원장님께 드리는 담당자 맞춤 인사말
                        </label>
                        <textarea
                          rows={2}
                          value={editingClinic.customGreeting}
                          onChange={(e) =>
                            handleUpdateClinic({
                              ...editingClinic,
                              customGreeting: e.target.value,
                            })
                          }
                          className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. 마진 계산기 초기값 자동 세팅 */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-extrabold text-[#191F28]">
                      4) 해당 병원 전용 공급단가 · 권장 판매수가 · 제안 사입수량 (Profit 시뮬레이터 초기값)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F0F6FF] p-4 rounded-2xl border border-[#CFE2FF]">
                      <div>
                        <label className="block text-xs font-bold text-[#1B64DA] mb-1">
                          1cc당 공급단가 (원, VAT포함)
                        </label>
                        <input
                          type="number"
                          step={5000}
                          value={editingClinic.simulatorDefaults.unitCost}
                          onChange={(e) =>
                            handleUpdateClinic({
                              ...editingClinic,
                              simulatorDefaults: {
                                ...editingClinic.simulatorDefaults,
                                unitCost: Number(e.target.value) || 135000,
                              },
                            })
                          }
                          className="w-full text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1B64DA] mb-1">
                          권장 1cc 판매수가 (원, VAT포함)
                        </label>
                        <input
                          type="number"
                          step={10000}
                          value={editingClinic.simulatorDefaults.sellingPrice}
                          onChange={(e) =>
                            handleUpdateClinic({
                              ...editingClinic,
                              simulatorDefaults: {
                                ...editingClinic.simulatorDefaults,
                                sellingPrice: Number(e.target.value) || 440000,
                              },
                            })
                          }
                          className="w-full text-sm font-bold text-[#3182F6] bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1B64DA] mb-1">
                          제안 사입 구매 수량 (cc)
                        </label>
                        <input
                          type="number"
                          step={2}
                          value={editingClinic.simulatorDefaults.purchaseQty}
                          onChange={(e) =>
                            handleUpdateClinic({
                              ...editingClinic,
                              simulatorDefaults: {
                                ...editingClinic.simulatorDefaults,
                                purchaseQty: Number(e.target.value) || 30,
                              },
                            })
                          }
                          className="w-full text-sm font-bold text-[#00A862] bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. 병원별 노출하고 싶은 강남/서초 타 병원 이벤트 선별 */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-[#191F28]">
                        5) 이 원장님께 노출할 강남·서초 타 병원 선택 ({editingClinic.selectedEventIds.length}개 선택됨)
                      </h4>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateClinic({
                              ...editingClinic,
                              selectedEventIds: db.benchmarkEvents.map((e) => e.id),
                            })
                          }
                          className="text-xs text-[#3182F6] font-bold hover:underline"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateClinic({
                              ...editingClinic,
                              selectedEventIds: db.benchmarkEvents
                                .filter((e) => e.isDesignated)
                                .map((e) => e.id),
                            })
                          }
                          className="text-xs text-[#191F28] font-bold hover:underline"
                        >
                          지정 4대 병원만 선택
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {db.benchmarkEvents.map((ev) => {
                        const checked = editingClinic.selectedEventIds.includes(ev.id);
                        return (
                          <label
                            key={ev.id}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition ${
                              checked
                                ? "bg-[#E8F3FF]/70 border-[#3182F6] font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextIds = checked
                                  ? editingClinic.selectedEventIds.filter((id) => id !== ev.id)
                                  : [...editingClinic.selectedEventIds, ev.id];
                                handleUpdateClinic({
                                  ...editingClinic,
                                  selectedEventIds: nextIds,
                                });
                              }}
                              className="mt-0.5 accent-[#3182F6]"
                            />
                            <div>
                              <div className="text-slate-900 font-bold">
                                {ev.clinicName}{" "}
                                {ev.isDesignated && (
                                  <span className="text-[10px] bg-[#3182F6] text-white px-1.5 py-0.5 rounded ml-1">
                                    지정
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                1cc {ev.price1cc ? `${ev.price1cc / 10000}만` : "-"} / 2cc{" "}
                                {ev.price2cc ? `${ev.price2cc / 10000}만` : "-"}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. 우리 병원만의 맞춤 추천 패키지 추가 */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-extrabold text-[#191F28]">
                      6) {editingClinic.clinicName} 전용 맞춤 추천 패키지 관리
                    </h4>

                    <div className="space-y-2">
                      {(editingClinic.customPackages || []).map((pkg) => (
                        <div
                          key={pkg.id}
                          className="p-3.5 rounded-xl bg-[#E8F3FF]/50 border border-[#CFE2FF] flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-900">{pkg.name}</span>
                            <span className="ml-2 font-bold text-[#3182F6]">
                              권장가 {(pkg.recommendedPrice / 10000).toFixed(0)}만원
                            </span>
                            <p className="text-slate-600 mt-0.5">
                              구성: {pkg.composition.join(" + ")} | {pkg.synergyPoint}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateClinic({
                                ...editingClinic,
                                customPackages: editingClinic.customPackages.filter(
                                  (p) => p.id !== pkg.id
                                ),
                              })
                            }
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-700">
                        + 새 맞춤 추천 패키지 추가
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          placeholder="패키지명 (예: 리바이브 2cc + 울쎄라 300샷)"
                          value={newPkgName}
                          onChange={(e) => setNewPkgName(e.target.value)}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 sm:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="구성품 (쉼표 구분: 리바이브 2cc, LDM)"
                          value={newPkgComp}
                          onChange={(e) => setNewPkgComp(e.target.value)}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <input
                          type="number"
                          step={10000}
                          placeholder="권장 이벤트가(원)"
                          value={newPkgPrice}
                          onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <input
                          type="number"
                          step={10000}
                          placeholder="정상가(원)"
                          value={newPkgRegPrice}
                          onChange={(e) => setNewPkgRegPrice(Number(e.target.value))}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <input
                          type="text"
                          placeholder="한줄 기대효과 코멘트"
                          value={newPkgSynergy}
                          onChange={(e) => setNewPkgSynergy(e.target.value)}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomPackageToClinic}
                        className="bg-[#3182F6] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1B64DA]"
                      >
                        + 이 병원 맞춤 패키지에 추가
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== ADMIN TAB 3: 접속 로그 & MERZ ACTIVITY 신청 내역 ==================== */}
          {activeAdminTab === "logs" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 toss-card p-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#191F28]">
                    거래처별 실시간 열람 로그 & Merz Activity 신청 대시보드
                  </h2>
                  <p className="text-xs text-[#8B95A1]">
                    원장님이 배포 페이지에 머무른 총 시간, 선택한 탭별 체류 시간, 클릭한 병원 링크/학술자료 및 액티비티 신청 내역을 확인합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshLogsAndData}
                  disabled={refreshingLogs}
                  className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingLogs ? "animate-spin" : ""}`} />
                  <span>로그 새로고침</span>
                </button>
              </div>

              {/* Section 1: Merz Activity Applications */}
              <div className="toss-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#191F28] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#3182F6]" />
                    <span>Merz Activity 4종 원장님 신청 내역 ({db.activityApplications.length}건)</span>
                  </h3>
                  <span className="text-xs text-[#8B95A1]">
                    카카오톡 ID: <strong>{db.repProfile.kakaoId}</strong> 알림 연동
                  </span>
                </div>

                {db.activityApplications.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl text-xs text-slate-400">
                    아직 접수된 액티비티 신청 내역이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                          <th className="py-3 px-4">신청 일시</th>
                          <th className="py-3 px-4">거래처 (원장님)</th>
                          <th className="py-3 px-4">신청 액티비티</th>
                          <th className="py-3 px-4">희망 일정 / 연락처</th>
                          <th className="py-3 px-4">요청 메모</th>
                          <th className="py-3 px-4">진행 상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {db.activityApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {new Date(app.createdAt).toLocaleString("ko-KR")}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {app.clinicName} ({app.directorName}님)
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-[#3182F6] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {app.activityCode}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-700">
                              <div>
                                <strong>일정:</strong> {app.preferredDate}
                              </div>
                              {app.contactPhone && (
                                <div className="text-slate-500">연락처: {app.contactPhone}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                              {app.requestNote || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={app.status}
                                onChange={(e) => {
                                  const nextApps = db.activityApplications.map((a) =>
                                    a.id === app.id
                                      ? {
                                          ...a,
                                          status: e.target.value as typeof app.status,
                                        }
                                      : a
                                  );
                                  const nextDb = { ...db, activityApplications: nextApps };
                                  setDb(nextDb);
                                  persistDb(nextDb, "신청 상태가 변경되었어요.");
                                }}
                                className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5"
                              >
                                <option value="접수완료">접수완료</option>
                                <option value="일정조율중">일정조율중</option>
                                <option value="진행완료">진행완료</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Per-Clinic Access & Dwell Time Logs */}
              <div className="toss-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#191F28] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3182F6]" />
                      <span>거래처별 배포 페이지 접속 기록 · 체류시간 · 선택 탭 상세 분석</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">거래처 필터:</span>
                    <select
                      value={logClinicFilter}
                      onChange={(e) => setLogClinicFilter(e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    >
                      <option value="all">전체 거래처 보기 ({db.accessLogs.length})</option>
                      {db.clinics.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.clinicName} ({c.directorName}님)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const sortedTabs = (
                      Object.entries(log.tabDwellSeconds) as [TabKey, number][]
                    ).sort((a, b) => b[1] - a[1]);
                    const topTab = sortedTabs[0];

                    return (
                      <div
                        key={log.sessionId}
                        className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-[#191F28]">
                              {log.clinicName} ({log.directorName}님)
                            </span>
                            <span className="text-xs font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-600">
                              기기: {log.deviceType}
                            </span>
                            {topTab && topTab[1] > 0 && (
                              <span className="text-xs font-bold bg-[#E8F3FF] text-[#3182F6] px-2.5 py-0.5 rounded-full">
                                최다 관심 탭: {tabLabels[topTab[0]]} ({formatDuration(topTab[1])})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>접속: {new Date(log.startedAt).toLocaleString("ko-KR")}</span>
                            <span className="font-extrabold text-[#00A862] bg-[#E5F9F0] px-3 py-1 rounded-lg">
                              총 체류시간: {formatDuration(log.totalDwellSeconds)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {(Object.keys(tabLabels) as TabKey[]).map((tKey) => {
                            const sec = log.tabDwellSeconds[tKey] || 0;
                            const pct =
                              log.totalDwellSeconds > 0
                                ? Math.min(100, Math.round((sec / log.totalDwellSeconds) * 100))
                                : 0;
                            return (
                              <div
                                key={tKey}
                                className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700">
                                    {tabLabels[tKey]}
                                  </span>
                                  <span className="font-extrabold text-[#3182F6]">
                                    {formatDuration(sec)}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#3182F6] rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                            <span className="font-bold text-slate-500 block">
                              선택한 탭 이동 순서:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {log.tabSequence.map((t, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="bg-[#E8F3FF] text-[#1B64DA] font-bold px-2.5 py-0.5 rounded-md">
                                    {tabLabels[t] || t}
                                  </span>
                                  {idx < log.tabSequence.length - 1 && (
                                    <span className="text-slate-400">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                            <span className="font-bold text-slate-500 flex items-center gap-1">
                              <MousePointerClick className="w-3.5 h-3.5 text-[#3182F6]" />
                              <span>세부 클릭 및 열람 액션 ({log.clickedItems.length}건):</span>
                            </span>
                            {log.clickedItems.length === 0 ? (
                              <p className="text-slate-400 pt-1">기록된 세부 클릭이 없습니다.</p>
                            ) : (
                              <ul className="space-y-1 pt-1">
                                {log.clickedItems.map((ci, idx) => (
                                  <li
                                    key={idx}
                                    className="text-slate-700 flex items-center justify-between"
                                  >
                                    <span>• {ci.label}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(ci.timestamp).toLocaleTimeString("ko-KR")}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== ADMIN TAB 4: 강남/서초 이벤트 AI 서치 ==================== */}
          {activeAdminTab === "events" && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-[28px] bg-gradient-to-r from-[#1B64DA] to-[#3182F6] text-white p-6 sm:p-7 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#FEE500] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI GANGNAM · SEOCHO CLINIC EVENT SEARCH
                    </span>
                    <h2 className="text-xl font-extrabold mt-0.5">
                      관리자 지정 병원 + AI 강남·서초 리바이브 이벤트 자동 탐색
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunAiSearch("")}
                    disabled={aiSearching}
                    className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiSearching ? "탐색 중..." : "AI 추천 병원 일괄 탐색"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="지정할 병원명 입력 (예: 청담 OO의원)"
                    className="sm:col-span-5 text-xs sm:text-sm text-slate-900 bg-white rounded-xl px-3.5 py-2.5"
                  />
                  <select
                    value={aiDistrict}
                    onChange={(e) =>
                      setAiDistrict(e.target.value as BenchmarkClinicEvent["district"])
                    }
                    className="sm:col-span-2 text-xs font-bold text-slate-900 bg-white rounded-xl px-3 py-2.5"
                  >
                    <option value="강남역/신논현">강남역/신논현</option>
                    <option value="청담/압구정">청담/압구정</option>
                    <option value="신사/논현">신사/논현</option>
                    <option value="서초/교대">서초/교대</option>
                  </select>
                  <select
                    value={aiGroup}
                    onChange={(e) => setAiGroup(e.target.value as "network" | "premium")}
                    className="sm:col-span-2 text-xs font-bold text-slate-900 bg-white rounded-xl px-3 py-2.5"
                  >
                    <option value="network">대형/네트워크</option>
                    <option value="premium">프리미엄/클리닉</option>
                  </select>
                  <label className="sm:col-span-1 flex items-center justify-center gap-1 text-xs cursor-pointer bg-white/15 rounded-xl px-2">
                    <input
                      type="checkbox"
                      checked={aiIsDesignated}
                      onChange={(e) => setAiIsDesignated(e.target.checked)}
                    />
                    <span>지정</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRunAiSearch()}
                    disabled={aiSearching}
                    className="sm:col-span-2 bg-[#191F28] hover:bg-slate-800 text-white font-bold text-xs rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>AI 서치</span>
                  </button>
                </div>

                {aiResults.length > 0 && (
                  <div className="bg-white/15 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-[#FEE500]">
                      AI 탐색 결과 ({aiResults.length}건) — [추가]를 누르면 바로 반영돼요:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiResults.map((resItem) => (
                        <div
                          key={resItem.id}
                          className="bg-white text-slate-800 p-4 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 text-xs">
                            <div className="font-extrabold text-sm text-[#191F28]">
                              {resItem.clinicName} ({resItem.district})
                            </div>
                            <div className="font-bold text-[#3182F6]">
                              1cc: {(resItem.price1cc || 0) / 10000}만원 / 2cc:{" "}
                              {(resItem.price2cc || 0) / 10000}만원
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddEventToDb(resItem)}
                            className="bg-[#3182F6] text-white text-xs font-bold px-3.5 py-2 rounded-xl shrink-0"
                          >
                            + 추가
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ADMIN TAB 5: 학술 자료 폴더 관리 ==================== */}
          {activeAdminTab === "academic" && (
            <div className="toss-card p-6 sm:p-7 space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#191F28]">
                    실시간 학술 자료 폴더 연동 관리
                  </h2>
                  <p className="text-xs text-[#8B95A1] mt-0.5">
                    내 컴퓨터 폴더에 파일을 넣거나 아래에서 업로드하면 [About Revive] 탭에 실시간으로 반영돼요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshLogsAndData}
                  className="bg-[#E8F3FF] text-[#3182F6] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>폴더 스캔 새로고침</span>
                </button>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold block">
                    내 컴퓨터 학술 자료 폴더 경로:
                  </span>
                  <code className="font-mono font-bold text-[#191F28] text-xs sm:text-sm break-all">
                    {academicDirPath}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(academicDirPath);
                    showToast("폴더 경로가 복사되었어요!");
                  }}
                  className="bg-[#3182F6] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>폴더 경로 복사</span>
                </button>
              </div>

              <form
                onSubmit={handleAcademicUpload}
                className="bg-[#F0F6FF] p-5 rounded-2xl border border-[#CFE2FF] space-y-3"
              >
                <div className="text-xs font-extrabold text-[#1B64DA] flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>웹에서 학술 자료 파일 바로 추가</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setUploadFile(f);
                      if (f && !uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
                      }
                    }}
                    className="text-xs bg-white border border-slate-300 rounded-xl p-2"
                  />
                  <input
                    type="text"
                    placeholder="자료 제목"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="분류 태그"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="한줄 요약 설명"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="bg-[#3182F6] hover:bg-[#1B64DA] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  {uploading ? "업로드 중..." : "+ 학술 자료 업로드"}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {academicFiles.map((f) => (
                  <div
                    key={f.fileName}
                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold bg-[#E8F3FF] text-[#3182F6] px-2.5 py-0.5 rounded-full">
                        {f.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 pt-1">
                        {f.displayName}
                      </h4>
                      <p className="text-xs text-slate-500">{f.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#3182F6] hover:underline flex items-center gap-1"
                      >
                        <span>열어보기</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAcademicDelete(f.fileName)}
                        className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
