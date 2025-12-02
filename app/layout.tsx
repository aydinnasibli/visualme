import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Visualization Engine - AI-Powered Visualizations",
  description: "Transform any text, data, or concept into beautiful interactive visualizations using AI. Supports network graphs, mind maps, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
