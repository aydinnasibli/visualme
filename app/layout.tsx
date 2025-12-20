import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/layout/Header';
import { ExtendedNodesProvider } from '@/lib/context/ExtendedNodesContext';
import "./globals.css";

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
          <ExtendedNodesProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
          </ExtendedNodesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
