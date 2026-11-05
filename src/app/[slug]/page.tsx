import React from "react";
import { getDatabase, getAcademicFilesList } from "@/lib/db";
import ClientPortalView from "@/components/ClientPortalView";
import Link from "next/link";
import { Lock, ShieldAlert, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

const SHORT_ALIAS_MAP: Record<string, string> = {
  "1": "toxnfill-gn",
  tf: "toxnfill-gn",
  "toxnfill-gn": "toxnfill-gn",
  "2": "rejuel-gn",
  rj: "rejuel-gn",
  "rejuel-gn": "rejuel-gn",
  "3": "drevers-gn",
  de: "drevers-gn",
  "drevers-gn": "drevers-gn",
  "4": "theia-gn",
  th: "theia-gn",
  "theia-gn": "theia-gn",
  "5": "cheongdam-ace",
  cd: "cheongdam-ace",
  "cheongdam-ace": "cheongdam-ace",
};

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function ShortClinicDistributionPage({ params }: PageProps) {
  const db = await getDatabase();
  const academicFiles = await getAcademicFilesList();
  const decodedSlug = decodeURIComponent(params.slug).toLowerCase();
  const mappedSlug = SHORT_ALIAS_MAP[decodedSlug] || decodedSlug;

  const clinic = db.clinics.find(
    (c) =>
      c.slug.toLowerCase() === mappedSlug ||
      c.slug.toLowerCase() === decodedSlug ||
      c.pin === decodedSlug
  );

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1B3A6B] to-[#3182F6] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white text-[#191F28] rounded-[32px] p-8 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold">유효하지 않은 전용 링크입니다</h1>
          <p className="text-xs text-[#4E5968] leading-relaxed">
            요청하신 주소(<code>/{decodedSlug}</code>)는 등록되지 않았거나 변경된 링크입니다.
            <br />
            담당자(<strong>{db.repProfile.roleTitle} {db.repProfile.name}: {db.repProfile.phone}</strong>)에게 전용 링크를 문의해 주세요.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white text-sm font-extrabold px-5 py-3.5 rounded-2xl transition"
          >
            PIN 번호 입력 게이트로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (clinic.isActive === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1B3A6B] to-[#3182F6] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white text-[#191F28] rounded-[32px] p-8 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-block text-xs font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            {clinic.clinicName} 전용 링크
          </span>
          <h1 className="text-xl font-extrabold">접속 권한이 일시 중지된 페이지입니다</h1>
          <p className="text-xs text-[#4E5968] leading-relaxed">
            본 전용 링크는 담당자에 의해 열람 권한이 비활성화되었거나 열람 기간이 만료되었습니다.
            <br />
            다시 열람을 원하시면 담당자(<strong>{db.repProfile.roleTitle} {db.repProfile.name}</strong>)에게 연락해 주세요.
          </p>
          <a
            href={`tel:${db.repProfile.phone}`}
            className="inline-flex items-center justify-center gap-2 w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white text-sm font-extrabold px-5 py-3.5 rounded-2xl transition"
          >
            <Phone className="w-4 h-4" />
            <span>{db.repProfile.roleTitle} {db.repProfile.name}에게 전화하기 ({db.repProfile.phone})</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <ClientPortalView
      db={db}
      clinic={clinic}
      academicFiles={academicFiles}
      requirePin={true}
      isPreviewMode={false}
    />
  );
}
