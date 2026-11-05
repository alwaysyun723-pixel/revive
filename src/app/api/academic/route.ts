import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAcademicDirPath, getAcademicFilesList, getDatabase, saveDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = getAcademicFilesList();
  const dirPath = getAcademicDirPath();
  return NextResponse.json({ files, dirPath });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const displayName = (formData.get("displayName") as string) || "";
    const category = (formData.get("category") as string) || "학술·임상 자료";
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json({ ok: false, error: "파일이 선택되지 않았습니다." }, { status: 400 });
    }

    const dirPath = getAcademicDirPath();
    const safeName = path.basename(file.name);
    const targetPath = path.join(dirPath, safeName);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

    const db = getDatabase();
    db.academicFileMeta = db.academicFileMeta || {};
    db.academicFileMeta[safeName] = {
      displayName: displayName.trim() || safeName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      category: category.trim() || "학술·임상 자료",
      description: description.trim() || "관리자 업로드 학술 자료",
    };
    saveDatabase(db);

    return NextResponse.json({
      ok: true,
      files: getAcademicFilesList(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json({ ok: false, error: "fileName이 필요합니다." }, { status: 400 });
    }

    const dirPath = getAcademicDirPath();
    const safeName = path.basename(fileName);
    const targetPath = path.join(dirPath, safeName);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    const db = getDatabase();
    if (db.academicFileMeta && db.academicFileMeta[safeName]) {
      delete db.academicFileMeta[safeName];
      saveDatabase(db);
    }

    return NextResponse.json({
      ok: true,
      files: getAcademicFilesList(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
