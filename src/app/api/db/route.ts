import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, getAcademicFilesList, getAcademicDirPath } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDatabase();
  const academicFiles = await getAcademicFilesList();
  const academicDirPath = getAcademicDirPath();
  return NextResponse.json({
    db,
    academicFiles,
    academicDirPath,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const currentDb = await getDatabase();
    const updatedDb = {
      ...currentDb,
      ...body,
    };
    await saveDatabase(updatedDb, true);
    const academicFiles = await getAcademicFilesList();
    return NextResponse.json({
      ok: true,
      db: updatedDb,
      academicFiles,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
