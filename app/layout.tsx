import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import ThemedToaster from '@/components/dashboard/ThemedToaster';
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://visualme.app'),
  title: "VisualMe - Visualize Anything in Seconds",
  description: "Transform ideas, raw data, or unstructured notes into professional diagrams. A refined workspace where your words become visuals instantly.",
  keywords: "visualization, AI, data visualization, charts, graphs, mind maps, flowcharts, timelines, diagrams",
  openGraph: {
    title: "VisualMe - Visualize Anything in Seconds",
    description: "Transform ideas, raw data, or unstructured notes into professional diagrams.",
    type: "website",
    siteName: "VisualMe",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'VisualMe - AI-Powered Data Visualization' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VisualMe - Visualize Anything in Seconds",
    description: "Transform ideas, raw data, or unstructured notes into professional diagrams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="bg-surface-0 text-ink antialiased overflow-x-hidden selection:bg-accent/25 selection:text-ink">
        <ClerkProvider
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          telemetry={{ disabled: true }}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <ThemedToaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
