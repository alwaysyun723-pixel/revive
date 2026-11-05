import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, customAlias } = body as { targetUrl: string; customAlias?: string };

    if (!targetUrl) {
      return NextResponse.json({ ok: false, error: "targetUrl required" }, { status: 400 });
    }

    const params = new URLSearchParams({
      format: "json",
      url: targetUrl,
    });
    if (customAlias && customAlias.trim()) {
      params.set("shorturl", customAlias.trim());
    }

    const res = await fetch(`https://is.gd/create.php?${params.toString()}`);
    const data = await res.json();

    if (data.shorturl) {
      return NextResponse.json({ ok: true, shortUrl: data.shorturl });
    }

    // Fallback without customAlias if alias was already taken
    const fallbackParams = new URLSearchParams({
      format: "json",
      url: targetUrl,
    });
    const fallbackRes = await fetch(`https://is.gd/create.php?${fallbackParams.toString()}`);
    const fallbackData = await fallbackRes.json();

    return NextResponse.json({
      ok: Boolean(fallbackData.shorturl),
      shortUrl: fallbackData.shorturl || targetUrl,
      error: data.errormessage,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
