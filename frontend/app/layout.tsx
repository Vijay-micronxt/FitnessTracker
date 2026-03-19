import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fitness Chat - Conversational Fitness Assistant',
  description: 'Ask fitness questions and get answers powered by AI and real fitness knowledge.',
  keywords: ['fitness', 'chat', 'assistant', 'ai', 'health', 'workout', 'training'],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75" font-weight="bold">💪</text></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">{children}</body>
    </html>
  );
}
