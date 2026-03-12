import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

interface SettingsPageProps { token: string | null; }

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const token = req.cookies.token || null;
  if (!token) return { redirect: { destination: '/login', permanent: false } };
  return { props: { token } };
};

export default function SettingsPage({ token }: SettingsPageProps) {
  const [formData, setFormData] = useState<{ firstName: string; lastName: string; email: string; phoneNumber: string; avatar: string; newAvatar: File | null }>({
    firstName: '', lastName: '', email: '', phoneNumber: '', avatar: '', newAvatar: null,
  });
  const [isEditing, setIsEditing] = useState<{ firstName: boolean; lastName: boolean; phoneNumber: boolean }>({ firstName: false, lastName: false, phoneNumber: false });
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/profile', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const profile = await res.json();
        setFormData({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phoneNumber: profile.phoneNumber || '', avatar: profile.avatar, newAvatar: null });
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/login');
      }
    };
    fetchProfile();
  }, [token, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, newAvatar: file });
  };

  const handleAvatarUpload = async () => {
    if (!formData.newAvatar) return;
    const formPayload = new FormData();
    formPayload.append('file', formData.newAvatar);
    try {
      const res = await fetch('/api/users/avatar-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formPayload });
      if (!res.ok) throw new Error('Failed to upload avatar');
      const data = await res.json();
      setFormData({ ...formData, avatar: data.url, newAvatar: null });
      alert('Avatar updated successfully');
    } catch (error) { console.error('Error updating avatar:', error); alert('Failed to update avatar'); }
  };

  const handleEditSubmit = async (field: keyof typeof formData) => {
    try {
      const res = await fetch('/api/users/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ [field]: formData[field] }) });
      if (!res.ok) throw new Error(`Failed to update ${field}`);
      alert(`${field} updated successfully`);
      setIsEditing({ ...isEditing, [field]: false });
    } catch (error) { console.error(`Error updating ${field}:`, error); }
  };

  const fieldLabels: Record<string, string> = { firstName: 'First Name', lastName: 'Last Name', phoneNumber: 'Phone Number' };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="glass p-8 flex flex-col sm:flex-row gap-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 sm:w-48 shrink-0">
          <img src={formData.avatar} alt="Avatar" className="w-28 h-28 rounded-2xl object-cover border-2 border-white/[0.1] shadow-xl transition-transform hover:scale-105" />
          <input
            type="file" accept="image/*" onChange={handleFileChange}
            className="block text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-500 file:cursor-pointer file:transition-colors"
          />
          {formData.newAvatar && (
            <button onClick={handleAvatarUpload} className="btn-primary text-sm py-2 px-4">Upload</button>
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-5">
          {(['firstName', 'lastName', 'phoneNumber'] as const).map((field) => (
            <div key={field} className="flex items-center gap-4 py-3 border-b border-white/[0.06] last:border-0">
              <span className="text-sm font-medium text-zinc-400 w-28 shrink-0">{fieldLabels[field]}</span>
              {isEditing[field] ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={formData[field] as string}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                  <button onClick={() => handleEditSubmit(field)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors">Save</button>
                  <button onClick={() => setIsEditing({ ...isEditing, [field]: false })} className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 text-xs font-medium rounded-lg transition-colors">Cancel</button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-white text-sm">{String(formData[field]) || 'Not set'}</span>
                  <button onClick={() => setIsEditing({ ...isEditing, [field]: true })} className="btn-ghost text-xs">Edit</button>
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-4 py-3">
            <span className="text-sm font-medium text-zinc-400 w-28 shrink-0">Email</span>
            <span className="text-white text-sm">{formData.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
