import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["vietnamese", "latin"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--",
});

export const metadata: Metadata = {
  title: "TimeTrack Pro - Hệ thống chấm công thông minh",
  description: "Quản lý thời gian làm việc mọi lúc, mọi nơi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`light ${manrope.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-manrope antialiased">{children}</body>
    </html>
  );
}
