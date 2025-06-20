
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PlanProvider } from '@/contexts/plan-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const appUrl = 'https://grozen.app'; // Placeholder for your actual domain
const appTitle = 'GroZen: AI Wellness Quest - Level Up Your Vibe! ✨';
const appDescription = 'Free AI wellness app for teens! Get personalized diet plans, AI-powered daily quests, mood tracking with empathetic feedback, and crush goals with fun challenges & leaderboards. Your adventure to a healthier, happier you starts here!';
const appKeywords = 'teen wellness, AI coach, free wellness app, teen fitness, mental health for teens, gamified wellness, personalized plans, GroZen, mood tracking, habit building, fun app for teens, AI wellness app, teen wellness tracker, free mood tracker, gamified self-care, daily health missions, AI diet planner, budget grocery list, mini workouts app, mood diary via emojis, selfie mood check, AI stress tips, wellness challenge app, live leaderboards, health badges, self-care for teens, habit tracker for students, stress relief app, mental health for teens, healthy habits game, meal planner for teens, study break reminders, youth fitness app, grocery planner app, self-care reminders, AI wellness coach, student wellness app, school stress tracker, mindful breaks tool, Genkit, Gemini AI';

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  keywords: appKeywords,
  authors: [
    { name: "Lakshya Gupta" },
    { name: "The Techiral Team" }
  ],
  creator: 'Lakshya Gupta / Techiral',
  publisher: 'Techiral',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    siteName: 'GroZen',
    title: 'GroZen: Your Epic AI Wellness Adventure (Free for Teens!)',
    description: 'GroZen is a free AI-powered game that turns self-care into daily fun: get quick mood checks, easy meal & workout missions, smart grocery lists, and compete with friends to crush stress and level up your health!',
    images: [
      {
        url: 'https://placehold.co/1200x630.png?text=GroZen+AI+Wellness+Adventure', // Placeholder OG image
        width: 1200,
        height: 630,
        alt: 'GroZen - Fun AI Wellness App for Teens with Personalized Plans & Mood Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lakshyaagy', // Placeholder for your Twitter handle
    creator: '@lakshyaagy', // Placeholder for your Twitter handle
    title: 'GroZen: This Free AI App Turns Self-Care Into a Game—And It’s Actually Fun!',
    description: 'GroZen offers free AI-driven diet plans, mood tracking with empathetic feedback, and gamified daily quests to make wellness enjoyable for teens.',
    images: ['https://placehold.co/1200x600.png?text=GroZen+AI+App+for+Teens'], // Placeholder Twitter image
  },
  manifest: '/manifest.json', // You'll need to create public/manifest.json
  icons: {
    icon: '/favicon.png', // You'll need to create public/favicon.png
    apple: '/apple-touch-icon.png', // You'll need to create public/apple-touch-icon.png
  },
  alternates: {
    canonical: appUrl,
  },
};

export const viewport: Viewport = {
  themeColor: 'hsl(var(--primary))', // Should match your primary dark theme color
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'A fun, gamified AI-powered wellness and fitness app for teens. Get free personalized plans to improve mood, habits, and confidence. Simple, engaging, and effective, using Genkit and Google Gemini models.',
  url: appUrl,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  keywords: appKeywords,
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
    "target": appUrl
  },
  creator: [
    {
      "@type": "Person",
      "name": "Lakshya Gupta"
    },
    {
      "@type": "Organization",
      "name": "Techiral"
    }
  ]
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
        {/* Add actual manifest and icon links here if not using the ones in metadata.icons */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" /> */}
        {/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
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
