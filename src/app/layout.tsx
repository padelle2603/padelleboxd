import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import AdminShortcut from "@/components/layout/AdminShortcut";

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
          <p className="mb-2">
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block opacity-80 transition hover:opacity-100"
              aria-label="The Movie Database (TMDB)"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={90} height={12} />
            </a>
          </p>
          <p>
            PadelleBoxd ·
            <span className="text-zinc-500">
              {" "}
              Data provided by TMDB. This product uses the TMDB API but is not endorsed or
              certified by TMDB.
            </span>
          </p>
          <p className="mt-1 text-zinc-700">Built with Next.js.</p>
        </footer>
      </body>
    </html>
  );
}