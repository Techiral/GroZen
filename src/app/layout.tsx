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
  // Next.js 13+ App Router convention for favicons:
  // Place your favicon.png (or .ico, .svg) in the /app directory
  // or provide an explicit link in the <head> as done below for clarity with .png.
  // icons: {
  //   icon: '/favicon.png', // This would be another way if using the metadata object
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Explicit link for favicon.png placed in /public directory */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
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
