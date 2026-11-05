import React from "react";
import { getDatabase, getAcademicFilesList, getAcademicDirPath } from "@/lib/db";
import AdminDashboardView from "@/components/AdminDashboardView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = await getDatabase();
  const academicFiles = await getAcademicFilesList();
  const academicDirPath = getAcademicDirPath();

  return (
    <AdminDashboardView
      initialDb={db}
      initialAcademicFiles={academicFiles}
      academicDirPath={academicDirPath}
    />
  );
}
