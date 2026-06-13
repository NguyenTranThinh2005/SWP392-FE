import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MangaFlow - Manga Production & Editorial Workspace",
  description: "Collaborative workspace for Mangakas, Assistants, and Editors.",
};

import { GlobalUIProvider } from "@/context/GlobalUIContext";
import GlobalOverlay from "@/components/common/GlobalOverlay";
import UIInitializer from "@/components/common/UIInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", nunitoSans.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GlobalUIProvider>
          <UIInitializer />
          {children}
          <GlobalOverlay />
          <Toaster />
        </GlobalUIProvider>
      </body>
    </html>
  );
}
