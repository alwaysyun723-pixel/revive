import fs from "fs";
import path from "path";
import { RemodelingDatabase, AcademicFileItem } from "@/types/remodeling";
import { defaultDatabase } from "@/data/defaultData";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const ACADEMIC_DIR = path.join(process.cwd(), "public", "academic-docs");

export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACADEMIC_DIR)) {
    fs.mkdirSync(ACADEMIC_DIR, { recursive: true });
  }
}

export function getDatabase(): RemodelingDatabase {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), "utf-8");
    return defaultDatabase;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RemodelingDatabase>;
    return {
      ...defaultDatabase,
      ...parsed,
      repProfile: { ...defaultDatabase.repProfile, ...(parsed.repProfile || {}) },
      siteContent: {
        ...defaultDatabase.siteContent,
        ...(parsed.siteContent || {}),
        tabLabels: {
          ...defaultDatabase.siteContent.tabLabels,
          ...(parsed.siteContent?.tabLabels || {}),
        },
        homeSection: {
          ...defaultDatabase.siteContent.homeSection,
          ...(parsed.siteContent?.homeSection || {}),
        },
        overviewSection: {
          ...defaultDatabase.siteContent.overviewSection,
          ...(parsed.siteContent?.overviewSection || {}),
        },
        eventsSection: {
          ...defaultDatabase.siteContent.eventsSection,
          ...(parsed.siteContent?.eventsSection || {}),
        },
        packagesSection: {
          ...defaultDatabase.siteContent.packagesSection,
          ...(parsed.siteContent?.packagesSection || {}),
        },
        calculatorSection: {
          ...defaultDatabase.siteContent.calculatorSection,
          ...(parsed.siteContent?.calculatorSection || {}),
        },
      },
    };
  } catch {
    return defaultDatabase;
  }
}

export function saveDatabase(db: RemodelingDatabase): RemodelingDatabase {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  return db;
}

export function getAcademicFilesList(): AcademicFileItem[] {
  ensureDirectories();
  const db = getDatabase();
  const metaMap = db.academicFileMeta || {};

  const entries = fs.readdirSync(ACADEMIC_DIR, { withFileTypes: true });
  const files: AcademicFileItem[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(ACADEMIC_DIR, entry.name);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(entry.name).replace(".", "").toUpperCase() || "FILE";
    const meta = metaMap[entry.name] || {};

    files.push({
      fileName: entry.name,
      displayName: meta.displayName || entry.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
      url: `/academic-docs/${encodeURIComponent(entry.name)}`,
      ext,
      category: meta.category || "학술·임상 자료",
      description:
        meta.description ||
        `파일 크기 ${(stat.size / 1024).toFixed(1)} KB · public/academic-docs 폴더 실시간 연동 파일`,
    });
  }

  return files.sort((a, b) => (a.fileName > b.fileName ? 1 : -1));
}

export function getAcademicDirPath(): string {
  ensureDirectories();
  return ACADEMIC_DIR;
}
