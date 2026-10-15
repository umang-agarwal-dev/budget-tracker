import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWA";

export const metadata: Metadata = {
  title: { default: "Pocket", template: "%s · Pocket" },
  description: "Know what's left. Split the bill. Skip the stress.",
  applicationName: "Pocket",
  appleWebApp: { capable: true, title: "Pocket", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f4ec" }, { media: "(prefers-color-scheme: dark)", color: "#0e0f0e" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>{children}<PWARegister /></body>
    </html>
  );
}
