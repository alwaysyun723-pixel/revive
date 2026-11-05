import React from "react";
import { getDatabase, getAcademicFilesList } from "@/lib/db";
import ClientPortalView from "@/components/ClientPortalView";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDatabase();
  const academicFiles = getAcademicFilesList();
  const defaultClinic = db.clinics[0];

  return (
    <ClientPortalView
      db={db}
      clinic={defaultClinic}
      academicFiles={academicFiles}
      requirePin={false}
      isPreviewMode={true}
    />
  );
}
