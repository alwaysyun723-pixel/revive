import { NextRequest, NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/db";
import { ActivityApplication } from "@/types/remodeling";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinicSlug,
      clinicName,
      directorName,
      activityId,
      activityCode,
      activityTitle,
      preferredDate,
      contactPhone,
      requestNote,
      sessionId,
    } = body;

    const db = await getDatabase();
    const nowIso = new Date().toISOString();

    const newApp: ActivityApplication = {
      id: `app-${Date.now()}`,
      clinicSlug: clinicSlug || "demo",
      clinicName: clinicName || "방문 거래처",
      directorName: directorName || "원장",
      activityId: activityId || "act",
      activityCode: activityCode || "MERZ-ACTIVITY",
      activityTitle: activityTitle || activityCode,
      preferredDate: preferredDate || "일정 협의 희망",
      contactPhone: contactPhone || "",
      requestNote: requestNote || "",
      createdAt: nowIso,
      status: "접수완료",
      kakaoNotified: false,
    };

    const alertMessageText = `[Re:modeling 액티비티 신청 알림]\n• 병원명: ${newApp.clinicName} (${newApp.directorName}님)\n• 신청 프로그램: ${newApp.activityCode} (${newApp.activityTitle})\n• 희망 일정: ${newApp.preferredDate}\n• 연락처/메모: ${newApp.contactPhone || "-"} / ${newApp.requestNote || "없음"}\n• 신청 시각: ${new Date().toLocaleString("ko-KR")}`;

    // 1. If Kakao REST API Access Token ('나에게 보내기') is configured, send real-time KakaoTalk alert to RBS 서윤
    const kakaoToken = db.repProfile.kakaoWebhookToken?.trim();
    if (kakaoToken) {
      try {
        const templateObject = {
          object_type: "text",
          text: alertMessageText,
          link: {
            web_url: "http://localhost:3000/admin",
            mobile_web_url: "http://localhost:3000/admin",
          },
          button_title: "관리자 페이지에서 확인",
        };

        const formBody = new URLSearchParams();
        formBody.append("template_object", JSON.stringify(templateObject));

        const kakaoRes = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${kakaoToken}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          },
          body: formBody.toString(),
        });

        if (kakaoRes.ok) {
          newApp.kakaoNotified = true;
        }
      } catch {
        // Fallback handled gracefully
      }
    }

    // 2. If Custom Webhook URL is configured, also trigger webhook
    const customWebhook = db.repProfile.customWebhookUrl?.trim();
    if (customWebhook) {
      try {
        await fetch(customWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: alertMessageText,
            application: newApp,
          }),
        });
        newApp.kakaoNotified = true;
      } catch {
        // Ignore webhook failure
      }
    }

    db.activityApplications.unshift(newApp);

    // Also record in session log if sessionId is provided
    if (sessionId) {
      const sess = db.accessLogs.find((s) => s.sessionId === sessionId);
      if (sess) {
        sess.clickedItems.push({
          type: "activity_apply",
          label: `${newApp.activityCode} 신청 (${newApp.preferredDate})`,
          timestamp: nowIso,
        });
      }
    }

    await saveDatabase(db, true);

    return NextResponse.json({
      ok: true,
      application: newApp,
      alertMessageText,
      repKakaoId: db.repProfile.kakaoId,
      repPhone: db.repProfile.phone,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Application failed" },
      { status: 500 }
    );
  }
}
