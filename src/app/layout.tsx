import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Life RPG | Gamify Your Reality',
  description: 'Transform your daily habits, chores, and focus sessions into an immersive RPG. Level up, earn credits, and dominate your attribute matrix.',
  keywords: ['habit tracker', 'rpg', 'gamification', 'pomodoro timer', 'productivity', 'focus protocol', 'Next.js'],
  authors: [{ name: 'Operative' }],
  creator: 'Tech Zephyr Participant',
  
  openGraph: {
    title: 'Life RPG | Neural Progression Engine',
    description: 'Stop making to-do lists. Start completing Quests. Level up your real life.',
    url: 'https://your-vercel-url.vercel.app', 
    siteName: 'Life RPG',
    type: 'website',
    locale: 'en_US',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Life RPG | Hack Your Habits',
    description: 'A multi-genre gamified productivity engine. Track streaks, use focus timers, and unlock The Armory.',
  },
  
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-cyan-500/30">
        {children}
      </body>
    </html>
  );
}
