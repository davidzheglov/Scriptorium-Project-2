import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';

interface LandingProps {
  firstname: string;
  lastname: string;
  token: string | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;
  return {
    props: {
      firstname: cookies.firstname || 'User',
      lastname: cookies.lastname || '',
      token: cookies.token || null,
    },
  };
};

export default function LandingPage({ firstname, lastname, token }: LandingProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => { setIsLoggedIn(!!token); }, [token]);

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      document.cookie = 'token=; Max-Age=0; path=/';
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const features = [
    {
      title: 'Write & Execute Code',
      description: 'Run code in 11+ languages including Python, JavaScript, Java, Go, Rust, and more — all in a sandboxed Docker environment.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
    },
    {
      title: 'Blog & Collaborate',
      description: 'Share your work through blog posts. Link code templates, upvote content, and engage with the community through comments.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
    },
    {
      title: 'Secure Sandbox',
      description: 'Every code execution runs in an isolated Docker container with resource limits, ensuring safety and reliability.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Open-source code platform
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">Write. Execute.</span>
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">Share.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          A modern platform for writing, executing, and sharing code in multiple languages. Create reusable templates and collaborate through blog posts.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          {isLoggedIn ? (
            <>
              <button onClick={() => router.push('/codespace')} className="btn-primary">Open Codespace</button>
              <button onClick={() => router.push('/admin/reports')} className="btn-secondary">Reports Dashboard</button>
              <button onClick={handleLogout} className="btn-ghost">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => router.push('/signup')} className="btn-primary">Get Started</button>
              <button onClick={() => router.push('/login')} className="btn-secondary">Login</button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 pb-20">
        {features.map((feature, i) => (
          <div key={i} className="glass-hover p-8 group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5 group-hover:bg-brand-500/20 transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center pb-20">
        <p className="text-sm text-zinc-500 mb-4 uppercase tracking-wider font-medium">Supported Languages</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Python', 'JavaScript', 'Java', 'C', 'C++', 'Go', 'Ruby', 'PHP', 'Rust', 'Kotlin', 'Dart'].map((lang) => (
            <span key={lang} className="badge">{lang}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
