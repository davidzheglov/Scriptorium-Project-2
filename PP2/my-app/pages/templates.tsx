import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/router';

interface Tag { id: number; name: string; }
interface Template { id: number; title: string; explanation: string; tags: Tag[]; code: string; }

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) { const data = await response.json(); setIsLoggedIn(data.isLoggedIn); }
      } catch (error) { console.error('Error checking login status:', error); }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates/visitor_get');
        if (response.ok) { const data = await response.json(); setTemplates(data); }
      } catch (error) { console.error('Error fetching templates:', error); }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredTemplates(templates.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchQuery, templates]);

  const handleEditClick = (templateId: number, code: string) => {
    if (!isLoggedIn) {
      setShowPopup(true);
      setTimeout(() => { setShowPopup(false); router.push(`/codespace?templateId=${templateId}&code=${encodeURIComponent(code)}`); }, 1500);
    } else {
      router.push(`/codespace?templateId=${templateId}&code=${encodeURIComponent(code)}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Templates</h1>
          <p className="text-zinc-400 text-sm mt-1">Browse and fork community code templates</p>
        </div>
        <div className="relative w-full sm:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500">No templates found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="glass-hover p-6 group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">{template.title}</h2>
                  <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{template.explanation}</p>
                </div>
                <span className="text-xs text-zinc-600 ml-3 shrink-0">#{template.id}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {template.tags.map((tag) => (
                  <span key={tag.id} className="badge">{tag.name}</span>
                ))}
              </div>
              <button
                onClick={() => handleEditClick(template.id, template.code)}
                className="mt-4 w-full py-2 text-sm font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-xl hover:bg-brand-500/20 transition-colors"
              >
                Open in Codespace
              </button>
            </div>
          ))}
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass px-8 py-6">
            <p className="text-white font-medium">Opening forked version...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
