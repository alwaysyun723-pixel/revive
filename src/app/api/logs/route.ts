import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/db";
import { TabKey } from "@/types/remodeling";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDatabase();
  return NextResponse.json({ accessLogs: db.accessLogs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      clinicSlug,
      clinicName,
      directorName,
      deviceType,
      activeTab,
      dwellIncrementSec = 0,
      clickedItem,
    } = body as {
      sessionId: string;
      clinicSlug: string;
      clinicName: string;
      directorName: string;
      deviceType?: "Mobile" | "Tablet" | "PC";
      activeTab?: TabKey;
      dwellIncrementSec?: number;
      clickedItem?: {
        type: "event_link" | "academic_file" | "activity_apply" | "contact_action";
        label: string;
      };
    };

    if (!sessionId || !clinicSlug) {
      return NextResponse.json({ ok: false, error: "Missing sessionId or clinicSlug" }, { status: 400 });
    }

    const db = await getDatabase();
    const nowIso = new Date().toISOString();
    let session = db.accessLogs.find((s) => s.sessionId === sessionId);
    const isNewSession = !session;

    if (!session) {
      session = {
        sessionId,
        clinicSlug,
        clinicName: clinicName || clinicSlug,
        directorName: directorName || "원장",
        deviceType: deviceType || "PC",
        startedAt: nowIso,
        lastActiveAt: nowIso,
        totalDwellSeconds: 0,
        tabDwellSeconds: {
          home: 0,
          overview: 0,
          events: 0,
          packages: 0,
          calculator: 0,
        },
        tabSequence: activeTab ? [activeTab] : ["home"],
        clickedItems: [],
      };
      db.accessLogs.unshift(session);
    } else {
      session.lastActiveAt = nowIso;
    }

    if (dwellIncrementSec > 0) {
      session.totalDwellSeconds += dwellIncrementSec;
      const tab = activeTab || "home";
      session.tabDwellSeconds[tab] = (session.tabDwellSeconds[tab] || 0) + dwellIncrementSec;
    }

    if (activeTab) {
      const lastTab = session.tabSequence[session.tabSequence.length - 1];
      if (lastTab !== activeTab) {
        session.tabSequence.push(activeTab);
      }
    }

    if (clickedItem) {
      session.clickedItems.push({
        type: clickedItem.type,
        label: clickedItem.label,
        timestamp: nowIso,
      });
    }

    const shouldSyncCloud =
      isNewSession || Boolean(clickedItem) || session.totalDwellSeconds % 30 === 0;
    await saveDatabase(db, shouldSyncCloud);
    return NextResponse.json({ ok: true, session });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Log failed" },
      { status: 500 }
    );
  }
}
