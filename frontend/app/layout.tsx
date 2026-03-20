import type { Metadata } from 'next';
import './globals.css';
import { ConfigProvider } from '../contexts/ConfigContext';
import { ContentProvider } from '../contexts/ContentContext';
import { DataSourceProvider } from '../contexts/DataSourceContext';
import { ThemeProvider } from '../components/ThemeProvider';

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
    <html lang="en" className="scroll-smooth">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-gray-900 font-inter" style={{ fontFamily: '"Inter", sans-serif' }}>
        <ConfigProvider>
          <ThemeProvider>
            <ContentProvider>
              <DataSourceProvider>
                {children}
              </DataSourceProvider>
            </ContentProvider>
          </ThemeProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
