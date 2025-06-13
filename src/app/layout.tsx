
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PlanProvider } from '@/contexts/plan-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Updated Metadata for minimal, dopamine-focused landing page
export const metadata: Metadata = {
  title: 'GroZen: Instant Teen Glow Up ✨',
  description: 'Unlock your best self in minutes. AI wellness, 100% free for teens. Fast results, feel amazing. Join now!',
  keywords: 'teen wellness, AI coach, instant results, free app, teen fitness, mental wellbeing, body confidence, grozen',
  authors: [{ name: 'GroZen Team' }],
  creator: 'GroZen',
  publisher: 'GroZen',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grozen.app', // Replace with your actual domain
    siteName: 'GroZen',
    title: 'GroZen: Instant Teen Transformation ✨ Free AI Wellness',
    description: 'AI-powered wellness for teens. Get personalized plans, boost confidence, and feel amazing. Free to start!',
    images: [
      {
        url: 'https://grozen.app/og-image-minimal.jpg', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'GroZen - Instant Teen Wellness App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GroZenApp', // Replace with your Twitter handle
    creator: '@GroZenApp', // Replace with your Twitter handle
    title: 'GroZen: Instant Teen Glow Up ✨ Free AI Wellness',
    description: 'Tap into AI-powered wellness designed for teens. Fast, free, and fun. Transform today! #GroZen #TeenWellness',
    images: ['https://grozen.app/twitter-image-minimal.jpg'], // Replace with your actual Twitter image URL
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1', // Max scale 1 for better control on dopamine-focused UI
  themeColor: '#000000', // Matches Deep Black background
  manifest: '/manifest.json', // Ensure you have a manifest.json for PWA capabilities
  icons: {
    icon: '/favicon.png', // Ensure favicon.png is in /public
    apple: '/apple-touch-icon.png', // Ensure apple-touch-icon.png is in /public
  },
  alternates: {
    canonical: 'https://grozen.app', // Replace with your actual domain
  },
};

// Simplified Schema.org for the new focus
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'GroZen',
  description: 'Instant AI-powered wellness app for teens. Get personalized plans, boost confidence, and feel amazing. 100% Free.',
  url: 'https://grozen.app', // Replace with your actual domain
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  keywords: 'teen wellness, AI coach, free wellness app, instant results, teen mental health, teen fitness',
  audience: {
    '@type': 'Audience',
    audienceType: 'Teenagers',
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
        {/* Add Google Site Verification if you have one */}
        {/* <meta name="google-site-verification" content="YOUR_CODE_HERE" /> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to image placeholders or CDN if used */}
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
