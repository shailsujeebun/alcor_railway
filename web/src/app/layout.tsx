import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AOSProvider } from '@/components/providers/aos-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { TopBar } from '@/components/layout/top-bar';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { DomErrorBoundary } from '@/components/providers/dom-error-boundary';
import { TranslationProvider } from '@/components/providers/translation-provider';

export const metadata: Metadata = {
  title: 'B2B Маркетплейс - Промислове обладнання',
  description: 'Провідний B2B маркетплейс промислового обладнання. Зв\'яжіться з перевіреними постачальниками з усього світу.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <DomErrorBoundary>
                <TranslationProvider>
                  <AOSProvider>
                    <TopBar />
                    <Navbar />
                    <main className="site-main-shell min-h-screen">{children}</main>
                    <Footer />
                  </AOSProvider>
                </TranslationProvider>
              </DomErrorBoundary>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
