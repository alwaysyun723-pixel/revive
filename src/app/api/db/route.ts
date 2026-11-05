import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase, getAcademicFilesList, getAcademicDirPath } from "@/lib/db";
import { spawn } from "child_process";
import fs from "fs";

export const dynamic = "force-dynamic";

function triggerBackgroundGitHubSync() {
  try {
    const gitExe =
      "C:\\Users\\alway\\.gemini\\antigravity\\brain\\13cd3277-bca6-44a0-a922-9b068f6a69bd\\scratch\\mingit\\bin\\cmd\\git.exe";
    const nodeExe =
      "C:\\Users\\alway\\.gemini\\antigravity\\brain\\13cd3277-bca6-44a0-a922-9b068f6a69bd\\scratch\\node\\node-v20.18.3-win-x64\\node.exe";
    const pushScript =
      "C:\\Users\\alway\\.gemini\\antigravity\\brain\\13cd3277-bca6-44a0-a922-9b068f6a69bd\\scratch\\push_github.mjs";

    if (fs.existsSync(gitExe) && fs.existsSync(nodeExe) && fs.existsSync(pushScript)) {
      const child = spawn(
        "cmd.exe",
        [
          "/c",
          `"${gitExe}" add data/db.json && "${gitExe}" commit -m "Sync admin DB update" && "${nodeExe}" "${pushScript}"`,
        ],
        {
          cwd: process.cwd(),
          detached: true,
          stdio: "ignore",
        }
      );
      child.unref();
    }
  } catch {
    // Ignore sync errors on non-local environments
  }
}

export async function GET() {
  const db = getDatabase();
  const academicFiles = getAcademicFilesList();
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
    const currentDb = getDatabase();
    const updatedDb = {
      ...currentDb,
      ...body,
    };
    saveDatabase(updatedDb);
    triggerBackgroundGitHubSync();
    const academicFiles = getAcademicFilesList();
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
