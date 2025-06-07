import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PlanProvider } from '@/contexts/plan-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GroZen - Get Rid Of Your Body Insecurities in 5 Minutes | Teen Wellness App',
  description: 'Join 10,000+ teens transforming their lives with AI-powered wellness coaching. Personalized meal plans, fun workouts, and mood tracking designed for Gen Z. Start your free transformation today!',
  keywords: 'teen wellness app, body confidence teens, AI wellness coach, teen fitness, mental health teens, personalized meal plans teens, teen workout app, body positivity app, wellness for teenagers, teen health transformation',
  authors: [{ name: 'GroZen Team' }],
  creator: 'GroZen',
  publisher: 'GroZen',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grozen.app',
    siteName: 'GroZen',
    title: 'GroZen - Transform Your Life in 5 Minutes | #1 Teen Wellness App',
    description: 'Join 10,000+ teens who transformed their lives with GroZen. AI-powered wellness coaching, personalized plans, and a supportive community. Start free today!',
    images: [
      {
        url: 'https://grozen.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GroZen - Teen Wellness Transformation App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GroZenApp',
    creator: '@GroZenApp',
    title: 'GroZen - Get Rid Of Your Body Insecurities in 5 Minutes',
    description: 'Join 10,000+ teens transforming their lives with AI wellness coaching. Start your free transformation today! 🚀',
    images: ['https://grozen.app/twitter-image.jpg'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#D3D3D3',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://grozen.app',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

// Schema markup for enhanced SERP visibility
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'AI-powered wellness app designed specifically for teenagers to transform their health, fitness, and mental wellbeing.',
  url: 'https://grozen.app',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '2847',
    bestRating: '5',
    worstRating: '1',
  },
  author: {
    '@type': 'Organization',
    name: 'GroZen',
    url: 'https://grozen.app',
  },
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString(),
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  audience: {
    '@type': 'Audience',
    audienceType: 'Teenagers',
    suggestedMinAge: 13,
    suggestedMaxAge: 19,
  },
  featureList: [
    'AI-powered wellness coaching',
    'Personalized meal plans for teens',
    'Fun workout routines',
    'Mood tracking and mental health support',
    'Teen community and challenges',
    'Progress tracking and gamification',
  ],
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
        <meta name="google-site-verification" content="your-google-verification-code" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://placehold.co" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
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