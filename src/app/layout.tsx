
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
  title: 'GroZen: Level Up Your Vibe! Free AI Wellness for Teens ✨',
  description: 'Unlock your teen wellness quest with GroZen! Free, fun, AI-powered plans for fitness, mood, and focus. Smash goals, feel awesome, and share your wins!',
  keywords: 'teen wellness, AI coach, free wellness app, teen fitness, mental health for teens, gamified wellness, personalized plans, GroZen, mood tracking, habit building, fun app for teens',
  authors: [{ name: 'The GroZen Crew' }],
  creator: 'GroZen',
  publisher: 'GroZen',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grozen.app', // Replace with your actual domain
    siteName: 'GroZen',
    title: 'GroZen: Your Epic AI Wellness Adventure (Free for Teens!)',
    description: 'Join GroZen! Free AI wellness plans designed to be fun and effective for teens. Boost fitness, mood, and confidence. Start your glow up today!',
    images: [
      {
        url: 'https://grozen.app/og-image-main-teen.jpg', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'GroZen - Fun AI Wellness App for Teens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GroZenApp', // Replace with your Twitter handle
    creator: '@GroZenApp', // Replace with your Twitter handle
    title: 'GroZen: AI Wellness But Make It FUN for Teens 🚀',
    description: 'Personalized AI plans for fitness, mood & more. It\'s 100% free, super engaging, and helps you smash your goals. #GroZen #TeenWellness #AIGlowUp #FunFitness',
    images: ['https://grozen.app/twitter-image-main-teen.jpg'], // Replace with your actual Twitter image URL
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://grozen.app', // Replace with your actual domain
  },
};

export const viewport: Viewport = {
  themeColor: 'hsl(var(--primary))', // Use the new primary color
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // userScalable: false, // Consider for a more app-like feel, but be cautious with accessibility
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'A fun, gamified AI-powered wellness and fitness app for teens. Get free personalized plans to improve mood, habits, and confidence. Simple, engaging, and effective.',
  url: 'https://grozen.app', // Replace with your actual domain
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
    "target": "https://grozen.app" // Replace with your domain if signup can start from root
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
