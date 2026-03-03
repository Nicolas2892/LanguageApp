import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Español Avanzado",
  description: "Adaptive Spanish learning app for B1 to B2 progression",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Español Avanzado',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch initials for the nav avatar — lightweight PK lookup, gracefully skipped
  // when unauthenticated (auth pages). Middleware already handles redirects.
  let userInitials = ''
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      const displayName = (profile as { display_name: string | null } | null)?.display_name ?? null
      userInitials = getInitials(displayName, user.email!)
    }
  } catch {
    // unauthenticated or unexpected error — nav falls back to "?" avatar
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SideNav userInitials={userInitials} />
        <div className="lg:ml-[220px]">
          <AppHeader userInitials={userInitials} />
          {children}
        </div>
        <BottomNav />
        <ServiceWorkerRegistration />
        <IOSInstallPrompt />
      </body>
    </html>
  );
}
