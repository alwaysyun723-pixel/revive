import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Re:modeling | Belotero® Revive Executive Briefing Portal",
  description:
    "멀츠 에스테틱스 벨로테로 리바이브(Belotero Revive) 스킨부스터 마케팅 브리핑, 강남/서초 이벤트 현황, 패키지 제안 및 마진 시뮬레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
