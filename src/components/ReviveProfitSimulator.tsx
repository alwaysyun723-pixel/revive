"use client";

import React, { useEffect, useRef, useState } from "react";
import { SimulatorDefaults, ProtocolGuideItem } from "@/types/remodeling";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

interface Props {
  initialDefaults: SimulatorDefaults;
  clinicName?: string;
  directorName?: string;
  sectionBadge?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  protocols?: ProtocolGuideItem[];
  editable?: boolean;
  onChangeCalculatorSection?: (next: {
    badgeText: string;
    title: string;
    subtitle: string;
  }) => void;
  onChangeProtocols?: (next: ProtocolGuideItem[]) => void;
}

const PROTOCOL_THEMES = [
  { bg: "bg-[#F0F6FF] border-[#CFE2FF]", badge: "bg-[#3182F6] text-white" },
  { bg: "bg-[#E8F3FF] border-[#90C2FF]", badge: "bg-[#1B64DA] text-white" },
  { bg: "bg-[#E5F9F0] border-[#8EE5BE]", badge: "bg-[#00C471] text-white" },
  { bg: "bg-[#F3F0FF] border-[#D0BFFF]", badge: "bg-[#6741D9] text-white" },
];

export default function ReviveProfitSimulator({
  initialDefaults,
  clinicName,
  sectionBadge = "🧮 실시간 수익 시뮬레이터",
  sectionTitle = "우리 병원 예상 수익을 계산해보세요",
  sectionSubtitle = "슬라이더를 움직이면 월 순수익과 원가 회수 시점(BEP)이 바로 계산돼요.",
  protocols,
  editable = false,
  onChangeCalculatorSection,
  onChangeProtocols,
}: Props) {
  const [unitCost, setUnitCost] = useState<number>(initialDefaults.unitCost || 135000);
  const [price, setPrice] = useState<number>(initialDefaults.sellingPrice || 440000);
  const [purchaseQty, setPurchaseQty] = useState<number>(initialDefaults.purchaseQty || 30);
  const [patients, setPatients] = useState<number[]>(
    initialDefaults.patientsPerCc?.length === 8
      ? [...initialDefaults.patientsPerCc]
      : [2, 8, 2, 1, 0, 0, 0, 0]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    setUnitCost(initialDefaults.unitCost || 135000);
    setPrice(initialDefaults.sellingPrice || 440000);
    setPurchaseQty(initialDefaults.purchaseQty || 30);
    if (initialDefaults.patientsPerCc?.length === 8) {
      setPatients([...initialDefaults.patientsPerCc]);
    }
  }, [initialDefaults]);

  const handleReset = () => {
    setUnitCost(initialDefaults.unitCost || 135000);
    setPrice(initialDefaults.sellingPrice || 440000);
    setPurchaseQty(initialDefaults.purchaseQty || 30);
    setPatients(
      initialDefaults.patientsPerCc?.length === 8
        ? [...initialDefaults.patientsPerCc]
        : [2, 8, 2, 1, 0, 0, 0, 0]
    );
  };

  const updatePatientCount = (index: number, rawVal: number) => {
    let val = isNaN(rawVal) ? 0 : rawVal;
    if (val < 0) val = 0;
    if (val > 50) val = 50;
    const next = [...patients];
    next[index] = val;
    setPatients(next);
  };

  const ccPerTier = patients.map((count, idx) => count * (idx + 1));
  const totalMonthlyCc = ccPerTier.reduce((acc, v) => acc + v, 0);
  const totalMonthlyPatients = patients.reduce((acc, v) => acc + v, 0);

  const totalPurchaseCost = purchaseQty * unitCost;
  const totalPurchaseRevenue = purchaseQty * price;

  const unitProfit = price - unitCost;
  const unitProfitExc = Math.round(price / 1.1) - unitCost;
  const monthlyProfitInc = totalMonthlyCc * unitProfit;
  const monthlyProfitExc = totalMonthlyCc * unitProfitExc;

  const bepCc = price > 0 ? Math.ceil(totalPurchaseCost / price) : 0;
  const bepPatients2cc = (bepCc / 2).toFixed(1);
  const inventoryMonths = totalMonthlyCc > 0 ? (purchaseQty / totalMonthlyCc).toFixed(1) : "0.0";

  const tiers = [10, 20, 30, 40, 50];

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels: tiers.map((t) => `${t}cc`),
        datasets: [
          {
            label: "매입 원가",
            data: tiers.map((cc) => cc * unitCost),
            backgroundColor: "#CBD5E1",
            borderRadius: 10,
          },
          {
            label: "총 매출액",
            data: tiers.map((cc) => cc * price),
            backgroundColor: "#3182F6",
            borderRadius: 10,
          },
          {
            label: "병원 순수익",
            data: tiers.map((cc) => cc * price - cc * unitCost),
            backgroundColor: "#00C471",
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              font: { family: "Pretendard, sans-serif", size: 13, weight: "bold" },
              usePointStyle: true,
              boxWidth: 8,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const raw = Number(context.raw || 0);
                return `${context.dataset.label}: ${(raw / 10000).toLocaleString()}만원`;
              },
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return (Number(value) / 10000).toLocaleString() + "만";
              },
              font: { size: 12 },
              color: "#8B95A1",
            },
            grid: { color: "#F2F4F6" },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 13, weight: "bold" }, color: "#4E5968" },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [unitCost, price]);

  const activeProtocols: ProtocolGuideItem[] =
    protocols && protocols.length > 0
      ? protocols
      : [
          {
            name: "1cc 가벼운 시작",
            cc: 1,
            desc: "눈밑 · 입가 · 더마톡신 결합",
            targetArea: "눈가 · 입가",
            cycle: "1회 또는 3회",
          },
          {
            name: "2cc 표준 풀페이스",
            cc: 2,
            desc: "양볼 1cc씩 가장 인기 있는 기본 용량",
            targetArea: "양볼 전체",
            cycle: "4주 간격 3회",
          },
          {
            name: "3cc 프리미엄",
            cc: 3,
            desc: "양볼 2cc + 눈밑 · 입술 1cc",
            targetArea: "풀페이스",
            cycle: "4주 간격 3회",
          },
          {
            name: "4cc 집중 부스팅",
            cc: 4,
            desc: "풀페이스 + 목주름 고용량 케어",
            targetArea: "풀페이스 + 목",
            cycle: "VIP 집중 케어",
          },
        ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Toss Colorful Hero Summary Card */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#191F28] via-[#1B3A6B] to-[#3182F6] text-white p-7 sm:p-9 shadow-lg shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          {editable && onChangeCalculatorSection ? (
            <div className="space-y-2 bg-white/10 p-4 rounded-2xl border border-white/20">
              <span className="text-[11px] text-amber-300 font-bold block">
                ✏️ 시뮬레이터 상단 문구 직접 수정
              </span>
              <input
                type="text"
                value={sectionBadge}
                onChange={(e) =>
                  onChangeCalculatorSection({
                    badgeText: e.target.value,
                    title: sectionTitle,
                    subtitle: sectionSubtitle,
                  })
                }
                className="text-xs font-bold text-white bg-white/15 border border-white/30 rounded-xl px-3 py-1.5 w-full sm:w-64"
              />
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) =>
                  onChangeCalculatorSection({
                    badgeText: sectionBadge,
                    title: e.target.value,
                    subtitle: sectionSubtitle,
                  })
                }
                className="text-lg font-extrabold text-white bg-white/15 border border-white/30 rounded-xl px-3 py-1.5 w-full"
              />
              <input
                type="text"
                value={sectionSubtitle}
                onChange={(e) =>
                  onChangeCalculatorSection({
                    badgeText: sectionBadge,
                    title: sectionTitle,
                    subtitle: e.target.value,
                  })
                }
                className="text-xs text-blue-100 bg-white/15 border border-white/30 rounded-xl px-3 py-1.5 w-full"
              />
            </div>
          ) : (
            <>
              <span className="inline-block text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full">
                {sectionBadge} {clinicName ? `· ${clinicName}` : ""}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-1">
                월 예상 순수익은{" "}
                <span className="text-[#00E68A]">
                  +{(monthlyProfitInc / 10000).toLocaleString()}만원
                </span>
                이에요
              </h2>
              <p className="text-xs sm:text-sm text-blue-100">
                VAT 제외 실순익 월{" "}
                <strong className="text-white">{monthlyProfitExc.toLocaleString()}원</strong> · 2cc 시술{" "}
                <strong className="text-[#FEE500]">{bepPatients2cc}명</strong>이면 사입 원가를 모두 회수해요
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start md:self-center bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-3 rounded-2xl border border-white/20 flex items-center gap-1.5 transition active:scale-95 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>초기값 복원</span>
        </button>
      </div>

      {/* 4 Colorful Toss Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="toss-card p-6 space-y-1.5 border-t-4 border-t-slate-400">
          <span className="text-xs font-bold text-[#8B95A1]">총 사입 투자금 ({purchaseQty}cc)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#191F28]">
            {(totalPurchaseCost / 10000).toLocaleString()}만원
          </div>
          <span className="text-xs text-[#8B95A1] block">
            1cc당 {(unitCost / 10000).toFixed(1)}만원
          </span>
        </div>

        <div className="rounded-[28px] bg-[#E8F3FF] border border-[#CFE2FF] p-6 space-y-1.5">
          <span className="text-xs font-bold text-[#1B64DA]">완판 시 총 매출</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3182F6]">
            {(totalPurchaseRevenue / 10000).toLocaleString()}만원
          </div>
          <span className="text-xs text-[#1B64DA] font-bold block">
            완판 순익 +{((totalPurchaseRevenue - totalPurchaseCost) / 10000).toLocaleString()}만원
          </span>
        </div>

        <div className="rounded-[28px] bg-[#E5F9F0] border border-[#A6E9C8] p-6 space-y-1.5">
          <span className="text-xs font-bold text-[#008C52]">원가 회수 (손익분기)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#00A862]">
            단 {bepCc}cc
          </div>
          <span className="text-xs text-[#008C52] font-bold block">
            2cc 환자 {bepPatients2cc}명이면 끝
          </span>
        </div>

        <div className="rounded-[28px] bg-[#F3F0FF] border border-[#D8CEFF] p-6 space-y-1.5">
          <span className="text-xs font-bold text-[#5F3DC4]">예상 재고 소진 기간</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#6741D9]">
            {inventoryMonths}개월
          </div>
          <span className="text-xs text-[#5F3DC4] font-semibold block">
            월 {totalMonthlyCc}cc ({totalMonthlyPatients}명) 기준
          </span>
        </div>
      </div>

      {/* 3 Main Sliders Card */}
      <div className="toss-card p-7 sm:p-8 space-y-7">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#191F28]">
            🎛️ {sectionTitle}
          </h3>
          <span className="text-xs font-bold text-[#3182F6] bg-[#E8F3FF] px-3 py-1 rounded-full">
            VAT 포함
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1cc 구매단가 */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 p-5 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#4E5968]">1cc 구매단가</span>
              <span className="text-lg font-extrabold text-[#191F28]">
                {(unitCost / 10000).toFixed(1)}만원
              </span>
            </div>
            <input
              type="range"
              min={135000}
              max={180000}
              step={5000}
              value={Math.min(180000, Math.max(135000, unitCost))}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full accent-[#191F28]"
            />
            <div className="flex justify-between text-xs text-[#8B95A1]">
              <span>13.5만원</span>
              <span>18만원</span>
            </div>
          </div>

          {/* 1cc 판매수가 */}
          <div className="bg-[#E8F3FF]/60 border border-[#CFE2FF] p-5 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#1B64DA]">1cc 판매수가</span>
              <span className="text-lg font-extrabold text-[#3182F6]">
                {(price / 10000).toFixed(0)}만원
              </span>
            </div>
            <input
              type="range"
              min={330000}
              max={660000}
              step={10000}
              value={Math.min(660000, Math.max(330000, price))}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-[#3182F6]"
            />
            <div className="flex justify-between text-xs text-[#3182F6]/80 font-medium">
              <span>33만원</span>
              <span>44만원</span>
              <span>66만원</span>
            </div>
          </div>

          {/* 사입 수량 */}
          <div className="bg-[#E5F9F0]/60 border border-[#A6E9C8] p-5 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#008C52]">사입 구매 수량</span>
              <span className="text-lg font-extrabold text-[#00A862]">{purchaseQty}cc</span>
            </div>
            <input
              type="range"
              min={8}
              max={500}
              step={2}
              value={Math.min(500, Math.max(8, purchaseQty))}
              onChange={(e) => setPurchaseQty(Number(e.target.value))}
              className="w-full accent-[#00C471]"
            />
            <div className="flex justify-between text-xs text-[#008C52]/80 font-medium">
              <span>8cc</span>
              <span>250cc</span>
              <span>500cc</span>
            </div>
          </div>
        </div>

        {/* 1cc ~ 8cc Patient Counts */}
        <div className="pt-4 border-t border-[#F2F4F6] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#191F28]">
              용량별 월 시술 환자 수 설정
            </span>
            <span className="text-sm font-extrabold text-white bg-[#3182F6] px-4 py-1 rounded-full shadow-sm">
              월 총 {totalMonthlyCc}cc 소진 ({totalMonthlyPatients}명)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {patients.map((count, idx) => {
              const ccNum = idx + 1;
              const isActiveCount = count > 0;
              return (
                <div
                  key={ccNum}
                  className={`p-3.5 rounded-2xl flex flex-col justify-between space-y-2.5 border transition ${
                    isActiveCount
                      ? "bg-[#E8F3FF]/50 border-[#90C2FF]"
                      : "bg-[#F9FAFB] border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#1B64DA]">{ccNum}cc</span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={count}
                        onChange={(e) => updatePatientCount(idx, parseInt(e.target.value, 10))}
                        className="w-11 text-center text-xs font-extrabold text-[#191F28] bg-white rounded-lg py-1 border border-slate-200"
                      />
                      <span className="text-[11px] text-[#8B95A1]">명</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={count}
                    onChange={(e) => updatePatientCount(idx, parseInt(e.target.value, 10))}
                    className="w-full accent-[#3182F6]"
                  />
                  <span className="text-[11px] text-[#4E5968] text-center">
                    월 <strong className="text-[#3182F6]">{count * ccNum}cc</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1cc ~ 4cc 프로토콜별 1회 순수익 카드 (직접 수정 연동) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-extrabold text-[#191F28]">
            💉 용량별 프로토콜 가이드 & 1회 순수익
          </h3>
          {editable && onChangeProtocols && (
            <button
              type="button"
              onClick={() =>
                onChangeProtocols([
                  ...activeProtocols,
                  {
                    name: `${activeProtocols.length + 1}cc 프로토콜`,
                    cc: activeProtocols.length + 1,
                    desc: "프로토콜 설명을 입력하세요",
                    targetArea: "권장 부위",
                    cycle: "권장 주기",
                  },
                ])
              }
              className="text-xs bg-[#3182F6] text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>프로토콜 추가</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeProtocols.map((p, idx) => {
            const pCost = p.cc * unitCost;
            const pPrice = p.cc * price;
            const pProfit = pPrice - pCost;
            const theme = PROTOCOL_THEMES[idx % PROTOCOL_THEMES.length];

            return (
              <div
                key={idx}
                className={`rounded-[28px] border p-6 flex flex-col justify-between space-y-4 ${theme.bg}`}
              >
                {editable && onChangeProtocols ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...activeProtocols];
                          next[idx] = { ...p, name: e.target.value };
                          onChangeProtocols(next);
                        }}
                        className="font-extrabold text-sm text-[#191F28] bg-white border border-blue-300 rounded-xl px-2.5 py-1 w-full"
                      />
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={p.cc}
                        onChange={(e) => {
                          const next = [...activeProtocols];
                          next[idx] = { ...p, cc: Number(e.target.value) || 1 };
                          onChangeProtocols(next);
                        }}
                        className="w-14 text-center font-bold text-xs bg-white border border-blue-300 rounded-xl py-1"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onChangeProtocols(activeProtocols.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={p.desc}
                      onChange={(e) => {
                        const next = [...activeProtocols];
                        next[idx] = { ...p, desc: e.target.value };
                        onChangeProtocols(next);
                      }}
                      className="text-xs text-[#4E5968] bg-white border border-blue-300 rounded-xl p-2 w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#191F28]">{p.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                        {p.cc}cc
                      </span>
                    </div>
                    <p className="text-xs text-[#4E5968] mt-1.5 leading-relaxed">{p.desc}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-black/[0.06] space-y-1 text-xs bg-white/80 p-3.5 rounded-2xl">
                  <div className="flex justify-between text-[#4E5968]">
                    <span>판매수가</span>
                    <span className="font-bold text-[#191F28]">
                      {(pPrice / 10000).toLocaleString()}만원
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-[#191F28]">1회 순수익</span>
                    <span className="text-lg font-extrabold text-[#00A862]">
                      +{(pProfit / 10000).toFixed(1).replace(".0", "")}만원
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10cc ~ 50cc Table & Chart */}
      <div className="toss-card p-7 sm:p-8 space-y-6">
        <h3 className="text-lg font-extrabold text-[#191F28]">
          📊 구매 용량별(10cc~50cc) 수익 비교
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-[#4E5968] bg-[#F8FAFC] text-xs border-b border-[#E5E8EB]">
                <th className="py-3.5 px-4 font-bold rounded-l-xl">도입 물량</th>
                <th className="py-3.5 px-4 font-bold">매입액</th>
                <th className="py-3.5 px-4 font-bold">총 매출액</th>
                <th className="py-3.5 px-4 font-bold">순수익</th>
                <th className="py-3.5 px-4 font-bold">ROI</th>
                <th className="py-3.5 px-4 font-bold rounded-r-xl">원가회수(BEP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {tiers.map((cc) => {
                const cost = cc * unitCost;
                const rev = cc * price;
                const profit = rev - cost;
                const roi = cost > 0 ? ((profit / cost) * 100).toFixed(0) + "%" : "0%";
                const bep = price > 0 ? Math.ceil(cost / price) : 0;
                const isRec = cc === 30;
                return (
                  <tr key={cc} className={isRec ? "bg-[#E8F3FF]/70 font-bold" : "hover:bg-slate-50"}>
                    <td className="py-3.5 px-4 font-extrabold text-[#191F28]">
                      {cc}cc{" "}
                      {isRec && (
                        <span className="text-[10px] bg-[#3182F6] text-white px-2 py-0.5 rounded-full ml-1">
                          인기
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#4E5968]">{(cost / 10000).toLocaleString()}만원</td>
                    <td className="py-3.5 px-4 text-[#1B64DA] font-bold">
                      {(rev / 10000).toLocaleString()}만원
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#00A862]">
                      +{(profit / 10000).toLocaleString()}만원
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#3182F6]">{roi}</td>
                    <td className="py-3.5 px-4 font-bold text-[#191F28]">{bep}cc 시술</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-4 h-64 w-full relative">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
