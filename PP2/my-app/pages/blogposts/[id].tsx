import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  templates: { id: number }[];
  user: { id: number; firstName: string; lastName: string; avatar: string } | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  comments: Comment[];
  hidden?: boolean;
}

interface Comment {
  id: number;
  content: string;
  user: { id: number; firstName: string; lastName: string; avatar: string } | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
}


interface BlogPostsPageProps {
  blogPost?: BlogPost;
  token: string | null;
  error?: string;
  userId: number;
}


// interface DecodedToken {
//   id: number;
//   email: string;
// }

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const { req } = context;
  const cookies = req.cookies;
  const token = cookies.token || null;

  const API_URL = process.env.API_URL || 'http://localhost:3000/api';

  if (!id) {
    return { notFound: true };
  }

  console.log('Fetching blog post with ID:', id);
  try {
    const res = await fetch(`${API_URL}/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

    if (!res.ok) {
      throw new Error('Failed to fetch blog post');
    }

    const blogPost = await res.json();
    console.log('Fetched blog post:', blogPost);

    return {
      props: { blogPost, token, userId,},
    };
  } catch (error: unknown) {
    console.error('Error fetching blog post:', error instanceof Error ? error.message : error);
    return {
      props: { error: 'Failed to load blog post' },
    };
  }
};


// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { req } = context;
//   const cookies = req.cookies;

//   const token = cookies.token || null;

//   const jwt = require('jsonwebtoken');
//   const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';
//   let userId = null;

//   if (token) {
//     try {
//       const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };
//       userId = decodedToken.userId;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//     }
//   }

//   return {
//     props: {
//       token,
//       userId,
//     },
//   };
// };



export default function BlogPostPage({
  blogPost,
  token,
  error,
  userId,
}: BlogPostsPageProps) {
  console.log('blogPost prop received:', blogPost);

  const [post, setPost] = useState<BlogPost | null>(blogPost || null);
  const [comments, setComments] = useState<Comment[]>([]); // Start with an empty array
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    description: post?.description || '',
    tags: Array.isArray(post?.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
    templates: Array.isArray(post?.templates) ? post.templates.map((template) => template.id).join(', ') : '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const router = useRouter();
  useEffect(() => {
    console.log('Logged-in User ID:', userId);
  }, [userId]); // This will log whenever `userId` changes





  // let currentUserId: number | null = null;
  // if (token){
  //   try {
  //     const decodedToken: DecodedToken = jwtDecode(token);
  //     currentUserId = decodedToken.id;
  //   } catch (error) {
  //     console.error('Failed to decode token:', error);
  //   }
  // }
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        tags: Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
        templates: Array.isArray(post.templates) ? post.templates.map((template) => template.id).join(', ') : '',
      });
    }
  }, [post]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="glass p-8 max-w-md text-center">
          <p className="text-zinc-400">Blog post not found</p>
        </div>
      </div>
    );
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: post?.id,
          type: voteType,
          itemType: 'blogPost',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${voteType}`);
      }

      console.log(`${voteType} successful. Reloading page to reflect changes.`);
      router.reload();
    } catch (error) {
      console.error(`Error during ${voteType}:`, error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = async () => {
    if (userId !== post?.user?.id) {
      setErrorMessage('You are not authorized to edit this blog post.');
      return;
    }

    if (post?.hidden) {
      setErrorMessage('Editing is not allowed because this post is hidden.');
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${post?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: formData.tags.split(',').map((tag) => tag.trim()),
          templateIds: formData.templates.split(',').map((id) => parseInt(id.trim(), 10)),
        }),
      });

      if (res.status === 403) {
        setErrorMessage('You are not authorized to edit this blog post.');
        return;
      }

      if (!res.ok) throw new Error('Failed to update blog post');

      console.log('Post updated successfully. Reloading page...');
      router.reload();
    } catch (error) {
      console.error('Error updating blog post:', error);
    }
  };

  const handleAddComment = async () => {
    try {
      const res = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          blogPostId: post?.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      console.log('Comment added successfully. Reloading page...');
      router.reload();
    } catch (err: unknown) {
      console.error('Error adding comment:', err instanceof Error ? err.message : err);
    }
  };

  const handleReportPost = async (reason: string) => {
    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          blogPostId: post?.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      console.log('Report submitted successfully');
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error reporting content:', error);
    }
  };

  const handleReportComment = async (commentId: number, reason: string) => {
    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          commentId,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      console.log('Report submitted successfully');
      alert('Comment report submitted successfully!');
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const handleCommentVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: commentId,
          type: voteType,
          itemType: 'comment',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${voteType} comment`);
      }

      console.log(`Comment ${voteType} successful. Reloading comments.`);
      fetchComments();
    } catch (error) {
      console.error(`Error during comment ${voteType}:`, error);
    }
  };

  const [sortCriteria, setSortCriteria] = useState<'date' | 'rating'>('date');

  const fetchComments = async () => {
    if (!post?.id) return; // Ensure the blog post ID exists

    try {
      const res = await fetch(`/api/blogs/${post.id}/comments?sort=${sortCriteria}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token for authentication
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }

      const fetchedComments = await res.json();
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]); // Reset comments if there's an error
    }
  };


  // Trigger fetching comments whenever the sort criteria changes
  useEffect(() => {
    fetchComments();
  }, [sortCriteria, post?.id]); // Fetch comments when sorting changes or when the post ID changes



  const handleEditComment = async (commentId: number, currentContent: string) => {
    const updatedContent = prompt('Edit your comment:', currentContent);
    if (!updatedContent || updatedContent.trim() === '') return;

    try {
      const res = await fetch(`/api/comments/${commentId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (!res.ok) {
        throw new Error('Failed to update comment');
      }

      console.log('Comment updated successfully. Reloading comments...');
      router.reload(); // Reload the page to reflect the updated comment
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }

      console.log('Comment deleted successfully. Reloading comments...');
      router.reload(); // Reload the page to reflect the updated comments
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };



  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
        {/* Error Message */}
        {errorMessage && (
          <div className="glass p-4 mb-6 border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {isEditing ? (
          userId === post?.user?.id ? (
            <div className="glass p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Edit Post</h2>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field min-h-[120px] resize-y"
                    placeholder="Description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input-field"
                    placeholder="Tags (comma-separated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Template IDs</label>
                  <input
                    type="text"
                    value={formData.templates}
                    onChange={(e) => setFormData({ ...formData, templates: e.target.value })}
                    className="input-field"
                    placeholder="Template IDs (comma-separated)"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleEdit} className="btn-primary">
                    Save Changes
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass p-8 text-center">
              <p className="text-red-400">You are not authorized to edit this blog post.</p>
            </div>
          )
        ) : (
          <>
            {/* Article Header */}
            <article>
              <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                  {post?.title || 'Untitled'}
                </h1>
                <div className="flex items-center gap-3 mt-4">
                  {post?.user && (
                    <img
                      src={post.user.avatar || '/default-avatar.png'}
                      alt={`${post.user.firstName}'s avatar`}
                      className="w-8 h-8 rounded-full ring-2 ring-white/[0.1]"
                    />
                  )}
                  <p className="text-sm text-zinc-500">
                    {post?.createdAt ? new Date(post.createdAt).toISOString().split('T')[0] : 'Invalid Date'}
                    {post?.user && (
                      <span className="ml-1">
                        by <span className="text-zinc-300">{post.user.firstName} {post.user.lastName}</span>
                      </span>
                    )}
                  </p>
                </div>
              </header>

              {/* Article Body */}
              <div className="glass p-6 sm:p-8 mb-6">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-base">
                  {post?.description || 'No content available.'}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post?.tags.map((tag, index) => (
                    <span key={index} className="badge">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Templates</h3>
                <div className="flex flex-wrap gap-2">
                  {post?.templates.map((template, index) => (
                    <a
                      key={index}
                      href={`/codespace?templateId=${template.id}`}
                      className="badge hover:bg-brand-500/20 hover:text-brand-200 transition-colors duration-200"
                    >
                      Template #{template.id}
                    </a>
                  ))}
                </div>
              </div>

              {/* Vote + Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={post?.userVote === 'upvote' || isVoting || (!token)}
                  className={`btn-ghost inline-flex items-center gap-2 text-sm ${
                    post?.userVote === 'upvote'
                      ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                      : ''
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Upvote ({post?.upvotes || 0})
                </button>
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={post?.userVote === 'downvote' || isVoting || (!token)}
                  className={`btn-ghost inline-flex items-center gap-2 text-sm ${
                    post?.userVote === 'downvote'
                      ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                      : ''
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Downvote ({post?.downvotes || 0})
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={userId !== post?.user?.id}
                    className="btn-ghost text-sm inline-flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter a reason for reporting this content:');
                      if (reason) handleReportPost(reason);
                    }}
                    className="btn-ghost text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    Report
                  </button>
                </div>
              </div>
            </article>

            {/* Divider */}
            <div className="border-t border-white/[0.06] my-8" />
          </>
        )}

        {/* Comments Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Comments</h2>
            <select
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-lg text-sm text-zinc-300 outline-none transition-all duration-200 focus:border-brand-500/50 cursor-pointer"
              value={sortCriteria}
              onChange={(e) => setSortCriteria(e.target.value as 'date' | 'rating')}
            >
              <option value="date" className="bg-zinc-900">Sort by Date</option>
              <option value="rating" className="bg-zinc-900">Sort by Rating</option>
            </select>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="glass p-5">
                <div className="flex items-start gap-3">
                  <img
                    src={comment.user?.avatar || '/default-avatar.png'}
                    alt={`${comment.user?.firstName || 'Anonymous'}'s avatar`}
                    className="w-8 h-8 rounded-full ring-2 ring-white/[0.08] flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-white">
                        {comment.user?.firstName || 'Anonymous'} {comment.user?.lastName || ''}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {format(new Date(comment.createdAt), 'yyyy-MM-dd')}
                      </p>
                    </div>
                    <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{comment.content}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleCommentVote(comment.id, 'upvote')}
                        className={`btn-ghost text-xs inline-flex items-center gap-1 py-1 px-2 ${
                          comment.userVote === 'upvote' ? 'text-green-400 bg-green-500/10' : ''
                        }`}
                        disabled={!token}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        {comment.upvotes}
                      </button>
                      <button
                        onClick={() => handleCommentVote(comment.id, 'downvote')}
                        className={`btn-ghost text-xs inline-flex items-center gap-1 py-1 px-2 ${
                          comment.userVote === 'downvote' ? 'text-red-400 bg-red-500/10' : ''
                        }`}
                        disabled={!token}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {comment.downvotes}
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter a reason for reporting this comment:');
                          if (reason) handleReportComment(comment.id, reason);
                        }}
                        className="btn-ghost text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 py-1 px-2"
                      >
                        Report
                      </button>
                      {/* Render Edit and Delete buttons for the comment owner */}
                      {/* comment.user?.id === userId && */(
                        <>
                        { comment.user && comment.user.id === userId && (
                          <button
                            onClick={() => handleEditComment(comment.id, comment.content)}
                            className="btn-ghost text-xs py-1 px-2 inline-flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button> )}
                              {console.log('Comment User ID:', comment.user?.id)}
                              { comment.user && comment.user.id === userId && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="btn-ghost text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 py-1 px-2 inline-flex items-center gap-1"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add Comment */}
        <div className="mt-8 glass p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Leave a comment</h3>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="input-field min-h-[100px] resize-y"
            placeholder="Write a comment..."
          />
          <div className="mt-3 flex justify-end">
            <button onClick={handleAddComment} className="btn-primary text-sm">
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
