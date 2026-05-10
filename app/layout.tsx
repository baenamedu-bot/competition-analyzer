import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { ApiKeyProvider } from '@/components/settings/api-key-context';
import { AppHeader } from '@/components/app-header';
import { FooterCredit } from '@/components/branding/footer-credit';
import { WelcomeModal } from '@/components/branding/welcome-modal';
import { BRAND } from '@/components/branding/brand-constants';

export const metadata: Metadata = {
  title: `${BRAND.appName} · ${BRAND.studio}`,
  description:
    '현상설계 공모지침서·공고문·과업지시서 100~300페이지를 자동 분석·시각화. AI 교육 프로그램에서 만든 건축 실무 도구.',
  authors: [{ name: BRAND.creator }],
  applicationName: BRAND.appName,
  openGraph: {
    title: `${BRAND.appName} · ${BRAND.studio}`,
    description: '공모 사전 독해를 반나절로 압축하는 AI 보조 도구',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-zinc-50/40 text-zinc-900 antialiased">
        <ApiKeyProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <FooterCredit />
          </div>
          <WelcomeModal />
          <Toaster position="top-center" richColors closeButton />
        </ApiKeyProvider>
      </body>
    </html>
  );
}
