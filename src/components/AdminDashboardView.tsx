"use client";

import React, { useState } from "react";
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

export default function AdminDashboardView({
  initialDb,
  initialAcademicFiles,
  academicDirPath,
}: Props) {
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

  const handleCreateNewClinic = () => {
    const newId = `clinic-${Date.now()}`;
    const newSlug = `clinic-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClinic: ClinicConfig = {
      id: newId,
      slug: newSlug,
      clinicName: "신규 거래처 의원",
      directorName: "원장",
      pin: "1234",
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
    persistDb(nextDb, "새 거래처 배포 페이지가 생성되었어요.");
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

  const handleCopyClinicShareMessage = (clinic: ClinicConfig) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = `${origin}/c/${clinic.slug}`;
    const shareText = `[Merz Aesthetics · Re:modeling 브리핑]\n\n${clinic.clinicName} ${clinic.directorName}님, 안녕하세요!\n멀츠 에스테틱스 코리아 ${db.repProfile.roleTitle} ${db.repProfile.name}입니다.\n\n${clinic.clinicName}을 위해 준비한 벨로테로 리바이브 강남·서초 시세 및 수익 계산기 페이지예요.\n\n▶ 전용 링크: ${url}\n▶ 비밀번호(PIN): ${clinic.pin}\n\n궁금하신 점이나 MEX 프로그램 신청은 페이지 내 버튼이나 카톡(ID: ${db.repProfile.kakaoId})으로 편하게 말씀해 주세요!`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(clinic.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast(`${clinic.clinicName} 카톡 초대 문구가 복사되었어요!`);
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
                  Re:modeling 관리자 센터
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
              onClick={() => persistDb(db, "현재 수정한 모든 내용이 홈페이지에 즉시 반영되었어요!")}
              disabled={saving}
              className="bg-[#00C471] hover:bg-[#00A862] text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "저장 중..." : "💾 변경사항 즉시 저장"}</span>
            </button>
            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>고객 화면 보기</span>
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
                  label: "🎨 1. 동일한 화면 보며 홈페이지 직접 수정 (Visual Editor)",
                  icon: <FileEdit className="w-4 h-4" />,
                },
                {
                  key: "clinics",
                  label: `🏥 2. 거래처별 배포 링크·단가 관리 (${db.clinics.length})`,
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

      {/* ==================== ADMIN TAB 1: 동일한 화면 보며 바로 수정 (VISUAL LIVE EDITOR) ==================== */}
      {activeAdminTab === "visual" && (
        <div className="flex-1 flex flex-col">
          <div className="bg-gradient-to-r from-[#3182F6] to-[#1B64DA] text-white py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-[#FEE500] text-[#191F28] font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                실시간 화면 편집 모드
              </span>
              <span>
                아래 실제 홈페이지 화면에서 <strong>메뉴 탭 이름(HOME, About Revive 등)</strong>, <strong>용량별 시술 프로토콜(1cc~4cc)</strong>, <strong>명함</strong>, <strong>액티비티 4종</strong> 등 모든 글자를 클릭해 바로 수정하고 우측 상단 <strong>[💾 변경사항 즉시 저장]</strong>을 눌러주세요!
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
                              <span className="font-extrabold text-sm text-[#191F28]">
                                {c.clinicName}
                              </span>
                              <span className="text-xs font-bold text-[#3182F6]">
                                ({c.directorName}님)
                              </span>
                            </div>
                            <div className="text-[11px] text-[#4E5968] mt-0.5 flex items-center gap-2">
                              <span>
                                URL: <code>/c/{c.slug}</code>
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 font-extrabold text-[#1B64DA]">
                                <Lock className="w-3 h-3" /> PIN: {c.pin}
                              </span>
                            </div>
                          </div>
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
                          <Link
                            href={`/c/${c.slug}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#3182F6] hover:bg-[#1B64DA] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>열기</span>
                          </Link>
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
                      <Link
                        href={`/c/${editingClinic.slug}`}
                        target="_blank"
                        className="text-xs bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#191F28] font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5"
                      >
                        <span>배포 페이지 미리보기</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
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
                      1) 기본 병원 정보 · 고유 링크 · 4자리 보안 PIN
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
                          className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          고유 URL 코드 (/c/코드)
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
                          className="w-full text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#3182F6] mb-1">
                          보안 PIN 번호 (4자리)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editingClinic.pin}
                          onChange={(e) =>
                            handleUpdateClinic({ ...editingClinic, pin: e.target.value })
                          }
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
