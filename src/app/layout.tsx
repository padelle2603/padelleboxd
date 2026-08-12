import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AdminShortcut from "@/components/AdminShortcut";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PadelleBoxd — Track the TV series you love",
    template: "%s — PadelleBoxd",
  },
  description:
    "Track the TV series you watch. Rate them, organize your list, and share it with friends.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <AdminShortcut />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-600">
          PadelleBoxd ·
          <span className="text-zinc-500"> Data provided by TMDB. Built with Next.js.</span>
        </footer>
      </body>
    </html>
  );
}