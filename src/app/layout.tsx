
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PlanProvider } from '@/contexts/plan-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GroZen | Free AI Wellness App to Level Up Your Mood, Meals & Mind with AI Mood Tracker & Diet Plans',
  description: 'GroZen is a free AI wellness app for teens: get daily health missions (meals, mini‑workouts, chill breaks), mood tracking via emojis & selfies, AI tips, budget‑smart grocery lists, live leaderboards & badges for fun self‑care.',
  keywords: 'teen wellness, AI coach, free wellness app, teen fitness, mental health for teens, gamified wellness, personalized plans, GroZen, mood tracking, habit building, fun app for teens, AI wellness app, teen wellness tracker, free mood tracker, gamified self-care, daily health missions, AI diet planner, budget grocery list, mini workouts app, mood diary via emojis, selfie mood check, AI stress tips, wellness challenge app, live leaderboards, health badges, self-care for teens, habit tracker for students, stress relief app, mental health for teens, healthy habits game, meal planner for teens, study break reminders, youth fitness app, grocery planner app, self-care reminders, AI wellness coach, student wellness app, school stress tracker, mindful breaks tool',
  authors: [
    { name: "Lakshya Gupta" },
    { name: "The Techiral Team" }
  ],
  creator: 'Techiral',
  publisher: 'Techiral',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grozen.vercel.app',
    siteName: 'GroZen',
    title: 'GroZen: Your Epic AI Wellness Adventure (Free for Teens!)',
    description: 'GroZen is a free AI-powered game that turns self-care into daily fun: get quick mood checks, easy meal & workout missions, smart grocery lists, and compete with friends to crush stress and level up your health!',
    images: [
      {
        url: 'https://i.ibb.co/Xr8LtLpd/Chat-GPT-Image-Jun-19-2025-09-07-01-PM.png', // Placeholder OG image
        width: 1200,
        height: 630,
        alt: 'GroZen - Fun AI Wellness App for Teens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@techiral_', // Placeholder for your Twitter handle
    creator: '@techiral_', // Placeholder for your Twitter handle
    title: 'This Free AI App Turns Self-Care Into a Game — And It’s Actually Fun”',
    description: 'This free AI app gives you mood boosts, fun daily missions, and zero-pressure self-care that actually feels good.',
    images: ['https://i.ibb.co/Xr8LtLpd/Chat-GPT-Image-Jun-19-2025-09-07-01-PM.png'], // Placeholder Twitter image
  },
  manifest: '/manifest.json', // Placeholder for your manifest file in /public
  icons: {
    icon: '/favicon.png', // Placeholder for your favicon in /public
    apple: '/favicon.png', // Placeholder for your apple touch icon in /public
  },
  alternates: {
    canonical: 'https://grozen.vercel.app', // Placeholder for your actual domain
  },
};

export const viewport: Viewport = {
  themeColor: 'hsl(var(--primary))',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'A fun, gamified AI-powered wellness and fitness app for teens. Get free personalized plans to improve mood, habits, and confidence. Simple, engaging, and effective.',
  url: 'https://grozen.vercel.app', // Placeholder for your actual domain
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  keywords: 'teen wellness, AI coach, free wellness app, gamified fitness, mental health app for teens, personalized wellness, habit tracker, fun app',
  audience: {
    '@type': 'Audience',
    audienceType: 'Teenagers',
    geographicArea: {
        "@type": "AdministrativeArea",
        name: "Worldwide"
    },
    suggestedMinAge: 13,
    suggestedMaxAge: 19,
  },
  potentialAction: {
    "@type": "CreateAction",
    "target": "https://grozen.vercel.app" // Placeholder for your domain
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://placehold.co" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <PlanProvider>
          {children}
          <Toaster />
        </PlanProvider>
      </body>
    </html>
  );
}

