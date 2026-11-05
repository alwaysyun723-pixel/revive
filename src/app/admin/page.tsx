import React from "react";
import { getDatabase, getAcademicFilesList, getAcademicDirPath } from "@/lib/db";
import AdminDashboardView from "@/components/AdminDashboardView";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const db = getDatabase();
  const academicFiles = getAcademicFilesList();
  const academicDirPath = getAcademicDirPath();

  return (
    <AdminDashboardView
      initialDb={db}
      initialAcademicFiles={academicFiles}
      academicDirPath={academicDirPath}
    />
  );
}
