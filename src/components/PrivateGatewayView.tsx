"use client";

import React, { useState } from "react";
import { RemodelingDatabase } from "@/types/remodeling";
import { Lock, ShieldCheck, Phone, MessageCircle, ArrowRight, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  db: RemodelingDatabase;
}

export default function PrivateGatewayView({ db }: Props) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const activeClinics = db.clinics.filter((c) => c.isActive !== false);

  const handleGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setErrorMsg("전달받으신 보안 PIN 번호를 입력해 주세요.");
      return;
    }

    // If a specific clinic is selected, verify against that clinic
    if (selectedSlug) {
      const target = activeClinics.find((c) => c.slug === selectedSlug);
      if (!target) {
        setErrorMsg("현재 접속 권한이 비활성화된 병원입니다. 담당자에게 문의해 주세요.");
        return;
      }
      if (target.pin.trim() === trimmedPin) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`remodeling_unlocked_${target.slug}`, target.pin.trim());
        }
        router.push(`/c/${target.slug}`);
        return;
      } else {
        setErrorMsg("선택하신 병원의 보안 PIN 번호가 일치하지 않습니다.");
        return;
      }
    }

    // Otherwise, match by unique PIN across active clinics
    const matchedClinic = activeClinics.find((c) => c.pin.trim() === trimmedPin);
    if (matchedClinic) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `remodeling_unlocked_${matchedClinic.slug}`,
          matchedClinic.pin.trim()
        );
      }
      router.push(`/c/${matchedClinic.slug}`);
    } else {
      setErrorMsg("유효하지 않은 PIN 번호이거나 접속 권한이 부여되지 않았습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1B3A6B] to-[#3182F6] flex flex-col justify-between items-center px-4 py-10 text-white">
      {/* Top Brand Header */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white text-[#1B64DA] font-extrabold flex items-center justify-center text-base shadow-md">
            R
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight block leading-none">
              {db.siteContent.brandTitle}
            </span>
            <span className="text-[11px] text-blue-200 font-semibold">
              Merz Aesthetics Private B2B Portal
            </span>
          </div>
        </div>
        <Link
          href="/admin"
          className="text-xs font-extrabold bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 backdrop-blur-sm transition"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>담당자 관리 센터</span>
        </Link>
      </div>

      {/* Center Private Access Card */}
      <div className="w-full max-w-md bg-white text-[#191F28] rounded-[32px] p-8 sm:p-9 shadow-2xl space-y-6 my-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#E8F3FF] to-[#CFE2FF] text-[#3182F6] flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B64DA] bg-[#E8F3FF] px-3.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            불특정 다수 열람 제한 · 초대 전용 공간
          </span>
          <h1 className="text-2xl font-extrabold text-[#191F28] leading-snug pt-1">
            공유받으신 전용 링크 또는
            <br />
            보안 PIN 번호로 입장해 주세요
          </h1>
          <p className="text-xs text-[#4E5968] leading-relaxed">
            본 페이지는 멀츠 에스테틱스 담당자(<strong>{db.repProfile.roleTitle} {db.repProfile.name}</strong>)가
            URL과 접속 권한을 부여한 거래처 원장님께만 공개됩니다.
          </p>
        </div>

        <form onSubmit={handleGatewaySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#4E5968]">
              거래처 선택 (선택사항 · PIN 번호만 입력해도 자동 연결)
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setErrorMsg("");
              }}
              className="w-full text-sm font-bold text-[#191F28] bg-[#F2F4F6] border border-slate-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
            >
              <option value="">병원 선택 없이 PIN 번호로 바로 입장</option>
              {activeClinics.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.clinicName} ({c.directorName}님 전용)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#4E5968]">
              부여받으신 보안 PIN 번호 입력
            </label>
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg("");
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl tracking-[0.45em] font-extrabold text-[#191F28] bg-[#F2F4F6] border border-slate-200 rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition"
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3182F6] to-[#1B64DA] hover:from-[#1B64DA] hover:to-[#1550B0] text-white font-extrabold py-4 rounded-2xl transition active:scale-[0.99] text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <span>전용 브리핑 페이지 입장하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Rep Contact Footer inside Card */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4E5968]">
          <div>
            <span className="font-extrabold text-[#191F28]">
              전용 링크 / PIN 문의: {db.repProfile.roleTitle} {db.repProfile.name}
            </span>
            <p className="text-[11px] text-[#8B95A1]">{db.repProfile.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${db.repProfile.phone}`}
              className="bg-[#E8F3FF] text-[#1B64DA] font-extrabold px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-[#CFE2FF] transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>전화</span>
            </a>
            <span className="bg-[#FEE500] text-[#191F28] font-extrabold px-3 py-2 rounded-xl flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>카톡 ID: {db.repProfile.kakaoId}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Notice */}
      <div className="text-center text-xs text-blue-200/80 space-y-1">
        <p>※ 각 병원별 전용 링크(<code>/c/병원코드</code>)로 접속하시면 해당 병원 맞춤 화면으로 바로 연결됩니다.</p>
      </div>
    </div>
  );
}
