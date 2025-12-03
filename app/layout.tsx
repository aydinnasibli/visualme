import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

// Force dynamic rendering to avoid Clerk build issues
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
  // Use placeholder keys during build if not provided
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';
  const hasRealKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="bg-zinc-950 text-gray-200 antialiased">
          {!hasRealKeys && process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-500 text-black text-center py-2 text-sm font-semibold">
              ⚠️ Clerk keys not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env
            </div>
          )}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
