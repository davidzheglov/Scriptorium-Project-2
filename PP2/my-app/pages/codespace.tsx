import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;
  return { props: { token: cookies.token || null } };
};

interface CodeEditorProps { token: string | null; }

const CodeEditor: React.FC<CodeEditorProps> = ({ token }) => {
  const router = useRouter();
  const { code: queryCode } = router.query;

  const [code, setCode] = useState<string>('# Write your code here');
  const [output, setOutput] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [stdin, setStdin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSavePopup, setShowSavePopup] = useState<boolean>(false);
  const [templateTitle, setTemplateTitle] = useState<string>('');
  const [templateExplanation, setTemplateExplanation] = useState<string>('');
  const [templateTags, setTemplateTags] = useState<string>('');

  const languages: string[] = ['python', 'javascript', 'java', 'c', 'cpp', 'go', 'ruby', 'php', 'rust', 'kotlin', 'dart'];

  useEffect(() => {
    if (queryCode) setCode(decodeURIComponent(queryCode as string));
  }, [queryCode]);

  const runCode = async () => {
    setIsLoading(true);
    setOutput('');
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
      });
      const data = await response.json();
      setOutput(response.ok ? (data.output || 'No output') : `Error: ${data.error}`);
    } catch (error: any) {
      setOutput(`Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    const tagsArray = templateTags.split(',').map((tag) => tag.trim());
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ title: templateTitle, explanation: templateExplanation, tags: tagsArray, code }),
      });
      if (response.ok) {
        alert('Template saved successfully!');
        setShowSavePopup(false);
      } else {
        const errorData = await response.text();
        alert(`Failed to save template: ${errorData || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-2 sm:p-4 animate-fade-in">
      {/* Editor Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm outline-none focus:border-brand-500/50 transition-colors"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang} className="bg-zinc-900">{lang.toUpperCase()}</option>
              ))}
            </select>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-zinc-400">Docker Sandbox</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSavePopup(true)} className="btn-ghost text-sm">
              <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save as Template
            </button>
          </div>
        </div>

        {/* Code textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 w-full p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-mono text-sm resize-none outline-none focus:border-brand-500/30 transition-colors placeholder-zinc-600"
          placeholder="Write your code here..."
          spellCheck={false}
        />

        {/* Stdin + Run */}
        <div className="flex items-center gap-3 mt-3">
          <input
            type="text"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="stdin (optional)"
            className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm font-mono outline-none focus:border-brand-500/30 placeholder-zinc-600 transition-colors"
          />
          <button
            onClick={runCode}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              isLoading
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
            }`}
          >
            {isLoading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Running...</>
            ) : (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Run</>
            )}
          </button>
        </div>
      </div>

      {/* Output Panel */}
      <div className="lg:w-[380px] flex flex-col min-h-0 lg:min-h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <h3 className="text-sm font-semibold text-zinc-300">Output</h3>
        </div>
        <pre className="flex-1 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-mono overflow-auto text-emerald-300/80 min-h-[200px]">
          {output || <span className="text-zinc-600">Output will appear here...</span>}
        </pre>
      </div>

      {/* Save Template Modal */}
      {showSavePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-6">Save as Template</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Template title" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} className="input-field" />
              <textarea placeholder="Explanation" value={templateExplanation} onChange={(e) => setTemplateExplanation(e.target.value)} className="input-field min-h-[80px] resize-none" />
              <input type="text" placeholder="Tags (comma-separated)" value={templateTags} onChange={(e) => setTemplateTags(e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveTemplate} className="btn-primary flex-1">Save</button>
              <button onClick={() => setShowSavePopup(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
