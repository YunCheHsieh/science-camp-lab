import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Science Camp Lab｜科普營隊營運模擬平台",
  description:
    "從第一場營隊開始，模擬收入、成本、年度排程與公司化的可能性。科普教育團隊的試營運工作空間。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
