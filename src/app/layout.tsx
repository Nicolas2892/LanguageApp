import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { PageWrapper } from "@/components/PageWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SplashScreen } from "@/components/SplashScreen";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["600"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Senda",
  description: "Adaptive Spanish learning app for B1 to B2 progression",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Senda',
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

// Injected before paint for 'system' theme to prevent FOUC
const SYSTEM_THEME_SCRIPT = `
(function(){
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.matches) document.documentElement.classList.add('dark');
  mq.addEventListener('change', function(e){
    document.documentElement.classList[e.matches?'add':'remove']('dark');
  });
})();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch initials + theme for the nav avatar — lightweight PK lookup, gracefully skipped
  // when unauthenticated (auth pages). Middleware already handles redirects.
  let userInitials = ''
  let userId: string | undefined
  let streak = 0
  let themePreference: 'light' | 'dark' | 'system' = 'system'
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, theme_preference, streak')
        .eq('id', user.id)
        .single()
      const p = profile as { display_name: string | null; theme_preference: string | null; streak: number | null } | null
      userInitials = getInitials(p?.display_name ?? null, user.email!)
      streak = p?.streak ?? 0
      if (p?.theme_preference === 'light' || p?.theme_preference === 'dark' || p?.theme_preference === 'system') {
        themePreference = p.theme_preference
      }
    }
  } catch {
    // unauthenticated or unexpected error — nav falls back to "?" avatar, system theme
  }

  // For dark/light: SSR applies class immediately (no FOUC).
  // For system: inline script handles it client-side before paint.
  const htmlClass = themePreference === 'dark' ? 'dark' : ''

  return (
    <html lang="en" className={htmlClass}>
      <head>
        {themePreference === 'system' && (
          <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME_SCRIPT }} />
        )}
      </head>
      <body
        className={`${dmSans.variable} ${lora.variable} antialiased`}
      >
        <ThemeProvider initialTheme={themePreference}>
          <PostHogProvider userId={userId}>
            <SideNav userInitials={userInitials} streak={streak} />
            <div className="lg:ml-[220px]">
              <AppHeader userInitials={userInitials} streak={streak} />
              <PageWrapper>{children}</PageWrapper>
            </div>
            <BottomNav />
            <ServiceWorkerRegistration />
            <IOSInstallPrompt />
            <SplashScreen />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
