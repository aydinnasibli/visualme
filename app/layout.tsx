import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { ExtendedNodesProvider } from '@/lib/context/ExtendedNodesContext';
import "./globals.css";

export const metadata: Metadata = {
  title: "VisualMe - Visualize Anything in Seconds",
  description: "Transform ideas, raw data, or unstructured notes into professional diagrams. A refined workspace where your words become visuals instantly.",
  keywords: "visualization, AI, data visualization, charts, graphs, mind maps, flowcharts, timelines, diagrams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-display bg-background-dark text-white antialiased overflow-x-hidden selection:bg-primary/30 selection:text-white">
          <ExtendedNodesProvider>
            {children}
          </ExtendedNodesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
