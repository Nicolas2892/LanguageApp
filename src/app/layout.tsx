import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { PageWrapper } from "@/components/PageWrapper";
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
    statusBarStyle: 'black-translucent',
    startupImage: [
      // iPhone SE (2x) — 320×568pt
      { url: '/splash?w=640&h=1136', media: '(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)' },
      // iPhone 8 (2x) — 375×667pt
      { url: '/splash?w=750&h=1334', media: '(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)' },
      // iPhone 8 Plus (3x) — 414×736pt
      { url: '/splash?w=1242&h=2208', media: '(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone X / XS / 11 Pro (3x) — 375×812pt
      { url: '/splash?w=1125&h=2436', media: '(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone XR / 11 (2x) — 414×896pt
      { url: '/splash?w=828&h=1792', media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2)' },
      // iPhone XS Max / 11 Pro Max (3x) — 414×896pt
      { url: '/splash?w=1242&h=2688', media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone 12 / 13 / 14 (3x) — 390×844pt
      { url: '/splash?w=1170&h=2532', media: '(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone 12 / 13 / 14 Pro Max (3x) — 428×926pt
      { url: '/splash?w=1284&h=2778', media: '(device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone 14 Pro (3x) — 393×852pt
      { url: '/splash?w=1179&h=2556', media: '(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)' },
      // iPhone 14 Pro Max (3x) — 430×932pt
      { url: '/splash?w=1290&h=2796', media: '(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)' },
    ],
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
          <PageWrapper>{children}</PageWrapper>
        </div>
        <BottomNav />
        <ServiceWorkerRegistration />
        <IOSInstallPrompt />
      </body>
    </html>
  );
}
