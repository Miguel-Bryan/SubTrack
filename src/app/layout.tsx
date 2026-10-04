import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SubTrack", template: "%s · SubTrack" },
  description: "Track clients, payments and renewals for a subscription-reselling business.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f2f2b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
