import type { Metadata } from 'next';
import './globals.css';

const domain = process.env.NEXT_PUBLIC_DOMAIN ?? 'fitness';

const domainMeta: Record<string, { title: string; description: string; icon: string }> = {
  fitness: {
    title: 'Fitness Chat - Conversational Fitness Assistant',
    description: 'Ask fitness questions and get answers powered by AI and real fitness knowledge.',
    icon: '💪',
  },
  plants: {
    title: 'Plant Care Chat - Conversational Plant Assistant',
    description: 'Ask plant care questions and get answers powered by AI and real horticultural knowledge.',
    icon: '🌱',
  },
};

const meta = domainMeta[domain] ?? domainMeta.fitness;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: domain === 'plants'
    ? ['plants', 'gardening', 'plant care', 'chat', 'assistant', 'ai', 'horticulture']
    : ['fitness', 'chat', 'assistant', 'ai', 'health', 'workout', 'training'],
  icons: {
    icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75" font-weight="bold">${meta.icon}</text></svg>`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" data-domain={domain}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-gray-900 font-inter" style={{ fontFamily: '"Inter", sans-serif' }}>{children}</body>
    </html>
  );
}
