import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

type WelcomePageProps = { firstname: string; lastname: string };

export default function WelcomePage({ firstname, lastname }: WelcomePageProps) {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] animate-fade-in">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-600/30 animate-glow">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold">
          <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Welcome, </span>
          <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">{firstname}</span>
        </h1>
        <p className="text-zinc-400 mt-4 text-lg">Your account is ready. Start exploring Scriptorium.</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-8">
          Get Started
        </button>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.headers.cookie
    ?.split('; ')
    .reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {}) || {};

  return {
    props: {
      firstname: cookies.firstname || 'User',
      lastname: cookies.lastname || '',
    },
  };
};
