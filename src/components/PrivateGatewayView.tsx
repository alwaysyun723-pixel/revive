"use client";

import React, { useState } from "react";
import { RemodelingDatabase } from "@/types/remodeling";
import { Phone, MessageCircle, Settings, LogIn, Check, X, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  db: RemodelingDatabase;
}

export default function PrivateGatewayView({ db }: Props) {
  const router = useRouter();
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [kakaoCopied, setKakaoCopied] = useState<boolean>(false);
  const [kakaoProfileOpen, setKakaoProfileOpen] = useState<boolean>(false);

  const activeClinics = db.clinics.filter((c) => c.isActive !== false);

  const [checkingPin, setCheckingPin] = useState<boolean>(false);

  const handleGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setErrorMsg("부여받으신 PIN 번호를 입력해 주세요.");
      return;
    }

    // If admin enters the master admin PIN (20170519) directly, unlock and go to /admin
    if (trimmedPin === "20170519") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("remodeling_admin_unlocked", "20170519");
      }
      router.push("/admin");
      return;
    }

    // 1. Check initial props.db first
    let matchedClinic = activeClinics.find((c) => c.pin.trim() === trimmedPin);

    // 2. Always fetch latest /api/db if not found in initial props (in case a new clinic/PIN was just created in Admin!)
    if (!matchedClinic) {
      setCheckingPin(true);
      try {
        const res = await fetch("/api/db", { cache: "no-store" });
        const data = await res.json();
        if (data?.db?.clinics) {
          const latestActive = (data.db.clinics as typeof db.clinics).filter(
            (c) => c.isActive !== false
          );
          matchedClinic = latestActive.find((c) => c.pin.trim() === trimmedPin);
        }
      } catch {
        // Ignore network error
      } finally {
        setCheckingPin(false);
      }
    }

    if (matchedClinic) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `remodeling_unlocked_${matchedClinic.slug}`,
          matchedClinic.pin.trim()
        );
      }
      router.push(`/${matchedClinic.slug}`);
    } else {
      setErrorMsg("등록되지 않은 PIN 번호이거나 접속 권한이 없습니다.");
    }
  };

  const launchKakaoApp = () => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) {
      window.location.href =
        "intent://main#Intent;scheme=kakaotalk;package=com.kakao.talk;end";
    } else {
      window.location.href = "kakaotalk://launch";
    }
  };

  const handleKakaoClick = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(db.repProfile.kakaoId);
    }
    setKakaoCopied(true);
    setTimeout(() => setKakaoCopied(false), 3000);

    if (typeof window === "undefined") return;

    const directProfileUrl = db.repProfile.kakaoOpenChatUrl?.trim() || "";
    // Only navigate directly if it is an open.kakao.com or pf.kakao.com link (qr.kakao.com redirects browsers to kakaocorp homepage)
    if (
      directProfileUrl &&
      (directProfileUrl.includes("open.kakao.com") ||
        directProfileUrl.includes("pf.kakao.com"))
    ) {
      window.location.href = directProfileUrl;
      return;
    }

    // Show RBS 서윤's actual KakaoTalk Profile Card + QR modal immediately AND launch KakaoTalk app
    setKakaoProfileOpen(true);
    launchKakaoApp();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F0F7FF] via-[#E6F4FF] to-[#E3FAFC] flex flex-col justify-between items-center px-4 py-7 text-[#191F28]">
      {/* Subtle Revive Aqua-Glow Background Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#3182F6]/20 to-[#00B4D8]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-[#00A8E8]/20 to-[#38D9A9]/15 blur-3xl" />

      {/* Top Minimal Brand Header */}
      <div className="w-full max-w-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3182F6] to-[#00A8E8] text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-blue-500/20">
            R
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-[#191F28] block leading-none">
              {db.siteContent.brandTitle}
            </span>
            <span className="text-[10px] text-[#3182F6] font-bold tracking-wide">
              Merz Aesthetics Consulting Portal
            </span>
          </div>
        </div>

        {/* Smaller, Minimal '관리센터' Button */}
        <Link
          href="/admin"
          className="text-[11px] font-bold text-[#4E5968] hover:text-[#1B64DA] bg-white/75 hover:bg-white border border-blue-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm backdrop-blur-sm transition"
        >
          <Settings className="w-3 h-3 text-[#3182F6]" />
          <span>관리센터</span>
        </Link>
      </div>

      {/* Center Belotero Revive Inspired Friendly & Minimal Login Card */}
      <div className="w-full max-w-[400px] bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-8 sm:p-9 shadow-[0_20px_50px_rgba(0,118,255,0.1)] space-y-6 my-auto relative z-10">
        {/* Belotero Revive Dual-Droplet (HA + Glycerol) + Login Illustration */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-[#E8F3FF] via-[#D0EBFF] to-[#E3FAFC] shadow-inner" />
            {/* Revive Hydro-Booster Droplet + Key/Portal SVG Illustration */}
            <svg
              viewBox="0 0 80 80"
              className="w-14 h-14 relative z-10 drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="reviveDropGrad" x1="15" y1="10" x2="65" y2="70" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3182F6" />
                  <stop offset="0.55" stopColor="#00A8E8" />
                  <stop offset="1" stopColor="#00C471" />
                </linearGradient>
                <linearGradient id="reviveGlowGrad" x1="25" y1="20" x2="55" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#E8F3FF" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Main Revive Water Droplet */}
              <path
                d="M40 10C40 10 18 34.5 18 50C18 62.1503 27.8497 72 40 72C52.1503 72 62 62.1503 62 50C62 34.5 40 10 40 10Z"
                fill="url(#reviveDropGrad)"
              />
              {/* Inner Shine / Glycerol Dual Circle */}
              <path
                d="M31 44C28.5 49 30 56 35 59"
                stroke="url(#reviveGlowGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Friendly Login Keyhole / Sparkle inside Droplet */}
              <circle cx="40" cy="47" r="5.5" fill="white" />
              <path
                d="M37.5 51L36 60H44L42.5 51H37.5Z"
                fill="white"
              />
              {/* Top Sparkle */}
              <path
                d="M59 16L60.5 20.5L65 22L60.5 23.5L59 28L57.5 23.5L53 22L57.5 20.5L59 16Z"
                fill="#00A8E8"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <span className="inline-block text-[11px] font-extrabold tracking-wider text-[#00A8E8] bg-[#E3FAFC] px-3 py-0.5 rounded-full">
              BELOTERO REVIVE®
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#191F28] tracking-tight pt-0.5">
              Re:modeling
            </h1>
          </div>

          <p className="text-xs text-[#4E5968] leading-relaxed font-medium px-1">
            본 페이지는 <strong className="text-[#1B64DA] font-extrabold">Merz Aesthetics RBS ({db.repProfile.name})</strong> 가
            <br />
            URL과 접속 권한을 부여한 분께만 공개됩니다.
          </p>
        </div>

        {/* Single Clean PIN Input Form (No Clinic Dropdown) */}
        <form onSubmit={handleGatewaySubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg("");
              }}
              placeholder="PIN 번호 입력"
              autoFocus
              className="w-full text-center text-lg sm:text-xl tracking-[0.25em] font-extrabold text-[#191F28] placeholder:text-[#8B95A1] placeholder:tracking-normal placeholder:font-bold placeholder:text-sm bg-[#F4F8FF] border border-[#CFE2FF] rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition"
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Let's Revive Login Button with Login Graphic */}
          <button
            type="submit"
            disabled={checkingPin}
            className="w-full bg-gradient-to-r from-[#3182F6] via-[#1B64DA] to-[#00A8E8] hover:opacity-95 text-white font-extrabold py-4 rounded-2xl transition active:scale-[0.98] text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>{checkingPin ? "확인 중..." : "Let's Revive"}</span>
          </button>
        </form>

        {/* Minimal Contact Row: Only '문의' + Phone & Kakao Icons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#8B95A1]">문의</span>

          <div className="flex items-center gap-2">
            {kakaoCopied && (
              <span className="text-[11px] font-bold text-[#1B64DA] bg-[#E8F3FF] px-2.5 py-1 rounded-lg flex items-center gap-1 animate-fade-in">
                <Check className="w-3 h-3" /> 카톡 ID({db.repProfile.kakaoId}) 복사됨
              </span>
            )}
            <a
              href={`tel:${db.repProfile.phone}`}
              title={`전화 문의 (${db.repProfile.phone})`}
              className="w-9 h-9 rounded-xl bg-[#E8F3FF] hover:bg-[#CFE2FF] text-[#1B64DA] flex items-center justify-center transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleKakaoClick}
              title={`카카오톡 문의 (ID: ${db.repProfile.kakaoId})`}
              className="w-9 h-9 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] flex items-center justify-center transition active:scale-95 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-[#191F28]" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty bottom spacer for balanced vertical centering (no bottom text) */}
      <div className="h-4" />

      {/* Direct KakaoTalk Profile & QR Popup Modal */}
      {kakaoProfileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setKakaoProfileOpen(false)}
        >
          <div
            className="bg-white rounded-[32px] max-w-sm w-full p-5 shadow-2xl space-y-4 text-center relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setKakaoProfileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-[#191F28] flex items-center justify-center z-10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Uploaded Actual KakaoTalk Profile Card Image (서윤 / seoyun4 + QR) */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img
                src="/kakao-profile-seoyun.jpg"
                alt={`${db.repProfile.name} 카카오톡 프로필 (${db.repProfile.kakaoId})`}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] font-bold text-[#3182F6] block">
                  카톡 ID 자동 복사 완료
                </span>
                <strong className="text-sm font-extrabold text-[#191F28]">
                  ID : {db.repProfile.kakaoId}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(db.repProfile.kakaoId);
                  setKakaoCopied(true);
                  setTimeout(() => setKakaoCopied(false), 2500);
                }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-[#191F28] text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>ID 복사</span>
              </button>
            </div>

            <p className="text-[11px] text-[#4E5968] leading-relaxed">
              휴대폰에서는 위 <strong>QR코드를 길게 누르거나</strong> PC에서는{" "}
              <strong>카메라로 스캔</strong>하시면 바로{" "}
              <strong>{db.repProfile.name}</strong> 프로필로 연결됩니다.
            </p>

            <button
              type="button"
              onClick={launchKakaoApp}
              className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191F28] font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm transition active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-[#191F28]" />
              <span>카카오톡 앱 바로 열기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
