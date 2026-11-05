import fs from "fs";
import os from "os";
import path from "path";
import { RemodelingDatabase, AcademicFileItem } from "@/types/remodeling";
import { defaultDatabase } from "@/data/defaultData";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "re_modeling_data");
const ACADEMIC_DIR = path.join(process.cwd(), "public", "academic-docs");

function getWritableDataDir(): string {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.accessSync(LOCAL_DATA_DIR, fs.constants.W_OK);
    return LOCAL_DATA_DIR;
  } catch {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    return TMP_DATA_DIR;
  }
}

export function ensureDirectories() {
  getWritableDataDir();
  try {
    if (!fs.existsSync(ACADEMIC_DIR)) {
      fs.mkdirSync(ACADEMIC_DIR, { recursive: true });
    }
  } catch {
    // Ignore on read-only serverless file systems
  }
}

export function getDatabase(): RemodelingDatabase {
  const dataDir = getWritableDataDir();
  const dbFile = path.join(dataDir, "db.json");
  if (!fs.existsSync(dbFile)) {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(defaultDatabase, null, 2), "utf-8");
    } catch {
      // Ignore write error if any
    }
    return defaultDatabase;
  }
  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RemodelingDatabase>;
    const existingClinics = parsed.clinics || [];
    const existingSlugs = new Set(existingClinics.map((c) => c.slug));
    const mergedClinics = [
      ...defaultDatabase.clinics.filter((dc) => !existingSlugs.has(dc.slug)),
      ...existingClinics,
    ];
    return {
      ...defaultDatabase,
      ...parsed,
      clinics: mergedClinics,
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
  const dataDir = getWritableDataDir();
  const dbFile = path.join(dataDir, "db.json");
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Ignore if read-only
  }
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
