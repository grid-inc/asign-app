import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DS2 アサインダッシュボード",
  description: "DS2メンバーのプロジェクトアサイン状況を可視化",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
