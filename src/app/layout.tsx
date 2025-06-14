
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
  title: 'GroZen: AI Wellness for Teens - Simple, Fast, Free',
  description: 'Get your free, personalized AI wellness plan with GroZen. Designed for teens to boost mood, fitness, and confidence. Start your glow up today!',
  keywords: 'teen wellness, AI wellness, free wellness app, teen fitness, teen mental health, personalized plan, grozen, ai coach, mood tracking, habit building',
  authors: [{ name: 'GroZen Team' }],
  creator: 'GroZen',
  publisher: 'GroZen',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grozen.app', // Replace with your actual domain
    siteName: 'GroZen',
    title: 'GroZen: Simple AI Wellness & Fitness for Teens (Free)',
    description: 'Unlock your potential with GroZen! Free AI-powered wellness plans for teens. Improve fitness, mood, and habits. Quick and easy to start.',
    images: [
      {
        url: 'https://grozen.app/og-image-main.jpg', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'GroZen - AI Wellness App for Teens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GroZenApp', // Replace with your Twitter handle
    creator: '@GroZenApp', // Replace with your Twitter handle
    title: 'GroZen: Free AI Wellness Designed for Teens ✨',
    description: 'Personalized AI plans for fitness, mood, and more. Simple, fast, and 100% free. Join GroZen and start your transformation! #GroZen #TeenWellness #AIcoach',
    images: ['https://grozen.app/twitter-image-main.jpg'], // Replace with your actual Twitter image URL
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
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'AI-powered wellness and fitness app for teens. Get free personalized plans to improve mood, habits, and confidence. Simple, fast, and effective.',
  url: 'https://grozen.app', // Replace with your actual domain
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  keywords: 'teen wellness, AI coach, free wellness app, fitness app, mental health app, personalized wellness, habit tracker',
  audience: {
    '@type': 'Audience',
    audienceType: 'Teenagers',
    geographicArea: {
        "@type": "AdministrativeArea",
        name: "Worldwide"
    },
    suggestedMinAge: 13,
    suggestedMaxAge: 19,
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
