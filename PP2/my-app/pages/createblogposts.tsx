import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;

  const token = cookies.token || null;

  return {
    props: {
      token,
    },
  };
};

export default function CreateBlogPost({ token }: { token: string | null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    templateIds: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validTemplateIds, setValidTemplateIds] = useState<number[]>([]); // Store valid Template IDs

  // Fetch valid Template IDs when the component loads
  useEffect(() => {
    const fetchTemplateIds = async () => {
      try {
        const res = await fetch('/api/templates/visitor_get');
        if (!res.ok) throw new Error('Failed to fetch templates');
        const templates = await res.json();
        const ids = templates.map((template: { id: number }) => template.id);
        setValidTemplateIds(ids);
      } catch (err) {
        console.error('Error fetching template IDs:', err);
      }
    };

    fetchTemplateIds();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('You are not authenticated. Please log in.');
      return;
    }

    const parsedTemplateIds = formData.templateIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id)
      .map(Number);

    if (parsedTemplateIds.some((id) => isNaN(id))) {
      setError('Template IDs must be valid numbers.');
      return;
    }

    // Validate Template IDs against the fetched valid IDs
    const invalidIds = parsedTemplateIds.filter((id) => !validTemplateIds.includes(id));
    if (invalidIds.length > 0) {
      setError(`Invalid Template IDs: ${invalidIds.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: (formData.tags || '').split(',').map((tag) => tag.trim()),
          templateIds: parsedTemplateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating blog post:', errorData);
        throw new Error(errorData.message || 'Failed to create blog post');
      }

      console.log('Blog post created successfully!');
      router.push('/blogposts');
    } catch (err: any) {
      console.error('Error:', err.message);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Create a New Blog Post</h1>
          <p className="text-zinc-500 mt-2 text-sm">Share your ideas with the community.</p>
        </div>

        {/* Form Card */}
        <div className="glass p-8">
          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Post Title</label>
              <p className="text-xs text-zinc-600 mb-2">
                This is the title of your blog post.
              </p>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your post title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
              <p className="text-xs text-zinc-600 mb-2">
                Write a brief description or summary for your blog post.
              </p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[140px] resize-y"
                rows={5}
                placeholder="Write a brief description of your post"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tags</label>
              <p className="text-xs text-zinc-600 mb-2">
                Add relevant tags separated by commas (e.g., technology, coding, web development).
              </p>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., technology, coding, web development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Template IDs</label>
              <input
                type="text"
                name="templateIds"
                value={formData.templateIds}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 1, 2, 3"
                required
              />
              <p className="text-xs text-zinc-600 mt-2">
                Valid Template IDs: {validTemplateIds.length > 0 ? validTemplateIds.join(', ') : 'Loading...'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
