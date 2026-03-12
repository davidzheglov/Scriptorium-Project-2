import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  user: { id: number; firstName: string; lastName: string; avatar: string };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  hidden: boolean;
  reports: { reason: string; createdAt: string }[];
}

interface BlogPostsPageProps {
  token: string | null;
  userId: number;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;

  const token = cookies.token || null;

  const jwt = require('jsonwebtoken');
  const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';
  let userId = null;

  if (token) {
    try {
      const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };
      userId = decodedToken.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  return {
    props: {
      token,
      userId,
    },
  };
};

export default function BlogPostsPage({ token, userId }: BlogPostsPageProps) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [sortOrder, setSortOrder] = useState<'date' | 'rating'>('date'); // State for sort order
  const router = useRouter();

  const fetchBlogPosts = async (page: number) => {
    setLoading(true);
    try {
      console.log('Fetching blog posts with token:', token);

      const res = await fetch(
        `/api/blogs?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}&sort=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch blog posts');
      }

      // Updated to include totalCount from backend
      const { blogPosts: posts, totalCount } = await res.json();

      const visiblePosts = posts.filter(
        (post: BlogPost) => !post.hidden || (post.user.id === userId && post.hidden)
      );

      console.log('Visible posts:', visiblePosts);

      setBlogPosts(visiblePosts);
      setTotalPages(Math.ceil(totalCount / 10)); // Calculate total pages dynamically
    } catch (err: any) {
      console.error('Error fetching blog posts:', err.message);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage, searchQuery, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to the first page when a new search is initiated
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'date' | 'rating');
    setCurrentPage(1); // Reset to the first page when the sort order changes
  };


  const handleCreatePost = () => {
    router.push('createblogposts');
  };

  const handleDelete = async (postId: number) => {
    try {
      await fetch(`/api/blogs/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchBlogPosts(currentPage);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleUpvote = async (postId: number) => {
    try {
      await fetch(`/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: postId, type: 'upvote', itemType: 'blogPost' }),
      });
      fetchBlogPosts(currentPage);
    } catch (error) {
      console.error('Upvote failed:', error);
    }
  };

  const handleDownvote = async (postId: number) => {
    try {
      await fetch(`/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: postId, type: 'downvote', itemType: 'blogPost' }),
      });
      fetchBlogPosts(currentPage);
    } catch (error) {
      console.error('Downvote failed:', error);
    }
  };

  useEffect(() => {
    console.log('Current User ID:', userId);
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Blog Posts</h1>
            <p className="text-zinc-500 mt-1 text-sm">Discover stories, ideas, and expertise.</p>
          </div>
          <button
            onClick={handleCreatePost}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Post
          </button>
        </header>

        {/* Search and Sort Bar */}
        <div className="glass rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={handleSearch}
              className="input-field pl-10"
            />
          </div>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-zinc-300 outline-none transition-all duration-200 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
          >
            <option value="date" className="bg-zinc-900">Sort by Date</option>
            <option value="rating" className="bg-zinc-900">Sort by Rating</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-zinc-500">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading posts...</span>
            </div>
          </div>
        ) : error ? (
          <div className="glass p-6 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : blogPosts.length > 0 ? (
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className={`glass-hover p-5 ${post.hidden ? 'opacity-60 border-yellow-500/20' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={post.user?.avatar || '/default-avatar.png'}
                    alt={`${post.user?.firstName || 'Unknown'}'s avatar`}
                    className="w-10 h-10 rounded-full ring-2 ring-white/[0.1] flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-lg font-semibold text-white hover:text-brand-400 cursor-pointer transition-colors duration-200 truncate"
                      onClick={() => router.push(`/blogposts/${post.id}`)}
                    >
                      {post.title}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {post.user?.firstName || 'Unknown'} {post.user?.lastName || ''}
                      <span className="mx-1.5 text-zinc-700">&#183;</span>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>

                    {post.hidden && post.user.id === userId && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-yellow-400 text-sm font-medium mb-1">
                          This post is hidden. Reports:
                        </p>
                        <ul className="list-disc ml-4 text-zinc-400 text-sm space-y-0.5">
                          {post.reports.map((report, index) => (
                            <li key={index}>{report.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="mt-2 text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleUpvote(post.id)}
                        disabled={post.hidden && post.user.id !== userId}
                        className="btn-ghost inline-flex items-center gap-1.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:text-green-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        {post.upvotes}
                      </button>
                      <button
                        onClick={() => handleDownvote(post.id)}
                        disabled={post.hidden && post.user.id !== userId}
                        className="btn-ghost inline-flex items-center gap-1.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {post.downvotes}
                      </button>
                      {post.user.id === userId && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="btn-ghost text-sm text-zinc-500 hover:text-red-400 ml-auto inline-flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-12 text-center">
            <p className="text-zinc-500">No blog posts available.</p>
          </div>
        )}

        {/* Pagination */}
        <footer className="mt-8 flex justify-between items-center glass rounded-xl p-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-ghost inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-sm text-zinc-400">
            Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-ghost inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </footer>
      </div>
    </div>
  );
}
