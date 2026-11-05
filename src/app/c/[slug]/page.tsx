import React from "react";
import { getDatabase, getAcademicFilesList } from "@/lib/db";
import ClientPortalView from "@/components/ClientPortalView";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    slug: string;
  };
}

export default function ClinicDistributionPage({ params }: PageProps) {
  const db = getDatabase();
  const academicFiles = getAcademicFilesList();
  const decodedSlug = decodeURIComponent(params.slug);
  const clinic = db.clinics.find((c) => c.slug === decodedSlug);

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-merz-gold text-slate-900 font-extrabold flex items-center justify-center text-lg">
          Re:
        </div>
        <h1 className="text-xl font-extrabold">요청하신 거래처 브리핑 페이지를 찾을 수 없습니다.</h1>
        <p className="text-xs text-slate-400 max-w-md">
          링크 주소(<code>/c/{decodedSlug}</code>)가 정확한지 확인해 주시거나 담당자({db.repProfile.roleTitle}{" "}
          {db.repProfile.name}: {db.repProfile.phone})에게 문의해 주세요.
        </p>
        <Link
          href="/"
          className="bg-merz-teal text-white text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          기본 브리핑 페이지로 이동
        </Link>
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
