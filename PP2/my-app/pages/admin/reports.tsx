import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import prisma from '@/utils/db';

// Type definitions for reported posts and comments
interface Report {
  reason: string;
  createdAt: string;
}

interface ReportedPost {
  id: number;
  title: string;
  description: string;
  reports: Report[];
}

interface ReportedComment {
  id: number;
  content: string;
  reports: Report[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;
  const token = cookies.token || null;

  console.log('Token in getServerSideProps:', token);

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';

    // Decode token and extract userId
    const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };

    console.log('Decoded token:', decodedToken);

    if (!decodedToken.userId) {
      console.error('Decoded token does not contain userId');
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Fetch the user's role using userId
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return {
        redirect: {
          destination: '/unauthorized',
          permanent: false,
        },
      };
    }

    return {
      props: {
        token,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Error validating token or fetching user role:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function ReportsPage({ token, role }: { token: string; role: string }) {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (role !== 'ADMIN') {
      setError('You are unauthorized to view this page.');
      return;
    }

    const fetchReports = async () => {
      console.log('Starting fetchReports...');
      try {
        if (!token) {
          setError('Authorization token not found. Please log in as an admin.');
          return;
        }

        console.log('Token before fetch:', token);
        const res = await fetch('/api/reports', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.trim()}`,
          },
        });

        console.log('Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error:', errorText);
          throw new Error('Failed to fetch reported content');
        }

        const data = await res.json();
        console.log('Fetched reports:', data);

        setReportedPosts(data.reportedPosts || []);
        setReportedComments(data.reportedComments || []);
      } catch (err) {
        console.error('Error in fetchReports:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, role]);

  const handleHideContent = async (id: number, type: 'post' | 'comment') => {
    console.log(`Hiding ${type} with ID:`, id);
    try {
      const res = await fetch('/api/reports/hide', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(
          type === 'post' ? { blogPostId: id } : { commentId: id }
        ),
      });

      console.log('Hide response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to hide content');
      }

      alert('Content hidden successfully');
      router.reload();
    } catch (error) {
      console.error('Error hiding content:', error);
      alert('Error hiding content');
    }
  };

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="glass p-8 max-w-md border-red-500/20">
          <p className="text-red-400 text-center">You are unauthorized to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="glass p-8 max-w-md border-red-500/20 bg-red-500/5">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Admin Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Reported Content</h1>
          <p className="text-zinc-500 mt-1 text-sm">Review and moderate flagged posts and comments.</p>
        </header>

        {/* Reported Blog Posts */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Reported Blog Posts</h2>
            <span className="badge ml-auto">{reportedPosts.length} items</span>
          </div>

          {reportedPosts.length === 0 ? (
            <div className="glass p-8 text-center">
              <p className="text-zinc-500 text-sm">No reported posts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportedPosts.map((post) => (
                <div key={post.id} className="glass p-5 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white truncate">{post.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{post.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400/80">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                          {post.reports.length} {post.reports.length === 1 ? 'report' : 'reports'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHideContent(post.id, 'post')}
                      className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    >
                      Hide Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reported Comments */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Reported Comments</h2>
            <span className="badge ml-auto">{reportedComments.length} items</span>
          </div>

          {reportedComments.length === 0 ? (
            <div className="glass p-8 text-center">
              <p className="text-zinc-500 text-sm">No reported comments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportedComments.map((comment) => (
                <div key={comment.id} className="glass p-5 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400/80">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                          {comment.reports.length} {comment.reports.length === 1 ? 'report' : 'reports'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHideContent(comment.id, 'comment')}
                      className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    >
                      Hide Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
