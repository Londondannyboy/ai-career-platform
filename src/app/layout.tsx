import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { VoiceProvider } from "@humeai/voice-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Career Platform",
  description: "Build your career repository, connect with professionals, and find your next opportunity",
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <VoiceProvider 
            auth={{
              type: "apiKey",
              value: process.env.NEXT_PUBLIC_HUME_API_KEY || "",
            }}
            configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID || "8f16326f-a45d-4433-9a12-890120244ec3"}
          >
            {children}
          </VoiceProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
