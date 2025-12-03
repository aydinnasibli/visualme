import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Universal Visualization Engine - AI-Powered Visualizations",
  description: "Transform any text, data, or concept into beautiful interactive visualizations using AI. Supports 19 visualization formats.",
  keywords: "visualization, AI, data visualization, charts, graphs, mind maps, flowcharts, timelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-zinc-950 text-gray-200 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
