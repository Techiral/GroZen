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
  title: 'GroZen',
  description: 'Your personalized wellness companion.',
  icons: {
    icon: '/favicon.png', // Points to public/favicon.png
    // You can also add other icon types here if needed, e.g., apple-touch-icon
    // apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* The <head> tag is managed by Next.js metadata, no need for manual favicon link here */}
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
