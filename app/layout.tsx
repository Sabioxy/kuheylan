import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import RouteTransition from "./route-transition";
import { PlayerProvider } from "@/components/PlayerProvider";
import StickyPlayer from "@/components/StickyPlayer";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Küheylan",
  description: "Dijital müzik lisansları için minimalist pazar yeri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <PlayerProvider>
          <div className="min-h-dvh">
            <TopNav />
            <RouteTransition>
              <main className="pb-24">{children}</main>
            </RouteTransition>
            <StickyPlayer />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
