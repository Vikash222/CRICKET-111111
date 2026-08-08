import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { db } from '../services/db';
import { BattingStyle, BowlingStyle, PlayerRole, Profile } from '../types/cricket';

interface Props {
  onClose: () => void;
  onSaved?: (profile: Profile) => void;
}

export const PlayerProfileEditor: React.FC<Props> = ({ onClose, onSaved }) => {
  const fallbackUser = db.getCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<Profile>(fallbackUser);
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState<number | ''>('');
  const [role, setRole] = useState<PlayerRole>('batsman');
  const [batting, setBatting] = useState<BattingStyle>('right_hand');
  const [bowling, setBowling] = useState<BowlingStyle>('right_arm_medium');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        if (mounted) setError('Your login session has expired. Please log in again.');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        if (mounted) setError(profileError.message);
        setLoading(false);
        return;
      }

      const profile = (data || {
        ...fallbackUser,
        id: authUser.id,
        email: authUser.email || fallbackUser.email,
      }) as Profile;

      if (!mounted) return;
      setUser(profile);
      setName(profile.full_name || '');
      setJersey(profile.jersey_number ?? '');
      setRole(profile.playing_role || 'batsman');
      setBatting(profile.batting_style || 'right_hand');
      setBowling(profile.bowling_style || 'right_arm_medium');
      setBio(profile.bio || '');
      setPhoto(profile.avatar_url || '');
      setLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Use JPG, PNG or WEBP under 5 MB.');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('Uploading photo…');

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/profile-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setMessage('');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setPhoto(data.publicUrl);
    setMessage('Photo uploaded. Save Profile to apply it.');
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('Saving profile…');

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setError('Your login session has expired. Please log in again.');
      setSaving(false);
      return;
    }

    const payload = {
      id: authUser.id,
      email: authUser.email || user.email,
      full_name: name.trim(),
      jersey_number: jersey === '' ? null : Number(jersey),
      playing_role: role,
      batting_style: batting,
      bowling_style: bowling,
      bio: bio.trim() || null,
      avatar_url: photo || null,
    };

    const { data, error: saveError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (saveError) {
      setError(saveError.message);
      setMessage('');
      setSaving(false);
      return;
    }

    const saved = data as Profile;
    db.setCurrentUser(saved);
    onSaved?.(saved);
    setMessage('Profile saved successfully.');
    setSaving(false);
    window.setTimeout(onClose, 350);
  };

  if (loading) {
    return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="rounded-2xl bg-white p-6 text-slate-700 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-emerald-600"/>Loading your profile…</div></div>;
  }

  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <form onSubmit={save} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-5 shadow-xl text-slate-900 space-y-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><User className="w-5 h-5 text-emerald-600"/><div><h2 className="font-bold">Edit Player Profile</h2><p className="text-[11px] text-slate-500">Your changes are saved to Supabase</p></div></div><button type="button" onClick={onClose}><X className="w-5 h-5 text-slate-500"/></button></div>

      <div className="flex items-center gap-4"><div className="relative"><img src={photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-20 h-20 rounded-full object-cover border"/><button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white disabled:opacity-50"><Camera className="w-4 h-4"/></button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.currentTarget.value = ''; }}/></div><p className="text-xs text-slate-500">Profile photo<br/>JPG, PNG or WEBP · max 5 MB</p></div>

      <label className="block text-xs font-semibold">Full name<input required value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Jersey number<input type="number" min="0" max="999" value={jersey} onChange={(e)=>setJersey(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"/></label><label className="text-xs font-semibold">Playing role<select value={role} onChange={(e)=>setRole(e.target.value as PlayerRole)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="batsman">Batsman</option><option value="bowler">Bowler</option><option value="all_rounder">All-rounder</option><option value="wicket_keeper">Wicketkeeper</option></select></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Batting<select value={batting} onChange={(e)=>setBatting(e.target.value as BattingStyle)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="right_hand">Right hand</option><option value="left_hand">Left hand</option></select></label><label className="text-xs font-semibold">Bowling<select value={bowling} onChange={(e)=>setBowling(e.target.value as BowlingStyle)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="right_arm_fast">Right-arm fast</option><option value="right_arm_medium">Right-arm medium</option><option value="right_arm_spin">Right-arm spin</option><option value="left_arm_fast">Left-arm fast</option><option value="left_arm_medium">Left-arm medium</option><option value="left_arm_spin">Left-arm spin</option><option value="none">None</option></select></label></div>
      <label className="block text-xs font-semibold">Bio<textarea value={bio} onChange={(e)=>setBio(e.target.value)} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal resize-none"/></label>

      {error && <p className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">{message}</p>}
      <button disabled={saving || uploading} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 font-bold flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin"/>}{saving ? 'Saving…' : 'Save Profile'}</button>
    </form>
  </div>;
};
