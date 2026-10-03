import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press" });
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jet" });

export const metadata: Metadata = {
  title: "Pointer Quest: Escape to NULL",
  description: "Quiz dungeon Singly Linked List — praktikum Struktur Data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#120f19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${press.variable} ${vt323.variable} ${jet.variable}`}>
      <body className="min-h-dvh overflow-x-hidden antialiased">{children}</body>
    </html>
  );
}
