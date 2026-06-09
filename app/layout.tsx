import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { ExtendedNodesProvider } from '@/lib/context/ExtendedNodesContext';
import ThemedToaster from '@/components/dashboard/ThemedToaster';
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
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-surface-0 text-ink antialiased overflow-x-hidden selection:bg-accent/25 selection:text-ink">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ExtendedNodesProvider>
              {children}
              <ThemedToaster />
            </ExtendedNodesProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
