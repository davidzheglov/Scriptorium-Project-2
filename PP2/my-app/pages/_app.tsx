import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Navbar from '@/components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white relative">
      {/* Subtle gradient orbs in the background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-brand-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <main className="px-4 sm:px-6 lg:px-8 pb-16">
          <Component {...pageProps} />
        </main>
      </div>
    </div>
  );
}
