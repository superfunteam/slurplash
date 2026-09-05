import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";

const gsf = Google_Sans_Flex({
  variable: "--font-gsf",
  subsets: ["latin"],
  axes: ["ROND", "wdth", "opsz", "GRAD"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slurplash — The 7-Eleven Head-to-Head Comedy Game",
  description: "A Quiplash-style party game for 7-Eleven. Big screen hosts, phones play. Oh thank heaven.",
  applicationName: "Slurplash",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Slurplash" },
};

export const viewport: Viewport = {
  themeColor: "#023B2D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gsf.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
