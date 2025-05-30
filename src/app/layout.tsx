import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { ReactNode } from 'react'
import ScrollToTopButton from './components/ScrollToTopButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/usa_etf_dividend.ico" />
        <meta name="theme-color" content="#facc15" />
        {/* 오픈그래프 */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Smart Dividend Portfolio" />
        <meta property="og:title" content="미국 ETF/배당주 포트폴리오 관리" />
        <meta property="og:description" content="미국 ETF/배당주 포트폴리오를 쉽고 체계적으로 관리하세요." />
        <meta property="og:image" content="/open_graph_image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Tailwind output.css가 필요하다면 아래 한 줄 추가 (일반적으로 필요 없음) */}
        {/* <link rel="stylesheet" href="/output.css" /> */}
        {/* PWA 서비스워커 등록 */}
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js'); }); }` }} />
      </head>
      <body className="bg-gray-900 text-white min-h-screen flex flex-col items-center">
        {/* 메뉴바 */}
        <nav className="w-[95vw] flex items-center justify-between py-4 px-6 bg-gray-800 rounded-b-lg shadow-md mt-4 mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight hover:text-green-400 transition">Smart Dividend Portfolio</Link>
          <div className="flex gap-8 text-lg font-medium">
            <Link href="/input" className="hover:text-green-400 transition">자료입력</Link>
            <Link href="/status" className="hover:text-green-400 transition">자료현황</Link>
            <Link href="/manage" className="hover:text-green-400 transition">자료관리</Link>
          </div>
        </nav>
        {/* 본문 */}
        <main className="flex-1 w-[95vw] flex flex-col items-start">
          {children}
        </main>
        {/* Footer */}
        <footer className="w-[95vw] text-center py-4 text-gray-300 border-t border-gray-700 mt-8">
          Built with <span className="text-red-400">❤️</span> by 나 종 춘 | najongchoon@gmail.com
        </footer>
        {/* 위로가기 버튼 (클라이언트 컴포넌트) */}
        <ScrollToTopButton />
      </body>
    </html>
  )
}
